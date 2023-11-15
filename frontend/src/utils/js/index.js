import Promise from 'bluebird';

const _insertScriptTag = function (path, callback) {
  const scriptTag = document.createElement('script');
  scriptTag.src = path;
  scriptTag.onload = callback;
  document.body.appendChild(scriptTag);
};

export function loadScript(path, loadedCheck) {
  const isLoaded = loadedCheck();
  if (!isLoaded) {
    return new Promise((resolve) => {
      _insertScriptTag(path, resolve);
    });
  }
  return Promise.resolve();
}
