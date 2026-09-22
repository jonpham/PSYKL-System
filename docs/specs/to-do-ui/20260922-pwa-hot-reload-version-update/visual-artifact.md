# Visual Artifact — PWA Update from App

> Form C — state storyboard for one surface: Settings → About → Version.

## Today (for contrast)

```text
About
  Version
  web 3f9a1c2 · api 3f9a1c2   in sync
```

## States

| State                | What the user sees                                                                                                                     | How they got here                                                             |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **Checking**         | `Currently loaded  3f9a1c2` / `Available  checking…` — no button                                                                       | Opened Settings; the update check is in flight                                |
| **Up to date**       | `Currently loaded  3f9a1c2` / `Available  3f9a1c2` and a status line **Up to date** — no button                                        | Check finished, versions match                                                |
| **Update available** | `Currently loaded  3f9a1c2` / `Available  8b12d44`, status **A new version is available**, primary button **Update to latest version** | Check finished, a newer bundle is on the server                               |
| **Updating**         | Button replaced by a disabled **Updating…** state; the rest of Settings stays visible                                                  | Tapped the button; skip-waiting handshake then reload is in progress          |
| **Offline / failed** | `Available  unavailable`, status **Couldn't check for updates**, secondary button **Try again**                                        | The version check failed (offline, server unreachable), or the update stalled |

## Reference wireframe — Update available

```text
┌─────────────────────────────────────┐
│ About                               │
│ ─────────────────────────────────── │
│ Currently loaded          3f9a1c2   │
│ Available                 8b12d44   │
│                                     │
│ A new version is available.         │
│ ┌─────────────────────────────────┐ │
│ │   Update to latest version      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ API build  8b12d44                  │
└─────────────────────────────────────┘
```

## Notes

- The reload returns the user to `/settings`, so the Settings view is restored by routing — no state to save. Landing state is **Up to date**.
- If the handshake does not complete within ~5s, fall back to a plain reload rather than hanging in **Updating…**.
- Version strings stay short commits (7 chars) with the full SHA in `title`, matching today's footer.
- `API build` keeps the existing web-vs-api provenance value but is no longer the headline; it is a muted detail row.
