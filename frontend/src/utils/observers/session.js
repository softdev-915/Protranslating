class SessionObserver {
  constructor() {
    this.user = null;
    this.observers = [];
  }

  addObserver(userObserver) {
    this.observers.push(userObserver);
    if (this.user) {
      userObserver.onLogin(this.user);
    } else {
      userObserver.onLogout();
    }
  }

  onLogin(user) {
    this.user = user;
    this.observers.forEach((o) => { o.onLogin(user); });
  }

  onLogout() {
    const { user } = this;
    this.user = null;
    this.observers.forEach((o) => { o.onLogout(user); });
  }
}

const sessionObserver = new SessionObserver();

export default sessionObserver;
