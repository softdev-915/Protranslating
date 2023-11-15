/**
 * Service wrapper that ensures the service makes only one request at a time.
 * If a request has been made, multiple calls to retrieve will receive the pending promise
 * @param {Object} Service to wrap
*/

export default class ServiceRequestLocker {
  constructor(service) {
    this.service = service;
    this._pendingPromise = null;
  }

  retrieve(params) {
    if (this._pendingPromise === null) {
      this._pendingPromise = this.service.retrieve(params);
      return this._resolvePromise();
    }
    return this._resolvePromise();
  }

  _resolvePromise() {
    if (this._pendingPromise) {
      return this._pendingPromise.then((response) => {
        const list = response.data.list.filter((e) => !e.deleted);
        setTimeout(() => {
          this._pendingPromise = null;
        }, 1);
        return {
          data: {
            list,
          },
        };
      });
    }
    return Promise.resolve({ data: { list: [] } });
  }
}
