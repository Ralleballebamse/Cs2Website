# Cs2Website
Making my own website where I can see players in my game skins

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
Run tests with node --test tests/marketPrices.test.js.

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

Run browser-cache tests with node --test tests/sessionCache.test.js.
