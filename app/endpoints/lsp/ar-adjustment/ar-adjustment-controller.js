const ArAdjustmentsApi = require('./ar-adjustment-api');
const defaultController = require('../../../utils/default-controller');

const arAdjustmentController = defaultController(ArAdjustmentsApi, 'ar-adjustment', { enableAttachmentsHandling: true });

module.exports = arAdjustmentController;
