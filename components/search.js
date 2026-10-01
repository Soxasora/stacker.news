import Container from '@/components/ui/container'
import styles from './search.module.css'
import { useMemo } from 'react'
import { Select, DatePicker } from './form'
import { useRouter } from 'next/router'
import { whenToFrom } from '@/lib/time'
import { useMe } from './me'

const param = value => typeof value === 'string' ? value : ''

// the filters of the search page. the search itself is typed in the nav search bar
export default function SearchFilters () {
  const router = useRouter()
  const { me } = useMe()
  const q = param(router.query.q)
  const from = param(router.query.from)
  const to = param(router.query.to)
  const what = router.pathname.startsWith('/stackers') ? 'stackers' : param(router.query.what) || 'all'
  const sort = param(router.query.sort) || 'relevance'
  const when = param(router.query.when) || 'forever'
  const whatItemOptions = useMemo(() => (['all', 'posts', 'comments', me ? 'bookmarks' : undefined, 'stackers'].filter(item => !!item)), [me])

  const search = async changes => {
    const values = { q, what, sort, when, from, to, ...changes }

    if (values.what === 'stackers') {
      await router.push({
        pathname: '/stackers/search',
        query: { q, what: 'stackers' }
      }, {
        pathname: '/stackers/search',
        query: { q }
      })
      return
    }

    if (values.what === 'all') delete values.what
    if (values.sort === 'relevance') delete values.sort
    if (values.when === 'forever') delete values.when
    if (values.when !== 'custom') { delete values.from; delete values.to }
    if (values.from && !values.to) return

    await router.push({
      pathname: '/search',
      query: values
    })
  }

  if (!q) return null

  return (
    <div className={styles.searchSection}>
      <Container className={`px-0 ${styles.searchContainer}`}>
        <div className='text-muted font-bold flex items-center flex-wrap'>
          <div className='text-muted font-bold flex items-center mb-2'>
            <Select
              noForm
              groupClassName='me-2 mb-0'
              onChange={(_, e) => search({ what: e.target.value })}
              name='what'
              value={what}
              items={whatItemOptions}
            />
            {what !== 'stackers' &&
              <>
                by
                <Select
                  noForm
                  groupClassName='mx-2 mb-0'
                  onChange={(_, e) => search({ sort: e.target.value })}
                  name='sort'
                  value={sort}
                  items={['relevance', 'sats', 'new', 'comments']}
                />
                for
                <Select
                  noForm
                  groupClassName='mb-0 mx-2'
                  onChange={(_, e) => {
                    const range = e.target.value === 'custom' ? { from: whenToFrom(when), to: Date.now() } : {}
                    search({ when: e.target.value, ...range })
                  }}
                  name='when'
                  value={when}
                  items={['custom', 'forever', 'day', 'week', 'month', 'year']}
                />
              </>}
          </div>
          {when === 'custom' &&
            <DatePicker
              noForm
              fromName='from'
              toName='to'
              className='p-0 px-2'
              onChange={(_, [from, to]) => {
                search({ from: from.getTime(), to: to.getTime() })
              }}
              from={from}
              to={to}
              when={when}
            />}
        </div>
      </Container>
    </div>
  )
}
