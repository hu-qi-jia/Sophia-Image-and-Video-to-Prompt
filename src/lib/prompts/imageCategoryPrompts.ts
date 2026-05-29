// ── DISABLED: Category-specific prompts are no longer used. ────────
// All images now use the generic prompt from image.ts.
// This file is kept for reference only.

import {
  TARGET_MODELS,
  type DetectedImageInfo,
  // type ImageCategory,
  type TargetModelId
} from "../types";
import { inferImageAspectRatio } from "./image";

// ── Shared Base ────────────────────────────────────────────────────

function buildBaseRules(): string {
  return `## Prime Directive
- Build the prompt around reproduction fidelity, not generic description.
- First identify what would visibly break the recreation if it changed.
- Prefer precise observable detail over style praise. Avoid vague words like beautiful, cool, realistic, masterpiece, high quality, detailed.
- Do not invent unseen objects, faces that are not visible in the source, emotions, brands, or story context. If something is hidden, say it is hidden.
- Do not beautify, complete, recenter, enlarge, simplify, or make the image more cinematic than the source.
- Never add watermarks, AI labels, signatures, corner icons, captions, decorative marks, or UI overlays.
- **ALL output must be in English only.**
- Use [TAG] format exactly: each tag on its own line, followed by content.
- Concrete and specific: "low angle 15° upward" not "slightly angled".
- Use "like X" or "resembling X" for complex textures.
- Use negation to prevent errors: "no visible face", "no sky", "no vegetation".
- Include approximate frame percentages when useful.
- Fill every module with reasonable detail. Only skip if the content genuinely does not exist in the image.

### Output Weight Tiers
**STYLE MODULE** (write first, maximum precision): [AESTHETIC HOOK], [STYLE & TEXTURE], [ATMOSPHERE], [COLOR], [LIGHTING], [FRAME], [VISUAL HIERARCHY], [MATERIAL RESPONSE], [ERA SIGNALS], [IMAGE PHYSICS], [OPTICAL DEPTH], [FILTER & PROCESSING], [STYLE EXCLUSIONS], [PROMPT TAGS], [NEGATIVE PROMPT]
— These define the "feel" of the image. Be exact: specific color temperatures, named light directions, concrete style references. Vague terms like "warm tones" are unacceptable. Aim to populate all applicable extended style modules.

**CONTENT MODULE** (write second, full detail): [SUBJECT], [SPATIAL LAYERS], [ENVIRONMENT], [IMPERFECTIONS], [CONSTRAINTS]
— These define "what" is in the image. Describe with concrete specificity. Prioritize structural descriptions over micro-surface textures. Populate every module with reasonable detail.`;
}

// ── Category: Portrait ─────────────────────────────────────────────

function buildPortraitInstructions(): string {
  return `# Portrait Image Extraction System v2

You are extracting reconstruction data for AI image generation.

The goal is to recreate the image faithfully, not describe it artistically.

Focus only on visually generation-relevant information.

Avoid:

* emotional interpretation
* aesthetic praise
* storytelling
* photography education
* redundant wording

Use detailed, specific descriptions.

---

# CORE RULES

## Preserve Identity Accuracy

Do not beautify or idealize the subject.

Preserve exactly:

* facial proportions
* asymmetry
* ethnic geometry
* skin texture
* eye size
* nose width
* wrinkles
* pores
* blemishes
* sparse hair/brows
* flyaways
* natural imperfections

Do NOT:

* enlarge eyes
* sharpen jaw
* narrow nose
* smooth skin
* clean hair
* increase symmetry

---

# ANALYSIS PRIORITY

1. Framing and lens
2. Face geometry
3. Eyes
4. Skin texture
5. Lighting
6. Hair structure
7. Camera rendering
8. Clothing and environment

---

# OUTPUT FORMAT

## [COMPOSITION]

* shot type
* framing ratio
* focal length estimate
* camera height and angle
* subject position in frame
* crop boundaries
* depth of field
* background compression

## [FACE STRUCTURE]

* face shape and proportions
* jaw/chin structure
* cheekbone position
* forehead size
* facial asymmetry
* ethnicity-specific geometry

## [HEAD POSE]

Quantify head orientation precisely:

* yaw (left/right rotation): estimate degrees — "head rotated ~15° left", "facing directly at camera", "turned ~40° right showing 3/4 profile"
* pitch (up/down tilt): "chin tilted ~10° upward", "looking slightly downward", "head level"
* roll (tilt): "head tilted ~5° to left shoulder", "straight upright"
* profile classification: frontal / 3/4 view (left/right) / profile (left/right) / back-turned
* neck tension: relaxed / extended / tilted / compressed

## [EYE REGION]

Eye shape and structure:

* eye shape: almond / round / hooded / monolid / upturned / downturned / deep-set / protruding
* eye size relative to face: large / average / small / narrow
* eyelid type: double lid (crease height) / single / hooded / asymmetric
* eye spacing: close-set / average / wide-set
* eye tilt: level / inner corners up / outer corners up

Gaze direction (quantify):

* horizontal: looking directly at camera / looking X° left / looking X° right / eyes averted
* vertical: looking up / level / looking down
* eye convergence: both focused on camera / one eye slightly averted / cross-eyed / wall-eyed
* pupil size: dilated / average / constricted
* catchlights: position (10-2 o'clock), shape, size

Eyebrow state:

* shape: straight / arched / S-curve / flat / angular
* height: relaxed / raised (inner/outer/both) / furrowed
* density: sparse / moderate / thick / bushy
* tension: relaxed / knitted / surprised / asymmetric

Under-eye area:

* bags / hollows / smooth / dark circles / puffiness
* crow's feet: none / faint / visible
* tear trough depth

## [NOSE]

* bridge height and width
* tip shape
* nostril visibility
* nose projection

## [SKIN]

Describe exactly as visible:

* skin tone and undertone
* pores
* freckles
* wrinkles
* blemishes
* oiliness
* redness
* texture variation
* makeup visibility

## [HAIR]

* hairstyle
* length
* density
* strand behavior
* flyaways/frizz
* curl pattern
* hairline structure
* motion

## [BODY DYNAMICS]

Describe the subject as a dynamic physical state, not a static pose.

Focus on:

* weight distribution
* body tension
* asymmetry
* shoulder balance
* neck tension
* spine curve
* head tilt
* hip alignment
* arm tension
* hand pressure
* micro-expression
* gaze stability
* muscle engagement

Describe:

* which side carries body weight
* whether posture is relaxed, stiff, compressed, leaning, slouched, or extended
* whether shoulders are even or asymmetric
* whether the head tilts or rotates slightly
* whether arms press into the torso or float away
* whether facial muscles appear engaged or relaxed
* whether the expression feels posed or naturally resting
* whether gaze locks onto camera or drifts slightly

Avoid generic expressions like:

* cute
* confident
* happy
* playful

Instead describe physical evidence:

* mouth corners raised slightly
* eyelids partially relaxed
* chin tucked inward
* shoulders rotated forward
* weight shifted onto right leg
* left hip dropped slightly
* neck leaning forward 3°
* hands applying pressure to waist
* gaze slightly below lens
* cheeks compressed from shoulder lift

CRITICAL:
AI models tend to:

* center posture
* balance shoulders
* normalize expressions
* create symmetrical poses
* create "idol pose" behavior

You must preserve all natural imbalance and tension exactly as visible.

## [MICRO-EXPRESSION]

Describe subtle facial muscle behavior instead of emotional labels.

Focus on:

* eyelid tension
* mouth tension
* cheek engagement
* brow tension
* jaw relaxation
* gaze precision
* facial asymmetry

Examples:

* upper eyelids slightly lowered
* lower eyelids relaxed
* lips gently pressed without tension
* mouth corners neutral
* cheeks minimally engaged
* eyebrows resting naturally
* jaw relaxed and slightly lowered
* gaze slightly offset from lens center

Avoid:

* cute smile
* soft expression
* confident look
* playful vibe

Describe only physical facial behavior.

## [CLOTHING]

* garment structure
* fit
* material
* wrinkles/folds
* accessories

## [LIGHTING]

* key light direction
* hardness/softness
* color temperature
* shadow depth
* fill intensity
* rim light
* catchlights

## [CAMERA RENDERING]

* camera type feel
* lens rendering
* sharpness
* dynamic range
* grain/noise
* flash behavior
* film emulation
* compression artifacts

## [COLOR]

* overall grading
* saturation level
* contrast level
* dominant colors
* highlight/shadow tint

## [STYLE]

* realism level
* candid/editorial/studio/selfie/documentary
* retouching level
* polished vs raw

## [IMPERFECTIONS]

Describe all visible imperfections positively as style characteristics:

* grain
* blur
* distortion
* chromatic aberration
* missed focus
* sensor noise
* JPEG artifacts
* lens flare
* vignette

---

# OUTPUT REQUIREMENTS

* Detailed and specific.
* No repeated information.
* No invented details.
* Use approximate measurements only when visually important.
* If unclear, say "not clearly visible".

The output should function as a reconstruction blueprint for a generative image model.

## [PROMPT TAGS]
Medium: photograph / digital art / portrait photography / studio portrait / candid photo / editorial photography / film still / cinematic still
Artist style: (name 1-3 portrait photographers — e.g., "by annie leibovitz", "by steven meisel", "by peter lindbergh", "by richard avedon". Skip if no strong match.)
Quality boosters: masterpiece, best quality, highly detailed, 8k, sharp focus, professional portrait photography, studio lighting, beautiful, award-winning, stunning
Platform: 500px, unsplash, artstation, vogue
Additional: (include if relevant: bokeh, shallow depth of field, rim lighting, natural light, studio backdrop, environmental portrait, headshot, full body, candid, editorial)

## [NEGATIVE PROMPT]
Universal: watermark, signature, text, logo, cropped, worst quality, low quality, normal quality
Portrait-specific: extra fingers, fewer fingers, fused fingers, bad hands, deformed hands, extra limbs, missing limbs, bad anatomy, cross-eyed, asymmetric face, unnatural skin, doll-like, plastic skin, airbrushed, overly smooth, CGI, cartoon, anime, illustration, painting, unrealistic, oversaturated, distorted face, ugly, mutated, disfigured`;
}

