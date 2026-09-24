# Image to SVG

A page-free SwiftBiuX `fileAction` that converts a selected image to SVG **on-device**. It does not use a third-party API or a Web UI.

It calls SwiftBiu's native `convertImageToSVG(...)` host API. The Swift engine uses a weighted OKLab palette, spatially connected regions, and a shared boundary graph. Smooth runs become cubic Bézier curves; detected corners and straight edges are preserved. Adjacent regions reuse the same fitted boundary in reverse.

Transparency is retained, including translucent fills and real holes. Stacked mode completes enclosed opaque regions beneath covering shapes. It does not paint beneath transparent or translucent holes.

Version 1.7.0 defaults to experimental object grouping. The native engine separates a likely canvas background, groups connected foreground colors, attaches small detached parts only when proximity gives an unambiguous owner, and places similar silhouettes in collections while retaining each instance as an independent object. Containment provides nested part groups. The rules are independent of object classes and color names.

Groups carry stable IDs for repeated conversions with identical inputs/options, plus `data-kind` (`background`, `composition`, `collection`, `object`, `part`) and `data-evidence`. When interleaved overlapping paints prevent a safe physical group, multiple fragments share `data-object`; `data-split="true"` marks them. Ordinary SVG editors may select fragments separately. The algorithm preserves drawing order wherever overlapping bounds constrain it. It does not recover original design intent, distinguish touching objects reliably, or reconstruct hidden geometry.

In object mode, each color paint sets `fill` directly on its `<path>` or `<rect>`. It does not create a separate `<g>` for every small color region. Group nodes represent editable background, composition, collection, object and multi-paint part layers. Geometric mode retains its previous SVG structure.

The default **Editable** color-region mode now reduces the paths themselves. After color quantization, a small connected region is absorbed into a touching larger region only when its OKLab color and opacity are close. Whole regions move together; transparent holes, changes between opaque/translucent paint, and strongly contrasting details are protected. **Minimal shapes** uses a wider similarity and size allowance and looks flatter. **Faithful color detail** keeps the prior region tracing. Pixel boundaries always skip this abstraction. This is a visual tradeoff, not a reconstruction of the original artist's layers or complex shading.

Smooth connected regions can become a single editable linear or radial gradient. Detection uses original pixels before palette quantization, checks the fitted paint against every pixel, and retains foreground cutouts and transparent holes. It accepts two-stop sRGB gradients with constant alpha; texture, distinct bands, varying-alpha shading and more complex gradients remain vector color regions. See the [SVG paint server specification](https://www.w3.org/TR/SVG2/pservers.html) for the output format.

## Settings

- **How many colors to keep** — 32 by default; lower is flatter and easier to edit
- **Trace resolution** — longest edge 768 by default, up to 1024
- **Ignore specks smaller than** — 4 px by default; 1 disables the separate area-only speckle filter. The color-region mode can still merge similar paints. Isolated specks may be removed by the area filter when enabled.
- **Edge style** — smooth curves, polygons, or pixel boundaries
- **Layer arrangement** — stacked layers or adjacent cutout shapes
- **Curve detail** — fine (0.35 px), balanced (0.6 px), or simple (1 px)
- **Smooth shading** — detect gradients by default, or keep solid color regions. Pixel mode always keeps solid colors.
- **Color region detail** — Editable by default, Minimal for stronger reduction, or Faithful for the previous paint detail
- **Editable groups** — experimental object groups by default, or the previous geometric containment hierarchy
- **Output Folder**

Existing saved settings take precedence over these defaults. The API also accepts `cornerThreshold` (20–150 degrees, default 60), and snake_case aliases for all tracing options.

Requires a SwiftBiu build with the upgraded native SVG engine for paint abstraction, grouping, gradient, curve and layer options. Older hosts ignore those new options. `maxColors` limits the solid-color palette; detected gradients use their own two color stops. Curve detail also controls polygon simplification. Nearly straight curve runs become lines within the selected fitting tolerance.

The host API accepts `groupMode: "objects" | "geometric"` (alias `group_mode`). Its default stays `geometric` for existing API callers; this plugin explicitly requests `objects`. Results add `objectCount` (logical object candidates, counting split fragments once) and `groupCount` (all `data-kind` groups, including background, parts, collections and fragments). Both are zero in geometric mode; `shapeCount` retains its original meaning.

The host API also accepts `paintMode: "editable" | "minimal" | "faithful"` (alias `paint_mode`). Its default stays `faithful` for existing callers; this plugin requests `editable`. The two options are independent: geometric grouping can use simplified paints, and object grouping can retain faithful paints.

The host repository's `tools/svg-quality` contains the regression suite and a reproducible VTracer comparison. The comparison records the reference version and parameters; it is not a claim of parity on every image.

`tools/svg-quality/grouping.py` produces an interactive before/after inspector and compares object masks against authored reference groups. Its algorithm takes inspiration from [Automatic Hierarchical Arrangement of Vector Designs](https://techmatt.github.io/pdfs/automaticArrangementOfVectorDesigns.pdf), using a smaller, deterministic native rule set. It does not embed the paper's implementation, ReGroup, Vector Prism or a vision-language model.
