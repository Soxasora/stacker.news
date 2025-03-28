import { numWithUnits } from './format'

export function timeSince (timeStamp) {
  const now = new Date()
  const secondsPast = Math.abs(now.getTime() - timeStamp) / 1000
  if (secondsPast < 60) {
    return parseInt(secondsPast) + 's'
  }
  if (secondsPast < 3600) {
    return parseInt(secondsPast / 60) + 'm'
  }
  if (secondsPast <= 86400) {
    return parseInt(secondsPast / 3600) + 'h'
  }
  if (secondsPast > 86400) {
    const day = timeStamp.getDate()
    const month = timeStamp.toDateString().match(/ [a-zA-Z]*/)[0].replace(' ', '')
    const year = timeStamp.getFullYear() === now.getFullYear() ? '' : ' ' + timeStamp.getFullYear()
    return day + ' ' + month + year
  }

  return 'now'
}

export function datePivot (date,
  { years = 0, months = 0, weeks = 0, days = 0, hours = 0, minutes = 0, seconds = 0, milliseconds = 0 }) {
  return new Date(
    date.getFullYear() + years,
    date.getMonth() + months,
    date.getDate() + days + weeks * 7,
    date.getHours() + hours,
    date.getMinutes() + minutes,
    date.getSeconds() + seconds,
    date.getMilliseconds() + milliseconds
  )
}

export function diffDays (date1, date2) {
  const diffTime = Math.abs(date2 - date1)
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

export const dayMonthYear = when => new Date(when).toISOString().slice(0, 10)
export const dayMonthYearToDate = when => {
  const [year, month, day] = when.split('-')
  return new Date(+year, month - 1, day)
}

export function timeLeft (timeStamp) {
  const now = new Date()
  const secondsPast = (timeStamp - now.getTime()) / 1000

  if (secondsPast < 0) {
    return false
  }

  if (secondsPast < 60) {
    return parseInt(secondsPast) + 's'
  }
  if (secondsPast < 3600) {
    return parseInt(secondsPast / 60) + 'm'
  }
  if (secondsPast <= 86400) {
    return parseInt(secondsPast / 3600) + 'h'
  }
  if (secondsPast > 86400) {
    const days = parseInt(secondsPast / (3600 * 24))
    return numWithUnits(days, { unitSingular: 'day', unitPlural: 'days' })
  }
}

export function whenRange (when, from, to = Date.now()) {
  switch (when) {
    case 'custom':
      return [new Date(Number(from)), new Date(Number(to))]
    default:
      return [new Date(whenToFrom(when)), new Date(Number(to))]
  }
}

export function timeUnitForRange ([from, to]) {
  const date1 = new Date(Number(from))
  const date2 = new Date(Number(to))
  const diffTime = Math.abs(date2 - date1)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 7) {
    return 'hour'
  }

  if (diffDays < 90) {
    return 'day'
  }

  if (diffDays < 180) {
    return 'week'
  }

  return 'month'
}

export const whenToFrom = (when) => {
  switch (when) {
    case 'day':
      return datePivot(new Date(), { days: -1 }).getTime()
    case 'week':
      return datePivot(new Date(), { days: -7 }).getTime()
    case 'month':
      return datePivot(new Date(), { days: -30 }).getTime()
    case 'year':
      return datePivot(new Date(), { days: -365 }).getTime()
    default:
      return new Date('2021-05-01').getTime()
  }
}

export const sleep = (ms) => new Promise((resolve, reject) => setTimeout(resolve, ms))

export function dateToTimeZone (date, tz) {
  return date.getTime() + tzOffset(tz) * 60 * 60 * 1000
}

function tzOffset (tz) {
  const date = new Date()
  date.setMilliseconds(0)
  const targetDate = new Date(date.toLocaleString('en-US', { timeZone: tz }))
  const targetOffsetHours = (date.getTime() - targetDate.getTime()) / 1000 / 60 / 60
  return targetOffsetHours
}

export class TimeoutError extends Error {
  constructor (timeout) {
    super(`timeout after ${timeout / 1000}s`)
    this.name = 'TimeoutError'
    this.timeout = timeout
  }
}

function timeoutPromise (timeout) {
  return new Promise((resolve, reject) => {
    // if no timeout is specified, never settle
    if (!timeout) return

    // delay timeout by 100ms so any parallel promise with same timeout will throw first
    const delay = 100
    setTimeout(() => reject(new TimeoutError(timeout)), timeout + delay)
  })
}

export async function withTimeout (promise, timeout) {
  return await Promise.race([promise, timeoutPromise(timeout)])
}

export async function callWithTimeout (fn, timeout) {
  return await Promise.race([fn(), timeoutPromise(timeout)])
}

// AbortSignal.timeout with our custom timeout error message
export function timeoutSignal (timeout) {
  const controller = new AbortController()

  if (timeout) {
    setTimeout(() => {
      controller.abort(new TimeoutError(timeout))
    }, timeout)
  }

  return controller.signal
}
