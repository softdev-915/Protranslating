const _ = require('lodash');
const ArAdvanceApi = require('../../endpoints/lsp/ar-advance/ar-advance-api');
const { RestError } = require('../api-response');

const IMPLEMENTED_APIS = {
  'ar-advance': {
    ApiClass: ArAdvanceApi,
    requiredRoles: ['AR-PAYMENT_UPDATE_ALL', 'AR-PAYMENT_UPDATE_OWN'],
  },
};

exports.assignEntityApiAndRoles = (req, res, next) => {
  const entityName = _.get(req, 'params.entityName');
  const { ApiClass, requiredRoles } = IMPLEMENTED_APIS[entityName];
  if (_.isNil(ApiClass) || _.isNil(requiredRoles)) {
    throw new RestError(400, { message: `File uploads are not supported by ${entityName}` });
  }
  req.params.ApiClass = ApiClass;
  req.params.requiredRoles = requiredRoles;
  next();
};
