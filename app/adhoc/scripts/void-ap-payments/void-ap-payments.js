const Promise = require('bluebird');
const { isValidObjectId } = require('mongoose');
const { loadSchemas, default: mongooseSchema } = require('../../../components/database/mongo').models;
const mongo = require('../../../components/database/mongo');
const logger = require('../../../components/log/stdout-logger');
const configuration = require('../../../components/configuration');
const ApPaymentApi = require('../../../endpoints/lsp/ap-payment/ap-payment-api');
const siConnector = require('../../../connectors/si/index');

const args = process.argv.slice(2);
const PAYMENT_IDS = args.slice(2);
const lspFlag = args[0];
const lspName = args[1];

if (lspName === undefined || lspFlag !== '--lsp'
  || PAYMENT_IDS.length === 0 || PAYMENT_IDS.some((id) => !isValidObjectId(id))) {
  logger.error('Bad arguments supplied');
  logger.info('Usage: node void-ap-payments.js --lsp LSP_NAME [PAYMENT_ID ...]');
  logger.info('Or with the file: node void-ap-payments.js --lsp LSP_NAME $(< void-payments-ids-pts.txt)');
  process.exit();
}

const main = async () => {
  const paymentVoidErrorIds = [];
  try {
    await mongo.connect(configuration);
    await loadSchemas();
    await siConnector.initialize();
    const lsp = await mongooseSchema.Lsp.findOne({ name: lspName });
    const user = { lsp };
    const flags = { mock: true };
    const apPaymentApi = new ApPaymentApi(logger, { user, configuration, flags });
    await Promise.mapSeries(PAYMENT_IDS, async (paymentId) => {
      try {
        await apPaymentApi.void(paymentId, { memo: 'Voided due to payment sync error', date: new Date() });
      } catch (e) {
        logger.error(`Can't void the payment with id ${paymentId} because ${e}`);
        paymentVoidErrorIds.push(paymentId);
      }
    });
  } catch (e) {
    logger.error(e);
  }
  logger.info('Finished. Problematic payments below');
  logger.info(JSON.stringify(paymentVoidErrorIds));
};

main().then(() => process.exit());
