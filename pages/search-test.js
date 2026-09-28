import SearchBar from '@/components/nav/search'
import { getGetServerSideProps } from '@/api/ssrApollo'
import { CenterLayout } from '@/components/layout'

// force SSR to include CSP nonces
export const getServerSideProps = getGetServerSideProps({ query: null })

export default function SearchTest () {
  return (
    <CenterLayout footer>
      <div>
        <SearchBar className='min-w-0 md:min-w-8' />
      </div>
    </CenterLayout>
  )
}
