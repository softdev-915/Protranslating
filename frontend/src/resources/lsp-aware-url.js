export default function (url) {
  const userLogged = window.store.getters['app/userLogged'];
  return `/api/lsp/${userLogged.lsp._id}/${url}`;
}
