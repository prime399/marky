const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createLocalProjectRepository,
  createMemoryStorageAdapter,
  PROJECTS_KEY,
} = require("../../src/core/services/localProjectRepository");
const { SYNC_STATUS } = require("../../src/core/project/projectSchema");

test("local project repository saves, lists, and loads projects", async () => {
  const storage = createMemoryStorageAdapter();
  const repository = createLocalProjectRepository({ storage });

  const savedA = await repository.saveProject({
    id: "p-1",
    title: "Project A",
    data: { scenes: {}, sceneOrder: [] },
  });
  const savedB = await repository.saveProject({
    id: "p-2",
    title: "Project B",
    data: { scenes: {}, sceneOrder: [] },
  });

  assert.equal(savedA.syncStatus, SYNC_STATUS.LOCAL_ONLY);
  assert.equal(savedB.syncStatus, SYNC_STATUS.LOCAL_ONLY);

  const loaded = await repository.loadProject("p-1");
  assert.equal(loaded.id, "p-1");
  assert.equal(loaded.title, "Project A");

  const listed = await repository.listProjects();
  assert.equal(listed.length, 2);
  assert.deepEqual(
    listed.map((project) => project.id).sort(),
    ["p-1", "p-2"],
  );

  const storedRecord = await storage.get(PROJECTS_KEY);
  assert.equal(typeof storedRecord, "object");
  assert.equal(Boolean(storedRecord["p-1"]), true);
});
