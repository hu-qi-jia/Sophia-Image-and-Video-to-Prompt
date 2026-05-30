# Sophia Image Prompt — Tag & Rule Reference

## System Identity

> You are a visual forensics system. Your job is NOT to caption — it is to reverse-engineer the exact visual controls needed to reproduce this image with an AI generator.

---

## Output Structure

The AI outputs `[TAG]` sections. These are automatically split into two display groups:

| Group | Display Name | Purpose |
|-------|-------------|---------|
| **STYLE MODULE** | 风格描述 | How the image *feels* — color, light, texture, camera, processing |
| **CONTENT MODULE** | 内容描述 | What the image *contains* — subjects, objects, spatial layers, environment |

---

## STYLE MODULE Tags (18 tags)

### REQUIRED

| # | Tag | Description |
|---|-----|-------------|
| 1 | `[ARCHETYPE]` | First output line — complexity tier (simple/moderate/complex) + image type |
| 2 | `[AESTHETIC HOOK]` | T0 highest-weight paragraph: medium + era + lighting + color science + texture |
| 3 | `[COLOR]` | Complete color pipeline: exposure, contrast, temperature(K), grading, palette, saturation, color bleed |
| 4 | `[LIGHTING]` | Key/fill/ambient light, flash analysis, shadows, light-material coupling |
| 5 | `[STYLE & TEXTURE]` | Visual style reference, medium texture, beauty filter detection + feature audit |
| 6 | `[FRAME]` | Lens character, perspective geometry, depth rendering (DOF/bokeh), motion rendering, quality tier |
| 7 | `[COMPOSITION]` | Grid/alignment, visual weight, focal hierarchy, negative space, balance type |
| 8 | `[PROMPT TAGS]` | Standardized SD/Midjourney tags: Medium, Artist, Quality boosters (MODE-AWARE), Platform |
| 9 | `[NEGATIVE PROMPT]` | Universal + type-specific negatives |

### CONDITIONAL

| # | Tag | When to Use |
|---|-----|-------------|
| 10 | `[ATMOSPHERE]` | Skip for product-on-white, flat UI, diagrams |
| 11 | `[SNAPSHOT FEEL]` | Snapshot/candid images with imperfect framing or accidental composition |

### OPTIONAL

| # | Tag | When to Use |
|---|-----|-------------|
| 12 | `[MATERIAL RESPONSE]` | Product shots, detailed fabrics, reflective surfaces |
| 13 | `[ERA SIGNALS]` | Clear period aesthetics, vintage looks, internet-era visual language |

### DIAGNOSTIC (auto-generated)

| # | Tag | Description |
|---|-----|-------------|
| 14 | `[IMAGE PHYSICS]` | Sensor/pipeline limitations: clipping, noise, compression |
| 15 | `[OPTICAL DEPTH]` | Lens depth rendering details |
| 16 | `[FILTER & PROCESSING]` | Post-processing chain |
| 17 | `[VISUAL HIERARCHY]` | Attention distribution across frame |
| 18 | `[STYLE EXCLUSIONS]` | Aesthetic directions to AVOID (2-4 items) |

---

## CONTENT MODULE Tags (7 tags)

### REQUIRED

| # | Tag | Description |
|---|-----|-------------|
| 1 | `[SUBJECT 1]` | Primary subject: identity, ethnicity/age/body, hair, pose, expression, clothing |
| 2 | `[SUBJECT 2..N]` | Additional subjects (up to 6), inter-subject spatial relationships |
| 3 | `[IMPERFECTIONS & PHYSICS]` | All non-ideal characteristics as POSITIVE style elements |
| 4 | `[CONSTRAINTS]` | Generator prohibitions + anti-idealization (Mode A or B) |

### CONDITIONAL

| # | Tag | When to Use |
|---|-----|-------------|
| 5 | `[POSE REFINEMENT]` | Only for extreme/dynamic/asymmetric poses — do NOT duplicate [SUBJECT 1] pose |
| 6 | `[SPATIAL LAYERS]` | Skip for studio backdrops, pure voids, solid color backgrounds |
| 7 | `[CLUTTER LOGIC]` | Multi-object scenes with non-sterile arrangement — skip for minimal/clean scenes |
| 8 | `[ENVIRONMENT]` | Skip for studio backdrops, pure voids, solid color backgrounds |

---

## Key Rules

