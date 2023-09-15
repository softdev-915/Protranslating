// add modifications at root level
module.exports = function modification(schema) {
  schema.methods.getModifications = function () {
    const self = this;

    return self.modifiedPaths({ includeChildren: true });
  };
};
