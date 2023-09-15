/* eslint-disable semi */
const _ = require('lodash');
const assert = require('assert');
const Promise = require('bluebird');

const LSP_ADMIN = 'LSP_ADMIN';
const _rolesToAdd = (roles, group) =>
  roles.filter(r => group.roles && group.roles.indexOf(r) === -1);

const _stringToArray = (param) => {
  if (!Array.isArray(param) && typeof param !== 'string') {
    throw new Error(`Invalid param ${param}`);
  }
  return Array.isArray(param) ? param : [param];
};

const updateUsersGroup = (group, roles, collections) => {
  assert.ok(collections.users);
  const groupName = _.get(group, 'name', group);
  const lspId = _.get(group, 'lspId');
  const groupMatchQuery = { name: groupName };
  if (!_.isNil(lspId)) {
    _.assign(groupMatchQuery, { lspId });
  }
  return new Promise((resolve, reject) => {
    const query = {
      groups: {
        $elemMatch: groupMatchQuery,
      },
    };
    const stream = collections.users.find(query).stream();
    stream.on('error', (err) => {
      reject(err);
    });
    stream.on('end', () => {
      resolve();
    });
    stream.on('data', (user) => {
      stream.pause();
      // updates the user's group and resumes the stream
      let changed = false;
      const groupFound = user.groups.find(g => g.name === groupName &&
        (_.isNil(lspId) || g.lspId.toString() === lspId.toString()));
      if (groupFound) {
        const allGroupsRoles = groupFound.roles.splice(0);
        groupFound.roles = _.uniq(allGroupsRoles.concat(roles));
        if (groupFound.roles.length !== allGroupsRoles.length) {
          changed = true;
        }
      }
      if (changed) {
        collections.users.updateOne({ _id: user._id }, { $set: user })
          .then(() => {
            stream.resume();
          });
      } else {
        stream.resume();
      }
    });
  });
};

const addGroupRoles = (group, roles, collections) => {
  assert.ok(collections.groups);
  roles = _stringToArray(roles);
  let allRoles;
  let changed = false;
  const groupName = _.get(group, 'name', group);
  const query = { name: groupName };
  const lspId = _.get(group, 'lspId');
  let groupLspId;
  if (lspId) {
    query.lspId = lspId;
  }
  return collections.groups.findOne(query)
    .then((dbGroup) => {
      if (dbGroup === null) {
        return collections.groups.insertOne(query);
      }
      return dbGroup;
    })
    .then((existingGroup) => {
      if (lspId) {
        groupLspId = existingGroup.lspId;
      }
      if (!existingGroup.roles) {
        existingGroup.roles = [];
      }
      const rolesToAdd = _rolesToAdd(roles, existingGroup);
      allRoles = existingGroup.roles.concat(rolesToAdd);
      if (rolesToAdd.length) {
        changed = true;
        return collections.groups.updateOne(
          query, {
            $set: {
              roles: allRoles,
            },
          }, {
            upsert: true,
          });
      }
    }).then(() => {
      if (lspId) {
        return { name: groupName, roles: allRoles, changed, lspId: groupLspId };
      }
      return { name: groupName, roles: allRoles, changed };
    });
};

const addNewRole = async (roles, groups, collections, addToLspAdmin = true) => {
  assert.ok(collections.roles);
  assert.ok(collections.groups);
  assert.ok(collections.users);
  roles = _stringToArray(roles);
  groups = _stringToArray(groups);
  if (addToLspAdmin) {
    // every role MUST be in LSP_ADMIN
    const lspAdmin = groups.find(g => g === LSP_ADMIN || g.name === LSP_ADMIN);
    if (!lspAdmin) {
      groups.push(LSP_ADMIN);
    }
  }
  const groupsInDb = await collections.groups.find({
    name: { $in: groups.map(group => _.get(group, 'name', group)) },
  }).toArray();
  return collections.roles.find({ name: { $in: roles } }).toArray()
    .then((dbRoles) => {
      const missingRoles = roles.filter(r => dbRoles.findIndex(dbr => dbr.name === r) === -1);
      if (missingRoles.length) {
        return Promise.all(missingRoles.map(r =>
          collections.roles.updateOne(
            { name: r },
            { $set: { name: r } },
            { upsert: true }),
        ))
      }
    })
    .then(() => Promise.all(groupsInDb.map(g => addGroupRoles(g, roles, collections))))
    .then(changed => Promise.all(changed.map(g => updateUsersGroup(g, g.roles, collections))));
};

/**
 * adding roles to db without adding them to LSP_ADMIN
 * @param {Array} roles --roles data to add
 * @param {Object} rolesCollection  --roles model
 * @returns {Promise}
 */
