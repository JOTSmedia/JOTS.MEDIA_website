# JOTS.MEDIA website

This updates the existing JOTS.MEDIA project. The original cyan accent, wordmark, Swarm mark, eight services, New Jersey identity, contact details, Instagram link, Great Notch Inn project, and legal content are retained.

## Preview and build

No installation or third-party JavaScript dependencies are needed. Node.js and Python 3 are required for local checks/builds.

```sh
npm run build
python3 -m http.server 8765 --bind 127.0.0.1
```

Open `http://127.0.0.1:8765/dist/`. Upload the **contents** of `dist/` to GitHub Pages or another static host. All internal assets are relative, so the site also works under a repository subdirectory. There is one HTML page with anchor routes for work, services, studio and contact. No deployment credentials or hosting identity were present; no public deployment was made.

## Design and behavior

- The header is fixed at the top with reserved layout space: 64px on desktop/tablet and 56px on phones. Section anchors clear the header. Work, Services, Studio and Contact highlight as their sections pass the reading line, with matching mobile states, restrained cyan underlines, hover backgrounds and keyboard focus treatment. Studio remains active through the process section. The mobile menu stays immediately below the header and closes on selection, Escape, outside pointer/focus or a desktop resize.
- After the loader clears and an 850ms pause, 55 individually isolated physical components lift away from the intact circuit board, separate, and return over 5.2 seconds. These are object-shaped transparent sprites of chips, capacitors, resistors and the processor, rather than fragments of the photograph. The clean board, contact pads and printed traces stay stationary. After reassembly, soft cyan light pulses travel repeatedly along five routes sampled directly from cyan groove pixels in the original circuit photograph. The original hero photograph is restored beneath this light overlay. Component movement plays once per page load; both effects are automatic.
- Assembly assets load on demand only when motion is enabled and the hero is visible. A 6.5-second asset deadline preserves the original still image on failure and never holds the brand loader. The canvas is capped at 1600px wide and 1.5× density; the light overlay paints at most 30 times per second. Leaving the hero, hiding the tab, reduced motion and Motion Off stop rendering and remove the canvas. Returning to the hero resumes the circuit lights after an interrupted or completed assembly, without replaying the component movement. Resizing rebuilds the light overlay for the new dimensions.

- Main sections alternate white (hero), black (work), white (services), black (studio), white (process), and black (contact), followed by a white footer. Cyan remains an accent.
- Scroll-triggered sequences reveal section labels, headings, copy, equal-size cards, images and divider rules with short staggers. The hero background has subtle native scroll-linked depth where supported. Content is visible by default; reduced motion and the footer motion control disable these effects. Initial reveals wait for the brand intro to finish.

- The hero uses two translucent glass reading panels with black outlines, cool beveled rims, a restrained surface reflection and supported backdrop blur. They match the chip material while maintaining dark, legible text.
- All rendered site text is uppercase. The hero and header use a quiet white surface, generous space, fine rules, restrained cyan, and a full-section, predominantly white technology background with subtle glass circuitry.
- The studio photograph uses a 3840px original. The generated technology background is retained at its native 1672×941 resolution, with optimized delivery variants up to 3840×2160; larger versions are resampled, not native 4K. Photographic source files, including the unused former camera hero, are retained in `sources/`. WebP delivery widths are 640, 960, 1600, 2560 and 3840, selected through `srcset` and `sizes`.
- The portfolio contains seven equally sized live-project cards in this order: Beth Elise, LÉ DEAUX, Great Notch Inn, ELEV8MI, SYMZ Customz, Tré Nation and Martinez Grocery. Desktop retains three columns across three rows; the final two positions are empty, without placeholder cards. Tablets use two columns and phones one.
- Seven real website snapshots show the navigation and hero at the top. After a two-second dwell with at least 60% of a preview visible, its full local page capture loads and begins scrolling at 22 CSS pixels per second. Captures are snapshots of the referenced live sites on October 23, 2026; use the project title or preview dialog to visit the live experience.
- Preview scrolling stops out of view, while the browser tab is hidden, and with reduced motion or the global motion control. Each preview has a pause/resume control. Wheel, touch or keyboard focus switches to manual exploration. Leaving the card resets its opening frame.
- Full-page captures load on demand. Small screens and standard-density cards receive the 640px version; higher-density/larger cards receive the larger version. Images have no embedded external code, audio or tracking.
- The custom Swarm intro gathers the nine brand dots from the viewport edges, reveals the large wordmark letter by letter, and opens a circular aperture from the cyan dot into the hero. A cyan progress bar and live percentage measure the timed introduction, reaching 100% at the transition; they are not network byte progress. The intro stays visible for 3 seconds from navigation and opens over 900 milliseconds. Reduced-motion/Motion Off visitors get a static 300ms introduction with a short 160ms exit. An independent 4.8-second head timer and a 5.2-second CSS visibility fallback prevent blocking. The dotted mark also appears in the header, hero and footer, and a footer Replay intro control can show the introduction again. Escape dismisses the intro early. It never locks scroll or hides the page content. With scripts unavailable, it does not appear.
- Native dialogs provide keyboard focus containment, Escape dismissal and return focus. Images have descriptions; form controls have labels; navigation and dialogs have accessible names.

