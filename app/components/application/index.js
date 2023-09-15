/* eslint no-param-reassign: ["error", { "props": false }] */
/* eslint-disable func-names */

const _ = require('lodash');
// const https = require('https');
const swaggerTools = require('@jeffe95/swagger-tools');
const Promise = require('bluebird');
// const fs = require('fs');
// Components
const logger = require('../log/logger');
const log = require('../log');
const errorHandler = require('../api-response/middleware');
const config = require('../configuration');
const Router = require('./route');
const security = require('./security');
const { RestError } = require('../api-response');

const environmentConfig = config.environment;

const paths = config.get('paths');
const env = config.get('environment');
const host = environmentConfig.HTTP_HOST;
const httpsPort = environmentConfig.HTTP_PORT;
const SERVER_TIMEOUT = 60000 * 60 * 2;
const KEEP_ALIVE_TIMEOUT = 60 * 1000;
const HEADERS_TIMEOUT = 65 * 1000;
// const keyFile = environmentConfig.LMS_KEY;
// const crtFile = environmentConfig.LMS_CRT;
/* const readFile = filepath => (
  new Promise((resolve, reject) => {
    fs.readFile(filepath, {
      encoding: 'utf-8',
    }, (err, data) => {
      if (err) {
        reject(err);
      }
      resolve(data);
    });
  })
);
*/

const swaggerize = (doc) => (
  new Promise((resolve, reject) => {
    try {
      swaggerTools.initializeMiddleware(doc, (middleware) => {
        resolve(middleware);
      });
    } catch (e) {
      stdoutLogger.error('Error Loading Swagger Definitions');
      reject(e);
    }
  })
);

module.exports = {
  create(app) {
    const swagger = {
      doc: {
        swagger: '2.0',
        info: {
          title: config.get('swagger.docTitle') || 'Rest Api',
          description: config.get('swagger.docDescription') || 'Rest Api',
          version: '1.0',
        },
        produces: ['application/json'],
        host: `${host}:${httpsPort}`,
        basePath: paths.api,
        tags: [
          {
            name: 'Login',
            description: 'SAML login APIs',
          },
        ],
        securityDefinitions: {
          api_key: {
            type: 'apiKey',
            name: 'Cookie',
            in: 'header',
          },
        },
        security: [{
          api_key: [],
        }],
        paths: {},
        definitions: {},
      },
      controllers: {},
      async setup() {
        const api = await swaggerize(swagger.doc);

        app.use(api.swaggerMetadata());
        app.use(api.swaggerSecurity(security));
        app.use(api.swaggerValidator());
        app.use(api.swaggerRouter({
          controllers: swagger.controllers,
          useStubs: false,
        }));

        if (env !== 'PROD') {
          const mockDocs = _.extend({}, swagger.doc, {
            basePath: '/api',
          });
          const mocks = await swaggerize(mockDocs);

          app.use(mocks.swaggerMetadata());
          app.use(mocks.swaggerValidator());
          app.use(mocks.swaggerRouter({
            controllers: {},
            useStubs: true,
          }));
          app.use(mocks.swaggerUi({
            apiDocs: paths.apiDocs,
            swaggerUi: paths.swaggerUi,
          }));
        }

        app.use((req, res, next) => {
          next(new RestError(404, { message: `Path not found ${req.url}` }));
        });
        app.use(errorHandler());
      },
    };

    return {
      use(route) {
        if (Router.instanceOf(route)) {
          const r = route.generate();

          _.extend(swagger.doc.paths, r._path);
          _.extend(swagger.doc.definitions, r._definition);
          _.extend(swagger.controllers, r._controller);

          if (_.size(r._childs) > 0) {
            _.each(r._childs, (child) => this.use(child));
          }
        }
      },

      async start() {
        swagger.setup(app);
        // const key = await readFile(keyFile);
        // const cert = await readFile(crtFile);
        /* const server = https.createServer({
          key,
          cert,
          // Force TLS 1.2
          // https://gist.github.com/collinsrj/e7faf14bb4f1d0a190a0
          // https://stackoverflow.com/a/49250499/467034
          secureProtocol: 'TLSv1_2_server_method',
        }, app); */
        //  timeout in the proxy is 2 hours
        const server = app.listen(httpsPort);
        server.timeout = 60000 * 60 * 2; // 2 hs
        server.keepAliveTimeout = 600 * 1000;
        server.headersTimeout = 60 * 1000;
        server.on('error', (error) => {
          stdoutLogger.error(error);
          process.exit(1);
        });
        server.on('listening', () => {
          logger.info(`Api Rest Endpoints available under "${paths.api}" path`);
          logger.info(`Readme documentation available under "${paths.readme}" path`);
          logger.info(`Api Swagger documentation Object available under "${paths.apiDocs}" path`);
          logger.info(`Swagger Api documentation available under "${paths.swaggerUi}" path`);
          logger.info(`Server running on http://${host}:${server.address().port}`);
        });
      },
    };
  },
};
