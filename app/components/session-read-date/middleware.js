const _ = require('lodash');
const { setReadDate } = require('../../utils/request');

const postPaths = [
  'ability',
  'ability-expense-account',
  'activity-tag',
  'activity',
  'assignment-status',
  'bank-account',
  'billing-term',
  'breakdown',
  'cat-tool',
  'certification',
  'company',
  'company-department-relationship',
  'company-external-accounting-code',
  'company-minimum-charge',
  'connector',
  'currency',
  'custom-query-preference',
  'custom-query',
  'delivery-method',
  'document-type',
  'documentation',
  'expense-account',
  'footer-template',
  'group',
  'internal-department',
  'language',
  'lead-source',
  'location',
  'lsp',
  'mt-engine',
  'mt-model',
  'opportunity',
  'payment-method',
  'request',
  'request-type',
  'revenue-account',
  'scheduler',
  'scheduling-status',
  'software-requirement',
  'tax-form',
  'template',
  'toast',
  'translation-unit',
  'user/competence',
  'vendor-minimum-charge',
  'request/:requestId/workflow',
  'provider-pooling-offer',
].map(path => `/api/lsp/:lspId/${path}`);

const deletePaths = [
  '/api/lsp/:lspId/request/:requestId/workflow',
];

const allPaths = [
  'request/:requestId/quote',
  'request/:requestId/force-update-patent-fee',
  'request/:requestId/calculate-patent-fee',
  'request/:requestId/approve-quote',
  'activity/:activityId/sendQuote',
  'custom-query/:customQueryId/preference',
  'request/:requestId/document/:documentId/translation/:language',
  'request/:requestId/workflow-paste',
  'request/:requestId/workflow/:workflowId/task/:taskId/providerTask/:providerTaskId/document',
  'template/name/:templateName',
  'template/:companyId/:internalDepartmentId',
  'provider-pooling-offer/provider-offers/:providerId',
  'request/:requestId/document',
  'wipo-request/:requestId',
  'nodb-request/:requestId',
  'epo/:requestId',
  'epo/request',
  'wipo-request',
  'nodb-request',
].map(
  path => `/api/lsp/:lspId/${path}`,
).concat(
  postPaths.map(path => `${path}/:id`),
);

const middleware = (req, res, next) => {
  const oldJson = res.json;
  res.json = function (responseBody) {
    const data = responseBody.data;
    try {
      if (_.isObject(data)) {
        Object.keys(data).forEach((key) => {
          const entity = data[key];
          if (_.isNil(entity)) {
            return;
          }
          setReadDate(req, key, entity);
        });
      }
    } catch (err) {
      req.$logger.error(`Error setting read date for path ${req.originalUrl}: ${err}`);
    }
    oldJson.apply(res, [responseBody]);
  };
  next();
};

module.exports = {
  allPaths,
  postPaths,
  deletePaths,
  middleware,
};
