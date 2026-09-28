import { Nav, Navbar } from '@/components/ui/nav'
import { PostItem, Sorts, hasNavSelect } from '../common'
import styles from '../../header.module.css'

export default function SecondBar (props) {
  const { prefix, topNavKey } = props
  if (!hasNavSelect(props)) return null
  return (
    <Navbar className='not-first:pt-0'>
      <Nav
        className={styles.navbarNav}
        activeKey={topNavKey}
      >
        <div className='flex'>
          <Sorts {...props} className='-ms-2 me-3' />
        </div>
        <PostItem className='ms-auto me-0 flex' prefix={prefix} />
      </Nav>
    </Navbar>
  )
}
