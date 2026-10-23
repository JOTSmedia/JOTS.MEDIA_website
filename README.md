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

- Main sections alternate white (hero), black (work), white (services), black (studio), white (process), and black (contact), followed by a white footer. Cyan remains an accent.
- Scroll-triggered sequences reveal section labels, headings, copy, equal-size cards, images and divider rules with short staggers. The hero background has subtle native scroll-linked depth where supported. Content is visible by default; reduced motion and the footer motion control disable these effects. Initial reveals wait for the brand intro to finish.

- All rendered site text is uppercase. The hero and header use a quiet white surface, generous space, fine rules, restrained cyan, and a full-section, predominantly white technology background with subtle glass circuitry.
- The studio photograph uses a 3840px original. The generated technology background is retained at its native 1672×941 resolution, with optimized delivery variants up to 3840×2160; larger versions are resampled, not native 4K. Photographic source files, including the unused former camera hero, are retained in `sources/`. WebP delivery widths are 640, 960, 1600, 2560 and 3840, selected through `srcset` and `sizes`.
- The portfolio uses nine equally sized slots: seven live projects and two labeled placeholders. Desktop uses three columns and three rows, with two columns on tablets and one on phones.
- Seven real website snapshots show the navigation and hero at the top. After a two-second dwell with at least 60% of a preview visible, its full local page capture loads and begins scrolling at 22 CSS pixels per second. Captures are snapshots of the referenced live sites on October 23, 2026; use the project title or preview dialog to visit the live experience.
- Preview scrolling stops out of view, while the browser tab is hidden, and with reduced motion or the global motion control. Each preview has a pause/resume control. Wheel, touch or keyboard focus switches to manual exploration. Leaving the card resets its opening frame.
- Full-page captures load on demand. Small screens and standard-density cards receive the 640px version; higher-density/larger cards receive the larger version. Images have no embedded external code, audio or tracking.
- The custom Swarm intro stays visible for 1.6 seconds from navigation, then fades out over 380 milliseconds. An independent 2.6-second head timer and a three-second CSS visibility fallback prevent blocking. The dotted mark also appears in the header, hero and footer, and a footer Replay intro control can show the introduction again. Escape dismisses the intro early. It never locks scroll or hides the page content. With scripts unavailable, it does not appear.
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

For future edits: content lives in `index.html`, presentation in `styles.css`, and loader, dialogs, contact handoff, motion and preview behavior in `app.js`. Refresh a project's thumbnail and full-page capture together, maintaining the hero at the top and the same page width. Retain the 640/1280 filename conventions; very tall WebP captures are constrained below the format's 16,383-pixel dimension limit.