const addNewRolesWithoutGroups = (roles, rolesCollection) => {
  const rolesToAdd = _stringToArray(roles);
  if (!rolesToAdd.length) {
    return Promise.reject(new Error("roles can't  be empty"))
  }
  return rolesCollection.find({ name: { $in: rolesToAdd } }).toArray()
    .then((dbRoles) => {
      const missingRoles = rolesToAdd.filter(r => dbRoles.findIndex(dbr => dbr.name === r) === -1);
      if (missingRoles.length) {
        return Promise.all(missingRoles.map(r => rolesCollection.insert({ name: r })));
      }
    })
};

const renameExistingRoles = (rolesList, collections, queryFilter) => {
  // rolesList can be an array of objects
  // { originalName: replacement }
  // { 'CUSTOMER_READ_ALL': 'COMPANY_READ_ALL' }
  assert.ok(collections.roles);
  assert.ok(collections.groups);
  assert.ok(collections.users);
  const originalRolesList = Object.keys(rolesList);
  let usersQuery = {};
  if (queryFilter) {
    usersQuery = queryFilter;
  }
  // Update roles
  // Update groups
  return collections.roles.find({ name: { $in: originalRolesList } }).toArray()
    .then((dbRoles) => {
      const promises = [];
      dbRoles.forEach((r) => {
      // eslint-disable-next-line arrow-body-style
        promises.push(() => {
          return collections.roles.update({ name: r.name },
            { $set: { name: rolesList[r.name] } },
            { upsert: true });
        });
      });
      // Rename all roles
      return Promise.resolve(promises).mapSeries(f => f());
    })
    .then(() => collections.groups.find({ roles: { $in: originalRolesList } }).toArray())
    .then((dbGroups) => {
      const promises = [];
      dbGroups.forEach((g) => {
      // eslint-disable-next-line no-confusing-arrow
        const newRoles = g.roles.map(groupRole => (_.isUndefined(rolesList[groupRole])
          ? groupRole
          : rolesList[groupRole]));
        // eslint-disable-next-line arrow-body-style
        promises.push(() => {
          return collections.groups.update({ _id: g._id }, { $set: { roles: newRoles } });
        });
      });
      // Swap all roles
      return Promise.resolve(promises).mapSeries(f => f());
    })
  // Grab all users
    .then(() => collections.users.find(usersQuery).toArray())
    .then((dbUsers) => {
      const promises = [];
      dbUsers.forEach((user) => {
        if (user.accounts) {
          user.accounts.forEach((account, index) => {
            const accountRoles = _.get(account, 'roles', []);
            // Override account roles
            // eslint-disable-next-line no-confusing-arrow
            user.accounts[index].roles = accountRoles.map(groupRole =>
              _.isUndefined(rolesList[groupRole]) ? groupRole : rolesList[groupRole]);
          });
        }
        promises.push(() => collections.users.update({ _id: user._id }, { $set: user }));
      });
      // Update users account roles
      return Promise.resolve(promises).mapSeries(f => f());
    });
};

const renameExistingGroups = (regexFilter, replacement, collections, queryFilter) => {
  // rolesList can be an array of objects
  // { originalName: replacement }
  // { 'CUSTOMER_READ_ALL': 'COMPANY_READ_ALL' }
  assert.ok(collections.groups);
  assert.ok(collections.users);
  let usersQuery = {};
  if (queryFilter) {
    usersQuery = queryFilter;
  }
  // Update roles
  // Update groups
  return collections.groups.find({ name: regexFilter }).toArray()
    .then((dbGroups) => {
      const promises = [];
      dbGroups.forEach((g) => {
        if (g.name && g.name.match(regexFilter)) {
          const newGroupName = g.name.replace(regexFilter, replacement);
          // eslint-disable-next-line arrow-body-style
          promises.push(() => {
            return collections.groups.update({ _id: g._id }, { $set: { name: newGroupName } });
          });
        }
      });
      // Swap all roles
      return Promise.resolve(promises).mapSeries(f => f());
    })
    .then(() => collections.users.find(usersQuery).toArray())
    .then((dbUsers) => {
      const promises = [];
      dbUsers.forEach((user) => {
        if (user.accounts) {
          user.accounts.forEach((account, index) => {
            if (Array.isArray(account.groups)) {
              account.groups.forEach((group, indexGroup) => {
              // Override group name
                if (typeof group.name === 'string') {
                  user.accounts[index].groups[indexGroup].name = group.name.replace(regexFilter,
                    replacement);
                }
                // Override group roles
                if (typeof group.roles === 'object' && group.roles.length > 0) {
                  const newRoles = group.roles.map(rolName => rolName.replace(regexFilter,
                    replacement));
                  user.accounts[index].groups[indexGroup].roles = newRoles;
                }
              });
            }
          });
        } else {
          user.groups.forEach((group, indexGroup) => {
            // Override group name
            if (typeof group.name === 'string') {
              user.groups[indexGroup].name = group.name.replace(regexFilter,
                replacement);
            }
            // Override group roles
            if (typeof group.roles === 'object' && group.roles.length > 0) {
              const newRoles = group.roles.map(rolName => rolName.replace(regexFilter,
                replacement));
              user.groups[indexGroup].roles = newRoles;
            }
          });
        }
        // update the user
        promises.push(() => collections.users.update({ _id: user._id }, { $set: user }));
      });
      // Update users account roles
      return Promise.resolve(promises).mapSeries(f => f());
    });
};

