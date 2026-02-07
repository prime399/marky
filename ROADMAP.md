# Screenity Editor Modernization Roadmap

This roadmap defines the implementation order and standards for evolving this project into a modern multi-scene editor with `Edit` and `Preview` modes, while keeping compatibility with future server-side endpoints hosted on Supabase + AWS.

## 1. Goals

1. Build a reusable editor foundation that supports fast iteration.
2. Avoid rewrites by reusing current components and state flows.
3. Keep local-first functionality working now.
4. Prepare clean integration points for future backend APIs.

## 2. Non-Negotiable Rules

1. Do not couple UI directly to storage or network calls.
2. All features must flow through shared domain models and store actions.
3. New work must plug into shared primitives (`Project schema`, timeline, renderer, inspector controls).
4. Cloud-backed features must use interfaces, with local adapters as default.
5. Every phase must have acceptance criteria and test coverage updates.
6. Every subpart in a phase must be unit tested and integration tested before moving to the next subpart.
7. No phase may start until all subparts in the current phase pass test gates.

## 3. Target Architecture (Foundation)

## 3.1 Core Domain

- `Project`: metadata + scenes + global settings + revision.
- `Scene`: media references + timeline bounds + layout + keyframes + overlays.
- `Track`: typed track data (`video`, `audio`, `caption`, `effect`).
- `Keyframe`: timestamped value with easing.
- `Asset`: logical asset ID + source + status + URLs.

## 3.2 Service Interfaces (must exist before backend integration)

- `ProjectRepository`
  - `loadProject(projectId)`
  - `saveProject(project)`
  - `listProjects()`
- `AssetService`
  - `createUploadTarget(payload)`
  - `completeUpload(payload)`
  - `getPlaybackUrl(assetId)`
- `ExportService`
  - `startExport(projectId, options)`
  - `getExportStatus(jobId)`
  - `cancelExport(jobId)`
- `AuthService`
  - `getSession()`
  - `refreshSession()`
- `EntitlementService`
  - `getEntitlements()`

Default implementations now:
- local repositories via `chrome.storage.local` / `localforage`.
- local export orchestration.

Future implementations:
- Supabase for auth, project metadata, entitlements.
- AWS for object storage + processing/export jobs.

## 4. Execution Order (Mandatory)

## Phase Gate Policy (Mandatory)

For every phase and every subpart/task:
1. Add/adjust unit tests for core logic.
2. Add/adjust integration tests for cross-module behavior.
3. Run full relevant suite and record results in PR.
4. Fix failures before proceeding.
5. Mark subpart complete only after tests pass.

Phase exit criteria:
1. All subparts completed.
2. All unit tests pass.
3. All integration tests pass.
4. Manual regression checklist completed.

## Phase 0: Contract and Adapter Setup

### Tasks
1. Define `Project v1` schema and migration strategy (`schemaVersion` + migrators).
2. Introduce service interfaces and local implementations.
3. Add sync status fields to project state:
   - `local_only`, `sync_pending`, `synced`, `sync_error`, `conflict`.

### Map to current code
- `src/pages/Content/context/ContentState.jsx`
- `src/pages/Sandbox/context/ContentState.jsx`
- `src/pages/CloudRecorder/createVideoProject.js`
- `src/pages/Background/messaging/handlers.js`

### Acceptance criteria
1. Project can be loaded/saved through interface only.
2. No UI component calls storage/network directly for project mutations.
3. Migration test for at least one schema bump exists.
4. Unit + integration tests for each subpart are passing.

## Phase 1: Editor Shell and Shared State

### Tasks
1. Build unified editor shell with `Edit` and `Preview` tabs.
2. Add centralized editor store actions/selectors.
3. Add selection model (`selectedSceneId`, `selectedTrackId`, `selectedItemId`).

### Map to current code
- `src/pages/Sandbox/Sandbox.jsx`
- `src/pages/Sandbox/layout/editor/Editor.js`
- `src/pages/Sandbox/layout/player/Player.js`

### Acceptance criteria
1. Tab switching preserves state and playhead.
2. No duplicated state between Edit and Preview paths.
3. Unit + integration tests for each subpart are passing.

## Phase 2: Timeline Foundation

### Tasks
1. Build scene timeline primitives:
   - add, remove, duplicate, reorder scenes.
   - trim start/end.
   - playhead and scrubbing.
2. Add reusable timeline utility functions (snap, clamp, overlap guards).

### Map to current code
- `src/pages/Sandbox/components/editor/Trimmer.jsx`
- `src/pages/Sandbox/layout/editor/TrimUI.js`
- `src/pages/Sandbox/components/editor/Waveform.jsx`

### Acceptance criteria
1. Scene CRUD works from one action layer.
2. Reorder and trim updates render output immediately.
3. Timeline unit tests for bounds/snap logic.
4. Integration tests cover CRUD + playback synchronization.
5. Unit + integration tests for each subpart are passing.

## Phase 3: Render/Playback Unification

### Tasks
1. Build one render pipeline for both tabs.
2. Add transport controls (play/pause/seek/loop) as shared module.
3. Ensure Preview is a clean mode, not a separate renderer.

### Map to current code
- `src/pages/Sandbox/layout/player/Content.js`
- `src/pages/Sandbox/components/player/VideoPlayer.jsx`
- `src/pages/Sandbox/layout/player/PlayerNav.js`

### Acceptance criteria
1. Same frame output in Edit and Preview at identical playhead positions.
2. Playback state source of truth is single store.
3. Unit + integration tests for each subpart are passing.

