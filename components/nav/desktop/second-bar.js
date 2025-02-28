import { Nav, Navbar } from 'react-bootstrap'
import { NavSelect, PostItem, Sorts, hasNavSelect } from '../common'
import styles from '../../header.module.css'
import { MultiSubSelect } from '@/components/sub-select'

export default function SecondBar (props) {
  const { prefix, topNavKey, sub } = props
  if (!hasNavSelect(props)) return null
  const isMultiSub = sub && sub.length > 1
  return (
    <Navbar className='pt-0 pb-2 d-flex flex-column align-items-start'>
      <Nav
        className={styles.navbarNav}
        activeKey={topNavKey}
      >
        <NavSelect sub={sub} multi={isMultiSub} size='medium' className='me-1' />
        <div className='ms-2 d-flex'><Sorts {...props} className='ms-1' /></div>
        <PostItem className='ms-auto me-0 d-none d-md-flex' prefix={prefix} />
      </Nav>
      {isMultiSub && <MultiSubSelect sub={sub} noForm className='me-1' groupClassName='mb-0 w-100' size='large' />}
    </Navbar>
  )
}
