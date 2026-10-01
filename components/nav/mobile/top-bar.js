import { Nav, Navbar } from '@/components/ui/nav'
import styles from '../../header.module.css'
import { Back, NavPrice, NavWalletSummary, SignUpButton, hasSorts } from '../common'
import { MobileSearchBar } from '../search'
import { useMe } from '@/components/me'
import { useCommentsNavigatorContext, CommentsNavigator } from '@/components/use-comments-navigator'

export function MobilePriceRow () {
  const { me } = useMe()
  const { navigator, commentCount } = useCommentsNavigatorContext()
  return (
    <>
      <Back />
      <NavPrice className='shrink' />
      <CommentsNavigator navigator={navigator} commentCount={commentCount} className='px-2' />
      {me ? <NavWalletSummary /> : <SignUpButton width='fit-content' />}
    </>
  )
}

export default function TopBar ({ path, pathname, topNavKey }) {
  // the search bar is on the pages that list a territory's items, where it's
  // also how you get to another territory, and on the search pages
  const search = hasSorts({ path, pathname }) || pathname.endsWith('/search')

  return (
    <Navbar className='not-last:pb-0'>
      <Nav
        className={styles.navbarNav}
        activeKey={topNavKey}
      >
        {search
          ? (
            <>
              <Back />
              <MobileSearchBar />
            </>
            )
          : <MobilePriceRow />}
      </Nav>
    </Navbar>
  )
}
