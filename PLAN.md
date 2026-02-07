# Editor Page UX Redesign Plan

## Goal
Redesign the editor page to follow an NLE (non-linear editor) pattern:
- **Left**: Video canvas/preview
- **Right**: Properties panel with rich editing controls
- **Bottom**: Timeline with transport controls
- **Top**: Unified nav with breadcrumb, shell tabs (centered), and actions (right)

## Current State
- **Player mode**: Nav (80px top) → flex row [Content (flex:1) | RightPanel (460px)]
- **Edit mode**: EditorNav (80px top) → VideoPlayer → TrimUI (230px bottom)
- ShellTabs float independently above everything
- RightPanel has: Edit section (Trim/Crop/Audio buttons), Save (Drive), Export (MP4/WEBM/GIF), Advanced (Raw/Troubleshoot)
- Edit/Preview are separate modes that swap the entire layout

## Changes

### Phase 1: Unified Nav Bar
**File: `src/pages/Sandbox/layout/player/PlayerNav.js`**
- Replace current nav with unified bar:
  - **Left**: Logo + breadcrumb (video title, editable)
  - **Center**: Embed ShellTabs directly into nav (Edit | Preview toggle)
  - **Right**: "Share" primary button + existing help/unlock buttons

**File: `src/pages/Sandbox/styles/player/_Nav.module.scss`**
- Add `.navCenter` styles for embedded tabs
- Adjust layout for three-section nav

**File: `src/pages/Sandbox/Sandbox.jsx`**
- Remove standalone `<ShellTabs>` rendering — it moves into the nav

### Phase 2: Restructure Player Layout for Edit Tab
**File: `src/pages/Sandbox/layout/player/Player.js`**
- Change layout to three-zone: canvas (left) + properties panel (right) + timeline (bottom)
- In Edit tab: show full NLE layout
- In Preview tab: show simplified view (just video + export controls)

**File: `src/pages/Sandbox/styles/player/_Player.module.scss`**
- New grid/flex layout:
  ```
  .layout { display: grid; grid-template-rows: 80px 1fr auto; height: 100vh; }
  .content { display: flex; flex: 1; overflow: hidden; }
  .timeline { height: 200px; border-top: 1px solid border-color; }
  ```

### Phase 3: Enhanced Right Panel (Properties Panel)
**File: `src/pages/Sandbox/layout/player/RightPanel.js`**
- Restructure into tabbed sections with a vertical icon toolbar on the left edge:
  - **Scene** (active by default): Template properties
  - **Audio**: Volume slider + re-record
  - **Export**: Download options (moved from current prominent position)
  - **Advanced**: Raw recording + troubleshooting

- Scene section contents:
  - Panel header: "Scene" with overflow menu
  - Template Properties subsection:
    - Text inputs for title overlays (top title, bottom title, small text)
    - Color picker for text color (hex input)
    - Toggle: Camera on corner
    - Toggle: Camera
    - Toggle: Flip orientation
  - Audio subsection:
    - Volume slider (reuse existing Radix slider styles)
    - Re-record button

**File: `src/pages/Sandbox/styles/player/_RightPanel.module.scss`**
- Add vertical toolbar styles (icon strip on left edge of panel)
- Add property input styles (text inputs, color picker, toggles)
- Reduce panel width from 460px to ~380px to give more canvas space

### Phase 4: Bottom Timeline
**File: `src/pages/Sandbox/layout/editor/Timeline.js`** (new)
- Toolbar row: transport controls (play/pause, timecode), split tool, zoom controls
- Timeline ruler with time markers and playhead scrubber
- Track lane with video thumbnail filmstrip
- Reuse existing Trimmer component logic for drag handles

**File: `src/pages/Sandbox/styles/edit/_Timeline.module.scss`** (new)
- Timeline container, ruler, track lanes, playhead styles

### Phase 5: Integrate Timeline into Edit Tab
**File: `src/pages/Sandbox/layout/player/Player.js`**
- When in Edit tab mode, render Timeline at bottom
- When in Preview tab, hide timeline

**File: `src/pages/Sandbox/Sandbox.jsx`**
- Remove separate Editor component rendering for edit mode
- Unify into single Player layout that adapts based on active tab

## Files Modified (summary)
1. `src/pages/Sandbox/layout/player/PlayerNav.js` — unified nav with embedded tabs
2. `src/pages/Sandbox/styles/player/_Nav.module.scss` — nav styles
3. `src/pages/Sandbox/layout/player/Player.js` — three-zone layout
4. `src/pages/Sandbox/styles/player/_Player.module.scss` — grid layout
5. `src/pages/Sandbox/layout/player/RightPanel.js` — properties panel with vertical toolbar
6. `src/pages/Sandbox/styles/player/_RightPanel.module.scss` — panel styles
7. `src/pages/Sandbox/layout/player/Content.js` — canvas area adjustments
8. `src/pages/Sandbox/Sandbox.jsx` — remove standalone ShellTabs, unify layout
9. `src/pages/Sandbox/layout/editor/Timeline.js` — new timeline component
10. `src/pages/Sandbox/styles/edit/_Timeline.module.scss` — new timeline styles

## Files NOT Modified
- editorShellModel.js, editorStore.js, editorShellSync.js — state logic stays the same
- Trimmer.jsx, Waveform.jsx — reused as-is inside Timeline
- Modal.jsx — already fixed
- All Content/ (recording toolbar) files — untouched

## Design Tokens (existing, reused)
- Colors: $color-primary (#3080F8), $color-border (#E8E8E8), $color-light-grey (#F6F7FB)
- Font: Satoshi family, 14px normal
- Border radius: 30px (pills), 15px (panels)
- Spacing: 4/8/12/16px scale
