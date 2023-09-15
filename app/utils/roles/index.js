const _ = require('lodash');

const splitRole = (role) => {
  const roleArr = role.split('_');
  if (_.isEmpty(roleArr)) {
    return null;
  }
  const resource = roleArr[0];
  const accessType = roleArr[1];
  const scope = roleArr[2];
  return {
    resource,
    accessType,
    scope,
  };
};

const hasProperScope = (s1, s2) => {
  if (s1 === 'ALL') {
    return true;
  }
  return s1 === s2;
};

const hasRole = (role, roleList = []) => {
  if (_.isEmpty(role)) return false;
  const requiredRole = splitRole(role);
  if (_.isEmpty(requiredRole)) return false;
  const splittedRoles = roleList.map(r => splitRole(r));
  if (_.isEmpty(splittedRoles)) return false;
  return splittedRoles.find((s) => {
    if (s.resource === requiredRole.resource) {
      if (s.accessType === requiredRole.accessType) {
        return hasProperScope(s.scope, requiredRole.scope);
      }
    }
    return false;
  }) !== undefined;
};

const hasOneRole = (roles, roleList) => {
  if (_.isEmpty(roles) || _.isEmpty(roleList)) return false;
  const splittedRoles = roleList.map(r => splitRole(r));
  if (_.isEmpty(splittedRoles)) return false;
  return roles.map((role) => {
    const requiredRole = splitRole(role);
    return splittedRoles.find((s) => {
      if (s.resource === requiredRole.resource) {
        if (s.accessType === requiredRole.accessType) {
          return hasProperScope(s.scope, requiredRole.scope);
        }
      }
      return false;
    });
  });
};

const hasOneOfRoleList = (roles, roleList) => {
  if (_.isEmpty(roles) || _.isEmpty(roleList)) return false;
  const found = roles.find(role => roleList.indexOf(role) !== -1);
  return !!found;
};

/* eslint-disable prefer-spread */
const verifyByRole = (userRoles, checkRoles) => {
  const uRoles = Array.isArray(userRoles) ? userRoles : [];
  const cRoles = Array.isArray(checkRoles) ? checkRoles : [];
  if (cRoles.length === 0) {
    return true;
  }
  return _.intersection(cRoles, uRoles).length > 0;
};

const getRoles = (user) => {
  if (user) {
    const userGroups = _.get(user, 'groups', []);
    const userRoles = userGroups.map((g) => {
      if (g.deleted) {
        return [];
      }
      return g.roles;
    });
    return _.flatten(userRoles).concat(user.roles || []);
  }
  return [];
};

const checkEndpointSecurity = (roleConditions, user) => roleConditions.every((c) => {
  const userRoles = getRoles(user);
  const type = typeof c;
  if (type === 'string') {
    return hasRole(c, userRoles);
  } else if (type === 'function') {
    return c(user);
  } else if (c.oneOf) {
    return c.oneOf.some(r => hasRole(r, userRoles));
  }
  return false;
});
const lspUrlRegexp = /\/lsp\/([a-zA-Z0-9-]+)\//;
const extractUserRoles = (req) => {
  const user = req.session.user;
  let lspId = _.get(req, 'swagger.params.lspId.value');
  if (!lspId) {
    const m = lspUrlRegexp.exec(req.path);
    if (m !== null) {
      lspId = m[1];
    }
  }
  return getRoles(user);
};

module.exports = {
  checkEndpointSecurity,
  splitRole,
  hasProperScope,
  extractUserRoles,
  hasRole,
  hasOneRole,
  hasOneOfRoleList,
  getRoles,
  verifyByRole,
};
