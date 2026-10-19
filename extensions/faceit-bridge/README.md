# FACEIT bridge extension

Load this directory as an unpacked extension in Chromium's extension settings.
If you previously loaded `faceit-bridge-extension/`, select this new directory
instead. The manifest and background worker must stay together.

When a FACEIT room finishes loading, `background.js` sends its match ID to
`http://localhost:3000/api/faceit/current-matchid`. Run the local website first.