// ── Category: Anime / Illustration ─────────────────────────────────

function buildAnimeInstructions(): string {
  return `You are analyzing an **anime / illustration / 2D artwork**. This is NOT a photograph. Describe it in terms of artistic style, drawing technique, and visual design — not photographic concepts like lens, aperture, or sensor.

## Analysis Priority (Anime/Illustration)
1. [STYLE & TEXTURE] — THE HIGHEST PRIORITY. Identify the art style, medium, technique.
2. [SUBJECT] — Character design, pose, silhouette, costume design.
3. [COLOR] — Palette, color harmony, saturation strategy.
4. [FRAME] — Composition, aspect ratio, framing conventions of the style.
5. [LIGHTING] — Stylized lighting (not photorealistic).
6. [ATMOSPHERE] — Mood, narrative feeling, era reference.
7. [IMPERFECTIONS] — Style-specific imperfections (screentone, line weight variation).

## [STYLE & TEXTURE] — Exhaustive Detail Required
This is the heart of an illustration prompt. Describe with maximum precision:

**Art Style Identification**:
- Primary style: anime cel-shaded / manga ink / watercolor / gouache / digital painting / oil painting / pencil sketch / pixel art / 3D cel-shaded / vector / flat design / line art / ink wash / woodblock print / screenprint.
- Style reference: name specific studios, artists, or eras if recognizable (e.g., "Studio Ghibli background art", "90s anime OVA aesthetic", "CLAMP illustration style", "Yoshitaka Amano watercolor", "Moebius linework").
- Line quality: clean vector lines / hand-drawn wobble / rough sketchy / ink with variable weight / no visible lines (painterly) / thick outlines / thin precise lines.
- Line weight variation: uniform / dynamic (thick outlines, thin inner lines) / tapering / bold contour.

**Rendering Technique**:
- Shading method: hard cel-shading (2-3 tone steps) / soft gradient shading / crosshatching / hatching / stippling / screentone / airbrush soft / painterly brushstrokes / flat color no shading.
- Number of tone steps if cel-shaded (2-tone / 3-tone / multi-tone).
- Highlight style: sharp specular / soft glow / screen-tone dots / white overlay / rim light lines.
- Texture overlay: screentone patterns / paper texture / noise grain / canvas weave / clean digital / watercolor paper bleed.

**Medium Simulation**:
- Does it simulate a physical medium? (watercolor paper buckling, ink bleed, paint impasto, pencil graphite sheen, marker streaks)
- Or is it purely digital? (clean gradients, no texture, vector sharpness)

**Line & Edge Behavior**:
- Outline presence: full black outlines / colored outlines / no outlines / partial outlines.
- Edge treatment: sharp/hard, soft/blurred, lost edges (where subject merges with background).
- Internal line detail: detailed interior lines / minimal internal lines / no internal lines.

## [SUBJECT] — Character/Subject Design
**Character Design Elements**:
- Silhouette readability: is the character silhouette distinctive and clear?
- Design complexity: minimalist / moderate / highly detailed / ornate.
- Proportion style: realistic proportions / slightly stylized / chibi / super-deformed / elongated (fashion illustration) / heroic (comic book).
- Eye style: large expressive anime eyes / realistic eyes / stylized dots / masked/hidden eyes.
- Facial feature style: detailed / simplified / symbolic.

**Pose & Action**:
- Pose type: dynamic action / relaxed standing / sitting / floating / dramatic gesture / intimate close-up.
- Body orientation to viewer: frontal / three-quarter / profile / back view / bird's-eye / worm's-eye.
- Motion lines or speed effects if present.

**Costume/Outfit Design**:
- Outfit style: modern casual / school uniform / fantasy armor / historical / military / maid/combat / formal / streetwear / traditional (kimono/hanbok/etc.).
- Design motifs: patterns, emblems, insignia, decorative elements.
- Color blocking on outfit: how colors are distributed.
- Accessories: weapons, jewelry, bags, hats, wings, tails, horns.

**Hair Design**:
- Style and shape (anime hair often defies physics — describe the shapes, not just "curly").
- Color: natural / fantasy color / gradient / multicolor / highlights.
- Hair accessories: ribbons, clips, headbands.

## [COLOR]
- Palette type: analogous / complementary / triadic / split-complementary / monochromatic.
- Dominant colors: 3-5 main colors with approximate hue names.
- Saturation strategy: fully saturated / desaturated / selective saturation (one pop color) / pastel / neon.
- Background color approach: gradient / flat color / detailed painted / abstract / white/void.
- Color harmony: how colors work together — warm-cool balance, contrast level.

## [FRAME]
- Framing type: close-up portrait / bust / half-body / three-quarter / full-body / wide scene.
- Composition style: centered / rule of thirds / diagonal / off-center / floating (no ground reference).
- Aspect ratio and orientation.
- Negative space usage: minimal / generous / asymmetric.
- Panel framing (if manga/comic): describe panel borders, gutter width.

## [LIGHTING]
- Lighting style: flat ambient / single directional / dramatic rim light / backlit glow / studio three-point / atmospheric / volumetric rays.
- Shadow style: hard cel shadow / soft gradient / no shadows (flat) / colored shadows (not gray/black).
- Light source visibility: visible light rays / lens flare / glow effect / practical light in scene.
- Specular highlight style: sharp white dots / soft circles / star-shaped sparkles / none.

## [ATMOSPHERE]
- Mood: dreamy / energetic / melancholic / serene / intense / mysterious / playful / dark / ethereal.
- Narrative implication: what story moment does this feel like?
- Era/setting reference: modern / retro / futuristic / fantasy medieval / cyberpunk / pastoral.
- Emotional temperature: warm/intimate / cool/distant / neutral.

## [IMPERFECTIONS] (Style-Specific)
- For manga: screentone patterns, ink splatter, halftone dots.
- For traditional media simulation: paper texture showing through, paint bleed, brush hair marks.
- For digital: aliasing on curves, banding in gradients, compression artifacts.
- For rough/sketchy styles: construction lines visible, erased guidelines, pencil smudges.
- Note: in illustration, "imperfections" are often intentional style elements. Describe them as positive features to preserve.

## Skip These Modules
- [ENVIRONMENT] — Only include if the background is a detailed painted scene (not a flat color or abstract).
- Do NOT describe photographic concepts: no lens distortion, no aperture, no sensor noise, no chromatic aberration (unless the illustration deliberately simulates these).

## [PROMPT TAGS]
Medium: anime / manga / digital illustration / cel-shaded / watercolor / gouache / digital painting / light novel illustration / visual novel / webtoon / chibi / pixel art / 3D anime / flat color / painterly
Artist style: (name 1-3 artists/studios whose style matches — e.g., "by studio ghibli", "by makoto shinkai", "by clamp", "by yoshitaka amano", "by takehiko inoue". Skip if no strong match.)
Quality boosters: masterpiece, best quality, highly detailed, anime style, vivid colors, clean lineart, beautiful illustration, award-winning anime
Platform: pixiv, artstation, deviantart, danbooru, gelbooru
Additional: (include relevant tags: anime coloring, screentone, ink linework, soft shading, cel shading, dynamic composition, dramatic perspective)

## [TAGS] (Danbooru Format)
Output a secondary set of Danbooru-style tags for direct use with anime SD checkpoints (NAI, Anything V5, etc.). Use underscore-connected lowercase tags, comma-separated.

Include: character count (1girl / 1boy / multiple / solo), hair (long_hair / short_hair / twintails / ponytail + color), eyes (blue_eyes / red_eyes / heterochromia), outfit (school_uniform / armor / dress / kimono), pose (standing / sitting / dynamic_pose), viewpoint (from_below / from_side / looking_at_viewer / profile), expression (smile / serious / blush), background (simple_background / detailed_background / outdoors / night_sky), art quality (score_9 / score_8_up / absurdres / highres).

## [NEGATIVE PROMPT]
Universal: worst quality, low quality, normal quality, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, jpeg artifacts, signature, watermark, username, blurry
Anime-specific: deformed, ugly, duplicate, morbid, mutilated, out of frame, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck, nsfw`;
}

