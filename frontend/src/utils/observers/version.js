
class VersionObserver {
  constructor() {
    this.version = null;
    this.observers = [];
    this._store = null;
  }

  addObserver(versionObserver) {
    this.observers.push(versionObserver);
    versionObserver.onVersionChange(this.version);
  }

  onVersionChange(version) {
    // change version only if the new version is defined.
    // Prevents from poping the notification in case there is a connection
    // drop.
    if (version) {
      if (this.version && this.version !== version) {
        this.observers.forEach((o) => { o.onVersionChange(version, true); });
      } else {
        this.observers.forEach((o) => { o.onVersionChange(version, false); });
      }
      if (this._store) {
        this._store._actions['app/setVersion'][0](version);
      }
      // Sets a global frotend version
      window.LSP_FRONTEND_VERSION = version;
      this.version = version;
    }
  }

  set store(store) {
    this._store = store;
    this.version = store.getters['app/version'];
  }
}

const versionObserver = new VersionObserver();

export default versionObserver;
