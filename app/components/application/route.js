/* eslint-disable no-shadow */

const _ = require('lodash');
const path = require('path');
const Controller = require('./controller');
const globalDefinitions = require('./definitions');

const Router = {
  _controller: {},
  _definition: {},
  _path: {},
  _childs: [],
  _methods: [],
  _prefix: '',
  init() {
    this._methods = [];
    this._prefix = '';
    this._controller = {};
    this._definition = {
      apiResponse: globalDefinitions.apiResponse,
      error: globalDefinitions.error,
    };
    this._path = {};
    this._childs = [];
    return (this);
  },
  name(path) {
    return path
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/^-+|-+$/g, '');
  },
  register(type, path, controller, doc) {
    this._methods.push({
      type,
      path,
      controller: Controller.create(controller),
      doc,
    });
  },
  generate() {
    _.each(this._methods, (method) => {
      const routePath = {};
      const routeController = {};
      const url = path.normalize(this._prefix + method.path);
      const routeId = this.name(url);

      routePath[url] = {};
      routePath[url][method.type] = _.extend(method.doc, {
        'x-swagger-router-controller': routeId,
        operationId: method.type,
      });

      routeController[`${routeId}_${method.type}`] = method.controller;

      _.merge(this._path, routePath);
      _.extend(this._controller, routeController);
    });
    return this;
  },
};

const Properties = {
  // path: {
  //   value(paths) {
  //     _.extend(this._path, paths)
  //   }
  // },
  // controller: {
  //   value(paths) {
  //     _.extend(this._controller, paths)
  //   }
  // },
  definition: {
    value(id, config) {
      const data = {};

      data[id] = config;

      _.extend(this._definition, data);
    },
  },
  definitions: {
    value(definitions) {
      _.extend(this._definition, definitions);
    },
  },
  use: {
    value(path, route) {
      if (module.exports.instanceOf(route)) {
        // route._path = _.mapKeys(route._path, (doc, key) => {
        //   return path + key
        // })
        // route._controller = _.mapKeys(route._controller, (doc, key) => {
        //   return key.replace(route._path, this.generate(path + key))
        // })
        route._prefix = this._prefix + path;
        this._childs.push(route);
      }
    },
  },
  get: {
    value(path, controller, doc) {
      this.register('get', path, controller, doc);
    },
  },
  post: {
    value(path, controller, doc) {
      this.register(
        'post',
        path,
        controller,
        doc,
      );
    },
  },
  put: {
    value(path, controller, doc) {
      this.register(
        'put',
        path,
        controller,
        doc,
      );
    },
  },
  patch: {
    value(path, controller, doc) {
      this.register(
        'patch',
        path,
        controller,
        doc,
      );
    },
  },
  patch: {
    value(path, controller, doc) {
      this.register(
        'patch',
        path,
        controller,
        doc,
      );
    },
  },
  delete: {
    value(path, controller, doc) {
      this.register(
        'delete',
        path,
        controller,
        doc,
      );
    },
  },
  options: {
    value(path, controller, doc) {
      this.register(
        'options',
        path,
        controller || Controller.create(async (req, res) => {
          const methods = _.keys(req.swagger.path);

          res.setHeader('Allow', methods.join(' ').toUpperCase());
          res.status(204).send();
        }),
        _.extend(doc, {
          description: 'OPTIONS method',
          summary: 'OPTIONS method',
          responses: {
            204: {
              description: 'Successful options.',
            },
          },
        }),
      );
    },
  },
};

module.exports = {
  instanceOf(route) {
    const belongs = Object.getPrototypeOf(route) === Router;

    if (!belongs) {
      console.log(new Error().stack);
      throw new Error('Cannot use a non-router instance. Please use "create()" from app/components/application/route');
    }
    return belongs;
  },
  create() {
    return Object.create(Router, Properties).init();
  },
};