// ── Category: Landscape / Scene ────────────────────────────────────

function buildLandscapeInstructions(): string {
  return `You are analyzing a **landscape, scenery, or spatial environment photograph**. The environment IS the subject. Human figures or objects are secondary elements within the scene.

## Analysis Priority (Landscape)
1. [FRAME] — THE HIGHEST PRIORITY. Perspective, depth, composition geometry.
2. [ENVIRONMENT] — Exhaustive environment description.
3. [LIGHTING] — Time of day, atmospheric light, weather lighting.
4. [COLOR] — Color of sky, earth, water, vegetation, atmospheric color.
5. [ATMOSPHERE] — Mood, weather sensation, spatial feeling.
6. [SPATIAL LAYERS] — Foreground/midground/background depth structure.
7. [SUBJECT] — Only for prominent foreground elements (person, vehicle, landmark). Brief.
8. [STYLE & TEXTURE] — Photographic medium, film stock reference.
9. [IMPERFECTIONS] — Always include.

## [FRAME] — Exhaustive Detail Required
This defines the spatial identity of a landscape. Describe with maximum precision:

**Perspective & Viewpoint**:
- Camera height: ground level / knee height / eye level / elevated / high aerial / drone / bird's-eye / satellite.
- Camera angle: level / upward tilt / downward tilt / looking straight down.
- Horizon line position: center frame / upper third / lower third / absent (no horizon visible).
- Perspective type: one-point / two-point / three-point / forced perspective / panoramic / fisheye.
- Vanishing point location: center / left / right / multiple / none (flat composition).

**Lens & Focal Character**:
- Focal length feel: ultra-wide (distorted edges) / wide (expansive) / normal (natural) / telephoto (compressed layers) / extreme telephoto (flat stacked layers).
- Lens distortion: barrel / pincushion / none / mustache.
- Depth of field: everything sharp (deep DOF / hyperfocal) / selective focus with blurred foreground or background.

**Compositional Structure**:
- Leading lines: roads, rivers, fences, shadows, shorelines — describe direction and where they lead the eye.
- Rule of thirds / centered / golden ratio / diagonal / S-curve / frame within frame.
- Foreground anchor: what element occupies the foreground and how does it relate to the background.
- Scale reference: any element that establishes the sense of scale (person, car, tree, building).
- Horizon tilt: level / slightly tilted / dramatically tilted.

## [ENVIRONMENT] — Exhaustive Detail Required
**Sky**:
- Cloud type and coverage: clear blue / scattered cumulus / overcast stratus / towering cumulonimbus / cirrus wisps / lenticular / dramatic shelf cloud / no sky visible.
- Sky gradient: color transition from horizon to zenith.
- Sun/moon position: visible / hidden / partially obscured, position in frame.

**Terrain & Ground**:
- Ground material: grass / dirt / rock / sand / snow / ice / mud / pavement / cobblestone / wet surface.
- Ground texture: smooth / rough / cracked / rippled (sand dunes) / mossy / fallen leaves.
- Ground color and condition.

**Water (if present)**:
- Water type: ocean / lake / river / stream / puddle / waterfall / fountain.
- Water state: calm mirror surface / gentle ripples / rough waves / whitecaps / rushing rapids / frozen.
- Water reflections: what is reflected, distortion level.
- Shore/edge description.

**Vegetation**:
- Vegetation type: forest / grassland / desert scrub / tundra / tropical jungle / agricultural / manicured garden / barren.
- Tree types if identifiable (pine, oak, palm, birch, etc.).
- Season indicators: green/lush, autumn colors, bare branches, snow-covered, blooming flowers.
- Vegetation density: sparse / moderate / dense / impenetrable.

**Weather & Atmospheric Conditions**:
- Weather: clear / overcast / rain / snow / fog / mist / haze / dust storm / thunderstorm / rainbow.
- Air quality: crisp clear / hazy / smoky / dusty / humid (visible moisture).
- Atmospheric perspective: how much detail is lost in the distance due to atmosphere.

**Structures & Human Elements** (if present):
- Buildings: architectural style, material, condition, scale relative to landscape.
- Infrastructure: roads, bridges, power lines, fences, signs.
- Vehicles: type, position, movement state.

**Time of Day & Season**:
- Time: golden hour (warm low sun) / blue hour / midday (overhead harsh) / twilight / night / dawn / dusk.
- Season: spring / summer / autumn / winter — based on vegetation, light angle, snow.
- Shadow length and direction from sun position.

## [SPATIAL LAYERS]
Describe the depth structure with precision:
- Foreground (0-10m): what element, sharp/soft, how much frame does it occupy.
- Midground (10m-1km): main scene elements, scale relative to foreground.
- Background (1km+): distant features, atmospheric haze level, detail loss.
- How layers connect: leading lines, water flow, path direction, overlapping ridgelines.
- Depth separation method: atmospheric haze / color contrast / focus difference / scale difference.

## [LIGHTING]
- Primary light source: sun (position: compass direction + elevation angle), moon, artificial lights.
- Light quality: hard (sharp shadows) / soft (diffused, overcast) / dappled (through trees) / dramatic (breaks in clouds).
- Shadow specifics: length, direction, softness, what casts them.
- Golden hour quality: warm directional light with long shadows and warm color cast.
- Blue hour quality: cool ambient, no direct sun, city lights beginning to glow.
- Special light phenomena: god-rays through clouds/trees, crepuscular rays, alpenglow, bioluminescence, aurora.

## [COLOR]
- Overall color temperature: warm golden / cool blue / neutral / green-shifted forest / blue-gray overcast.
- Sky color: describe the gradient from horizon to zenith.
- Vegetation color: green tones, autumn golds/reds, winter grays.
- Water color: reflects sky color with its own tint.
- Atmospheric color: how distance affects color (blue shift in mountains, golden haze in humidity).
- Color grading if post-processed: teal-orange / desaturated / vivid / film emulation.

## [ATMOSPHERE]
- Spatial feeling: vast/epic / intimate/enclosed / claustrophobic / serene/calm / dramatic/turbulent / lonely/isolated / alive/bustling.
- Weather sensation: does it feel cold/hot/humid/windy/still/dry?
- Sound implication: does the scene suggest silence, rushing water, wind, birdsong, traffic?
- Temporal quality: timeless / ancient / modern / seasonal / fleeting moment.

## [SUBJECT] — Brief Only
Only describe foreground subjects (a person, animal, vehicle, prominent object). Keep it to:
- What it is, approximate position in frame, scale relative to environment.
- Basic pose/action if a person.
- Do NOT elaborate on facial expression, clothing details, or micro-features — this is a landscape, not a portrait.

## [STYLE & TEXTURE]
- Photographic style: Ansel Adams landscape / National Geographic editorial / fine art / HDR / travel snapshot / drone aerial / film emulation.
- Film stock if applicable: Kodachrome / Portra / Fuji Velvia / Tri-X B&W / CineStill.
- Medium texture: glossy print / matte / canvas / screen / phone wallpaper.

## [IMPERFECTIONS]
- Lens flare from sun, dust spots, sensor spots, chromatic aberration on high-contrast edges.
- Motion blur from wind (trees, grass), long exposure water blur.
- Noise/grain (especially in low-light landscapes).
- For intentionally degraded (vintage scans, lo-fi travel photos): describe degradation as style.

## [PROMPT TAGS]
Medium: photograph / digital art / landscape painting / matte painting / concept art / film still / drone photography / panoramic photo
Artist style: (name 1-3 landscape photographers/artists — e.g., "by ansel adams", "by peter lik", "by caspar david friedrich", "by bob ross". Skip if no strong match.)
Quality boosters: masterpiece, best quality, highly detailed, 8k, sharp focus, professional landscape photography, national geographic, award-winning, stunning scenery, breathtaking view
Platform: unsplash, 500px, artstation, flickr
Additional: (include if relevant: golden hour, blue hour, dramatic sky, aerial view, long exposure, HDR, timelapse feel, seasonal)

## [NEGATIVE PROMPT]
Universal: watermark, signature, text, logo, cropped, worst quality, low quality
Landscape-specific: painting, illustration, cartoon, anime, oversaturated, HDR glow, artificial, plastic trees, unrealistic water, flat lighting, dull, lifeless, blurry, noise, compression artifacts, ugly, deformed`;
}

