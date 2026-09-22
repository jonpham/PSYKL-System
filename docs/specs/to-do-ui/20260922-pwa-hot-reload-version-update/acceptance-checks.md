# Acceptance Checks — PWA Update from App

Observable in the production app at `/settings` (Settings → About).

- [ ] **Primary path** — With a newer bundle deployed, opening Settings shows a different **Available** version and an **Update to latest version** button; tapping it reloads the app onto the new bundle and the Settings view returns reading **Up to date**.
- [ ] **Up to date** — When loaded and available versions match, the section reads **Up to date** and no update button is rendered.
- [ ] **Recovery** — When the update check fails (offline or server unreachable), **Available** reads `unavailable` with **Couldn't check for updates** and a **Try again** action; no update button is offered.
- [ ] **Stalled update** — If the service-worker handshake does not complete within the timeout, the app reloads anyway rather than sitting in **Updating…**.
- [ ] **Persistence** — After the update reload the app is on `/settings`, and the previously loaded version is gone (a second check reports no update available).
- [ ] **Keyboard & focus** — The update button is reachable by Tab and activates with Enter/Space; it is disabled (not removed) while updating.
- [ ] **Narrow layout** — At ~390px (iPhone) the version rows and the full-width button fit without horizontal scroll or truncated SHAs.

## Verified

{Filled after the slice runs — manual verification on desktop browser and iPhone home-screen PWA.}
