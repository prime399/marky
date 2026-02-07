const { produce } = require("immer");

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