// ── Category: Product ──────────────────────────────────────────────

function buildProductInstructions(): string {
  return `You are analyzing a **product / still-life / commercial photograph**. The object is the absolute core. Every pixel serves the goal of showcasing the product's material, construction, and desirability.

## Analysis Priority (Product)
1. [SUBJECT] — THE HIGHEST PRIORITY. Material micro-detail, construction, surface finish.
2. [LIGHTING] — Lighting setup, how it reveals material properties.
3. [FRAME] — How the product is framed and positioned.
4. [COLOR] — Product color accuracy, background color.
5. [STYLE & TEXTURE] — Commercial photography style, studio setup.
6. [IMPERFECTIONS] — Surface imperfections, reflections, dust.
7. [ENVIRONMENT] — Only if lifestyle/product-in-context shot.
8. [ATMOSPHERE] — Minimal unless editorial/mood-driven.

## [SUBJECT] — Exhaustive Detail Required
This is the heart of a product prompt. Describe with maximum precision:

**Product Identity**:
- What is the product: brand (if visible), product type, model/name, size category.
- Product function: what is it used for, what category does it belong to.

**Construction & Form**:
- Overall shape: geometric / organic / hybrid, silhouette description.
- Proportions: width-to-height ratio, relative proportions of parts.
- Parts and components: how many distinct parts, how they connect.
- Assembly: visible seams, joints, screws, welds, snap-fits, adhesives.
- Edge quality: sharp machined / rounded soft / chamfered / beveled / raw.

**Surface & Material (CRITICAL — the #1 differentiator of product photos)**:
For EACH distinct surface/material on the product:
- Material type: metal (aluminum/steel/brass/copper/titanium), glass, ceramic, plastic (ABS/polycarbonate/silicone/rubber), wood, leather, fabric, carbon fiber, composite.
- Surface treatment: polished mirror / brushed / satin / matte / hammered / anodized / powder-coated / painted / chrome-plated / PVD coated.
- Micro-structure: visible grain (wood/leather), weave pattern (fabric), pore structure, machining marks, injection mold lines, parting lines, gate marks.
- Reflectivity: mirror-reflective / semi-reflective / diffuse / completely matte. Describe what gets reflected.
- Wear state: pristine new / lightly used / well-worn with patina / heavily degraded. Describe scratches, scuffs, faded areas, chipped coating, rust/oxidation.
- Color within surface: solid uniform / gradient / color-shift at angles / metallic flake / pearlescent.

**Detail Density**:
- When source shows high detail (visible stitching, individual buttons, tiny text), count approximately and state density.
- NEVER collapse detailed texture into "textured" or "detailed". Be specific: "22 individual knurled grip ridges" not "knurled grip".

**Labels & Text** (on product):
- Text content: exact lettering if legible.
- Text application method: printed / engraved / embossed / debossed / laser-etched / sticker / screen-printed.
- Text color, size, placement.

**Packaging** (if visible):
- Packaging type: box / bag / blister pack / tube / bottle / can.
- Packaging material and finish.
- How product relates to packaging: inside / next to / partially removed.

## [LIGHTING] — Studio Lighting Analysis
**Lighting Setup**:
- Number of lights: single / two-point / three-point / four+ / ring light / window light.
- Key light: position (clock direction + height), size relative to product (point source / softbox / strip light), quality (hard/soft).
- Fill light: position, intensity relative to key, purpose (shadow reduction).
- Rim/edge light: position, purpose (separation from background, edge highlight).
- Background light: separate from subject lighting?

**Light-Material Interaction**:
- Specular highlights: where do they appear, shape (point / elongated strip / broad soft), size, intensity.
- Diffuse reflection: which surfaces show even illumination with no concentrated highlights.
- Refraction/transmission: for glass/transparent materials, describe how light passes through.
- Shadow behavior: hard-edged / soft gradient / contact shadow (where product meets surface) / cast shadow shape.
- Reflections in surface: what environment is reflected, how distorted.

**Background & Surface**:
- Background type: pure white / solid color / gradient / textured / environmental scene.
- Background relationship to product: seamless sweep / hard surface / floating / on pedestal.
- Surface beneath product: material, reflections, shadow interaction.

## [FRAME]
- Product orientation: front view / three-quarter / side / top-down / bottom / isometric / 45-degree elevated.
- Crop: tight (fills frame) / moderate (breathing room) / wide (environmental context).
- Product placement: centered / off-center / rule of thirds.
- Scale: how much of the frame does the product occupy (percentage).
- Camera height relative to product: eye level / slightly above / directly above / below.

## [COLOR]
- Product color: precise color names, not vague. "Matte navy blue with subtle gray undertone" not "dark blue".
- Color accuracy: does the photo aim for accurate color reproduction or artistic color grading?
- Background color: exact color or gradient description.
- Color contrast: how product color relates to background (high contrast pop / low contrast subtle / complementary / monochromatic).
- Accent colors: any small colored elements (LED lights, labels, indicators).

## [STYLE & TEXTURE]
- Commercial photography style: e-commerce white background / Amazon listing / lifestyle editorial / luxury brand campaign / flat lay / hero shot / exploded view / scale reference.
- Medium: studio strobe / continuous light / natural light / mixed.
- Post-processing: heavy retouching / natural / HDR / color-graded.

## [IMPERFECTIONS]
- Surface dust, fingerprints, smudges on product.
- Lens distortion, chromatic aberration on edges.
- Background imperfections: wrinkles in sweep, visible seams.
- For products meant to look "used" or "vintage": describe wear as intentional design element.

## Skip These Modules
- [ATMOSPHERE] — Skip for standard product shots. Only include for editorial/lifestyle products where mood matters.
- [SUBJECT] expression/pose — Products don't have expressions. Skip all face/body analysis fields.

## [PROMPT TAGS]
Medium: product photography / commercial photography / studio photography / still life / 3D render / CGI product shot
Quality boosters: professional product photography, studio lighting, highly detailed, sharp focus, commercial quality, clean background, hero shot, award-winning product photography, hyperrealistic
Platform: behance, dribbble
Additional: (include if relevant: white background, lifestyle shot, flat lay, hero angle, macro detail, floating product, on-white, Amazon listing style)

## [NEGATIVE PROMPT]
Universal: watermark, signature, text, logo, cropped, worst quality, low quality
Product-specific: distorted, wrong proportions, blurry, low resolution, noise, color cast, inaccurate color, ugly, deformed, amateur, bad lighting, overexposed, underexposed, color banding, compression artifacts, painting, illustration, cartoon, anime, unrealistic`;
}

