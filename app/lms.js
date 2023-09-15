const _ = require('lodash');
const config = require('./components/configuration');
const logger = require('./components/log/logger');
const mongo = require('./components/database/mongo');
const app = require('./app');
const api = require('./components/application');
const siConnector = require('./connectors/si');
const buildApplicationScheduler = require('./components/scheduler');

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught exception: ${err.stack}`);
});

const configuration = require('./components/configuration');
const stdoutLogger = require('./components/log/stdout-logger');
const { createHeapSnapshotIfNeeded } = require('./components/heapdump');

const {
  NODE_ENV, IS_UNIT, MIGRATIONS_DISABLED,
} = config.environment;

mongo.connect(config)
  .then(() => mongo.loadSchemas())
  .then(async () => {
    if (!IS_UNIT && MIGRATIONS_DISABLED === false) {
      try {
        const migrationRunnerStatus = await app.migrationRunner.executeMigrations();
        if (_.isNil(migrationRunnerStatus) || migrationRunnerStatus.executing) {
          logger.info('Migrations are being executed. Waiting');
          await app.migrationRunner.waitForMigrationsFinish();
        }
        if (!_.isNil(migrationRunnerStatus) && migrationRunnerStatus.hasFailed) {
          logger.error('Migrations ended with errors');
          throw new Error(`Migrations have failed ${'Migrations ended with errors'}`);
        }
      } catch (error) {
        console.log(error);
        logger.error(`Migrations have failed, the app will not start. Check lms_migrations_cluster collection for more info. Err ${error}`);
        throw new Error(`Migrations have failed ${error}`);
      } finally {
        logger.info('Migrations ended');
      }
    }
  })
  .then(() => siConnector.initialize())
  .then(() => buildApplicationScheduler(config))
  .then((scheduler) => scheduler.configure())
  .then(() => {
    logger.info('[Scheduler Initialized]');
    const prjs = api.create(app);
    
    /* eslint-disable global-require */
    prjs.use(require('./endpoints/auth'));
    prjs.use(require('./endpoints/auth/heartbeat'));
    prjs.use(require('./endpoints/auth/forgot-password'));
    prjs.use(require('./endpoints/log'));
    prjs.use(require('./endpoints/version'));
    prjs.use(require('./endpoints/lsp/http-header'));
    prjs.use(require('./endpoints/lsp/assignment-status'));
    prjs.use(require('./endpoints/lsp/user/cat'));
    prjs.use(require('./endpoints/lsp/user/grid'));
    prjs.use(require('./endpoints/lsp/user/toast'));
    prjs.use(require('./endpoints/lsp/user/competence-level'));
    prjs.use(require('./endpoints/lsp/user/document'));
    // user routes might interfere with he grid or image routes
    // that's why it has been moved below.
    prjs.use(require('./endpoints/lsp/active-user-sessions'));
    prjs.use(require('./endpoints/lsp/user'));
    prjs.use(require('./endpoints/lsp/role'));
    prjs.use(require('./endpoints/lsp/group'));
    prjs.use(require('./endpoints/lsp/scheduler'));
    prjs.use(require('./endpoints/lsp/documentation'));
    prjs.use(require('./endpoints/lsp/company'));
    prjs.use(require('./endpoints/lsp/company/document'));
    prjs.use(require('./endpoints/lsp/contact'));
    prjs.use(require('./endpoints/lsp/notification'));
    prjs.use(require('./endpoints/lsp/request'));
    prjs.use(require('./endpoints/lsp/request/workflow'));
    prjs.use(require('./endpoints/lsp/request/workflow-template'));
    prjs.use(require('./endpoints/lsp/request/task'));
    prjs.use(require('./endpoints/lsp/request/translation'));
    prjs.use(require('./endpoints/lsp/company/request/time-to-deliver'));
    prjs.use(require('./endpoints/lsp/company/request/document'));
    prjs.use(require('./endpoints/lsp/company/request/document/basic-cat-tool'));
    prjs.use(require('./endpoints/lsp/company/request/workflow/task/document'));
    prjs.use(require('./endpoints/lsp/quote-lms'));
    prjs.use(require('./endpoints/lsp/report'));
    prjs.use(require('./endpoints/lsp/audit'));
    prjs.use(require('./endpoints/lsp/document-prospect'));
    prjs.use(require('./endpoints/lsp/ability'));
    prjs.use(require('./endpoints/lsp/language'));
    prjs.use(require('./endpoints/lsp/task'));
    prjs.use(require('./endpoints/lsp/cat-tool'));
    prjs.use(require('./endpoints/lsp/toast'));
    prjs.use(require('./endpoints/lsp/activity/tag'));
    prjs.use(require('./endpoints/lsp/activity/document'));
    prjs.use(require('./endpoints/lsp/activity'));
    prjs.use(require('./endpoints/lsp/activity/document'));
    prjs.use(require('./endpoints/lsp/internal-department'));
    prjs.use(require('./endpoints/lsp/billing-term'));
    prjs.use(require('./endpoints/lsp/breakdown'));
    prjs.use(require('./endpoints/lsp/translation-unit'));
    prjs.use(require('./endpoints/lsp/currency'));
    prjs.use(require('./endpoints/lsp/payment-method'));
    prjs.use(require('./endpoints/lsp/lead-source'));
    prjs.use(require('./endpoints/lsp/country'));
    prjs.use(require('./endpoints/lsp/country/state'));
    prjs.use(require('./endpoints/lsp/industry'));
    prjs.use(require('./endpoints/lsp/external-resource'));
    prjs.use(require('./endpoints/lsp/tax-form'));
    prjs.use(require('./endpoints/lsp/opportunity'));
    prjs.use(require('./endpoints/lsp/opportunity/document'));
    prjs.use(require('./endpoints/lsp/document-type'));
    prjs.use(require('./endpoints/lsp/delivery-method'));
    prjs.use(require('./endpoints/lsp/software-requirement'));
    prjs.use(require('./endpoints/lsp/lsp'));
    prjs.use(require('./endpoints/lsp/lsp/document'));
    prjs.use(require('./endpoints/lsp/template'));
    prjs.use(require('./endpoints/lsp/request-type'));
    prjs.use(require('./endpoints/lsp/scheduling-status'));
    prjs.use(require('./endpoints/lsp/location'));
    prjs.use(require('./endpoints/lsp/certification'));
    prjs.use(require('./endpoints/lsp/mt-engine'));
    prjs.use(require('./endpoints/lsp/mt-provider'));
    prjs.use(require('./endpoints/lsp/portalcat'));
    prjs.use(require('./endpoints/lsp/portalcat/documents'));
    prjs.use(require('./endpoints/lsp/company-minimum-charge'));
    prjs.use(require('./endpoints/lsp/portalcat/config'));
    prjs.use(require('./endpoints/lsp/custom-query'));
    prjs.use(require('./endpoints/lsp/custom-query/preference'));
    prjs.use(require('./endpoints/lsp/expense-account'));
    prjs.use(require('./endpoints/lsp/ability-expense-account'));
    prjs.use(require('./endpoints/lsp/company-department-relationship'));
    prjs.use(require('./endpoints/lsp/company-external-accounting-code'));
    prjs.use(require('./endpoints/lsp/vendor-minimum-charge'));
    prjs.use(require('./endpoints/lsp/bill'));
    prjs.use(require('./endpoints/lsp/bill-adjustment'));
    prjs.use(require('./endpoints/lsp/ap-payment'));
    prjs.use(require('./endpoints/lsp/schema'));
    prjs.use(require('./endpoints/lsp/ar-invoice'));
    prjs.use(require('./endpoints/lsp/ar-invoice-entries'));
    prjs.use(require('./endpoints/lsp/ar-adjustment'));
    prjs.use(require('./endpoints/lsp/ar-advance'));
    prjs.use(require('./endpoints/lsp/ar-payment'));
    prjs.use(require('./endpoints/lsp/connector'));
    prjs.use(require('./endpoints/lsp/attachments'));
    prjs.use(require('./endpoints/lsp/cc-payments'));
    prjs.use(require('./endpoints/lsp/payment-gateway'));
    prjs.use(require('./endpoints/lsp/revenue-account'));
    prjs.use(require('./endpoints/lsp/bank-account'));
    prjs.use(require('./endpoints/lsp/check'));
    prjs.use(require('./endpoints/lsp/ip/ip_wipo'));
    prjs.use(require('./endpoints/lsp/ip/ip_epo'));
    prjs.use(require('./endpoints/lsp/ip/ip_nodb'));
    prjs.use(require('./endpoints/lsp/auto-translate'));
    prjs.use(require('./endpoints/lsp/company-excluded-providers'));
    prjs.use(require('./endpoints/lsp/compromised-password'));
    prjs.use(require('./endpoints/lsp/provider-pooling-offer'));
    prjs.use(require('./endpoints/lsp/provider-instructions'));
    prjs.use(require('./endpoints/lsp/portalcat/translation-memory'));
    prjs.use(require('./endpoints/lsp/portalmt/portalmt-settings'));
    prjs.use(require('./endpoints/lsp/portalmt/segment'));
    prjs.use(require('./endpoints/lsp/portalmt/segmentation-rules-list'));
    prjs.use(require('./endpoints/lsp/portalmt/translate-segments'));
    prjs.use(require('./endpoints/lsp/mt-model'));
    prjs.use(require('./endpoints/lsp/lsp-logos'));
    prjs.use(require('./endpoints/lsp/footer-template'));
    prjs.use(require('./endpoints/lsp/service-type'));
    prjs.use(require('./endpoints/lsp/delivery-type'));
    prjs.use(require('./endpoints/lsp/pii'));
    prjs.use(require('./endpoints/lsp/ip-instructions-deadline'));
    prjs.use(require('./endpoints/lsp/pipeline-action-config-templates'));
    if (NODE_ENV !== 'PROD') {
      prjs.use(require('./endpoints/lsp/import-entity'));
      prjs.use(require('./endpoints/lsp/tests'));
    }

    prjs.start();
    const snapshotMemoryInterval = configuration.environment.MEMORY_CHECK_INTERVAL_MS;
    setInterval(createHeapSnapshotIfNeeded.bind(this, stdoutLogger), snapshotMemoryInterval);
  })
  .catch((err) => {
    stdoutLogger.error(`Failed to bootstrap the application. Error: ${err}`);
    process.exit(-1);
  });
