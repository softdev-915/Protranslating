/**
 * Determines if a notification should be built or not based on the inactiveNotifications
 * array of the user
 * @param {object}  user
 * @param {array}  user.inactiveNotifications
 */
const shouldBuildNotification = (inactiveNotifications, templateName) => {
  const allDisabled = inactiveNotifications.find(name => name === 'all');
  if (allDisabled) {
    return false;
  }
  if (inactiveNotifications.length === 0) {
    return true;
  }
  const notificationFound = inactiveNotifications.find(name => name === templateName);
  return notificationFound === undefined;
};

module.exports = {
  shouldBuildNotification,
};
