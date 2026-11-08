# Sunset Paint — instructions for coding agents

Read `README.md`, `docs/ARCHITECTURE.md`, and `CONTRIBUTING.md` before changing behavior. `docs/AI-PROMPT.md` is a reusable task brief for users.

- This is an Electron Windows app with a plain JavaScript vector scene, plus a separate static website in `website/`. Preserve that structure unless a task requires changing it.
- Keep the warm palette, tactile depth, custom SVG icons, concise functional copy, keyboard controls, focus states, and reduced-motion support.
- Store new drawing data in world coordinates. Screen-size brushes convert through the current zoom. Do not flatten the scene for convenience.
- All canvas edits must participate in undo/redo, project save/open, recovery, and export. Committed marks are immutable because history snapshots share them.
- Validate new saved fields, preserve backward compatibility, and migrate explicitly before changing format version 1.
- The eraser currently paints paper color; flood fill traces only the visible viewport. Do not assume layers, transparency, pressure, or selection already exist. Document a limit rather than hiding it.
- Preserve `contextIsolation: true` and `nodeIntegration: false`. Keep filesystem access in the main process and the bridge narrow. Never add unrequested telemetry or network transmission.
- Click sounds are Web Audio synthesis. Preserve mute and volume. If changing synthesis, keep `app.js` and `website/sound.js` consistent.
- Make one focused change. Do not broadly reformat `app.js` or switch frameworks alongside a feature.
- Use targeted checks. For drawing changes, check undo/redo, deep zoom, project roundtrip, recovery, and export. For visual changes, inspect desktop/minimum-size layout. For website changes, inspect a desktop and mobile viewport.
- `npm run screenshots` uses isolated sample content; it must not read user projects or recovery. Never capture a user's drawing for marketing without their instruction.
- Keep runtime profiles, logs, generated builds, secrets, and user files out of Git. Installers belong in GitHub Releases.
- Update relevant docs, and report what changed, what was verified, and any limits.
