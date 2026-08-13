# Stampo

Mobile-first web app for cutting stamps out of photos, filing them in a collection,
and mailing one to someone as a short video.

## Run

```bash
npm install
npm run dev
```

Then open the app on a phone-sized viewport (design canvas is 440 × 956).

- `npm run build` — typecheck + production build
- `npm run lint` — oxlint

## Stack

Vite · React 19 · TypeScript · Tailwind CSS v4 · React Router.

## Layout approach

The home screen is a single illustration composed at the design's exact
coordinates on a 440 × 956 canvas. `components/Stage.tsx` measures the viewport
and scales that canvas to fit, so proportions hold on any phone — CSS can't turn
viewport units into the unitless factor `scale()` needs, so the factor is
measured in JS.

Later screens (cutter, details, collection) are ordinary responsive flow layouts
and should not use `Stage`.

## Structure

```
src/
  assets/art/      SVGs exported from the Paper design file
  components/      Stage, PillButton, ScreenStub
  screens/         Home + routed placeholders
  lib/
    types.ts       Stamp / StampDraft model
    collection.ts  localStorage-backed collection store
  router.tsx
```

## Routes

| Route         | State                                                       |
| ------------- | ----------------------------------------------------------- |
| `/`           | Home — built, matches the design                            |
| `/capture`    | stub — camera capture + photo upload                        |
| `/crop`       | stub — the stamp cutter (waiting on design)                 |
| `/stamp/new`  | stub — date + location, then save                           |
| `/collection` | stub — saved stamps; per-stamp actions still to be defined  |
| `/send`       | stub — HTML → MP4 video render (script to be provided)      |
| `/about`      | stub                                                        |

## Design source

Paper file "Sunny mist", home screen artboard. Colors and type live in
`src/index.css` under `@theme`; art is exported SVG, not re-drawn.
