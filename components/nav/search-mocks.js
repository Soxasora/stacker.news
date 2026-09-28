// mock groups for the search bar's dropdown, one export per state of the design
// and in the shape the list renders, so any of them can be passed as items.
// value is the row's link, title/label its text, meta its trailing column; the
// other fields are the raw values behind them, for whatever the design needs.
// delete once the groups are real

// empty bar
export const BROWSE = [
  {
    value: 'recent',
    label: 'recent',
    items: [
      { value: '/search?q=~bitcoin%20coldcard', type: 'recent', label: '~bitcoin coldcard', tokens: ['~bitcoin'], text: 'coldcard' },
      { value: '/search?q=%40nodebench', type: 'recent', label: '@nodebench', tokens: ['@nodebench'], text: '' },
      { value: '/search?q=channel%20jamming', type: 'recent', label: 'channel jamming', tokens: [], text: 'channel jamming' }
    ]
  },
  {
    value: 'jump',
    label: 'jump to',
    layout: 'tiles',
    toggle: {
      expanded: false,
      total: 84
    },
    items: [
      { value: '/~bitcoin', type: 'territory', name: 'bitcoin', label: '~bitcoin', meta: '412 posts', nitems: 412, subscribed: true },
      { value: '/~tech', type: 'territory', name: 'tech', label: '~tech', meta: '268 posts', nitems: 268, subscribed: true },
      { value: '/~meta', type: 'territory', name: 'meta', label: '~meta', meta: '96 posts', nitems: 96, subscribed: true },
      { value: '/~nostr', type: 'territory', name: 'nostr', label: '~nostr', meta: '181 posts', nitems: 181, subscribed: true }
    ]
  }
]

// typing ~b: names that start with it first, subscribed ones first among those
export const TERRITORIES = [
  {
    value: 'territories',
    label: 'territories',
    items: [
      { value: '/~bitcoin', type: 'territory', name: 'bitcoin', label: '~bitcoin', match: 'b', meta: 'subscribed', subscribed: true },
      { value: '/~books', type: 'territory', name: 'books', label: '~books', match: 'b', meta: 'subscribed', subscribed: true },
      { value: '/~bitdevs', type: 'territory', name: 'bitdevs', label: '~bitdevs', match: 'b', subscribed: false },
      { value: '/~bitcoin_beginners', type: 'territory', name: 'bitcoin_beginners', label: '~bitcoin_beginners', match: 'b', subscribed: false, muted: true },
      { value: '/~boudoir', type: 'territory', name: 'boudoir', label: '~boudoir', match: 'b', subscribed: false, nsfw: true }
    ]
  }
]

// typing @n: stacked is missing for stackers who hide it
export const STACKERS = [
  {
    value: 'stackers',
    label: 'stackers',
    items: [
      { value: '/nodebench', type: 'stacker', name: 'nodebench', label: '@nodebench', match: 'n', meta: '8.2k stacked', stacked: 8200, photoId: null },
      { value: '/nodeless', type: 'stacker', name: 'nodeless', label: '@nodeless', match: 'n', stacked: null, photoId: null },
      { value: '/noderunner', type: 'stacker', name: 'noderunner', label: '@noderunner', match: 'n', meta: '640 stacked', stacked: 640, photoId: null },
      { value: '/lightningdev', type: 'stacker', name: 'lightningdev', label: '@lightningdev', match: 'n', meta: '12.4k stacked', stacked: 12400, photoId: null },
      { value: '/plebnet', type: 'stacker', name: 'plebnet', label: '@plebnet', match: 'n', meta: '9k stacked', stacked: 9000, photoId: null }
    ]
  }
]

// typing lightning: the row that runs the search, then what it would find.
// searchTitle is the title as the search resolver marks it, for <SearchTitle>
export const SEARCH = [
  {
    value: 'search',
    items: [
      { value: '/search?q=lightning', type: 'search', label: 'search lightning', text: 'lightning', tokens: [] }
    ]
  },
  {
    value: 'posts',
    label: 'posts',
    items: [
      { value: '/items/1', type: 'post', title: 'Lightning liquidity ads, explained without the jargon', searchTitle: '***Lightning*** liquidity ads, explained without the jargon', meta: '~bitcoin \\ 2,104 sats', sub: 'bitcoin', sats: 2104 },
      { value: '/items/3', type: 'post', title: 'Why lightning addresses beat LNURL for tipping', searchTitle: 'Why ***lightning*** addresses beat LNURL for tipping', meta: '~bitcoin \\ 1,337 sats', sub: 'bitcoin', sats: 1337 },
      { value: '/items/2', type: 'post', title: 'Running a lightning node on a Raspberry Pi in 2026', searchTitle: 'Running a ***lightning*** node on a Raspberry Pi in 2026', meta: '~tech \\ 890 sats', sub: 'tech', sats: 890 },
      { value: '/items/17', type: 'post', title: 'Privacy on lightning: what your node leaks', searchTitle: 'Privacy on ***lightning***: what your node leaks', meta: '~privacy \\ 760 sats', sub: 'privacy', sats: 760 },
      { value: '/items/4', type: 'post', title: 'Ask SN: what is your lightning wallet setup?', searchTitle: 'Ask SN: what is your ***lightning*** wallet setup?', meta: '~AskSN \\ 612 sats', sub: 'AskSN', sats: 612 }
    ]
  }
]

// typing zapathon under a ~meta token: nothing there, one row to widen the search
export const SEARCH_ELSEWHERE = [
  {
    value: 'search',
    note: 'nothing in ~meta for “zapathon”',
    items: [
      { value: '/search?q=zapathon', type: 'search', label: 'search zapathon everywhere instead', text: 'zapathon', tokens: [] }
    ]
  }
]

// what the empty part says when a state has no rows at all
export const NOTHING = {
  territories: 'no territory called ~zzz',
  stackers: 'no stacker called @zzz',
  search: 'no posts for “zzz”'
}
