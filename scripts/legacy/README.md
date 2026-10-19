# Legacy tools

`import-market-ids.js` is the former unmounted `routes/githubLoad.js` bulk
importer. It is preserved here for reference and is never loaded by the server.
It downloads market-ID data and writes to the `items` table; review the parsing
and database configuration before manually running it. Normal inventory pricing
does not need this importer.
