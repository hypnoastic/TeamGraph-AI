# TeamGraph Minimal Neo-Brutalist

## Direction

TeamGraph is a technical organization-memory product. Its interface uses restrained
neo-brutalism: bold hierarchy, warm paper surfaces, a black application shell,
thick outlines, and hard offset shadows. Pages stay sparse and functional.

## Color Tokens

- `paper`: `#F4EFE6`
- `surface`: `#FFFDF8`
- `ink`: `#111111`
- `muted`: `#625E57`
- `purple`: `#9B5DE5`
- `lime`: `#B9F227`
- `yellow`: `#FFD84D`
- `coral`: `#FF6B5F`
- `cyan`: `#45D7E8`
- `white`: `#FFFFFF`

Color communicates action, state, or graph type. It is not decorative.

## Typography

- Headings and interface: Space Grotesk
- Technical values, IDs, status, and code: IBM Plex Mono
- Display: 48/52, 700
- Page title: 32/36, 700
- Section title: 20/24, 700
- Body: 14/21, 400
- Small body: 12/18, 400
- Technical label: 11/14, 600, uppercase

Keep copy concise. A page may have one short supporting sentence when required.

## Shape and Depth

- Structural border: `2px solid #111111`
- Small hard shadow: `4px 4px 0 #111111`
- Large hard shadow: `8px 8px 0 #111111`
- Standard radius: `4px`
- Tables and structural panels: `0px`
- Focus ring: `3px solid #9B5DE5`

Do not use blur, glass, soft shadows, or glows.

## Spacing

Use a 4px base scale: 4, 8, 12, 16, 24, 32, 48, 64.

- Desktop sidebar: 240px
- Desktop page padding: 32px
- Mobile page padding: 16px
- Standard control height: 40px
- Compact row height: 44px

## Shell

Desktop uses one black sidebar and one compact top bar. Main content uses the
paper canvas. Mobile uses a single drawer navigation.

The top bar contains only the page title, current project, and essential actions.
Health information belongs in Settings, not repeated throughout the shell.

## Components

### Buttons

Rectangular with a 2px border and 3-4px hard shadow. Primary is purple with black
text. Secondary is white. Destructive is coral. No pill buttons.

### Inputs

White background, 2px black border, 4px radius. Show helper text only for errors
or necessary format guidance.

### Cards

Use cards only for primary metrics, featured actions, or genuinely grouped data.
Do not wrap every section or row in a card. Avoid nested decorative containers.

### Tables and Lists

Prefer flat rows and strong dividers. Technical values use monospace. Row actions
remain compact and explicit.

### Badges

Small rectangular labels. Use lime for safe, yellow for review, coral for unsafe,
cyan for informational state, and purple for active memory.

### Modals and Drawers

One outlined surface with only required fields and actions.

### Empty and Error States

One sentence and one action. No illustration wall or explanatory paragraph.

## Graph

- Organization: black
- Project: purple
- User: cyan
- Context: yellow
- Episode: lime
- Fact: coral

Nodes use a 2px black border and 3px hard shadow. The graph canvas uses a subtle
dot grid and no glow.

## Restraint Rules

- One page header maximum.
- One main content surface per page.
- No decorative wrapper divs.
- No repeated helper copy.
- No text-heavy dashboards.
- No gradients except one signature marketing or graph-memory area.
- No dead buttons; unavailable connectors are visibly disabled and marked soon.
