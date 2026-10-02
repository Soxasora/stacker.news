import { Nav, Navbar } from '@/components/ui/nav'
import { PostItem, Sorts, hasSorts } from '../common'
import styles from '../../header.module.css'

export default function SecondBar (props) {
  const { prefix, topNavKey } = props
  if (!hasSorts(props)) return null
  return (
    <Navbar className='not-first:pt-0'>
      <Nav
        className={styles.navbarNav}
        activeKey={topNavKey}
      >
        {/* pulled back by the padding of the links so lit lines up with the logo */}
        <div className='flex gap-1 -ms-2'>
          <Sorts {...props} />
        </div>
        <PostItem className='ms-auto me-0 flex' prefix={prefix} />
      </Nav>
    </Navbar>
  )
}
