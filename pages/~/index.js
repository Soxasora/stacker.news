import { useRouter } from 'next/router'
import { getGetServerSideProps } from '@/api/ssrApollo'
import Items from '@/components/items'
import Layout from '@/components/layout'
import { SUB_FULL, SUB_ITEMS } from '@/fragments/subs'
import Snl from '@/components/snl'
import { useQuery } from '@apollo/client'
import PageLoading from '@/components/page-loading'
import TerritoryHeader from '@/components/territory-header'

// TODO: Fix the other pages

export const getServerSideProps = getGetServerSideProps({
  query: SUB_ITEMS,
  variables: (query) => ({
    ...query,
    sub: query.sub ? [...new Set(query.sub.split('+'))] : null
  }),
  notFound: (data, vars) => vars.sub && !data.sub
})

export default function Sub ({ ssrData }) {
  const router = useRouter()
  const multiSub = router.query.sub ? [...new Set(router.query.sub.split('+'))] : null
  const variables = {
    ...router.query,
    sub: multiSub
  }
  const { data } = useQuery(SUB_FULL, { variables })

  if (!data && !ssrData) return <PageLoading />
  const { sub } = data || ssrData

  return (
    <Layout sub={multiSub}>
      {sub && (multiSub?.length === 1)
        ? <TerritoryHeader sub={sub} />
        : (
          <Snl />
          )}
      <Items ssrData={ssrData} variables={variables} />
    </Layout>
  )
}
