// Concept of interoperability with cache
import { gql } from '@apollo/client'
import { getSSRApolloClient } from '@/api/ssrApollo'

const GET_DOMAINS = gql`
  query GetCustomDomains {
    customDomains {
      domain
      subName
      sslEnabled
    }
  }
`

export async function fetchDomainMapping () {
  const client = await getSSRApolloClient()
  const { data } = await client.query({
    query: GET_DOMAINS,
    fetchPolicy: 'cache-and-network' // use cache or refresh
  })

  // Transform to a lookup map
  const domainMap = {}
  for (const domain of data.customDomains) {
    domainMap[domain.domain.toLowerCase()] = {
      subName: domain.subName,
      sslEnabled: domain.sslEnabled
    }
  }

  console.log('Domain mapping:', domainMap)
  return domainMap
}

// Global variable to hold the cache for middleware
let domainCache = {}

// Initialize the cache at server startup
export async function initDomainCache () {
  if (typeof window !== 'undefined') return // Only run on server

  try {
    domainCache = await fetchDomainMapping()
    console.log(`Domain cache initialized with ${Object.keys(domainCache).length} domains`)
  } catch (error) {
    console.error('Error initializing domain cache:', error)
    domainCache = {}
  }
}

// Get domains from cache (no database access)
export function getDomainMapping () {
  return domainCache
}

// Function to update the global cache
export async function updateDomainCache () {
  try {
    domainCache = await fetchDomainMapping()
    console.log(`Domain cache updated with ${Object.keys(domainCache).length} domains`)
    return true
  } catch (error) {
    console.error('Error updating domain cache:', error)
    return false
  }
}

// Function to invalidate the cache when domains change
export function invalidateDomainCache () {
  // Force a refresh of the domain mapping
  fetchDomainMapping.invalidate('domain-mapping')
}
