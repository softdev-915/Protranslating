/**
 * for RegExp escape
 *
 * @param str
 */
export function escapedRegExp(str) {
  return new RegExp(str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}

export function matchStartRegExp(str) {
  return new RegExp(`^${str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
}