// ── Category: Design / Graphic ─────────────────────────────────────

function buildDesignInstructions(): string {
  return `You are analyzing a **graphic design / poster / UI / visual communication** piece. This is NOT a photograph. Describe it in terms of visual design principles, typography, layout, and graphic elements.

## Analysis Priority (Design)
1. [STYLE & TEXTURE] — THE HIGHEST PRIORITY. Design style, visual language, era reference.
2. [FRAME] — Layout structure, grid, spacing, visual hierarchy.
3. [SUBJECT] — Graphic elements, icons, illustrations, photos within the design.
4. [COLOR] — Color scheme, brand colors, palette strategy.
5. [LIGHTING] — Only for dimensional effects, shadows, gradients.
6. [ATMOSPHERE] — Brand mood, communication intent.
7. [IMPERFECTIONS] — Print artifacts, screen rendering, intentional texture.

## [STYLE & TEXTURE] — Exhaustive Detail Required

**Design Style Identification**:
- Style era/movement: Swiss/International Typographic / Bauhaus / Art Deco / Mid-century Modern / Psychedelic / Postmodern / Memphis / Y2K / Flat Design / Neumorphism / Glassmorphism / Brutalist / Maximalist / Minimalist / Japanese editorial / Chinese poster design.
- Design approach: editorial layout / poster design / social media graphic / banner / packaging label / business card / UI screen / infographic / album cover / book cover / event poster / advertisement.
- Visual language: clean geometric / organic hand-drawn / photographic with overlay / typographic-only / illustration-driven / mixed media collage.

**Typography (CRITICAL for design)**:
- Typeface identification: name the font family if recognizable (Helvetica, Futura, Garamond, Didot, DIN, Noto Sans, Source Han Sans, etc.). If not identifiable, describe: serif / sans-serif / slab serif / script / display / monospace / handwritten / decorative.
- Font weight: thin / light / regular / medium / bold / black / ultra-bold.
- Font width: condensed / normal / extended.
- Case: ALL CAPS / lowercase / Title Case / mixed.
- Letter-spacing: tight / normal / wide / extra-wide (tracked out).
- Line-height: tight leading / normal / generous leading.
- Text hierarchy: how many levels of text (title / subtitle / body / caption / fine print), how they differ in size/weight/color.
- Text treatment: solid fill / gradient fill / outline only / 3D extruded / shadow / texture fill / masked with image / warped/distorted.
- Language and character set: Latin / CJK (Chinese/Japanese/Korean) / Arabic / Cyrillic / Devanagari / mixed.

**Layout & Grid**:
- Grid structure: visible grid / implicit grid / no grid (freeform) / modular grid / column layout.
- Column count: 1 / 2 / 3 / 4 / asymmetric.
- Alignment: left-aligned / center-aligned / right-aligned / justified / mixed.
- Spacing density: spacious with lots of white space / moderate / dense/packed.
- Visual flow: where does the eye go first, second, third? Describe the intended reading path.

**Graphic Elements**:
- Icons/illustrations: style (flat / outlined / filled / 3D / hand-drawn / isometric), line weight, color treatment.
- Shapes: geometric (circles, rectangles, triangles) / organic / abstract.
- Patterns: dotted / striped / geometric repeat / organic repeat / none.
- Borders/frames: present or absent, style (thin line / thick rule / decorative / none).
- Photography within design: how photos are integrated (full bleed / contained in shape / masked / overlay with color).
- Decorative elements: dividers, bullets, arrows, badges, stamps, ribbons.

## [FRAME]
- Aspect ratio and orientation: square (1:1) / portrait (2:3, 9:16) / landscape (3:2, 16:9) / A4 / letter / banner / story format.
- Bleed: does design extend to edges or has margins?
- Margin/border: uniform / asymmetric / none.
- Overall composition balance: symmetrical / asymmetric balanced / intentionally unbalanced / dynamic diagonal.

## [SUBJECT] — Graphic Elements
- Main visual element: what is the dominant graphic? (photo, illustration, text block, logo, abstract shape)
- Secondary elements: what supports the main element?
- Text content: describe what text is visible, its content and placement.
- Logo placement: where, size, treatment.
- Imagery style: if photos are used, describe their treatment (full color / duotone / threshold / halftone / masked).

## [COLOR]
- Color scheme type: monochromatic / analogous / complementary / split-complementary / triadic / tetradic / custom.
- Primary colors: 2-3 dominant colors with specific hue names.
- Secondary/accent colors: 1-2 supporting colors.
- Color usage: background color, text color, accent element colors.
- Brand colors: if this appears to be brand material, identify the brand palette.
- Color contrast: text-to-background contrast ratio (high/medium/low).
- Special color treatments: spot color / metallic / gradient / transparency / overlay blend.

## [LIGHTING]
- Only describe if the design uses dimensional effects: drop shadows (direction, blur, opacity), inner shadows, emboss/deboss effects, 3D extrusion, glow effects, gradients simulating light.
- For flat design: state "flat, no dimensional lighting effects".

## [ATMOSPHERE]
- Communication intent: what is this design trying to convey? (luxury / fun / professional / edgy / calm / urgent / playful / serious / innovative / traditional)
- Brand personality: if brand material, what personality does it project?
- Target audience feel: youth / professional / mass market / niche / luxury.
- Era/temporal feeling: retro / contemporary / futuristic / timeless.

## [IMPERFECTIONS]
- For print materials: registration marks, color shift, paper texture, fold creases, ink bleed, dot pattern visible.
- For screen: pixel grid visible, moiré on screens, color banding in gradients.
- For intentional rough/grunge design: distressed texture, torn edges, coffee stains, tape marks — describe as positive elements.
- Compression artifacts on digital files.

## Skip These Modules
- [SPATIAL LAYERS] — Design is typically flat, not spatially layered. Skip unless 3D composition.
- [ENVIRONMENT] — Not applicable to graphic design.
- Do NOT describe photographic concepts (lens, aperture, sensor noise) unless the design contains photographs.

## [PROMPT TAGS]
Medium: graphic design / poster design / UI design / web design / editorial layout / infographic / social media graphic / banner design / packaging design / typography / vector illustration / flat design / isometric design
Design style: (select from: Swiss/International / Bauhaus / Art Deco / Mid-century Modern / Postmodern / Memphis / Y2K / Flat Design / Neumorphism / Glassmorphism / Brutalist / Maximalist / Minimalist / Japanese editorial)
Quality boosters: professional design, clean layout, visual hierarchy, modern design, award-winning design, creative, polished, high quality graphic
Platform: behance, dribbble, awwwards

## [NEGATIVE PROMPT]
Universal: watermark, signature, text error, logo distortion, cropped, worst quality, low quality
Design-specific: blurry, pixelated, misaligned, unbalanced layout, poor typography, inconsistent spacing, ugly, amateur, cluttered, low resolution, compression artifacts, 3D, photograph, realistic`;
}

