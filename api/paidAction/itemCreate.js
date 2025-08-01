import { ANON_ITEM_SPAM_INTERVAL, ANON_FEE_MULTIPLIER, ITEM_SPAM_INTERVAL, PAID_ACTION_PAYMENT_METHODS, USER_ID } from '@/lib/constants'
import { notifyItemMention, notifyItemParents, notifyMention, notifyTerritorySubscribers, notifyUserSubscribers, notifyThreadSubscribers } from '@/lib/webPush'
import { getItemMentions, getMentions, performBotBehavior } from './lib/item'
import { msatsToSats, satsToMsats } from '@/lib/format'
import { GqlInputError } from '@/lib/error'

export const anonable = true

export const paymentMethods = [
  PAID_ACTION_PAYMENT_METHODS.FEE_CREDIT,
  PAID_ACTION_PAYMENT_METHODS.REWARD_SATS,
  PAID_ACTION_PAYMENT_METHODS.OPTIMISTIC,
  PAID_ACTION_PAYMENT_METHODS.PESSIMISTIC
]

export const DEFAULT_ITEM_COST = 1000n

export async function getBaseCost ({ models, bio, parentId, subName }) {
  if (bio) return DEFAULT_ITEM_COST

  if (parentId) {
    // the subname is stored in the root item of the thread
    const [sub] = await models.$queryRaw`
      SELECT s."replyCost"
      FROM "Item" i
      LEFT JOIN "Item" r ON r.id = i."rootId"
      LEFT JOIN "Sub" s ON s.name = COALESCE(r."subName", i."subName")
      WHERE i.id = ${Number(parentId)}`

    if (sub?.replyCost) return satsToMsats(sub.replyCost)
    return DEFAULT_ITEM_COST
  }

  const sub = await models.sub.findUnique({ where: { name: subName } })
  return satsToMsats(sub.baseCost)
}

export async function getCost ({ subName, parentId, uploadIds, boost = 0, bio }, { models, me }) {
  const baseCost = await getBaseCost({ models, bio, parentId, subName })

  // cost = baseCost * 10^num_items_in_10m * 10 (ANON_FEE_MULTIPLIER constant) or 1 (user) + upload fees + boost
  const [{ cost }] = await models.$queryRaw`
    SELECT ${baseCost}::INTEGER
      * POWER(10, item_spam(${parseInt(parentId)}::INTEGER, ${me?.id ?? USER_ID.anon}::INTEGER,
          ${me?.id && !bio ? ITEM_SPAM_INTERVAL : ANON_ITEM_SPAM_INTERVAL}::INTERVAL))
      * ${me ? 1 : ANON_FEE_MULTIPLIER}::INTEGER
      + (SELECT "nUnpaid" * "uploadFeesMsats"
          FROM upload_fees(${me?.id || USER_ID.anon}::INTEGER, ${uploadIds}::INTEGER[]))
      + ${satsToMsats(boost)}::INTEGER as cost`

  // sub allows freebies (or is a bio or a comment), cost is less than baseCost, not anon,
  // cost must be greater than user's balance, and user has not disabled freebies
  const freebie = (parentId || bio) && cost <= baseCost && !!me &&
    me?.msats < cost && !me?.disableFreebies && me?.mcredits < cost

  return freebie ? BigInt(0) : BigInt(cost)
}

