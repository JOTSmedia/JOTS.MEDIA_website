# JOTS.MEDIA website

This updates the existing JOTS.MEDIA project. The original cyan accent, wordmark, Swarm mark, eight services, independent studio identity, contact details, Instagram link, Great Notch Inn project, and legal content are retained.

## Preview and build

No installation or third-party JavaScript dependencies are needed. Node.js and Python 3 are required for local checks/builds.

```sh
npm run build
python3 -m http.server 8765 --bind 127.0.0.1
```

Open `http://127.0.0.1:8765/dist/`. Upload the **contents** of `dist/` to GitHub Pages or another static host. All internal assets are relative, so the site also works under a repository subdirectory. There is one HTML page with anchor routes for work, services, studio and contact. No deployment credentials or hosting identity were present; no public deployment was made.

## Design and behavior

- The header is fixed at the top with reserved layout space: 64px on desktop/tablet and 56px on phones. Section anchors clear the header. Work, Services, Studio and Contact highlight as their sections pass the reading line, with matching mobile states, restrained cyan underlines, hover backgrounds and keyboard focus treatment. Studio remains active through the process section. The mobile menu stays immediately below the header and closes on selection, Escape, outside pointer/focus or a desktop resize.
- After the loader clears and an 850ms pause, 55 individually isolated physical components lift away from the intact circuit board, separate, change material, expand again, and return over 15.5 seconds. These are object-shaped transparent sprites of chips, capacitors, resistors and the processor, rather than fragments of the photograph. The clean board, contact pads and printed traces stay stationary. After reassembly, one cyan stream navigates all 47 routes aligned with the circuit grooves in the original photograph, spanning the west, rear, north, east and south branches. The itinerary alternates direction along neighboring grooves, with one moving head and one cumulative trailing glow. The original hero photograph is restored beneath this light overlay. The whole sequence repeats automatically, with a 5.2-second fully assembled pause between cycles so the stream can complete all 47 grooves. Cyan brightness eases out before the next lift and eases back in after exact reassembly; its distance clock never restarts between cycles.
- Assembly assets load on demand only when motion is enabled and the hero is visible. A 6.5-second asset deadline preserves the original still image on failure and never holds the brand loader. The canvas is capped at 1600px wide and 1.5× density; the light overlay targets about 60 frames per second. A single distance clock moves the stream at 4,000 source-image pixels per second, completing the full loop in about 4.9 seconds. Every route is visited once per continuous loop; brief hidden passages transfer the stream beneath components or beyond the photographed board edges. Each hidden handoff is capped at 64 source-image pixels of clock travel, keeping the luminous tail visible between branches. No extra visible connector lines are drawn. A 360-source-pixel tail keeps its brightness continuous across route handoffs. Route depth strengths range from 0.42 to 1; branches outside the current crop are skipped during painting. Each visible groove retains a faint cached tube body, and the single traveling stream has a bright white core and soft cyan bloom. The light canvas sits above the photo’s white wash, while all text stays above the effect. Leaving the hero, hiding the tab, reduced motion and Motion Off stop rendering and remove the canvas. Returning to the hero starts with the assembled cyan pause, then resumes the repeating material sequence. Only the initial sequence holds the idle tour; later loops do not interrupt user scrolling or the tour. Resizing rebuilds the light overlay for the new dimensions.

- Main sections alternate white (hero), black (work), white (services), black (studio), white (process), and black (contact), followed by a white footer. Cyan remains an accent.
- Scroll-triggered sequences reveal section labels, headings, copy, equal-size cards, images and divider rules with short staggers. The hero background has subtle native scroll-linked depth where supported. Content is visible by default; reduced motion and the footer motion control disable these effects. Initial reveals wait for the brand intro to finish.

