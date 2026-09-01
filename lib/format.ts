/**
 * Carbon's date formats, reproduced for the three patterns the Blade views use.
 *
 * Everything is forced to UTC so the server-rendered string and the hydrated
 * one always agree — a local-timezone format would produce a hydration mismatch
 * for any visitor whose offset crosses midnight.
 */
type CarbonFormat = 'd M Y' | 'M d, Y' | 'F d, Y'

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

const LONG_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function formatDate(iso: string, format: CarbonFormat): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''

  const day = String(date.getUTCDate()).padStart(2, '0')
  const year = date.getUTCFullYear()
  const monthIndex = date.getUTCMonth()

  switch (format) {
    case 'd M Y':
      return `${day} ${SHORT_MONTHS[monthIndex]} ${year}`
    case 'M d, Y':
      return `${SHORT_MONTHS[monthIndex]} ${day}, ${year}`
    case 'F d, Y':
      return `${LONG_MONTHS[monthIndex]} ${day}, ${year}`
  }
}
