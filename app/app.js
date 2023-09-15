const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const helmet = require('helmet');
const addRequestId = require('express-request-id');
const csrf = require('csurf');
const cidrMiddleware = require('./components/cidr/middleware');
// Components
const logMiddleware = require('./components/log/middleware');
const auditMiddleware = require('./components/audit/middleware');
const configuration = require('./components/configuration');
const sessionActivity = require('./components/session/middleware');
const apiLimit = require('./components/api-limit/middleware');
const flagMiddleware = require('./components/flag/middleware');
const mockApiMiddleware = require('./components/mock-api-middleware/middleware');
const hostMiddleware = require('./components/host/middleware');
const lspIdCheckMiddleware = require('./components/security/middleware');
const csrfMiddleware = require('./components/security/csrf');
const migrationsMiddleware = require('./components/migration/middleware');
const cloudStorageInterceptor = require('./components/cloud-storage/interceptor');
const ssoInterceptor = require('./components/sso/interceptor');
const MigrationRunner = require('./components/migration');
const { runAsyncStorage } = require('./async_storage');
const sessionReadDate = require('./components/session-read-date/middleware');

const app = express();
const envConfig = configuration.environment;
const migrationRunner = new MigrationRunner();

app.migrationRunner = migrationRunner;

app.use(bodyParser.json({ limit: envConfig.RAW_BODY_PAYLOAD_LIMIT }));
app.use(hostMiddleware());
app.use(addRequestId());
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cookieParser());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb' }));

const sessionConfiguration = {
  name: configuration.get('security.session.cookieName'),
  resave: configuration.get('security.session.resave'),
  saveUninitialized: configuration.get('security.session.saveUninitialized'),
  secret: configuration.get('security.session.secret'),
  unset: 'destroy',
  store: MongoStore.create({
    mongoUrl: 'mongodb://127.0.0.1:27017',
    // mongooseConnection: mongoConnection.mongoose.connection,
    ttl: 1 * 60 * 60, // = 1 hour
  }),
};

if (envConfig.USE_SECURE_COOKIES === 'true') {
  sessionConfiguration.cookie = { httpOnly: true, secure: true };
}

app.use(session(sessionConfiguration));
app.use(flagMiddleware());
app.use(mockApiMiddleware());
app.use(logMiddleware());
app.use(sessionActivity);
app.use(lspIdCheckMiddleware);
app.use(cidrMiddleware());
// csrf configuration
app.use(csrf());
// csrf error handler
app.use(csrfMiddleware);

if (envConfig.LOG_AUDIT_TRAILS) {
  app.use(auditMiddleware({
    bodyLimit: envConfig.RAW_BODY_PAYLOAD_LIMIT,
    propertiesFilter: envConfig.NODE_LOGS_FILTER,
    shouldStoreBody: envConfig.AUDIT_TRAIL_FULL_RESPONSE,
  }));
}
app.post(sessionReadDate.postPaths, sessionReadDate.middleware);
app.delete(sessionReadDate.deletePaths, sessionReadDate.middleware);
app.all(sessionReadDate.allPaths, sessionReadDate.middleware);

app.use(apiLimit);
app.use(migrationsMiddleware(migrationRunner));
app.use(runAsyncStorage);

// upload interceptor
cloudStorageInterceptor(app, configuration, null);
ssoInterceptor(app, null);

module.exports = app;