## Phase 4: Inspector and Layout System

### Tasks
1. Build reusable inspector field components (switch/select/slider/color/text).
2. Add layout preset registry (camera corner, split, fullscreen, template variants).
3. Store layout as scene data, not component-local flags.

### Map to current code
- `src/pages/Sandbox/layout/player/RightPanel.js`
- `src/pages/Sandbox/components/editor/Dropdown.jsx`
- `src/pages/Sandbox/components/editor/Switch.jsx`

### Acceptance criteria
1. New presets can be added via config without touching timeline code.
2. Inspector controls are reusable across scene/audio/caption properties.
3. Unit + integration tests for each subpart are passing.

## Phase 5: Recording Ingestion to Scenes

### Tasks
1. Convert recording outputs into scene records automatically.
2. Wire multi-recording session output to timeline scene creation.
3. Preserve existing recording reliability paths.

### Map to current code
- `src/pages/CloudRecorder/CloudRecorder.jsx`
- `src/pages/Background/recording/stopRecording.js`
- `src/pages/Background/messaging/handlers.js`

### Acceptance criteria
1. Every new recording becomes a scene without manual import.
2. Existing single-recording flow remains functional.
3. Unit + integration tests for each subpart are passing.

## Phase 6: Zoom Keyframes and Effects

### Tasks
1. Add keyframe model and interpolation engine.
2. Implement zoom in/out controls and keyframe editing.
3. Integrate click-event timing data for auto-seeded keyframes.

### Map to current code
- `src/pages/Background/messaging/handlers.js` (`click-event` flow)
- `src/pages/Content/context/ContentState.jsx`
- timeline/editor components in Sandbox

### Acceptance criteria
1. Keyframes persist per scene.
2. Preview playback reflects zoom interpolation exactly.
3. Unit + integration tests for each subpart are passing.

## Phase 7: Audio, Captions, and Export

### Tasks
1. Add audio track UI/mixing controls (volume, mute, ducking).
2. Add caption track and style settings.
3. Integrate export orchestrator with progress and error handling.

### Map to current code
- `src/pages/Sandbox/layout/editor/AudioUI.js`
- `src/pages/Sandbox/components/editor/Waveform.jsx`
- `src/pages/EditorWebCodecs/mediabunny/lib/videoAudioMixer.ts`
- `src/pages/EditorWebCodecs/mediabunny/lib/videoMuter.ts`

### Acceptance criteria
1. Multi-scene export reflects timeline + layout + zoom + audio/captions.
2. Export retry and cancellation behavior implemented.
3. Unit + integration tests for each subpart are passing.

## Phase 8: Supabase + AWS Integration

### Tasks
1. Implement remote adapters for interfaces only (no UI rewrites):
   - Supabase `AuthService`, `ProjectRepository`, `EntitlementService`.
   - AWS-backed `AssetService` and optional remote `ExportService`.
2. Add conflict/retry policies for sync.
3. Add environment-based adapter selection.

### Supabase mapping
- Auth/session refresh.
- Project/scene metadata tables.
- Entitlements/subscription flags.
- Optional realtime updates.

### AWS mapping
- S3-compatible uploads via presigned URLs.
- Processing/export workers (Lambda/ECS/queue workers).
- CDN playback URLs.

### Acceptance criteria
1. Switching adapters does not require UI component changes.
2. Local mode still works offline.
3. Sync conflicts are surfaced and resolvable.
4. Unit + integration tests for each subpart are passing.

## 5. Component Reuse Map (Reference)

- Popup and state flows:
  - `src/pages/Content/popup/*`
  - `src/pages/Content/context/*`
- Editor canvas/player:
  - `src/pages/Sandbox/layout/player/*`
  - `src/pages/Sandbox/components/player/*`
- Editor controls:
  - `src/pages/Sandbox/layout/editor/*`
  - `src/pages/Sandbox/components/editor/*`
- Recording + background orchestration:
  - `src/pages/Background/*`
  - `src/pages/CloudRecorder/*`
- Export/media processing:
  - `src/pages/EditorWebCodecs/*`

Use these modules as building blocks; prefer extraction over duplication.

## 6. Delivery Standards Per Phase

Each phase PR must include:
1. `What changed` summary.
2. Files touched and why.
3. Acceptance criteria checklist.
4. Backward compatibility notes.
5. Test updates (unit/integration/manual).
6. Explicit subpart test matrix showing pass/fail for unit and integration tests.

## 7. Testing Strategy

Minimum required:
1. Domain/model tests (`Project` schema + migrations).
2. Timeline behavior tests (trim/reorder/snap/playhead).
3. Renderer parity tests (Edit vs Preview output behavior).
4. Adapter contract tests (local vs remote implementations).
5. Recording-to-scene ingestion integration tests.
6. Per-subpart unit and integration test evidence before phase progression.

## 8. Risks and Mitigations

1. State fragmentation across contexts.
   - Mitigation: single editor store + strict action APIs.
2. UI/network coupling.
   - Mitigation: repository/service interfaces only.
3. Diverging render behavior.
   - Mitigation: shared playback pipeline for both modes.
4. Backend migration churn.
   - Mitigation: adapter-based design with stable domain contract.

## 9. Definition of Done (Project-Level)

The roadmap is complete when:
1. `Edit` and `Preview` share one render pipeline.
2. Multi-scene timeline is stable and fully editable.
3. Zoom/layout/audio/caption features are scene-driven and exportable.
4. Local mode works standalone.
5. Supabase + AWS adapters can be enabled without UI refactor.
