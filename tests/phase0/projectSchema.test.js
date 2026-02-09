const test = require("node:test");
const assert = require("node:assert/strict");

const {
  PROJECT_SCHEMA_VERSION,
  SYNC_STATUS,
  createDefaultProject,
  migrateProject,
} = require("../../src/core/project/projectSchema");

test("createDefaultProject returns Project v1 with local sync state", () => {
  const project = createDefaultProject({
    id: "project-1",
    title: "My Project",
    instantMode: true,
    now: 1700000000000,
  });

  assert.equal(project.id, "project-1");
  assert.equal(project.schemaVersion, PROJECT_SCHEMA_VERSION);
  assert.equal(project.syncStatus, SYNC_STATUS.LOCAL_ONLY);
  assert.equal(project.title, "My Project");
  assert.equal(project.settings.instantMode, true);
  assert.deepEqual(project.data.sceneOrder, []);
});

test("migrateProject upgrades legacy payloads to v1", () => {
  const migrated = migrateProject({
    id: "legacy-1",
    title: "Legacy Project",
    data: {
      scenes: { "scene-1": { id: "scene-1" } },
      sceneOrder: ["scene-1"],
      instantMode: true,
    },
  });

  assert.equal(migrated.schemaVersion, PROJECT_SCHEMA_VERSION);
  assert.equal(migrated.syncStatus, SYNC_STATUS.LOCAL_ONLY);
  assert.equal(migrated.settings.instantMode, true);
  assert.deepEqual(migrated.data.sceneOrder, ["scene-1"]);
  assert.deepEqual(migrated.data.scenes, { "scene-1": { id: "scene-1" } });
});