export async function perform (args, context) {
  const { invoiceId, parentId, uploadIds = [], forwardUsers = [], options: pollOptions = [], boost = 0, ...data } = args
  const { tx, me, cost } = context
  const boostMsats = satsToMsats(boost)

  const deletedUploads = []
  for (const uploadId of uploadIds) {
    if (!await tx.upload.findUnique({ where: { id: uploadId } })) {
      deletedUploads.push(uploadId)
    }
  }
  if (deletedUploads.length > 0) {
    throw new Error(`upload(s) ${deletedUploads.join(', ')} are expired, consider reuploading.`)
  }

  let invoiceData = {}
  if (invoiceId) {
    invoiceData = { invoiceId, invoiceActionState: 'PENDING' }
    await tx.upload.updateMany({
      where: { id: { in: uploadIds } },
      data: invoiceData
    })
  }

  const itemActs = []
  if (boostMsats > 0) {
    itemActs.push({
      msats: boostMsats, act: 'BOOST', userId: data.userId, ...invoiceData
    })
  }
  if (cost > 0) {
    itemActs.push({
      msats: cost - boostMsats, act: 'FEE', userId: data.userId, ...invoiceData
    })
    data.cost = msatsToSats(cost - boostMsats)
  }

  const mentions = await getMentions(args, context)
  const itemMentions = await getItemMentions(args, context)

  // start with median vote
  if (me) {
    const [row] = await tx.$queryRaw`SELECT
      COALESCE(percentile_cont(0.5) WITHIN GROUP(
        ORDER BY "weightedVotes" - "weightedDownVotes"), 0)
      AS median FROM "Item" WHERE "userId" = ${me.id}::INTEGER`
    if (row?.median < 0) {
      data.weightedDownVotes = -row.median
    }
  }

  const itemData = {
    parentId: parentId ? parseInt(parentId) : null,
    ...data,
    ...invoiceData,
    boost,
    threadSubscriptions: {
      createMany: {
        data: [
          { userId: data.userId },
          ...forwardUsers.map(({ userId }) => ({ userId }))
        ]
      }
    },
    itemForwards: {
      createMany: {
        data: forwardUsers
      }
    },
    pollOptions: {
      createMany: {
        data: pollOptions.map(option => ({ option }))
      }
    },
    itemUploads: {
      create: uploadIds.map(id => ({ uploadId: id }))
    },
    itemActs: {
      createMany: {
        data: itemActs
      }
    },
    mentions: {
      createMany: {
        data: mentions
      }
    },
    itemReferrers: {
      create: itemMentions
    }
  }

  let item
  if (data.bio && me) {
    item = (await tx.user.update({
      where: { id: data.userId },
      include: { bio: true },
      data: {
        bio: {
          create: itemData
        }
      }
    })).bio
  } else {
    try {
      item = await tx.item.create({ data: itemData })
    } catch (err) {
      if (err.message.includes('violates exclusion constraint \\"Item_unique_time_constraint\\"')) {
        const message = `you already submitted this ${itemData.title ? 'post' : 'comment'}`
        throw new GqlInputError(message)
      }
      throw err
    }
  }

  // store a reference to the item in the invoice
  if (invoiceId) {
    await tx.invoice.update({
      where: { id: invoiceId },
      data: { actionId: item.id }
    })
  }

  await performBotBehavior(item, context)

  // ltree is unsupported in Prisma, so we have to query it manually (FUCK!)
  return (await tx.$queryRaw`
    SELECT *, ltree2text(path) AS path, created_at AS "createdAt", updated_at AS "updatedAt"
    FROM "Item" WHERE id = ${item.id}::INTEGER`
  )[0]
}

export async function retry ({ invoiceId, newInvoiceId }, { tx }) {
  await tx.itemAct.updateMany({ where: { invoiceId }, data: { invoiceId: newInvoiceId, invoiceActionState: 'PENDING' } })
  await tx.item.updateMany({ where: { invoiceId }, data: { invoiceId: newInvoiceId, invoiceActionState: 'PENDING' } })
  await tx.upload.updateMany({ where: { invoiceId }, data: { invoiceId: newInvoiceId, invoiceActionState: 'PENDING' } })
  return (await tx.$queryRaw`
    SELECT *, ltree2text(path) AS path, created_at AS "createdAt", updated_at AS "updatedAt"
    FROM "Item" WHERE "invoiceId" = ${newInvoiceId}::INTEGER`
  )[0]
}

