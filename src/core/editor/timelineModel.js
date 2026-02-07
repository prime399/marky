const MIN_SCENE_DURATION = 0.1;
const DEFAULT_SNAP_STEP = 0.25;
const DEFAULT_SNAP_THRESHOLD = 0.05;

const asFiniteNumber = (value, fallback = 0) =>
  Number.isFinite(value) ? value : fallback;

const roundTimelineNumber = (value, precision = 6) => {
  const normalized = asFiniteNumber(value, 0);
  const factor = 10 ** precision;
  const rounded = Math.round(normalized * factor) / factor;
  return Object.is(rounded, -0) ? 0 : rounded;
};

const clamp = (value, min, max) => {
  const normalizedValue = asFiniteNumber(value, min);
  const normalizedMin = asFiniteNumber(min, 0);
  const normalizedMax = asFiniteNumber(max, normalizedMin);
  if (normalizedValue < normalizedMin) return normalizedMin;
  if (normalizedValue > normalizedMax) return normalizedMax;
  return normalizedValue;
};

const snapToStep = (
  value,
  step = DEFAULT_SNAP_STEP,
  threshold = DEFAULT_SNAP_THRESHOLD,
) => {
  const normalizedStep = asFiniteNumber(step, DEFAULT_SNAP_STEP);
  if (normalizedStep <= 0) return asFiniteNumber(value, 0);

  const normalizedValue = asFiniteNumber(value, 0);
  const nearest = Math.round(normalizedValue / normalizedStep) * normalizedStep;
  if (Math.abs(nearest - normalizedValue) > Math.abs(threshold)) {
    return roundTimelineNumber(normalizedValue);
  }
  return roundTimelineNumber(nearest);
};

const snapToPoints = (value, points = [], threshold = DEFAULT_SNAP_THRESHOLD) => {
  const normalizedValue = asFiniteNumber(value, 0);
  if (!Array.isArray(points) || points.length === 0) {
    return roundTimelineNumber(normalizedValue);
  }

  let candidate = normalizedValue;
  let minDistance = Number.POSITIVE_INFINITY;

  points.forEach((point) => {
    if (!Number.isFinite(point)) return;
    const distance = Math.abs(point - normalizedValue);
    if (distance < minDistance) {
      minDistance = distance;
      candidate = point;
    }
  });

  if (minDistance <= Math.abs(threshold)) {
    return roundTimelineNumber(candidate);
  }
  return roundTimelineNumber(normalizedValue);
};

const getSceneDuration = (scene = {}) => {
  const sourceDuration = Math.max(
    MIN_SCENE_DURATION,
    asFiniteNumber(scene.sourceDuration, MIN_SCENE_DURATION),
  );
  const trimStart = Math.max(0, asFiniteNumber(scene.trimStart, 0));
  const trimEnd = Math.max(0, asFiniteNumber(scene.trimEnd, 0));
  const rawDuration = sourceDuration - trimStart - trimEnd;
  return roundTimelineNumber(Math.max(MIN_SCENE_DURATION, rawDuration));
};

const createUniqueSceneId = (baseId, usedIds) => {
  if (!usedIds.has(baseId)) return baseId;

  let suffix = 2;
  while (usedIds.has(`${baseId}-${suffix}`)) {
    suffix += 1;
  }
  return `${baseId}-${suffix}`;
};

const normalizeScene = (scene = {}, index = 0, usedIds = new Set()) => {
  const fallbackId = `scene-${index + 1}`;
  const baseId =
    typeof scene.id === "string" && scene.id.trim().length > 0
      ? scene.id.trim()
      : fallbackId;
  const id = createUniqueSceneId(baseId, usedIds);
  usedIds.add(id);

  const sourceDuration = Math.max(
    MIN_SCENE_DURATION,
    asFiniteNumber(scene.sourceDuration, MIN_SCENE_DURATION),
  );
  const maxTrimStart = sourceDuration - MIN_SCENE_DURATION;
  const trimStart = clamp(asFiniteNumber(scene.trimStart, 0), 0, maxTrimStart);
  const maxTrimEnd = sourceDuration - trimStart - MIN_SCENE_DURATION;
  const trimEnd = clamp(asFiniteNumber(scene.trimEnd, 0), 0, maxTrimEnd);

  return {
    ...scene,
    id,
    sourceDuration: roundTimelineNumber(sourceDuration),
    trimStart: roundTimelineNumber(trimStart),
    trimEnd: roundTimelineNumber(trimEnd),
  };
};

