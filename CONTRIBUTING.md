# Contributing

Read [README.md](README.md), [AGENTS.md](AGENTS.md), and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Describe the user-visible result before choosing an implementation.

## Working locally

1. Fork or clone the repository. Create a branch for one focused change.
2. Run `npm ci` and `npm start` on Windows with Node.js 24.
3. Make the change without replacing the drawing engine or introducing a framework for an unrelated task.
4. Run the relevant smoke check and a brief manual check. For a tool, verify drawing, undo/redo, project roundtrip, and PNG export at ordinary and deep zoom.
5. Send a pull request explaining the problem, resulting behavior, validation performed, and any known limits. Screenshots help for visual changes.

## Extending tools

`app.js` contains the tool names, keyboard map, custom SVGs, pointer handlers, mark creation, and `drawMark`. Connect the UI, rendering, and persistence together. Call `commit()` or correctly pair `capture()` and `changed()` so undo and recovery remain consistent. Avoid mutating an already-committed mark: history snapshots share object references.

New persistent mark fields need defaults for existing projects and validation in `validateProject()`. A breaking change needs a version migration before raising the saved format version. Do not silently make older projects unreadable.

## Visual and interaction rules

- Preserve the Sunburst Barbera palette: peach `#ffb18a`, shadows `#3c001c`, Barbera `#99051f`, orange `#d75000`, sunburst `#efae70`, cream `#f5e4c0`.
- Use dimensional, tactile controls: material gradients, inset tracks, raised button edges, restrained shadows, and visible pressed/selected states.
- Draw icons as SVGs. Keep controls named by their action, with labels, tooltips, focus states, and keyboard access where applicable.
- Honor reduced motion. Use a skeleton if loading content needs a visible loading state.
- Keep clicks short, varied, optional, and volume-controlled. The website mirrors the app's synthesis; update both when changing that sound.
- Keep user-facing copy useful. Do not add AI badges, generic marketing filler, or commentary about the implementation to the app.

## Security and privacy

Keep Node integration off and context isolation on. File access belongs in `main.js`, exposed through the narrow `preload.js` bridge. Validate imported data. Do not add arbitrary shell execution, remote HTML execution, telemetry, accounts, or uploads as incidental parts of a feature. Never include projects, recovery profiles, credentials, or `node_modules` in a contribution.

## Scope and tests

Use meaningful focused checks. Do not add tests that simply repeat an implementation or run long test suites for a small CSS change. Add a regression check when fixing a real logic error. Update the known limits and architecture documentation when behavior changes.

By contributing original work you permit its distribution under the repository's MIT license. Keep dependency licenses and attribution intact.