- The hero uses two clear floating-glass reading panels with square corners and no border. A 2.5–16% reflection tint and 0.6px backdrop blur preserve circuit detail; soft offset shadows establish depth. Near-black, slightly heavier supporting text with a fine white text shadow remains readable through the clear surface. The photo’s white overlay is also reduced so the circuitry remains visible.
- The exploded assembly uses smooth quintic easing, coordinated component tiers, restrained lateral arcs, softer grounded shadows and a processor reflection clipped to the actual alpha silhouette. Dotted guide wires are removed. Both assembly and circuit painting are capped near 60 frames per second.
- The hero logo and text sit higher: about 32px on desktop and 24px on phones, with the physical component animation checked at full separation. Short phones use a smaller, slightly higher processor lift to keep the chip clear of the raised headline.
- All rendered site text is uppercase. The hero and header use a quiet white surface, generous space, fine rules, restrained cyan, and a full-section, predominantly white technology background with subtle glass circuitry.
- The studio photograph uses a 3840px original. The generated technology background is retained at its native 1672×941 resolution, with optimized delivery variants up to 3840×2160; larger versions are resampled, not native 4K. Photographic source files, including the unused former camera hero, are retained in `sources/`. WebP delivery widths are 640, 960, 1600, 2560 and 3840, selected through `srcset` and `sizes`.
- The portfolio contains eight equally sized live-project cards in this order: Beth Elise, Eternal Valley, LÉ DEAUX, Great Notch Inn, ELEV8MI, SYMZ Customz, Tré Nation and Martinez Grocery. Desktop retains three columns across three rows; the final position is empty, without a placeholder card. Tablets use two columns and phones one.
- Seven website snapshots show the navigation and hero at the top. After a two-second dwell with at least 60% of a scrolling preview visible, its full local page capture loads and begins scrolling at 22 CSS pixels per second. Eternal Valley is a full-screen film experience, so its card uses a still of the actual film keyframe “The Rainbow Bridge Crest,” with no simulated vertical page tour or pause control. Captures are snapshots of the referenced live sites on October 23, 2026; use the project title or preview dialog to visit the live experience.
- Preview scrolling stops out of view, while the browser tab is hidden, and with reduced motion or the global motion control. Each of the seven scrolling previews has a pause/resume control. Wheel, touch or keyboard focus switches to manual exploration. Leaving the card resets its opening frame.
- Full-page captures load on demand. Small screens and standard-density cards receive the 640px version; higher-density/larger cards receive the larger version. Images have no embedded external code, audio or tracking.
- The custom Swarm intro gathers the nine brand dots from the viewport edges, reveals the large wordmark letter by letter, and opens a circular aperture from the cyan dot into the hero. A cyan progress bar and live percentage measure the timed introduction, reaching 100% at the transition; they are not network byte progress. The intro stays visible for 3 seconds from navigation and opens over 900 milliseconds. Reduced-motion/Motion Off visitors get a static 300ms introduction with a short 160ms exit. An independent 4.8-second head timer and a 5.2-second CSS visibility fallback prevent blocking. The dotted mark also appears in the header, hero and footer, and a footer Replay intro control can show the introduction again. Escape dismisses the intro early. It never locks scroll or hides the page content. With scripts unavailable, it does not appear.
- Mobile and short-screen loader dots gather within their own logo area, avoiding the wordmark and progress bar. A compact landscape layout keeps the full mark, wordmark, captions and percentage on screen.
- After five seconds of inactivity, the page gently scrolls from the visitor's current position, easing to 35 CSS pixels per second over 1.2 seconds. Wheel, touch, mouse, keyboard, focus and external scrolling immediately yield control; real scroll events keep postponing restart through touch or trackpad momentum. Held touches/pointers, held navigation keys, form editing, open menus/dialogs, hidden tabs, reduced motion and Motion Off prevent scrolling. Once the visitor becomes idle again, scrolling can resume. There is no Start/Pause control. Nested portfolio preview scrolling remains independent.
- Native dialogs provide keyboard focus containment, Escape dismissal and return focus. Images have descriptions; form controls have labels; navigation and dialogs have accessible names.

## Contact brief

The previous form displayed a success message without delivering a message. The updated form validates details and prepares an email addressed to `hello@jots.media`; the visitor reviews and sends it in their own email app. It explicitly states that nothing has been sent. A text download is available if email-app configuration or URI length causes trouble. No invented backend or delivery confirmation is used. Phone and direct email links remain available without scripts.

## Project references

1. Beth Elise — https://jotsmedia.github.io/beth-elise-site-v9/
2. Eternal Valley — https://jotsmedia.github.io/ETERNALVALLEY_area51/
3. LÉ DEAUX — https://jotsmedia.github.io/LE-DEAUX/
4. The Great Notch Inn — https://www.thegreatnotchinn.com/
5. ELEV8MI — https://jotsmedia.github.io/elev8mi_v57/
6. SYMZ Customz — https://jotsmedia.github.io/SYMZ_v13/
7. Tré Nation — https://jotsmedia.github.io/TRENATION_v10/
8. Martinez Grocery — https://jotsmedia.github.io/NELSONS_v12/

The supplied NELSONS URL currently presents Martinez Grocery; its card follows that live identity. Project captures do not claim unverified performance statistics or client testimonials.

Eternal Valley was supplied through its repository at https://github.com/JOTSmedia/ETERNALVALLEY_area51. Its portfolio links use the verified live GitHub Pages experience; that site can automatically select its `?lite=1` presentation when 3D is unavailable. The original captured film keyframe is retained as `sources/eternal-valley-film-keyframe.png`, with 640px and 1280px WebP deliveries.

## Checks

`npm run check` validates JavaScript syntax, all local HTML/CSS assets and source sets, unique IDs, anchor destinations, form labels, all eight live-project destinations, and the seven scrolling projects' full-page preview files. Eternal Valley's still-image variants are checked through the HTML asset references. `npm run build` runs the checks and creates a clean static release in `dist/`. Unused legacy imagery and original JPEGs remain in the editable source project and are excluded from the deployment build.

