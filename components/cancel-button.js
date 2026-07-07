import { navLinkClasses } from '@/components/ui/nav'
import { useRouter } from 'next/router'
import Button from '@/components/ui/button'

export default function CancelButton ({ onClick }) {
  const router = useRouter()
  return (
    <Button className={navLinkClasses('me-4 text-muted font-bold')} variant='link' onClick={onClick || (() => router.back())}>cancel</Button>
  )
}
