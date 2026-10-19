# Project structure

```text
src/
  app.js                  Express middleware, static files, redirects and API mounts
  server.js               HTTP listener and price maintenance startup
  config/                 Environment loading and MySQL connection pool
  routes/                 HTTP handlers grouped by responsibility
  services/               Steam lookups, pricing, caching and database access
public/
  index.html              Home page
  pages/                  Account, Contact, Guide, Login and Posts HTML
  assets/
    styles/               Shared site/theme styles and page styles
    scripts/
      shared/             Account navigation, theme and browser cache
      pages/              Account, Contact and Login entry scripts
      inventory/          Posts entry script and inventory features
    images/               Default avatar and favicon
extensions/faceit-bridge/  Unpacked browser extension and installation notes
scripts/legacy/           Preserved manual importer; never started by the app
database/queries/         Local SQL query snippets, not schema migrations
docs/reference/           Saved HTML examples, not served to browsers
tests/
  client/                 Browser logic unit tests
  server/                 API, service and static asset tests
```

Keep browser-only code in `public/assets/scripts/` and server-only code in `src/`.
Use routes for HTTP validation/responses and services for reusable business logic.
Shared styles belong in `assets/styles/`, with page layouts in `styles/pages/`.
Use absolute browser URLs for pages/assets and relative module imports for code.

The app resolves `public/` and `.env` from their filesystem locations, independently
of the working directory. Importing `src/app.js` does not start a server or price
maintenance; `src/server.js` owns both. This makes the app testable in isolation.

Runtime cache files belong in ignored `.cache/`, and npm manages ignored
`node_modules/`. Editor settings remain in their existing editor folders.
Database queries and legacy scripts are never executed automatically.

## Existing links

The root URL serves `public/index.html`. The other pages live under `/pages/`.
Old `/home.html`, `/posts.html`, `/guide.html`, `/contact.html`, `/account.html`
and `/loginPage.html` URLs redirect to their new locations. API URLs are unchanged.

The extension moved from `faceit-bridge-extension/` to
`extensions/faceit-bridge/`. Load the new folder as an unpacked extension.
