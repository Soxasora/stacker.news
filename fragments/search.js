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
  query navSearchNames($q: String!, $withUsers: Boolean!, $withSubs: Boolean!, $limit: Limit) {
    searchUsers(q: $q, limit: $limit) @include(if: $withUsers) {
      name
      photoId
      optional {
        stacked
      }
    }
    subSuggestions(q: $q, limit: $limit) @include(if: $withSubs) {
      name
    }
  }
`

// the territories with the most posts in the last week, shown before anything
// is typed when there are no subscriptions to show
export const NAV_POPULAR_SUBS = gql`
  query navPopularSubs($limit: Limit) {
    topSubs(when: "week", by: "items", limit: $limit) {
      subs {
        name
        nitems(when: "week")
      }
    }
  }
`
