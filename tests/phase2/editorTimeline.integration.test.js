const test = require("node:test");
const assert = require("node:assert/strict");

const { reduceTimelineState } = require("../../src/core/editor/timelineModel");

const makeInitialState = () => ({
  scenes: [],
  playhead: 0,
  selectedSceneId: null,
  timelineDuration: 0,
  sceneRanges: [],
});

test("timeline reducer supports scene CRUD and reorder from one action layer", () => {
  let state = makeInitialState();

  state = reduceTimelineState(state, {
    type: "ADD_SCENE",
    scene: { id: "scene-a", sourceDuration: 4 },
  });
  state = reduceTimelineState(state, {
    type: "ADD_SCENE",
    scene: { id: "scene-b", sourceDuration: 3 },
  });
  state = reduceTimelineState(state, { type: "DUPLICATE_SCENE", sceneId: "scene-a" });
  state = reduceTimelineState(state, { type: "REORDER_SCENES", fromIndex: 2, toIndex: 0 });
  state = reduceTimelineState(state, { type: "REMOVE_SCENE", sceneId: "scene-b" });

  assert.deepEqual(
    state.scenes.map((scene) => scene.id),
    ["scene-a", "scene-a-copy"],
  );
  assert.equal(state.timelineDuration, 8);
  assert.equal(state.sceneRanges.length, 2);
});

test("trim and playhead actions keep playback synchronized to current timeline", () => {
  let state = reduceTimelineState(makeInitialState(), {
    type: "SET_SCENES",
    scenes: [
      { id: "scene-a", sourceDuration: 5 },
      { id: "scene-b", sourceDuration: 5 },
    ],
  });

  state = reduceTimelineState(state, { type: "SET_PLAYHEAD", playhead: 9.5 });
  assert.equal(state.playhead, 9.5);
  assert.equal(state.timelineDuration, 10);

  state = reduceTimelineState(state, {
    type: "TRIM_SCENE_END",
    sceneId: "scene-b",
    trimEnd: 4.7,
  });
  assert.equal(state.timelineDuration, 5.3);
  assert.equal(state.playhead, 5.3);

  state = reduceTimelineState(state, { type: "SCRUB_PLAYHEAD", delta: -10 });
  assert.equal(state.playhead, 0);
});
