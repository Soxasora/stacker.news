import { Nav, Navbar } from '@/components/ui/nav'
import styles from '../../header.module.css'
import { Back, Brand, RightCorner } from '../common'
import { useCommentsNavigatorContext, CommentsNavigator } from '@/components/use-comments-navigator'
import SearchBar from '../search'

// the header and sticky bar wrap this in hidden md:block, so items need no breakpoints
export function DesktopRow ({ dropNavKey }) {
  const { navigator, commentCount } = useCommentsNavigatorContext()
  return (
    <>
      <Back />
      <Brand className='me-1' />
      <SearchBar className='ms-3 min-w-8' />
      <CommentsNavigator navigator={navigator} commentCount={commentCount} />
      <RightCorner className='flex w-full justify-end' dropNavKey={dropNavKey} />
    </>
  )
}

export default function TopBar ({ topNavKey, dropNavKey }) {
  return (
    <Navbar className='not-last:pb-0'>
      <Nav
        className={styles.navbarNav}
        activeKey={topNavKey}
      >
        <DesktopRow dropNavKey={dropNavKey} />
      </Nav>
    </Navbar>
  )
}