For future edits: content lives in `index.html`, presentation in `styles.css`, loader, dialogs, contact handoff, motion and preview behavior in `app.js`, and the component assembly/circuit lights in `assembly.js`. The 47 circuit routes and matching branch, source-component and strength metadata, plus the ordered `streamTraversal` itinerary are stored in `images/assembly/circuit-paths.json`. Route points follow the source photograph's grooves and project with exactly the same crop and scale as the background; keep route metadata aligned with its corresponding points and include each route exactly once in the stream itinerary when editing. For scrolling projects, refresh the thumbnail and full-page capture together, maintaining the hero at the top and the same page width. Eternal Valley uses only a still film keyframe. Retain the 640/1280 filename conventions; very tall WebP captures are constrained below the format's 16,383-pixel dimension limit.

## Shared-link hero preview

The Open Graph and X/Twitter large-image card use a 1200×630 PNG screenshot of the actual header and hero, captured after the intro and reveal animations finish. This includes the dotted logo, headline, and white technology background; the loading screen is excluded.

The canonical URL is `https://jots.media/`, and both image tags point to `https://jots.media/images/social/jots-media-hero-20261023-v10.png`. The image is bundled in `dist/images/social/`. These tags are in the saved HTML and do not require JavaScript. To publish under a different hostname or GitHub Pages subdirectory, update the canonical, `og:url`, and absolute image URLs together; ordinary page assets remain relative.

Shared previews can be verified publicly after deploying the updated HTML and PNG to that domain. Existing cached previews may need to be re-scraped by the sharing service. When changing the hero later, capture a new screenshot, give the PNG a new versioned filename, and update both image tags.

## Mobile graphic refinement

Decorative starbursts, ornamental plus signs and the headline asterisk have been removed. Functional arrows, menu/close and preview transport icons use one locally drawn SVG family, preventing platform emoji substitution. Section headings share the brand sans-serif, with responsive type, more readable labels, consistent portfolio spacing, larger preview controls and a clearer footer. The user requested automatic idle scrolling without a separate Start/Pause control.

### Creative studio chapters
The portfolio opens directly into the interactive project collection. The services visual reinterprets the nine-dot identity in eight studies; select a service with a pointer, touch, or keyboard. The stage cycles every 4.2 seconds only while visible and motion is enabled; manual selection takes priority for ten seconds. Motion Off and reduced motion keep a finished still composition. No new runtime dependencies or external requests were added.

### Display typography and 3D glass
Headlines use locally served Syne; reading and interface text use Space Grotesk. The original logo lettering and Swarm artwork remain intact. Both variable WOFF2 files total about57KB; their OFL licenses ship in `fonts/`. Text remains visible while fonts load.

Each main chapter has one bounded glass assembly: project preview, capability visual, studio image, process sculpture and contact fan. Text stays outside the fragments. Phone scenes use fewer fragments; at most two scenes run together. Motion Off and reduced motion retain still compositions. The portfolio begins directly with the eight interactive project previews; the separate website spread has been removed.

The hero performs a15.5second material sequence: translucent white components lift, the environment becomes graphite black, the chip takes on a solid silicon/metal finish and expands again, then the scene becomes translucent white and reassembles. The cyan circuit begins afterward. Every interruption restores the finished white scene; no scrolling or input is captured.

### Physical materials and exact reassembly
The dark phase now uses opaque forest-black PCB epoxy, source-aligned copper traces, molded black chip packages, metallic terminations and a detailed generated silicon die. Physical textures are pre-baked WebP images: a 141KB atlas and responsive 37/63/118KB boards. Pixel processing happens only during optional asset authoring, never while the visitor waits for the animation. `node scripts/bake-physical-materials.cjs` reproduces them using `@napi-rs/canvas` and `sharp`; ordinary builds need neither dependency. The authoring material code is `hero-physical-materials.js` and is excluded from the deployment build.

All 55 dark silhouettes retain the original alpha bytes. White component pixels are sampled from a separate decode of the current responsive photograph: this uses raw bitmap dimensions instead of the density-adjusted DOM image dimensions. The canvas frame matches CSS cover positioning even with a rounded high-density backing buffer. Both material transitions freeze component vertices and sidewall thickness. All parts reach their exact registered rest coordinates before the final stationary texture handoff. The original photograph remains the final white view.

`npm test` covers six viewport/density cases, 55 components, the material storyboard and lifecycle, section motion, idle scrolling, and the single circuit stream. Browser frame comparisons at the user's 677×724 view found a best opening-to-final chip alignment of zero horizontal and vertical pixels across eight endpoint pairs; the full sequence was also rendered at 390×844 and 1280×800 with no console errors. See `verification/browser-registration-results.json`.

### Cyan stream during the black material phase
The same single-head cyan stream now runs during darkening, the physical-chip expansion and the return fade. It follows the existing47groove routes with the identical projection and distance clock used after reassembly. It is painted directly over the board and beneath component shadows/meshes, so the lifted hardware occludes it correctly. A slightly wider white-cyan core and stronger bounded bloom give it presence against the dark epoxy; intensity follows the material fade. The stream clock continues across the final transition into the white scene. No additional animation loop, bitmap processing, geometry changes or network assets are needed. Tests compare exact white/dark polylines and head coordinates at5,313timestamps per desktop/mobile view and preserve zero reassembly drift.
