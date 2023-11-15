export default class LSPAwareResource {
  constructor(resource) {
    if (typeof resource === 'function') {
      this._resourceFactory = resource;
    } else {
      this._resource = resource;
    }
  }

  get(params, actions, options) {
    return this._callResource('get', params, actions, options);
  }

  save(params, actions, options) {
    return this._callResource('save', params, actions, options, true);
  }

  query(params, actions, options) {
    return this._callResource('query', params, actions, options);
  }

  update(params, actions, options) {
    return this._callResource('update', params, actions, options, true);
  }

  remove(params, actions, options) {
    return this._callResource('remove', params, actions, options);
  }

  delete(params, actions, options) {
    return this._callResource('delete', params, actions, options);
  }

  _callResource(method, params, actions, options, hasBody) {
    const resource = this.resource();
    const args = this._buildArgs(params, actions, options, hasBody);
    return resource[method].call(resource, ...args);
  }

  resource() {
    if (!this._resource) {
      this._resource = this._resourceFactory();
      delete this._resourceFactory;
    }
    return this._resource;
  }

  _buildArgs(params, actions, options, hasBody) {
    const userLogged = window.store.getters['app/userLogged'];
    const args = [];
    // if request has body and no params, add params.
    if (!params) {
      params = {};
    } else if (!actions && hasBody) {
      actions = { ...params };
      params = { };
    }
    params.lspId = userLogged.lsp._id;
    args.push(params);
    if (actions) {
      args.push(actions);
      if (options) {
        args.push(options);
      }
    }
    return args;
  }
}