const normalizeScenes = (scenes = []) => {
  const usedIds = new Set();
  return (Array.isArray(scenes) ? scenes : []).map((scene, index) =>
    normalizeScene(scene, index, usedIds),
  );
};

const getSceneRanges = (scenes = []) => {
  const normalizedScenes = normalizeScenes(scenes);
  let cursor = 0;

  return normalizedScenes.map((scene) => {
    const duration = getSceneDuration(scene);
    const start = roundTimelineNumber(cursor);
    const end = roundTimelineNumber(start + duration);
    cursor = end;
    return {
      id: scene.id,
      start,
      end,
      duration,
    };
  });
};

const getTimelineDuration = (scenes = []) => {
  const ranges = getSceneRanges(scenes);
  if (ranges.length === 0) return 0;
  return ranges[ranges.length - 1].end;
};

const hasTimelineOverlap = (ranges = [], epsilon = 0.000001) => {
  for (let i = 1; i < ranges.length; i += 1) {
    if (ranges[i].start < ranges[i - 1].end - epsilon) return true;
  }
  return false;
};

const clampPlayheadToTimeline = (playhead, scenes = []) => {
  const timelineDuration = getTimelineDuration(scenes);
  if (timelineDuration <= 0) return 0;
  return roundTimelineNumber(clamp(playhead, 0, timelineDuration));
};

const scrubPlayhead = (playhead, delta, scenes = []) =>
  clampPlayheadToTimeline(asFiniteNumber(playhead, 0) + asFiniteNumber(delta, 0), scenes);

const snapToTimeline = (
  value,
  scenes = [],
  { step = DEFAULT_SNAP_STEP, threshold = DEFAULT_SNAP_THRESHOLD } = {},
) => {
  const timelineDuration = getTimelineDuration(scenes);
  const clamped = clamp(value, 0, timelineDuration);
  const ranges = getSceneRanges(scenes);
  const points = [0];
  ranges.forEach((range) => points.push(range.end));
  const pointSnapped = snapToPoints(clamped, points, threshold);
  const stepSnapped = snapToStep(pointSnapped, step, threshold);
  return clamp(stepSnapped, 0, timelineDuration);
};

const addScene = (scenes = [], scene = {}, index = scenes.length) => {
  const nextScenes = [...normalizeScenes(scenes)];
  const targetIndex = clamp(index, 0, nextScenes.length);
  nextScenes.splice(targetIndex, 0, scene);
  return normalizeScenes(nextScenes);
};

const removeScene = (scenes = [], sceneId) =>
  normalizeScenes(scenes).filter((scene) => scene.id !== sceneId);

const duplicateScene = (scenes = [], sceneId) => {
  const nextScenes = normalizeScenes(scenes);
  const sourceIndex = nextScenes.findIndex((scene) => scene.id === sceneId);
  if (sourceIndex === -1) return nextScenes;

  const sourceScene = nextScenes[sourceIndex];
  const duplicate = {
    ...sourceScene,
    id: `${sourceScene.id}-copy`,
  };
  nextScenes.splice(sourceIndex + 1, 0, duplicate);
  return normalizeScenes(nextScenes);
};

const reorderScenes = (scenes = [], fromIndex, toIndex) => {
  const nextScenes = [...normalizeScenes(scenes)];
  if (nextScenes.length < 2) return nextScenes;

  const startIndex = clamp(fromIndex, 0, nextScenes.length - 1);
  const endIndex = clamp(toIndex, 0, nextScenes.length - 1);
  if (startIndex === endIndex) return nextScenes;

  const [movedScene] = nextScenes.splice(startIndex, 1);
  nextScenes.splice(endIndex, 0, movedScene);
  return normalizeScenes(nextScenes);
};

const trimSceneStart = (scenes = [], sceneId, trimStart) =>
  normalizeScenes(scenes).map((scene) =>
    scene.id === sceneId ? normalizeScene({ ...scene, trimStart }) : scene,
  );

const trimSceneEnd = (scenes = [], sceneId, trimEnd) =>
  normalizeScenes(scenes).map((scene) =>
    scene.id === sceneId ? normalizeScene({ ...scene, trimEnd }) : scene,
  );

