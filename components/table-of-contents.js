import { useState, useMemo } from 'react'
import { Popover } from '@base-ui/react/popover'
import FormControl from 'react-bootstrap/FormControl'
import TocIcon from '@/svgs/list-unordered.svg'
import { useRouter } from 'next/router'
import { $extractHeadingsFromRoot } from '@/lib/lexical/utils/toc'
import { dropdownStyles, menuClasses } from '@/components/ui/dropdown'
import { cn } from '@/lib/cn'

// Popover, not Menu (deviation D5): Menu's typeahead would eat printable keys
// from the filter field. Controlled `open` so a heading click closes before
// emitting navigation.
export default function Toc ({ text, readerRef }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('')

  const toc = useMemo(() => {
    if (!readerRef || !text || text.length === 0) return []
    // access the lexical editor state and extract the headings
    return readerRef.getEditorState().read($extractHeadingsFromRoot)
  }, [readerRef, text])

  if (toc.length === 0) {
    return null
  }

  return (
    <div className='flex items-center mb-1'>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger render={<a role='button' tabIndex={0} />} nativeButton={false}>
          <TocIcon width={20} height={20} className='mx-2 fill-grey theme' />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner side='bottom' align='end' sideOffset={2} className={dropdownStyles.positioner}>
            <Popover.Popup className={menuClasses()}>
              <FormControl
                className='mx-4 my-2 w-auto'
                placeholder='filter'
                onChange={(e) => setFilter(e.target.value)}
                value={filter}
              />
              {toc.filter(v => !filter || (v.text || v.heading).toLowerCase().includes(filter)).map(v => (
                <a
                  key={v.slug}
                  href={`#${v.slug}`}
                  className={cn(dropdownStyles.item, v.depth === 1 && 'font-bold')}
                  style={{ marginLeft: `${(v.depth - 1) * 5}px` }}
                  onClick={() => {
                    setOpen(false)
                    // nextjs router doesn't emit hashChangeStart events
                    router.events.emit('hashChangeStart', `#${v.slug}`, { shallow: true })
                  }}
                >{v.text || v.heading}
                </a>
              ))}
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
  )
}
