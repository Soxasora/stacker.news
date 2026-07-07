import GithubIcon from '@/svgs/github-fill.svg'
import TwitterIcon from '@/svgs/twitter-fill.svg'
import LightningIcon from '@/svgs/bolt.svg'
import NostrIcon from '@/svgs/nostr.svg'
import Button, { buttonClasses } from '@/components/ui/button'
import useCookie from './use-cookie'
import { cookieOptions, MULTI_AUTH_POINTER } from '@/lib/auth'
import { useAccounts } from './account'
import SNIcon from '@/svgs/sn.svg'
import { Menu } from '@base-ui/react/menu'
import { dropdownStyles } from '@/components/ui/dropdown'
import styles from '@/components/dropdown.module.css'
import ArrowDownIcon from '@/svgs/editor/toolbar/arrow-down.svg'
import classNames from 'classnames'
import { cn } from '@/lib/cn'
import { useRouter } from 'next/router'

export default function LoginButton ({ text, type, className, onClick, disabled }) {
  let Icon, variant
  switch (type) {
    case 'twitter':
      Icon = TwitterIcon
      variant = 'twitter'
      break
    case 'github':
      Icon = GithubIcon
      variant = 'dark'
      break
    case 'nostr':
      Icon = NostrIcon
      variant = 'nostr'
      break
    case 'lightning':
    default:
      Icon = LightningIcon
      variant = 'primary'
      break
  }

  const name = type.charAt(0).toUpperCase() + type.substr(1).toLowerCase()

  return (
    <Button className={className} variant={variant} onClick={onClick} disabled={disabled}>
      <Icon
        width={20}
        height={20} className='me-4'
      />
      {text} {name}
    </Button>
  )
}

export function LoginWithNymButton ({ className, callbackUrl, disabled }) {
  const router = useRouter()
  const accounts = useAccounts()
  const [pointerCookie, setPointerCookie] = useCookie(MULTI_AUTH_POINTER)

  const account = accounts.find(account => account.id === Number(pointerCookie))
  if (!accounts.length) return null

  const title = account ? `Log in with @${account.name}` : 'Log in with @nym'

  // renders as one visual button (§6.8): main button grows, caret trigger
  // joins it — $btn-border-width is 0 so no -1px border collapse is needed
  return (
    <div className='mb-6 w-full inline-flex'>
      <Button
        variant='success'
        onClick={() => account && router.push(callbackUrl)}
        disabled={disabled || !account}
        className={cn('grow rounded-e-none', className)}
        title={title}
        style={{ minWidth: 0 }}
      >
        <SNIcon width={20} height={20} className='me-4 shrink-0' />
        <span className='truncate' style={{ minWidth: 0 }}>{title}</span>
      </Button>
      {(accounts.length > 1 || !account) && (
        <Menu.Root modal={false}>
          <Menu.Trigger
            title='select account'
            onPointerDown={e => { e.preventDefault(); e.stopPropagation() }}
            className={cn(buttonClasses({ variant: 'success' }), 'rounded-s-none')}
            style={{ maxWidth: '42px' }}
          >
            <ArrowDownIcon width={16} height={16} />
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner side='bottom' align='start' sideOffset={2} className={dropdownStyles.positioner}>
              <Menu.Popup className={classNames(dropdownStyles.menu, styles.dropdownExtra)} style={{ width: '150px' }}>
                {accounts.map(account => (
                  <Menu.Item
                    key={account.id}
                    onClick={() => {
                      setPointerCookie(account.id, cookieOptions({ httpOnly: false }))
                    }}
                    className={classNames(styles.dropdownExtraItem, Number(account.id) === Number(pointerCookie) && styles.active)}
                  >
                    <span className={styles.dropdownExtraItemText}>{account.name}</span>
                  </Menu.Item>
                ))}
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      )}
    </div>
  )
}
