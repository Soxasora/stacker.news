// C3 pre-flight/QA scratch page (§12.0) — never commit; delete after C3 lands.
// Mounts today's tooltip populations + a bare Base UI 1.6.0 tooltip + a
// replica of the toolbar's interim state (risk 1: rb Dropdown as Trigger
// child) so headless Chrome can measure painted output and tap behavior.
import { useState } from 'react'
import Dropdown from 'react-bootstrap/Dropdown'
import ActionTooltip from '@/components/action-tooltip'
import { BadgeTooltip } from '@/components/badge'
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip'
import { getGetServerSideProps } from '@/api/ssrApollo'

// force SSR to include CSP nonces; never serve this outside development
export const getServerSideProps = process.env.NODE_ENV === 'development'
  ? getGetServerSideProps({ query: null })
  : async () => ({ notFound: true })

// replica of editor/plugins/toolbar/index.js ToolbarDropdown (risk 1):
// rb Dropdown as='span' is the Trigger's render child until C8b
function ToolbarDropdownReplica () {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  return (
    <ActionTooltip notForm overlayText='toolbar replica' placement='top' noWrapper showDelay={500} transition disable={dropdownOpen}>
      <Dropdown drop='up' className='pointer' as='span' onToggle={setDropdownOpen} show={dropdownOpen}>
        <Dropdown.Toggle as='a' onPointerDown={e => e.preventDefault()} data-testid='toolbar-toggle'>
          toolbar dropdown
        </Dropdown.Toggle>
        <Dropdown.Menu>
          <Dropdown.Item data-testid='toolbar-item' onClick={() => setDropdownOpen(false)}>item one</Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    </ActionTooltip>
  )
}

export default function TooltipPreflight () {
  return (
    <div style={{ padding: '10rem 2rem 60vh' }}>
      <h1>C3 tooltip pre-flight</h1>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '5rem', marginTop: '4rem' }}>
        <ActionTooltip notForm overlayText='21 sats'>
          <span data-testid='action-trigger'>population A</span>
        </ActionTooltip>
        <BadgeTooltip overlayText='anonymous'>
          <span data-testid='badge-trigger'>population B</span>
        </BadgeTooltip>
        <BaseTooltip.Provider delay={0} closeDelay={0}>
          <BaseTooltip.Root>
            <BaseTooltip.Trigger data-testid='baseui-trigger' render={<span>base ui</span>} />
            <BaseTooltip.Portal>
              <BaseTooltip.Positioner side='bottom' sideOffset={6}>
                <BaseTooltip.Popup
                  data-testid='baseui-popup'
                  style={{ backgroundColor: '#5c8001', color: '#fff', padding: '.25rem .5rem' }}
                >
                  base ui popup
                </BaseTooltip.Popup>
              </BaseTooltip.Positioner>
            </BaseTooltip.Portal>
          </BaseTooltip.Root>
        </BaseTooltip.Provider>
        <ToolbarDropdownReplica />
      </div>
    </div>
  )
}
