const { produce, setAutoFreeze } = require("immer");

// Legacy state logic mutates nested objects/functions outside state updaters.
// Keep Immer draft ergonomics but disable freezing to avoid runtime breakage.
setAutoFreeze(false);

const applyStateUpdate = (prevState, updater) => {
  if (typeof updater !== "function") {
    return updater;
  }

  return produce(prevState, (draft) => {
    const result = updater(draft);
    if (result !== undefined) {
      return result;
    }
  });
};

module.exports = {
  applyStateUpdate,
};