const getSceneIdAtPlayhead = (scenes = [], playhead = 0) => {
  const ranges = getSceneRanges(scenes);
  if (ranges.length === 0) return null;

  const clampedPlayhead = clampPlayheadToTimeline(playhead, scenes);
  const range =
    ranges.find(
      (candidate) =>
        clampedPlayhead >= candidate.start && clampedPlayhead < candidate.end,
    ) || ranges[ranges.length - 1];
  return range.id;
};

const reduceTimelineState = (state = {}, action = {}) => {
  const currentScenes = normalizeScenes(state.scenes || []);
  const currentPlayhead = clampPlayheadToTimeline(state.playhead, currentScenes);
  const currentSelectedSceneId = state.selectedSceneId ?? null;

  const finalizeState = (scenes, selectedSceneIdOverride) => {
    const nextScenes = normalizeScenes(scenes);
    const timelineDuration = getTimelineDuration(nextScenes);
    const nextPlayhead = clampPlayheadToTimeline(currentPlayhead, nextScenes);
    const selectedSceneId =
      selectedSceneIdOverride === null
        ? null
        : nextScenes.some((scene) => scene.id === selectedSceneIdOverride)
          ? selectedSceneIdOverride
          : getSceneIdAtPlayhead(nextScenes, nextPlayhead);

    return {
      ...state,
      scenes: nextScenes,
      playhead: nextPlayhead,
      selectedSceneId,
      timelineDuration,
      sceneRanges: getSceneRanges(nextScenes),
    };
  };

  switch (action.type) {
    case "SET_SCENES":
      return finalizeState(action.scenes || [], currentSelectedSceneId);
    case "ADD_SCENE": {
      const nextScenes = addScene(currentScenes, action.scene || {}, action.index);
      const nextSelectedSceneId =
        action.selectScene === false
          ? currentSelectedSceneId
          : nextScenes[clamp(action.index ?? nextScenes.length - 1, 0, nextScenes.length - 1)]
              ?.id || currentSelectedSceneId;
      return finalizeState(nextScenes, nextSelectedSceneId);
    }
    case "REMOVE_SCENE": {
      const nextScenes = removeScene(currentScenes, action.sceneId);
      const nextSelectedSceneId =
        currentSelectedSceneId === action.sceneId
          ? getSceneIdAtPlayhead(nextScenes, currentPlayhead)
          : currentSelectedSceneId;
      return finalizeState(nextScenes, nextSelectedSceneId);
    }
    case "DUPLICATE_SCENE": {
      const nextScenes = duplicateScene(currentScenes, action.sceneId);
      const sourceIndex = nextScenes.findIndex((scene) => scene.id === action.sceneId);
      const duplicatedSceneId = nextScenes[sourceIndex + 1]?.id || currentSelectedSceneId;
      return finalizeState(nextScenes, duplicatedSceneId);
    }
    case "REORDER_SCENES":
      return finalizeState(
        reorderScenes(currentScenes, action.fromIndex, action.toIndex),
        currentSelectedSceneId,
      );
    case "TRIM_SCENE_START":
      return finalizeState(
        trimSceneStart(currentScenes, action.sceneId, action.trimStart),
        currentSelectedSceneId,
      );
    case "TRIM_SCENE_END":
      return finalizeState(
        trimSceneEnd(currentScenes, action.sceneId, action.trimEnd),
        currentSelectedSceneId,
      );
    case "SET_PLAYHEAD":
      return {
        ...finalizeState(currentScenes, currentSelectedSceneId),
        playhead: clampPlayheadToTimeline(action.playhead, currentScenes),
      };
    case "SCRUB_PLAYHEAD":
      return {
        ...finalizeState(currentScenes, currentSelectedSceneId),
        playhead: scrubPlayhead(currentPlayhead, action.delta, currentScenes),
      };
    case "SELECT_SCENE":
      return finalizeState(currentScenes, action.sceneId);
    default:
      return finalizeState(currentScenes, currentSelectedSceneId);
  }
};

module.exports = {
  MIN_SCENE_DURATION,
  DEFAULT_SNAP_STEP,
  DEFAULT_SNAP_THRESHOLD,
  clamp,
  snapToStep,
  snapToPoints,
  snapToTimeline,
  normalizeScene,
  normalizeScenes,
  getSceneDuration,
  getSceneRanges,
  getTimelineDuration,
  hasTimelineOverlap,
  clampPlayheadToTimeline,
  scrubPlayhead,
  addScene,
  removeScene,
  duplicateScene,
  reorderScenes,
  trimSceneStart,
  trimSceneEnd,
  getSceneIdAtPlayhead,
  reduceTimelineState,
};
