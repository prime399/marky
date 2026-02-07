const test = require("node:test");
const assert = require("node:assert/strict");

const {
  MIN_SCENE_DURATION,
  snapToStep,
  snapToTimeline,
  getSceneDuration,
  getSceneRanges,
  hasTimelineOverlap,
  clampPlayheadToTimeline,
  normalizeScenes,
} = require("../../src/core/editor/timelineModel");

test("scene normalization clamps trims and preserves minimum duration", () => {
  const [scene] = normalizeScenes([
    {
      id: "scene-a",
      sourceDuration: 5,
      trimStart: 4.95,
      trimEnd: 1,
    },
  ]);

  assert.equal(getSceneDuration(scene), MIN_SCENE_DURATION);
  assert.equal(scene.trimStart <= 4.9, true);
  assert.equal(scene.trimEnd, 0);
});

test("timeline ranges are contiguous and overlap guard stays false", () => {
  const scenes = normalizeScenes([
    { id: "scene-a", sourceDuration: 4, trimStart: 0.5, trimEnd: 0.5 },
    { id: "scene-b", sourceDuration: 3, trimStart: 0, trimEnd: 0.5 },
  ]);
  const ranges = getSceneRanges(scenes);

  assert.deepEqual(ranges, [
    { id: "scene-a", start: 0, end: 3, duration: 3 },
    { id: "scene-b", start: 3, end: 5.5, duration: 2.5 },
  ]);
  assert.equal(hasTimelineOverlap(ranges), false);
});

test("playhead and snap helpers clamp to valid timeline bounds", () => {
  const scenes = normalizeScenes([
    { id: "scene-a", sourceDuration: 4 },
    { id: "scene-b", sourceDuration: 2 },
  ]);

  assert.equal(clampPlayheadToTimeline(-10, scenes), 0);
  assert.equal(clampPlayheadToTimeline(99, scenes), 6);
  assert.equal(snapToStep(1.01, 0.25, 0.03), 1);
  assert.equal(snapToTimeline(3.97, scenes, { threshold: 0.05 }), 4);
  assert.equal(snapToTimeline(8.4, scenes), 6);
});
