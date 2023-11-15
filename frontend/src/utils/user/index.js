import _ from 'lodash';
import { getObjectDifferences } from '../object';

const toUserName = (u) => {
  let name = '';
  if (u.firstName) {
    name = u.firstName;
  }
  if (u.lastName) {
    name = name ? `${name} ${u.lastName}` : u.lastName;
  }
  return name;
};

const toUserFullName = (u) => {
  let name = '';
  if (!_.isEmpty(u.firstName)) {
    name += u.firstName;
  }
  if (!_.isEmpty(u.middleName)) {
    name += ` ${u.middleName}`;
  }
  if (!_.isEmpty(u.lastName)) {
    name += ` ${u.lastName}`;
  }
  return name;
};

const userRoles = (account) => {
  if (account) {
    let allRoles = [];
    if (account.roles) {
      allRoles = account.roles;
    }
    if (account.groups) {
      const groupsLen = account.groups.length;
      for (let i = 0; i < groupsLen; i++) {
        if (!account.groups.deleted) {
          allRoles = allRoles.concat(account.groups[i].roles);
        }
      }
    }
    return allRoles;
  }
  return [];
};

const getUserModifications = (userToSave, userFromDb) => {
  if (_.isNil(userFromDb)) {
    return [];
  }
  let path;
  userToSave = _.cloneDeep(userToSave);
  const EXCLUDED_FIELDS = ['readDate', 'updatedAt', 'updatedBy', 'siConnector', 'securityPolicy'];
  const modifications = Object.keys(userFromDb).reduce((modifiedFields, key) => {
    if (key === 'abilities') {
      const selectedAbilities = userToSave[key].map(ability => ability.value);
      if (!_.isEqual(selectedAbilities, userFromDb[key])) {
        modifiedFields.push(key);
      }
    } else if (key === 'vendorDetails') {
      const vendorDetailDifferences = getObjectDifferences(userToSave[key],
        userFromDb[key]);
      if (!_.isEmpty(vendorDetailDifferences)) {
        _.forEach(vendorDetailDifferences, (diff) => {
          path = `${key}.${diff}`;
          if (diff === 'internalDepartments') {
            const selectedInternalDepartments = _.get(userToSave, path, []).map(dept => dept._id);
            if (!_.isEqual(selectedInternalDepartments, _.get(userFromDb, path))) {
              modifiedFields.push(path);
            }
          } else if (diff === 'competenceLevels') {
            const competenceLevelsFromDb = _.get(userFromDb, path, []).map(cl => cl._id);
            if (!_.isEqual(competenceLevelsFromDb, _.get(userToSave, path))) {
              modifiedFields.push(path);
            }
          } else if (!_.isEqual(_.get(userFromDb, path), _.get(userToSave, path))) {
            modifiedFields.push(path);
            if (_.isObject(_.get(userToSave, path)) && _.isObject(_.get(userFromDb, path))) {
              const objectToSave = _.get(userToSave, path);
              const objectFromDb = _.get(userFromDb, path);
              const nestedDifferences = getObjectDifferences(objectToSave, objectFromDb);
              _.forEach(nestedDifferences, (nestedDiff) => {
                modifiedFields.push(`${path}.${nestedDiff}`);
              });
            }
          }
        });
      }
    } else if (!_.isEqual(userToSave[key], userFromDb[key])) {
      modifiedFields.push(key);
    }
    return modifiedFields;
  }, []);
  return _.pull(modifications, ...EXCLUDED_FIELDS);
};

const hasRole = (account, role) => {
  const allUserRoles = userRoles(account);
  if (role) {
    if (typeof role === 'string') {
      return allUserRoles.indexOf(role) >= 0;
    } if (Array.isArray(role)) {
      return role.map((r) => allUserRoles.indexOf(r) >= 0).reduce((prev, curr) => prev && curr);
    } if (role.oneOf) {
      return role.oneOf.map((r) => allUserRoles.indexOf(r) >= 0).reduce((prev, curr) => prev || curr);
    }
  }
  return false;
};
const profileImage = (lspId, userId, image) => `/api/lsp/${lspId}/user/${userId}/image/${image}`;
const splitName = (vendorName) => {
  let [firstName, middleName, lastName] = ['', '', ''];
  const splittedName = vendorName.split(' ');

  if (splittedName.length < 2) {
    [firstName] = splittedName;
  } else if (splittedName.length === 2) {
    [firstName, lastName] = splittedName;
  } else {
    [firstName, middleName, lastName] = splittedName;
  }
  return { firstName, middleName, lastName };
};

export {
  toUserName,
  toUserFullName,
  userRoles,
  hasRole,
  profileImage,
  splitName,
  getUserModifications,
};