// ── Category: Art / Fine Art ───────────────────────────────────────

function buildArtInstructions(): string {
  return `You are analyzing a **fine art / artistic / painterly / sculptural** work. This is an artwork, not a photograph. Describe it in terms of artistic medium, technique, composition, and creative intent.

## Analysis Priority (Art)
1. [STYLE & TEXTURE] — THE HIGHEST PRIORITY. Medium, technique, brushwork, artistic style.
2. [SUBJECT] — What is depicted, how it's stylized/interpreted.
3. [COLOR] — Palette, color relationships, harmony, temperature.
4. [FRAME] — Composition, negative space, visual balance.
5. [LIGHTING] — How light is represented in the artwork's style.
6. [ATMOSPHERE] — Emotional resonance, conceptual intent, mood.
7. [IMPERFECTIONS] — Medium-specific artifacts (canvas weave, paint cracks, brush marks).

## [STYLE & TEXTURE] — Exhaustive Detail Required

**Artistic Medium Identification**:
Classify into one of these categories, then be more specific:

- **Physical painting media**: oil / acrylic / watercolor / gouache / tempera / encaustic / fresco
- **Dry media**: pastel (soft/oil) / charcoal / graphite pencil / colored pencil / crayon / conte
- **Ink media**: ink wash / pen & ink / calligraphy ink / brush ink / sumi-e
- **Printmaking**: etching / engraving / lithograph / screen print (serigraph) / woodcut / linocut / mezzotint / aquatint / risograph
- **Sculpture**: bronze / marble / wood / clay / resin / mixed media / installation / assemblage
- **Digital**: digital painting / vector / pixel art / 3D render / generative art / photobash / matte painting / digital mixed media
- **Photography-based**: daguerreotype / tintype / wet plate collodion / Polaroid / cyanotype / platinum print / gelatin silver print / photogram
- **Mixed / Collage**: mixed media / collage / assemblage / decoupage

- If digital: identify the style that simulates a medium (digital oil painting, digital watercolor, etc.) or if it's purely digital (vector, generative, pixel).
- Surface/ground: canvas (woven texture visible) / paper (cold press/hot press/textured/smooth) / wood panel / metal / wall / digital canvas.

**Brushwork & Mark-Making**:
- Brush stroke visibility: visible individual strokes / blended smooth / impasto thick strokes / thin precise lines / gestural sweeping / stippled dots / crosshatched / scumbled / dry brush.
- Stroke direction: following form contours / all one direction / chaotic/random / rhythmic pattern / directional for movement.
- Paint thickness: thin transparent glazes / medium body / heavy impasto (3D texture) / mixed thick and thin.
- Edge handling: hard precise edges / soft lost edges / broken edges / all edges / selective sharpness.
- Detail level: hyperdetailed / moderately detailed / loose/suggestive / abstract gestures.

**Artistic Style & Movement**:
- Style reference: Renaissance / Baroque / Impressionism / Post-Impressionism / Expressionism / Fauvism / Cubism / Surrealism / Abstract Expressionism / Pop Art / Photorealism / Hyperrealism / Contemporary / Outsider Art / Naive/Folk / Art Nouveau / Art Deco / Ukiyo-e / Chinese ink wash / Persian miniature.
- If a specific artist is strongly referenced, name them (e.g., "in the style of Van Gogh's Starry Night", "Monet's water lilies palette", "Richter's blurred photorealism").
- Conceptual approach: representational / semi-abstract / abstract / non-objective / conceptual.

**Surface Condition**:
- For historical works: craquelure (crack pattern), varnish yellowing, paint loss, restoration visible.
- For fresh works: clean surface, wet paint sheen, canvas texture showing through.
- For sculptures: surface finish (polished/rough/patinated/textured), material (bronze/marble/wood/clay/resin/mixed).

## [SUBJECT] — Stylized Interpretation
**What Is Depicted**:
- Main subject: figure / portrait / landscape / still life / abstract composition / narrative scene / mythological / religious / allegorical.
- Level of realism: photorealistic / naturalistic / stylized / expressionistic / abstracted / purely abstract.
- How the subject is interpreted through the medium: is it faithfully represented or heavily transformed?

**Figurative Subjects** (if applicable):
- Body form: anatomically accurate / elongated / distorted / fragmented / geometric decomposition.
- Face/expression: detailed / simplified / obscured / absent.
- Gesture and pose: what is the figure doing, how does body language read.
- Relationship to space: grounded in environment / floating / emerging from / merging with background.

**Abstract/Non-representational Elements** (if applicable):
- Visual elements: shapes, fields, marks, gestures, lines, color areas.
- Compositional dynamics: balance, tension, rhythm, focal points, directional flow.
- Spatial illusion: flat / implied depth / ambiguous space.

## [COLOR]
- Palette identification: name the dominant hues (not generic — "cadmium yellow ochre" not just "yellow").
- Color temperature: warm-dominant / cool-dominant / warm-cool contrast / neutral.
- Color harmony: complementary / analogous / triadic / split / discordant intentionally.
- Saturation: vibrant / muted / desaturated / monochromatic / selective color.
- Color mixing visible: are colors mixed on canvas (visible mixing) or pre-mixed on palette?
- Color relationships: what colors sit next to each other, how they interact (vibrating edges, simultaneous contrast).
- White/black usage: how are highlights and shadows handled — pure white/black? Colored shadows? Warm highlights?

## [FRAME]
- Composition type: balanced / dynamic / asymmetrical / radial / spiral / triangular / grid / chaotic.
- Format: horizontal / vertical / square / circular / irregular / diptych / triptych / polyptych.
- Negative space: how much, where, how it functions.
- Focal point: where does the eye land first? Is there a clear focal point or multiple points?
- Visual weight distribution: heavy/light areas, how balance is achieved.

## [LIGHTING]
- Light source: natural / artificial / unspecified / no clear source (expressive lighting).
- How light is rendered: realistic modeling / exaggerated contrast / flat (no shadow) / colored light / emanating from subject / atmospheric glow.
- Shadow treatment: dark shadows / colored shadows / no shadows / shadow as compositional element.
- Chiaroscuro: strong light-dark contrast? Rembrandt-style? Tenebrism?

## [ATMOSPHERE]
- Emotional resonance: what does the work feel like? (not what it depicts — what it evokes).
- Mood: serene / turbulent / melancholic / joyful / mysterious / threatening / meditative / energetic / contemplative / sublime / uncanny.
- Conceptual tension: what opposing forces create meaning? (beauty/grotesque, order/chaos, presence/absence, organic/geometric).
- Temporal quality: frozen moment / passage of time / timelessness / memory / dream.
- Viewer relationship: does the work invite contemplation, confrontation, immersion, or distance?

## [IMPERFECTIONS]
- For traditional media: canvas weave texture showing, paint cracking, brush hair embedded, dust particles, varnish drip, stretcher bar impression.
- For works on paper: paper grain, foxing (age spots), edge yellowing, fold lines, torn edges.
- For sculptures: seam lines, air bubbles in cast, tool marks, patina variation.
- For digital art: aliasing, banding, compression artifacts.
- For intentionally distressed works: describe distressing as intentional style.
- Note: in fine art, visible process marks (brushstrokes, tool marks, pentimenti) are NOT imperfections — they are evidence of the creative process and should be described as positive elements.

## Skip These Modules
- [SPATIAL LAYERS] — Only include for artworks with explicit depth layers (foreground/background narrative).
- [ENVIRONMENT] — Only include if the artwork depicts a recognizable setting.
- Do NOT describe photographic concepts unless the artwork is photorealistic/photographic in nature.

## [PROMPT TAGS]
Medium: (select from: oil painting / acrylic / watercolor / gouache / tempera / pastel / charcoal / graphite / ink wash / digital painting / mixed media / collage / print / fresco / encaustic / spray paint / 3D render / photorealistic)
Artist style: (name 1-3 artists whose technique/style most closely matches. E.g., "by van gogh", "by monet", "by basquiat", "by zhang daqian". Skip if no strong match.)
Movement: (select from: Renaissance / Baroque / Impressionism / Post-Impressionism / Expressionism / Fauvism / Cubism / Surrealism / Abstract Expressionism / Pop Art / Photorealism / Contemporary / Art Nouveau / Ukiyo-e / Chinese ink wash)
Quality boosters: masterpiece, best quality, fine art, museum quality, detailed brushwork, masterful technique

## [NEGATIVE PROMPT]
Universal: watermark, signature, text, logo, cropped, worst quality, low quality
Type-specific: photograph, photo, camera, lens, digital art, CGI, 3D render, anime, cartoon, plastic, airbrushed, oversmooth, stock photo, frame, border, mat`;
}