const insertIfMissing = (collection, query, entity, lsp) => {
  entity.lspId = lsp._id;
  query.lspId = lsp._id;
  return collection.findOne(query).then((record) => {
    if (!record) {
      return collection.insertOne(_.omit(entity, ['_id']));
    }
  });
};

const copyCollectionRecordsToLsp = (lspCol, lspFromName, lspToName, collection) => {
  let currentRecords;
  return lspCol.findOne({ name: lspFromName })
    .then(lsp => collection.find({ lspId: lsp._id }).toArray())
    .then((records) => {
      currentRecords = records;
      return lspCol.findOne({ name: lspToName });
    })
    .then((lspTo) => {
      if (currentRecords.length > 0) {
        return Promise.mapSeries(currentRecords, record => insertIfMissing(collection, {
          name: record.name,
        }, record, lspTo));
      }
      return Promise.resolve();
    });
};

/**
 * Removes roles from roles, users, and groups collections
 * @param {String|Array} roles Roles to remove
 * @param {Object} collections.users Users collection
 * @param {Object} collections.roles Roles collection
 * @param {Object} collections.groups Groups collection
 */
const removeRoles = (roles, collections) => {
  assert.ok(collections.roles);
  assert.ok(collections.groups);
  assert.ok(collections.users);

  const rolesToRemove = _stringToArray(roles);
  return Promise.all(
    [
      collections.roles.deleteMany({ name: { $in: rolesToRemove } }),
      collections.users.updateMany({
        'groups.roles': { $elemMatch: { $in: rolesToRemove } },
      }, {
        $pullAll: { 'groups.$.roles': roles },
      }),
      collections.groups.updateMany({}, { $pullAll: { roles: roles } }),
    ],
  );
}
/** Note dont use this function, use removeGroupRolesAndUserGroupRoles function instead  */
/**
 * Removes roles from groups collection
 * @param {String|Array} roles Roles to remove
 * @param {Object} groupCollection Groups collection
 * @param {String|Array} groups Groups from remove
 */
const removeGroupRoles = (roles, groupCollection, groups) => {
  assert.ok(groupCollection);

  const rolesToRemove = _stringToArray(roles);
  const groupsFromRemove = _stringToArray(groups);
  if (groupsFromRemove.length !== 1) {
    return groupCollection.updateMany(
      { name: { $in: groupsFromRemove } },
      { $pullAll: { roles: roles } });
  }
  return groupCollection.updateOne(
    { name: groupsFromRemove[0] },
    { $pullAll: { roles: rolesToRemove } });
};

/**
 * Removes roles from groups collection
 * @param {String|Array} roles Roles to remove
 * @param {Object} collections.groups Groups collection
 * @param {Object} collections.users Users collection
 * @param {String|Array} groups Groups from remove
 */
const removeGroupRolesAndUserGroupRoles = (roles, collections, groups) => {
  assert.ok(collections.groups);
  assert.ok(collections.users);

  const rolesToRemove = _stringToArray(roles);
  const groupsFromRemove = _stringToArray(groups);
  const promises = [];
  if (groupsFromRemove.length !== 1) {
    promises.push(collections.groups.updateMany(
      { name: { $in: groupsFromRemove } },
      { $pullAll: { roles: roles } }));
  } else {
    promises.push(collections.groups.updateOne(
      { name: groupsFromRemove[0] },
      { $pullAll: { roles: rolesToRemove } }));
  }
  promises.push(collections.users.updateMany({
    'groups.roles': { $elemMatch: { $in: rolesToRemove } },
  }, {
    $pullAll: { 'groups.$.roles': rolesToRemove },
  }));
  return Promise.all(promises);
};

const addNewGroup = async (collections, group, roles = []) => {
  const existingGroup = await collections.groups.findOne(group);
  if (_.isNil(existingGroup)) {
    await collections.groups.insertOne(group)
  }
  if (!_.isEmpty(roles)) {
    await addNewRole(roles, [group.name], collections);
  }
};

const removeIndex = async (collection, indexToRemove) => {
  const indexes = await collection.indexes();
  const hasIndex = indexes.find(index => index.name === indexToRemove);
  if (hasIndex) {
    await collection.dropIndex(indexToRemove);
  }
}

module.exports = {
  addNewRole,
  addNewGroup,
  addNewRolesWithoutGroups,
  removeRoles,
  addGroupRoles,
  removeGroupRoles,
  removeGroupRolesAndUserGroupRoles,
  updateUsersGroup,
  renameExistingRoles,
  renameExistingGroups,
  copyCollectionRecordsToLsp,
  insertIfMissing,
  removeIndex,
};