## Contact brief

The previous form displayed a success message without delivering a message. The updated form validates details and prepares an email addressed to `hello@jots.media`; the visitor reviews and sends it in their own email app. It explicitly states that nothing has been sent. A text download is available if email-app configuration or URI length causes trouble. No invented backend or delivery confirmation is used. Phone and direct email links remain available without scripts.

## Project references

1. The Great Notch Inn — https://www.thegreatnotchinn.com/
2. Beth Elise — https://jotsmedia.github.io/beth-elise-site-v9/
3. ELEV8MI — https://jotsmedia.github.io/elev8mi_v57/
4. SYMZ Customz — https://jotsmedia.github.io/SYMZ_v13/
5. Tré Nation — https://jotsmedia.github.io/TRENATION_v10/
6. Martinez Grocery — https://jotsmedia.github.io/NELSONS_v12/
7. LÉ DEAUX — https://jotsmedia.github.io/LE-DEAUX/

The supplied NELSONS URL currently presents Martinez Grocery; its card follows that live identity. Project captures do not claim unverified performance statistics or client testimonials.

## Checks

`npm run check` validates JavaScript syntax, all local HTML/CSS assets and source sets, unique IDs, anchor destinations, form labels, all seven live-project destinations, and full-page preview files. `npm run build` runs the checks and creates a clean static release in `dist/`. Unused legacy imagery and original JPEGs remain in the editable source project and are excluded from the deployment build.

For future edits: content lives in `index.html`, presentation in `styles.css`, loader, dialogs, contact handoff, motion and preview behavior in `app.js`, and the component assembly/circuit lights in `assembly.js`. Circuit routes are stored in `images/assembly/circuit-paths.json`, sampled from source photograph groove pixels and projected with exactly the same crop and scale as the background. Refresh a project's thumbnail and full-page capture together, maintaining the hero at the top and the same page width. Retain the 640/1280 filename conventions; very tall WebP captures are constrained below the format's 16,383-pixel dimension limit.

## Shared-link hero preview

The Open Graph and X/Twitter large-image card use a 1200×630 JPEG screenshot of the actual header and hero, captured after the intro and reveal animations finish. This includes the dotted logo, headline, and white technology background; the loading screen is excluded.

The canonical URL is `https://jots.media/`, and both image tags point to `https://jots.media/images/social/jots-media-hero-20261023-v3.jpg`. The image is bundled in `dist/images/social/`. These tags are in the saved HTML and do not require JavaScript. To publish under a different hostname or GitHub Pages subdirectory, update the canonical, `og:url`, and absolute image URLs together; ordinary page assets remain relative.

Shared previews can be verified publicly after deploying the updated HTML and JPEG to that domain. Existing cached previews may need to be re-scraped by the sharing service. When changing the hero later, capture a new screenshot, give the JPEG a new versioned filename, and update both image tags.
