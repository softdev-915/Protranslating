class TaskObserver {
  constructor() {
    this.observers = [];
  }

  addObserver(userObserver) {
    this.observers.push(userObserver);
  }

  onTaskEvent(taskEvent) {
    this.observers.forEach((o) => { o.onTaskEvent(taskEvent); });
  }
}

const taskObserver = new TaskObserver();

export default taskObserver;