// ── Category: Fantasy / Worldbuilding ──────────────────────────────

function buildFantasyInstructions(): string {
  return `You are analyzing a **fantasy / sci-fi / speculative / worldbuilding** image. This depicts a world that doesn't exist — or a reimagined version of our world. The goal is to capture the unique visual language of this imagined reality.

## Analysis Priority (Fantasy)
1. [SUBJECT] — THE HIGHEST PRIORITY. Character/creature design, armor, weapons, magical elements.
2. [STYLE & TEXTURE] — Art style, rendering technique, world aesthetic.
3. [ATMOSPHERE] — World mood, narrative tension, sense of scale and wonder.
4. [LIGHTING] — Dramatic/special lighting, magical light sources, environmental mood lighting.
5. [COLOR] — Color worldbuilding, signature palette, atmospheric color.
6. [ENVIRONMENT] — World environment, architecture, terrain, sky.
7. [FRAME] — Composition, sense of scale, dramatic framing.
8. [IMPERFECTIONS] — Style-appropriate imperfections.

## [SUBJECT] — Exhaustive Detail Required

**Character/Creature Design**:
- Species/race: human / elf / dwarf / orc / alien / robot/android / demon / angel / undead / hybrid / mutant / mythical creature / original species.
- Physique: body proportions relative to human norm (human-like / towering / slight / monstrous / serpentine / insectoid / amorphous).
- Anatomy deviations from human: extra limbs, wings, tails, horns, multiple eyes, non-human skin, bioluminescent features.
- Skin/surface: material (flesh / scales / fur / chitin / metal / crystal / energy / void), color, texture, luminosity, markings.

**Face Design** (if visible):
- Eye design: number, shape (round / slit / compound / multi-pupil / glowing / no visible eyes), color, luminosity.
- Facial features: human-like / elongated / flattened / angular / animal-like / masked / partially obscured.
- Expression: readable emotion / inscrutable / bestial / serene / tortured / stoic.
- Head adornment: crown / horns / antennae / crests / hoods / helmets / halos / floating elements.

**Armor & Equipment Design**:
- Armor style: plate / chainmail / leather / power armor / exosuit / magical energy shell / organic (living armor) / ceremonial / improvised / layered.
- Armor material: steel / mithril / dragon scale / crystal / bone / dark matter / nanomaterial / woven enchantment.
- Armor condition: battle-worn / pristine / partially broken / regenerating / corroded by dark magic.
- Ornamentation: engravings, runes, gems, magical inscriptions, faction symbols.
- Joints and articulation: how armor pieces connect and allow movement.

**Weapons & Tools**:
- Weapon type: sword / staff / bow / firearm / energy weapon / wand / orb / shield / whip / scythe / axe / spear / gauntlet / improvised.
- Material: steel / enchanted metal / crystal / bone / wood / energy / plasma / void.
- Special properties visible: glowing runes, energy aura, elemental effect (fire/ice/lightning/shadow), chain/binding magic.
- Construction: single piece / modular / mechanical / organic / summoned.

**Magical/Supernatural Elements**:
- Magic visualization: glowing runes / energy particles / elemental manifestation (fire/ice/wind/earth/lightning) / shadow tendrils / light beams / floating symbols / portal / aura / ward.
- Magic source: emanating from character / from object / from environment / from gesture / ambient.
- Magical effects on environment: distortion, floating debris, color shift, growth/decay, spatial warping.

**Clothing/Outfit** (non-armor portions):
- Style: tattered robes / noble finery / practical adventuring gear / ceremonial vestments / futuristic bodysuit / tribal wraps / mercenary leather / priestly garments.
- Layering: single layer / multiple layers / cloak/cape / scarves / wraps.
- Fabric behavior: flowing/stiff / torn/whole / clean/dirty / enchanted (shifting color, moving on its own).

## [STYLE & TEXTURE]
- Art style: concept art / matte painting / photorealistic CGI / painterly / anime-fantasy / dark fantasy oil painting / comic book / cel-shaded / watercolor storybook / digital painting / 3D render / practical effects.
- Style reference: specific franchise aesthetic (Dark Souls / Elder Scrolls / WoW / Final Fantasy / Warhammer / Studio Ghibli / Miyazaki / Frank Frazetta / Boris Vallejo / Beksinski / Moebius / Syd Mead) or original.
- Rendering quality: AAA game concept art / indie game / book cover / movie still / tabletop illustration / fan art / master study.
- Texture detail: high-detail realistic / stylized with texture / clean/painterly / sketchy.

## [ENVIRONMENT] — World Environment
**World Type**:
- Setting: high fantasy / dark fantasy / science fantasy / cyberpunk / solarpunk / dieselpunk / steampunk / post-apocalyptic / cosmic horror / mythological / alternate history / far future / alien world / underwater / floating islands / underground / void/realm between worlds.

**Architecture** (if structures present):
- Style: gothic cathedral / elven organic / dwarven stone / brutalist alien / sleek futuristic / ruined ancient / cyberpunk neon / Japanese temple / Chinese pagoda / industrial / floating / impossible geometry.
- Material: stone / crystal / metal / wood / bone / energy / living material / mixed.
- Scale: human-scaled / towering megastructure / miniature / impossible scale.
- Condition: pristine / ancient/ruined / under construction / actively being destroyed / regenerating.

**Terrain & Nature**:
- Terrain: alien landscape / twisted forest / crystal desert / lava fields / frozen wasteland / floating rock / bioluminescent jungle / poison swamp / cloud ocean / void.
- Natural elements: normal (trees/water/rock) / fantastical (crystal trees, luminous water, floating stones) / corrupted (dead forest, dark crystal, blood ocean).
- Sky: normal sky / twin suns / nebula visible / aurora / perpetual storm / no sky (underground/indoors) / magical phenomena (floating islands, orbiting bodies).

## [LIGHTING]
- Light source: natural (sun/moon/stars) / magical (spell glow, enchanted crystals, bioluminescence) / artificial (torches, neon, holograms) / supernatural (divine light, shadow magic, portal glow).
- Dramatic quality: high contrast / volumetric fog / god-rays / rim lighting from magic / ambient glow / darkness with selective illumination.
- Color of light: warm torchlight / cool moonlight / green bioluminescence / purple magic / red hellfire / blue starlight / golden divine / shadow-black.
- Interaction with magic: does magical light cast shadows? Does it illuminate or create its own light space?

## [COLOR]
- World palette: does this world have a dominant color language? (Dark Souls = muted desaturated; Zelda BOTW = vibrant natural; Blade Runner = neon-on-dark; Warhammer = dark grim).
- Signature colors: 2-3 colors that define this world/scene.
- Magical color coding: what colors represent what magic type? (fire=red/orange, ice=blue/white, nature=green, shadow=purple/black, holy=gold/white, void=deep purple/nothing)
- Atmosphere color: how does the environment's atmosphere tint everything?

## [ATMOSPHERE]
- World feeling: epic/grandiose / intimate/personal / dark/menacing / hopeful/bright / mysterious/unknown / ancient/primordial / alien/uncanny / cozy/safe / chaotic/war-torn.
- Narrative implication: what story moment is this? (before battle / after victory / lone journey / discovery / last stand / quiet moment / confrontation / escape).
- Sense of scale: does the image convey vastness, intimacy, or both?
- Lore suggestion: does the image hint at history, mythology, or world rules without stating them?

## [FRAME]
- Dramatic framing: heroic low angle looking up / epic wide establishing shot / intimate close-up / dramatic silhouette / overhead tactical view / first-person POV / cinematic widescreen.
- Sense of scale: tiny figure in vast landscape / towering creature / equal confrontation / macro detail.
- Motion suggestion: frozen action / implied movement (wind, magic trails, debris) / static pose.

## [IMPERFECTIONS]
- For photorealistic fantasy: standard photographic imperfections.
- For painted/drawn fantasy: brush texture, canvas showing through, sketch lines, paint drip.
- For 3D renders: polygon edges visible, texture stretching, light bleeding, fireflies (bright pixels).
- For intentionally dark/grim fantasy: grime, blood, rust, decay, corruption — describe as world-building elements.
- For lo-fi/sketchy concept art: construction lines, quick marker strokes, thumbnail quality — describe as style.

## [PROMPT TAGS]
Medium: concept art / matte painting / digital painting / 3D render / photorealistic CGI / painterly / fantasy illustration / dark fantasy / epic art / cinematic concept art
Artist style: (name 1-3 artists — e.g., "by frank frazetta", "by boris vallejo", "by beksinski", "by moebius", "by syd mead", "by alan lee", "by john howe". Skip if no strong match.)
Quality boosters: masterpiece, best quality, highly detailed, epic, cinematic, award-winning concept art, AAA game art, movie poster quality, ultra-detailed, dramatic, atmospheric
Platform: artstation, deviantart
Additional: (include if relevant: dark fantasy, high fantasy, sci-fi, cyberpunk, steampunk, solarpunk, post-apocalyptic, cosmic horror, mythological, volumetric lighting, god rays, magical atmosphere, fantasy world)

## [NEGATIVE PROMPT]
Universal: watermark, signature, text, logo, cropped, worst quality, low quality
Fantasy-specific: blurry, lowres, bad anatomy, extra limbs, missing limbs, deformed, ugly, flat lighting, dull, boring, modern objects, realistic photograph, stock photo, amateur, poorly drawn, bad proportions, duplicate`;
}

