# Contributing

The plugin runtime is in `src/main.js`; Bob options are in `src/info.json`.
Run `npm test` and `npm run build` before submitting a pull request. Test the
package in Bob on macOS for runtime changes. Never commit credentials, private
endpoints, user text, or local configuration.

## Releases

1. Set the same version in `package.json` and `src/info.json`.
2. Run tests and build the package.
3. Commit the changes, create a matching `vX.Y.Z` tag, and push the commit and tag.
4. The release workflow validates the tag, builds the plugin, and publishes an
   English release with the package and its SHA-256 update feed (`appcast.json`).

`src/info.json` points to the update feed attached to the latest GitHub release.
The update feed is generated for each release and is not stored in the source
tree. Historical releases and Git history are not imported.

Use your GitHub no-reply email for commits if you do not want to publish a personal
email address. The MIT copyright notice must remain in source and distributions.
