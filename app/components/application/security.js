const _ = require('lodash');
const { RestError } = require('../api-response');
const rolesUtils = require('../../utils/roles');

module.exports = {
  /**
   * This middleware checks if the user is authenticated and authorized.
   */
  api_key(req, def, key, callback) {
    const routeSecurity = req.swagger.operation['x-swagger-security'];

    if (!routeSecurity) {
      // if no route security, let the request pass
      callback();
    } else if (req.session.user) {
      // if secured endpoint and session exist, let the request pass
      const { user } = req.session;
      const userLspId = _.get(req, 'session.user.lsp._id', '').toString();
      const lspId = _.get(req, 'swagger.params.lspId.value');

      if (lspId && lspId && userLspId !== lspId) {
        callback(new RestError(403, {
          message: 'The user does not belong to the given lsp',
        }));
      }
      const { roles = [] } = routeSecurity;
      const userHasSomeRoleValid = rolesUtils.checkEndpointSecurity(roles, user);

      if (roles.length > 0 && !userHasSomeRoleValid) {
        req.$logger.silly(`User ${user.email} does not have required roles`);
        // user has not the proper role
        callback(new RestError(403, {
          message: 'User is not authorized',
        }));
      } else {
        callback();
      }
    } else {
      // for now request will fail
      callback(new RestError(401, {
        message: 'User is not authenticated',
      }));
    }
  },
};