### Core Philosophy
- **Reproduction fidelity over description** — output is a generation blueprint
- **Constraint over adjective** — structural/geometric > aesthetic qualifiers
- **Imperfection is identity** — flaws are authenticity signals, not defects
- **Anti-normalization** — resist AI defaults (centered, symmetrical, well-lit, idealized)
- **Strict Decoupling** — Style tags contain ZERO subject terms; Content tags contain ZERO lighting/camera/color terms

### Spatial Anchoring Rule
Every visual element description MUST include its spatial position in the frame:
- Percentage from edges (e.g., "occupies center 40%")
- Quadrant (upper-left, center-right, lower-third)
- Clock positions (e.g., "key light from 10 o'clock")

### Weight Tiers
| Tier | Priority | Modules |
|------|----------|---------|
| T0 | HIGHEST | COLOR, LIGHTING, STYLE & TEXTURE, AESTHETIC HOOK |
| T1 | VISUAL LANGUAGE | FRAME, COMPOSITION, ATMOSPHERE |
| T2 | REPLACEABLE | SUBJECT, SPATIAL LAYERS, ENVIRONMENT |
| T3 | CONSTRAINTS | IMPERFECTIONS & PHYSICS, CONSTRAINTS, PROMPT TAGS, NEGATIVE PROMPT |

### Cross-Reference Rules
- `[SNAPSHOT FEEL]` active → `[PROMPT TAGS]` MUST use raw/candid/non-professional quality boosters
- Beauty filter detected → integrate feature audit into platform description, don't write standalone
- `[POSE REFINEMENT]` → check `[SUBJECT 1]` pose first, don't duplicate, only add quantification

### Complexity Tiers
| Tier | TAG Count | When |
|------|-----------|------|
| simple | ~15 | Plain bg, single subject, minimal detail |
| moderate | ~17 | Natural scene, 1-2 subjects |
| complex | ~19 | Multiple subjects, intricate scene, collage |

### Output Format
- ALL output in English
- Each `[TAG]` on its own line, followed by content
- Descriptive TAGs: natural language paragraphs
- Diagnostic TAGs: compact comma-separated format
- Weight annotations (optional, 2-3 max): `(keyword:1.3)` for emphasis, `(keyword:0.7)` for secondary

### Module Output Order

```
STYLE:
[ARCHETYPE] → [AESTHETIC HOOK] → [COLOR] → [LIGHTING] → [STYLE & TEXTURE]
→ [FRAME] → [COMPOSITION] → [ATMOSPHERE] → [SNAPSHOT FEEL] → [MATERIAL RESPONSE]
→ [ERA SIGNALS] → [IMAGE PHYSICS] → [OPTICAL DEPTH] → [FILTER & PROCESSING]
→ [VISUAL HIERARCHY] → [STYLE EXCLUSIONS] → [PROMPT TAGS] → [NEGATIVE PROMPT]

CONTENT:
[SUBJECT 1..N] → [POSE REFINEMENT] → [SPATIAL LAYERS] → [CLUTTER LOGIC]
→ [ENVIRONMENT] → [IMPERFECTIONS & PHYSICS] → [CONSTRAINTS]
```

---

## Anti-Idealization Modes

### Mode A — NO beauty processing in source (raw/candid/natural)
> "do not beautify or conventionalize facial features, do not enlarge eyes, do not narrow nose bridge, do not smooth skin texture or remove pores, do not reduce freckle/mole density, do not soften ethnic-specific facial geometry, do not apply beauty filter or skin retouching, do not symmetrize asymmetric features, do not make subject appear more conventionally attractive, do not remove flyaway hairs or frizz, do not clean up messy hair."

### Mode B — Source HAS beauty processing
> "preserve the beauty-filtered skin smoothing, maintain face-slimming proportions, keep enlarged bright eye catchlights, preserve warm skin glow, do not add raw skin texture or pores that the source does not show, do not de-beautify — the polished appearance IS the source style."

---

## Beauty Filter Platform Reference

| Platform | Key Visual Signature |
|----------|---------------------|
| Douyin/抖音 | Porcelain skin, jawline narrowing, enlarged eyes, golden glow, radial vignette |
| Instagram/TikTok | Moderate smoothing, boosted vibrance, lifted shadows, highlight bloom |
| Korean ulzzang | Glass-skin (zero pores), pastel grading, aegyo-sal (under-eye highlight) |
| Xiaohongshu/小红书 | Clean beauty, soft fill, even tone, matte skin |
| Weibo celebrity | High-contrast glamour, contouring, dramatic eye emphasis |
| Western influencer | Warm tones, clarity boost, orange-teal split toning |
