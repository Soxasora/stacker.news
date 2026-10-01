import { Nav, Navbar } from '@/components/ui/nav'
import styles from '../../header.module.css'
import { Back, Brand, RightCorner } from '../common'
import { useCommentsNavigatorContext, CommentsNavigator } from '@/components/use-comments-navigator'
import SearchBar from '../search'
import { useRouter } from 'next/router'

// the header and sticky bar wrap this in hidden md:block, so items need no breakpoints
export function DesktopRow ({ dropNavKey, searchFocus }) {
  const { navigator, commentCount } = useCommentsNavigatorContext()
  return (
    <>
      <Back />
      <Brand className='me-1' />
      <SearchBar className='ms-3 min-w-8' autoFocus={searchFocus} />
      <CommentsNavigator navigator={navigator} commentCount={commentCount} />
      <RightCorner className='flex w-full justify-end' dropNavKey={dropNavKey} />
    </>
  )
}

export default function TopBar ({ topNavKey, dropNavKey, pathname }) {
  const router = useRouter()
  // the search page without a search is there to start one
  const searchFocus = pathname === '/search' && !router.query.q
  return (
    <Navbar className='not-last:pb-0'>
      <Nav
        className={styles.navbarNav}
        activeKey={topNavKey}
      >
        <DesktopRow dropNavKey={dropNavKey} searchFocus={searchFocus} />
      </Nav>
    </Navbar>
  )
}
