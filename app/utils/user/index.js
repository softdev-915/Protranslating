const _ = require('lodash');

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

module.exports = {
  toUserFullName,
};
