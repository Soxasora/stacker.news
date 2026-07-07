import { useCallback, useEffect, useRef } from 'react'

function eventToPosition (event) {
  return {
    x: event.clientX,
    y: event.clientY
  }
}

function distance (pointA, pointB) {
  return Math.sqrt(
    Math.pow(pointB.x - pointA.x, 2) + Math.pow(pointB.y - pointA.y, 2)
  )
}

// functional rewrite of the old React.PureComponent (C11) — same props,
// same pointer semantics
export default function LongPressable ({
  onLongPress,
  onShortPress,
  longPressTime = 500,
  primaryMouseButtonOnly = true,
  // Maximum distance (pixels) user is allowed to drag before click is canceled
  dragThreshold = 100,
  children
}) {
  const timerRef = useRef(null)
  const isLongPressing = useRef(false)
  const startingPosition = useRef({ x: 0, y: 0 })

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => clearTimer, [clearTimer])

  const exceedDragThreshold = useCallback((point) => {
    return distance(startingPosition.current, point) > dragThreshold
  }, [dragThreshold])

  const handlePointerDown = useCallback((e) => {
    if (primaryMouseButtonOnly) {
      if (e.pointerType === 'mouse' && e.button !== 0) {
        return
      }
    }

    // re-initialize long press
    isLongPressing.current = false
    startingPosition.current = eventToPosition(e)

    timerRef.current = setTimeout(() => {
      isLongPressing.current = true
      onLongPress(e)
    }, longPressTime)
  }, [primaryMouseButtonOnly, longPressTime, onLongPress])

  const handlePointerUp = useCallback((e) => {
    if (timerRef.current) {
      clearTimer()
    }

    const mousePosition = eventToPosition(e)

    if (!isLongPressing.current && !exceedDragThreshold(mousePosition)) {
      onShortPress(e)
    } else {
      isLongPressing.current = false
    }
  }, [clearTimer, exceedDragThreshold, onShortPress])

  const handlePointerMove = useCallback((e) => {
    if (timerRef.current && exceedDragThreshold(eventToPosition(e))) {
      clearTimer()
    }
  }, [clearTimer, exceedDragThreshold])

  const handlePointerLeave = useCallback(() => {
    if (timerRef.current) {
      clearTimer()
    }
  }, [clearTimer])

  return (
    <div
      onPointerUp={handlePointerUp}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {children}
    </div>
  )
}
