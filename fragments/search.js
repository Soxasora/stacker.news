import { gql } from '@apollo/client'

// nav search dropdown. posts come from opensearch and names from the db, so
// they're separate queries and names don't wait for posts

// $q includes @nym and ~territory, the server uses them to filter posts
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

// searchUsers because userSuggestions only returns names and we need stacked.
// the include flags skip empty lookups, subSuggestions returns every territory for ''
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
