const generateUserToast = (toast, u) => ({
  lspId: toast.lspId,
  user: u,
  state: toast.state,
  toast: toast._id,
  title: toast.title,
  message: toast.message,
  ttl: toast.ttl || null,
  context: toast.context,
  lastReadTime: null,
  dismissedTime: null,
  requireDismiss: toast.requireDismiss,
  from: toast.from || null,
  to: toast.to || null,
});
const generateAllUsersToast = (toast, users) => users.map(u => generateUserToast(toast, u));

module.exports = {
  generateUserToast,
  generateAllUsersToast,
};
