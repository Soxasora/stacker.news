# Custom Domains MVP

## [STOPPED] Use subdomains for territories by default

### How it works
A wildcard DNS A record that points to stacker.news will enable us to use whatever subdomain, we will then handle outside of DNS other scenarios of inconsistencies.

Parsing the host from request headers is the first step.
It enables us to rewrite something like https://bitcoin.stacker.news to https://stacker.news/~bitcoin, thus allowing us to maintain the same underlying code until we won't need it anymore.

Here's a proof of concept that just checks for subdomain and rewrites to ~territoryname

```javascript
function getTerritorySubdomain (request) {
  // get the incoming url
  const url = request.nextUrl.clone()
  const host = request.headers.get('host') // e.g. "pizza.stacker.news"
  const parts = host.split('.')

  let subdomain = null

  if (parts.length > 2) {
    subdomain = parts[0]
  }

  // my environment is based on sn.soxa.dev as default url
  // this example just handles ~territory and everything else is not rewritten
  if (subdomain && subdomain !== 'sn' && url.pathname === '/') {
    // then this request can be rewritten
    return NextResponse.rewrite(new URL(`/~${subdomain}`, url))
  }
  return NextResponse.next()
}
```

# Custom Domains

We'll give community owners the possibility to become territory owners and benefit from spam protection and a solid revenue model.

This introduces a series of challenges that need to be solved:

- How do we save custom domains? - Ideation
- Shared Authentication - WIP 60%
-- TODO: Don't pass cookies this clearly, find a safer way.
- Automatic SSL certificates - WIP 0%
- DNS guide step by step
- Fee
- Future steps

## Saving custom domains
A straightforward approach is to lookup the DB to match incoming request's host with what's inside `custom_domain`\
But that's not ideal, we want to avoid a db lookup for every request.

A solid solution would be to store custom domains inside the DB and sync it with every instance's `InMemoryCache` using our worker. If a new custom domain gets added or removed, we trigger a cache update.

We would then be able to match incoming request's host with `custom_domain` in cache.

We have two ways: update cache on-demand or update cache every 5 minutes or so.

## Shared Authentication

Login is based on referer, signup redirects to stacker.news

#### Login
1. User goes to forum.pizza.com alone (no referer) -> One-click sign in: If the user is already logged in on stacker.news, transfer the auth cookies

2. User visits forum.pizza.com from stacker.news (referer) -> Automagical redirect with auth cookies from stacker.news

#### Signup
The user gets redirected to stacker.news to signup and gets redirected back with the auth cookies

#### Alternative approach
A very popular approach to this is via [postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) between iframes, saving the JWT in local/session storage. While 'straightforward' we have less control of possible tamperings.

## TODO: Automatic SSL certificates
If they're using Cloudflare, they can provide certificates for the custom domain. If they're not using Cloudflare we don't know.

So the best way to ensure SSL would be to set up a Caddy Server to generate certificates for them.

## TODO: DNS guide step by step
FAQ to most populars domain providers. The territory owner will have to set a CNAME and that's it.

## Fee
Fees are subjected to further discussion

## Future steps

In the future we'd want to provide territory owners ways to collect analytics on their custom domain.
This would mean an integration with Google Analytics by setting a GA4 token or other kinds of services.

While we can provide analytics for territory owners ourselves, they would probably want to handle analytics in their own way.

## More

- Search page should have ~territory pre written
- 