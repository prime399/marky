const test = require("node:test");
const assert = require("node:assert/strict");

const { applyStateUpdate } = require("../../src/core/state/immerUpdate");

test("applyStateUpdate supports immutable updater returns", () => {
  const prev = { a: 1, nested: { b: 2 } };
  const next = applyStateUpdate(prev, (state) => ({
    ...state,
    a: 10,
  }));

  assert.equal(next.a, 10);
  assert.equal(next.nested.b, 2);
  assert.equal(prev.a, 1);
});

test("applyStateUpdate supports draft mutations via Immer", () => {
  const prev = { a: 1, nested: { b: 2 } };
  const next = applyStateUpdate(prev, (draft) => {
    draft.nested.b = 7;
  });

  assert.equal(next.nested.b, 7);
  assert.equal(prev.nested.b, 2);
});

test("applyStateUpdate accepts direct object replacement", () => {
  const next = applyStateUpdate({ a: 1 }, { a: 42 });
  assert.deepEqual(next, { a: 42 });
});
