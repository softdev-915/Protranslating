/* eslint-disable no-empty */
const { Address4, Address6 } = require('ip-address');

const parseIP = (ip) => {
  try {
    const address4 = new Address4(ip);
    return address4;
  } catch (e) {}

  try {
    const address6 = new Address6(ip);
    return address6;
  } catch (e) {}
  return false;
};

const ipComplies = (ip, cidrRules) => {
  const ipToCheck = parseIP(ip);
  if (!ipToCheck) return false;

  for (let i = 0; i < cidrRules.length; i++) {
    const subnet = parseIP(cidrRules[i]);
    if (ipToCheck.isInSubnet(subnet)) {
      return true;
    }
  }
  return false;
};

const validateCIDR = (cidr) => {
  const ip = parseIP(cidr);
  return Boolean(ip);
};

module.exports = {
  parseIP,
  ipComplies,
  validateCIDR,
  parseIP,
};
