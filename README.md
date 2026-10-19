# SkinScope

A local Express website for browsing CS2 inventories and Steam market prices.

## Run locally

1. Install dependencies with `npm ci`.
2. Keep your existing MySQL database and root `.env` configuration.
3. Start the site with `npm run dev` and open http://localhost:3000.
4. Run all tests with `npm test`.

See [Project structure](docs/architecture.md) for the directory layout and file
placement rules. The entry point is now `src/server.js`; the npm commands take
care of this change. Restart the dev server and hard-refresh after the restructure.
Old page URLs redirect to their new locations, and API paths are unchanged.

Reload the browser extension from `extensions/faceit-bridge/` if it was installed
from the previous folder.

## Market prices

Prices come directly from Steam Community's priceoverview endpoint in EUR,
using exact market_hash_name values. POST /api/steam/market/prices reads batches
from the shared MySQL cache. There are no third-party historical price feeds.

The server creates the additive steam_price_cache table in the existing
cs2_website database. The original items table and its market IDs are preserved.
Each price has its own successful Steam fetch timestamp. Prices are displayed
only while strictly less than 24 hours old; failures never renew that timestamp.
The browser also removes displayed prices when they expire.

Recently viewed items (last seven days) are refreshed after 20 hours, leaving
four hours of headroom before expiry. This maintenance runs every minute while
the server is running and resumes from the database after restart. Keep the
server and MySQL running for unattended refreshes. Refreshes are attempted,
not guaranteed: Steam outages or limits can leave an item temporarily without
a valid price. Expired prices are never used as a fallback.

Cached items load immediately. New items need a Steam request once. One shared
queue deduplicates visitors' requests, initially spacing requests one second
apart and slowing down with exponential cooldowns and Retry-After on errors.
This is not a guaranteed safe Steam request rate. The existing 14,806 item IDs
do not contain prices and are not automatically scraped on every startup.
Only item names actually viewed through the site are enrolled for refresh.

Optional database configuration: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME.
Run tests with node --test tests/server/marketPrices.test.js.

## Steam profile backgrounds

The account page uses the linked profile's equipped background from Steam's
IPlayerService/GetProfileItemsEquipped endpoint. Images and muted looping videos
are supported as a backdrop visible around the centered account content.
The avatar banner keeps its gradient. Reduced-motion preferences use the
still image instead. The gradient remains when there is no equipped background
or media cannot load. Background lookups are separate from inventory/profile
lookups and cached for one hour on the server and in browser session storage.

## Browser session cache

Steam profiles and inventories (24 hours, including private results),
and match rosters (5 minutes) are cached in sessionStorage. Reloading the same
tab reuses unexpired data without another profile/inventory request. Profiles
and inventories are keyed by Steam ID, rosters by FACEIT match ID. A new match
replaces the visible roster and may reuse overlapping players' valid data.
The current match ID is still checked with the backend to detect new matches.
Failed requests are not cached. Expired/old entries are evicted; if browser
storage is blocked or full the app continues with an in-memory cache, which
does not survive reloads. Closing the tab ends the session cache.

Run browser-cache tests with node --test tests/client/sessionCache.test.js.

## Accounts and login

The login page supports sign-in, account creation, session restoration and
sign-out. Existing bcrypt accounts continue to work. New usernames use 3–30
letters, numbers, underscores or hyphens; new passwords require at least eight
characters and must fit bcrypt's 72-byte limit. The Steam profile URL is optional
and is a saved profile link, not proof of Steam ownership or Steam sign-in.

POST /api/auth/register and /api/auth/login issue a random seven-day session
cookie (HttpOnly, SameSite=Lax, Secure when the request uses HTTPS). Only a hash
of the session token is stored in the additive user_sessions MySQL table.
GET /api/auth/me restores account details; POST /api/auth/logout revokes the
session. Authentication is checked by the server rather than localStorage.
Public inventory pages remain public. There is no password reset or email
verification flow yet.

All pages check the same server session and replace Login with a circular
account avatar when signed in. The avatar opens a dedicated account page with profile details and sign-out;
the login page and header update together without reloading. A linked numeric
Steam profile supplies a cached avatar when available; otherwise a local default
image is used. Custom /id/ links and numeric /profiles/ links are supported.
The dedicated account page can save or remove a Steam profile using the
authenticated POST /api/auth/profile route. Only the session's own user record
can be updated. The link remains unverified ownership information.

Posts always includes the signed-in user's linked inventory, marked (You), even
without a FACEIT match. That inventory remains first as matches change and is
not duplicated if the user is also on the match roster. Private inventories
still cannot be read. Both browser and backend caches reuse profile lookups.

Authentication writes require JSON and reject cross-origin browser requests.
Login and registration attempts are limited per IP within each server process.
Restart npm run dev after updating to load the new routes. The old demo
/api/mysql/users/get and /api/mysql/users/set routes have been removed.

Run all tests with npm test.

## Appearance

Account details includes Dark mode and Light mode under Appearance. The existing
dark palette is the default. The selection applies immediately and is stored
in localStorage for this browser, including across page reloads and tabs. It is
not synced between devices. All six pages load the preference before rendering
their styles to avoid a flash of the wrong theme. If browser storage is blocked,
the selection still applies to the current page.
