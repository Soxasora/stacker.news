import { gql } from 'graphql-tag'
import { LIMIT } from '@/lib/cursor'

export default gql`
  extend type Query {
    sub(name: String): Sub
    subLatestPost(name: String!): String
    subs(subNames: [String!]): [Sub!]!
    activeSubs: [Sub!]!
    topSubs(cursor: String, when: String, from: String, to: String, by: String, limit: Limit! = ${LIMIT}): Subs
    userSubs(name: String!, cursor: String, when: String, from: String, to: String, by: String, limit: Limit! = ${LIMIT}): Subs
    mySubscribedSubs(cursor: String): Subs
    subSuggestions(q: String!, limit: Limit! = 5): [Sub!]!
  }

  type Subs {
    cursor: String
    subs: [Sub!]!
  }

  extend type Mutation {
    upsertSub(oldName: String, name: String!, desc: String, baseCost: Int!,
      replyCost: Int!,
      postsSatsFilter: Int,
      postTypes: [String!]!,
      billingType: String!, billingAutoRenew: Boolean!,
      sendProtocolId: Int,
      nsfw: Boolean!): PayIn!
    paySub(name: String!, sendProtocolId: Int): PayIn!
    toggleMuteSub(name: String!): Boolean!
    toggleSubSubscription(name: String!): Boolean!
    transferTerritory(subName: String!, userName: String!): Sub
    unarchiveTerritory(name: String!, desc: String, baseCost: Int!,
      replyCost: Int!, postsSatsFilter: Int,
      postTypes: [String!]!,
      billingType: String!, billingAutoRenew: Boolean!,
      sendProtocolId: Int,
      nsfw: Boolean!): PayIn!
    upsertSubTheme(subName: String!, input: SubThemeInput!): SubTheme
    upsertDomainSeo(subName: String!, input: DomainSeoInput!): DomainSeo
  }

  type Sub {
    name: String!
    createdAt: Date!
    userId: Int!
    user: User!
    desc: String
    lexicalState: String
    html: String
    updatedAt: Date!
    postTypes: [String!]!
    allowFreebies: Boolean!
    billingCost: Int!
    billingType: String!
    billingAutoRenew: Boolean!
    rankingType: String!
    billedLastAt: Date!
    billPaidUntil: Date
    baseCost: Int!
    replyCost: Int!
    postsSatsFilter: Int!
    status: String!
    meMuteSub: Boolean!
    nsfw: Boolean!
    nitems(when: String, from: String, to: String): Int!
    meSubscription: Boolean!
    theme: SubTheme
    domainSeo: DomainSeo

    optional: SubOptional!
  }

  type SubOptional {
    """
    conditionally private
    """
    stacked(when: String, from: String, to: String): Int
    spent(when: String, from: String, to: String): Int
    revenue(when: String, from: String, to: String): Int
  }

  enum ThemeMode {
    LIGHT
    DARK
    SYSTEM
  }

  type SubTheme {
    subName: String!
    primaryColor: String
    secondaryColor: String
    linkColor: String
    brandColor: String
    defaultMode: ThemeMode
    logoId: Int
  }

  input SubThemeInput {
    primaryColor: String
    secondaryColor: String
    linkColor: String
    brandColor: String
    logoId: Int
    defaultMode: ThemeMode
  }

  type DomainSeo {
    domainId: Int!
    title: String
    tagline: String
    ogImageId: Int
    faviconId: Int
  }

  input DomainSeoInput {
    title: String
    tagline: String
    ogImageId: Int
    faviconId: Int
  }
`
