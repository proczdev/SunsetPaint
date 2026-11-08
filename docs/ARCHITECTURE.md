# Architecture

## Desktop boundary

`main.js` creates a frameless BrowserWindow. Its preload is local; context isolation is enabled and Node integration disabled. IPC handles native open/save dialogs, recovery, and window actions. The renderer never receives a filesystem API. Closing sends a notification so the renderer can animate, flush recovery, and acknowledge; the main process has a timeout fallback.

`preload.js` exposes `window.desktop`: `window`, `save`, `open`, `recover`, `autosave`, `onClosing`, and `closeReady`. If a feature needs a new desktop operation, add a specific method rather than exposing generic IPC or file execution.

## Scene and coordinates

The artboard is 4096 world units square. `scene` is an ordered array of marks. Every mark has an anchor `x/y`; paths store offsets from that anchor. The view holds a world-space center and a zoom `z`. `world()` and `screen()` convert between viewport pixels and world coordinates.

Brush size is in screen pixels in the UI and is divided by zoom at stroke creation. `drawMark()` projects the anchor and scales local offsets/widths. `drawScene()` is reused for display and export, so do not hardcode view transforms inside a mark renderer.

`canvas` draws the committed scene; `preview` draws the in-progress mark and receives input. Pointer capture maintains a stroke outside the original pointer area. Device pixel ratio is handled separately from zoom. RequestAnimationFrame batches committed renders; pointer moves update the preview.

### Current mark types

| Type | Stored data |
| --- | --- |
| `brush`, `eraser` | local `points`, world `width`, color, opacity, smoothing flag |
| `circle`, `rectangle`, `star`, `ruler`, `arrow` | start/end local points, width, color, optional fill, creation zoom |
| `fill` | local contour `loops`, overlap width, color, opacity |
| `image` | embedded image data URL, world width/height and anchor |

Images are decoded into an in-memory map before loading a scene. `validateProject()` checks the file marker, version, mark types, colors, finite coordinates, and image data URL types.

## Input and history

The pointer handlers create a gesture, update its temporary mark, and commit once at the end. Panning is a separate gesture. Smoothing filters incoming points, then uses quadratic interpolation for rendering. Ruler and arrow can snap angles with Shift; proportional shapes constrain the end coordinates.

`capture()` stores a shallow snapshot of the scene array and clears redo. `commit()` captures, adds a mark, then calls `changed()`. `undo()`/`redo()` exchange array snapshots. Since marks are shared across snapshots, never mutate an existing committed object; replace it in a new array after capturing history. Settings and paper-color changes are currently outside canvas undo history.

`changed()` updates state, requests drawing, and debounces local recovery. A `.sunset` document has `{format:'sunset-paint', version:1, paper, scene, view}`. It does not store session history. Full-canvas PNG export renders the same scene with an identity projection onto a 4096px bitmap.

## Flood fill

`fillAt()` samples the current canvas at a capped viewport resolution. It floods color-similar pixels using the configured tolerance, extracts directed region edges, joins them into loops, removes collinear points, then converts the loops into world coordinates. A small stroke overlap around the region reduces white antialiasing seams. The result is a vector contour committed as a mark.

The algorithm only sees the viewport. Off-screen boundaries and features thinner than its sample resolution are not available. Do not describe it as a whole-document topology engine. If replacing it, preserve hole winding, edge behavior, and usable performance at deep zoom.

## Sound

`clickSound()` lazily creates a Web Audio context after interaction. It combines a filtered noise attack, a short pitched triangle body, and a quieter release transient. Button identity sets the pitch register; click count and jitter add variation. Settings persist mute and volume locally. The website's `sound.js` mirrors this synthesis and uses a separate settings key.

## Website

`website/` is buildless static HTML/CSS/JS. `config.js` is the single source for GitHub owner/repository, branch, version, and release asset filename. `site.js` wires links, accessible screenshot tabs/lightbox, sound controls, and a separate normalized-coordinate scratchpad. The scratchpad is a website demonstration, not an embedded desktop engine.

`scripts/capture-screenshots.cjs` creates original sample vector artwork and renders it in the real app using an isolated profile. It writes the example project and three screenshots. No screenshot comes from a user's personal drawing.

## Useful change paths

- New shape: SVG and key/tool maps → pointer mark creation → `drawMark` → `validateProject` → history/roundtrip/export check.
- New persistent document setting: file schema + validation + defaults + application + rendering/export + recovery.
- New user preference: defaults + persistent settings + control + behavior + keyboard/focus where applicable.
- Layers or image transforms: first design immutable scene changes and backward-compatible serialization; these features do not exist yet.
- New native integration: main process handler + narrow preload method + validated inputs; keep the renderer isolated.
