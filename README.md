# IchthyoMorph v12 — hyper-realistic procedural fish generator

React + Vite + Tailwind + Three.js. 106 species, each lofted from morphometrics measured on the
reference photographs of the [fish-images](https://github.com/youssef22karam/fish-images) library
(the app loads those photos directly from the library via jsDelivr for side-by-side comparison).

## What changed in v12
**Mouth fixes (wrasses, parrotfishes and every small-mouthed species)**
- Premaxillary protrusion, lip cushions and hyoid/throat depression now scale with the measured jaw
  (they were absolute: a 3 %-SL parrotfish mouth slid forward 78 % of its own length → needle snout).
- Protrusion fades to zero at the rictus → no more cheek slit behind the mouth corner.
- Lower-jaw skinning stops at the quadrate joint → throat skin no longer swings up into the head.
- Lower-lip tube winding fixed (it rendered inside-out → crumpled look).
- Parrotfish/puffer beaks are solid fused dental plates (species beak colour).

**Fins — part of the body, jointed, moving**
- Every fin is a closed two-layer shell: a fleshy root fillet that starts exactly on the body skin
  (and carries the body's own scale texture), bony rays raised on both faces, accordion pleats,
  translucent membrane with ray segmentation/branching, patterns (spots, leopard, bands, net, ray spots)
  and frayed margins.
- Caudal root continues the peduncle surface exactly; procurrent rays; new `delta` tail; corrected
  `rounded`/`halfmoon` outlines.
- 3D spines on spiny fins (+ perciform anal/pelvic spines), guppy gonopodium.
- Joints in the vertex shader: pectorals/pelvics row + feather from a ball joint at the fin base
  (labriform swimmers row hard), median fins ripple, the caudal cups/flexes and the body wave
  continues through long tails.

**Eyes** — gaze-driven globe (procedural iris fibres, pupillary ring, limbus, round pupil) under a clear
cornea, seated in a skin socket; saccades, independent left/right drift, convergence + pupil dilation
during the feeding strike.

## Layout (every file < 30 kB — no reassembly step needed)
- `src/engine/model.ts` analytic body model · `build.ts` body loft + orchestration
- `mouth.ts`, `eyes.ts`, `fins.ts`, `extras.ts` (rostra, barbels, spikes, fronds), `geom.ts`, `shader.ts`, `skin.ts`
- `src/data/species{1,2,3}{a,b}.ts` species data · `factory.ts` archetypes

URL parameters: `?sp=guppy&view=side|three|front|top|below&gape=0..1&feed=0|1&swim=0|1&fins=0|1&eyes=0|1&zoom=2&focus=0.9`.

```sh
npm install && npm run dev   # or npm run build
```
