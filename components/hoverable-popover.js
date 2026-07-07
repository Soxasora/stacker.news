import { PreviewCard } from '@base-ui/react/preview-card'
import { PopoverBody, popoverStyles, popupClasses } from '@/components/ui/popover'

export default function HoverablePopover ({ trigger, body, onShow }) {
  return (
    <PreviewCard.Root>
      {/* onShow fires at hover start (not open) so lazy queries prefetch
          during the 500ms delay window, exactly as the old onToggle did */}
      <PreviewCard.Trigger
        delay={500}
        closeDelay={300}
        render={<span onPointerEnter={onShow} onFocus={onShow} />}
      >
        {trigger}
      </PreviewCard.Trigger>
      <PreviewCard.Portal>
        <PreviewCard.Positioner side='bottom' sideOffset={8} className={popoverStyles.positioner}>
          <PreviewCard.Popup className={popupClasses()}>
            <PreviewCard.Arrow className={popoverStyles.arrow} />
            <PopoverBody>
              {body}
            </PopoverBody>
          </PreviewCard.Popup>
        </PreviewCard.Positioner>
      </PreviewCard.Portal>
    </PreviewCard.Root>
  )
}
