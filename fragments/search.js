import { gql } from '@apollo/client'

// the nav search dropdown: a handful of posts, stackers and territories per keystroke.
// posts go through opensearch while the names are plain db lookups, so they are
// separate queries and the names never wait for the posts

// $q is the full query (@nym and ~territory tokens narrow the posts server-side)
export const NAV_SEARCH_POSTS = gql`
  query navSearchPosts($q: String!, $limit: Limit) {
    search(q: $q, what: "posts", limit: $limit) {
      items {
        id
        title
        searchTitle
        sats
        ncomments
        sub {
          name
        }
      }
    }
  }
`

// $userQ and $subQ carry the text the name lookups match on. searchUsers returns
// whole user rows, so stacked resolves; subSuggestions lists every territory for
// an empty string, hence the include flag
export const NAV_SEARCH_NAMES = gql`
  query navSearchNames($userQ: String!, $withUsers: Boolean!, $subQ: String!, $withSubs: Boolean!, $limit: Limit) {
    searchUsers(q: $userQ, limit: $limit) @include(if: $withUsers) {
      name
      optional {
        stacked
      }
    }
    subSuggestions(q: $subQ, limit: $limit) @include(if: $withSubs) {
      name
    }
  }
`
