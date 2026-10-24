# ABDUCTION PROTOCOL

A browser-playable 3D game with nine missions, UFO abduction and aircraft Intercept modes. All game libraries, textures and sounds are included. No build command, API key, CDN or account is required to play.

## Publish with GitHub Pages

1. Upload this folder's **contents** into your repository, so `index.html`, `assets/` and `vendor/` are at its root. Include `.nojekyll`.
2. Commit to `main`.
3. Open **Settings → Pages**, choose **Deploy from a branch**, then **main** and **/(root)**. Save.
4. Open the game address shown in Pages after deployment finishes.

Upload the extracted files, rather than a ZIP or the enclosing GITHUB_UPLOAD folder. GitHub Desktop is also supported. All paths are relative, so project Pages addresses work.

## Play and controls

Revision 30 retains START NEW GAME with a confirmed classic-UFO reset, three new operations, expanded open flight, the merged terrain radar, layered positional audio, nine black-box story files and reliable non-selectable cockpit controls. Flight is fully manual; radar goal and salvage highlights remain. It preserves the Space control fix: mouse/touch button use returns keyboard focus to flight, while keyboard navigation keeps button focus.

M enlarges the terrain radar. N toggles audio. The ground-contact picker has been removed. Use W/S for thrust, A/D to steer, Q/E for altitude, Shift to boost, and P/Esc to pause. UFO has three longer steerable boost charges. R fires homing missiles; capture an SR-71 intact to unlock the TR-3B, then V switches airframes (also available in Help). UFO: hold Space to abduct and F for the attack laser. Intercept aircraft: hold Space to attack or designate. Repeated captures level up the TR-3B; Q/E climb and dive through a compressed orbital layer with local NASA Earth imagery. T or tapping the lock marker cycles hostiles; the TR-3B can fire guided missiles and lasers from orbit, with altitude/tier payload scaling and visible blast effects. Terrain blends onto the fixed globe during ascent. Distinct ground markers identify required humans/cattle/crew and hostiles; police cars, officers and civilian vehicles add ground activity. Sirens respect mute. Live goal counters highlight every relevant capture and notify completion. Aircraft show hit flashes and temporary health bars, then burn and crash into terrain on destruction. Complete the goals, press TRACK BEACON to highlight extraction, then fly there manually. Touch controls, a walkthrough, audio, graphics quality and Reduced Motion are available in the game.

White signal beacons take2.5seconds to scan within150m and below500m AGL. Each operation advances the rescue trail; next-mission checkpoints, score and refits save in this browser. The nine-operation story builds toward rescuing six named Asterion crew, followed by a real-time 3D reunion aboard the ship with English captions, optional speech, skip and replay. Orbital TR-3B flight extends horizontally beyond the original map; the heading-up radar retains surface targets and TRACK BEACON highlights manual extraction.

All visible game text is uppercase. Menus and reports use curved glass surfaces, green/purple orbital artwork and Matrix text decoding with English letters and numbers. Mission briefing headings decode once in 0.32 seconds; objectives and launch controls stay immediately readable. Reduced Motion keeps the text stable. Screen readers receive the original wording throughout the effect.

To preview this upload folder locally with Python 3, run `python3 -m http.server 8123` here, then open `http://localhost:8123`. Direct file:// opening is unsupported. The separate PLAY_LOCAL folder includes a double-click Mac launcher.

Revision 30 reduces rendering load with adaptive resolution, efficient terrain detail, throttled HUD updates and lower shadow cost. AUTO / SMOOTH FLIGHT is the default. UFO and TR-3B propulsion use a near-silent gravity hum and a soft boost pulse; human jets and helicopters keep their engine sounds.

## Graphics and credits

Three.js 0.170.0 is included under the MIT license in `vendor/THREE-LICENSE.txt`. Terrain scan credits are in `assets/terrain/README.txt`. Generated material provenance and exact prompts are in `AI-ASSETS.md`. Original aircraft, UFO, ground models and game systems were created for this game. Ultra uses native 4K photographed ground color maps and a 4K rendering budget; AI material images are 1672 × 941.
