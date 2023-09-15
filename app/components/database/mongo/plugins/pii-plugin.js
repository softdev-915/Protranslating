const _ = require('lodash');
const { maskPattern, maskValue } = require('../../../../utils/pii');

module.exports = exports = (schema) => {
  schema.methods.restoreMaskedValues = function (updatedEntity, entityInDb,
    pathsToMask = schema.statics.PATHS_TO_MASK) {
    _.forEach(pathsToMask, (path) => {
      if (maskPattern.test(_.get(updatedEntity, path))) {
        _.set(updatedEntity, path, _.get(entityInDb, path));
      }
    });
  };

  schema.methods.maskPIIValues = function (entity, pathsToMask = schema.statics.PATHS_TO_MASK) {
    _.forEach(pathsToMask, (path) => {
      if (_.hasIn(entity, path) && !_.isNil(_.get(entity, path))) {
        _.set(entity, path, maskValue(_.get(entity, path)));
      }
    });
  };
};