export async function onPaid ({ invoice, id }, context) {
  const { tx } = context
  let item

  if (invoice) {
    item = await tx.item.findFirst({
      where: { invoiceId: invoice.id },
      include: {
        user: true
      }
    })
    await tx.itemAct.updateMany({ where: { invoiceId: invoice.id }, data: { invoiceActionState: 'PAID' } })
    await tx.item.updateMany({ where: { invoiceId: invoice.id }, data: { invoiceActionState: 'PAID', invoicePaidAt: new Date() } })
    await tx.upload.updateMany({ where: { invoiceId: invoice.id }, data: { invoiceActionState: 'PAID', paid: true } })
  } else if (id) {
    item = await tx.item.findUnique({
      where: { id },
      include: {
        user: true,
        itemUploads: { include: { upload: true } }
      }
    })
    await tx.upload.updateMany({
      where: { id: { in: item.itemUploads.map(({ uploadId }) => uploadId) } },
      data: {
        paid: true
      }
    })
  } else {
    throw new Error('No item found')
  }

  await tx.$executeRaw`INSERT INTO pgboss.job (name, data, startafter, priority)
    VALUES ('timestampItem', jsonb_build_object('id', ${item.id}::INTEGER), now() + interval '10 minutes', -2)`
  await tx.$executeRaw`
    INSERT INTO pgboss.job (name, data, retrylimit, retrybackoff, startafter)
    VALUES ('imgproxy', jsonb_build_object('id', ${item.id}::INTEGER), 21, true, now() + interval '5 seconds')`

  if (item.boost > 0) {
    await tx.$executeRaw`
    INSERT INTO pgboss.job (name, data, retrylimit, retrybackoff, startafter, keepuntil)
    VALUES ('expireBoost', jsonb_build_object('id', ${item.id}::INTEGER), 21, true,
              now() + interval '30 days', now() + interval '40 days')`
  }

  if (item.parentId) {
    // denormalize ncomments, lastCommentAt, and "weightedComments" for ancestors, and insert into reply table
    await tx.$executeRaw`
      WITH comment AS (
        SELECT "Item".*, users.trust
        FROM "Item"
        JOIN users ON "Item"."userId" = users.id
        WHERE "Item".id = ${item.id}::INTEGER
      ), ancestors AS (
        SELECT "Item".*
        FROM "Item", comment
        WHERE "Item".path @> comment.path AND "Item".id <> comment.id
        ORDER BY "Item".id
      ), updated_ancestors AS (
        UPDATE "Item"
        SET ncomments = "Item".ncomments + 1,
          "lastCommentAt" = GREATEST("Item"."lastCommentAt", comment.created_at),
          "nDirectComments" = "Item"."nDirectComments" +
            CASE WHEN comment."parentId" = "Item".id THEN 1 ELSE 0 END
        FROM comment, ancestors
        WHERE "Item".id = ancestors.id
        RETURNING "Item".*
      )
      INSERT INTO "Reply" (created_at, updated_at, "ancestorId", "ancestorUserId", "itemId", "userId", level)
        SELECT comment.created_at, comment.updated_at, ancestors.id, ancestors."userId",
          comment.id, comment."userId", nlevel(comment.path) - nlevel(ancestors.path)
        FROM ancestors, comment`
  }
}

export async function nonCriticalSideEffects ({ invoice, id }, { models }) {
  const item = await models.item.findFirst({
    where: invoice ? { invoiceId: invoice.id } : { id: parseInt(id) },
    include: {
      mentions: true,
      itemReferrers: { include: { refereeItem: true } },
      user: true
    }
  })

  if (item.parentId) {
    notifyItemParents({ item, models }).catch(console.error)
    notifyThreadSubscribers({ models, item }).catch(console.error)
  }
  for (const { userId } of item.mentions) {
    notifyMention({ models, item, userId }).catch(console.error)
  }
  for (const { refereeItem } of item.itemReferrers) {
    notifyItemMention({ models, referrerItem: item, refereeItem }).catch(console.error)
  }

  notifyUserSubscribers({ models, item }).catch(console.error)
  notifyTerritorySubscribers({ models, item }).catch(console.error)
}

export async function onFail ({ invoice }, { tx }) {
  await tx.itemAct.updateMany({ where: { invoiceId: invoice.id }, data: { invoiceActionState: 'FAILED' } })
  await tx.item.updateMany({ where: { invoiceId: invoice.id }, data: { invoiceActionState: 'FAILED' } })
  await tx.upload.updateMany({ where: { invoiceId: invoice.id }, data: { invoiceActionState: 'FAILED' } })
}

export async function describe ({ parentId }, context) {
  return `SN: create ${parentId ? `reply to #${parentId}` : 'item'}`
}
