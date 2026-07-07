import Dropdown from '@/components/ui/dropdown'
import MoreIcon from '@/svgs/more-fill.svg'

export default function ActionDropdown ({ children }) {
  if (!children) {
    return null
  }
  return (
    <Dropdown className='pointer' as='span'>
      <Dropdown.Toggle as='a' onPointerDown={e => e.preventDefault()}>
        <MoreIcon className='fill-grey ms-1' height={16} width={16} />
      </Dropdown.Toggle>
      {/* roomy = the .5rem item padding item-info's module skin used to force */}
      <Dropdown.Menu roomy>
        {children}
      </Dropdown.Menu>
    </Dropdown>
  )
}