// ── Main Builder ───────────────────────────────────────────────────

function getCategoryInstructions(category: string /* Exclude<ImageCategory, "auto"> */): string {
  switch (category) {
    case "portrait":
      return buildPortraitInstructions();
    case "anime":
      return buildAnimeInstructions();
    case "landscape":
      return buildLandscapeInstructions();
    case "product":
      return buildProductInstructions();
    case "design":
      return buildDesignInstructions();
    case "art":
      return buildArtInstructions();
    case "fantasy":
      return buildFantasyInstructions();
    default:
      return "";
  }
}

function targetModelLabel(targetModel: TargetModelId): string {
  return TARGET_MODELS.find((m) => m.id === targetModel)?.label ?? targetModel;
}

export function buildCategoryImageInstruction(
  category: string /* Exclude<ImageCategory, "auto"> */,
  targetModel: TargetModelId,
  imageInfo?: DetectedImageInfo
): string {
  const modelLabel = targetModelLabel(targetModel);
  const aspectRatio = inferImageAspectRatio(imageInfo);

  return `You are a professional image-to-prompt reverse-engineering system. Your job is not to caption the image. Your job is to extract the visual controls needed to recreate it as faithfully as possible with an image generator.
Target generator: ${modelLabel}. Expected aspect ratio: ${aspectRatio}.

${buildBaseRules()}

${getCategoryInstructions(category)}

## Output Format
Use [TAG] format. Each [TAG] on its own line followed by content. The output is automatically split into two display groups — write them in this order.

**STYLE MODULE** (displayed as "风格描述" — write FIRST, maximum precision):
[AESTHETIC HOOK], [STYLE & TEXTURE], [ATMOSPHERE], [COLOR], [LIGHTING], [FRAME], [VISUAL HIERARCHY], [MATERIAL RESPONSE], [ERA SIGNALS], [IMAGE PHYSICS], [OPTICAL DEPTH], [FILTER & PROCESSING], [STYLE EXCLUSIONS], [PROMPT TAGS], [NEGATIVE PROMPT]

**CONTENT MODULE** (displayed as "内容描述" — write SECOND, directional freedom):
[SUBJECT 1], [SUBJECT 2], [SPATIAL LAYERS], [ENVIRONMENT], [IMPERFECTIONS], [CONSTRAINTS]

Descriptive modules use natural language paragraphs. Diagnostic modules ([IMPERFECTIONS]) may use compact checklist or comma-separated format. [PROMPT TAGS], [NEGATIVE PROMPT], and [STYLE EXCLUSIONS] use comma-separated standardized tags. Fill every module with reasonable detail — only skip if the content genuinely does not exist in the image. [IMPERFECTIONS] and [NEGATIVE PROMPT] must always be generated.

### Available Tags — Style Module
[AESTHETIC HOOK] — Single-sentence visual signature: [Medium] + [Era] + [Lighting] + [Color Science]. Primary style anchor.
[STYLE & TEXTURE] — Artistic style, medium, surface quality. Be specific: name the style, reference artists or movements.
[ATMOSPHERE] — Mood, tension, psychological space, narrative. Use precise emotional descriptors.
[COLOR] — Palette, grading, temperature, saturation. Name exact color temperatures and grading styles.
[LIGHTING] — Light sources, quality, shadows, special effects. Specify direction (clock position), quality (hard/soft), color.
[FRAME] — Camera, lens character, device aesthetics. Focus on optical/device properties.
[VISUAL HIERARCHY] — Attention distribution: focal priority, attention flow, visual weight, information density.
[MATERIAL RESPONSE] — Cross-material light interaction: skin/fabric/metal/plastic behavior, halation, bloom.
[ERA SIGNALS] — Period markers: technology (CRT/VHS/webcam), fashion, internet aesthetics, cultural framing.
[IMAGE PHYSICS] — Sensor/pipeline limitations: clipping, noise, compression, optical flaws, processing artifacts.
[OPTICAL DEPTH] — Lens depth rendering: focus structure, depth falloff, bokeh, spatial compression, lens breathing.
[FILTER & PROCESSING] — Post-processing chain: filter/preset, tone curve, split toning, vignette, grain, glow, sharpening, local adjustments.
[STYLE EXCLUSIONS] — Aesthetic directions to AVOID. Comma-separated "avoid X" phrases, 2-4 items.
[PROMPT TAGS] — Standardized tags. Select 3-6 per sub-category: Medium, Artist style, Quality boosters, Platform.
[NEGATIVE PROMPT] — Always include universal terms + type-specific negatives.

### Available Tags — Content Module
[SUBJECT 1: name] — Subject identity, pose, expression, clothing, key features. Describe with concrete specificity.
[SPATIAL LAYERS] — Brief depth ordering (foreground/midground/background).
[ENVIRONMENT] — Brief setting description. Skip for studio backdrops.
[IMPERFECTIONS] — Degradation notes. Comma-separated.
[CONSTRAINTS] — Generator prohibitions. For portraits, ALWAYS include anti-idealization constraints.`;
}
