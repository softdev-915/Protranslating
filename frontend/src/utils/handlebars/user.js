export const username = (user) => {
  if (user === undefined) {
    return '';
  }
  const nameParts = [];
  if (user.firstName) {
    nameParts.push(user.firstName);
  }
  if (user.middleName) {
    nameParts.push(user.middleName);
  }
  if (user.lastName) {
    nameParts.push(user.lastName);
  }
  return nameParts.join(' ');
};
