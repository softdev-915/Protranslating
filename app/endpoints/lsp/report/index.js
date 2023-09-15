const Router = require('../../../components/application/route');
const controller = require('./report-controller');

const route = module.exports = Router.create();

route.post('/lsp/{lspId}/report/generate-pdf', controller.createPdfReport, {
  tags: ['Report'],
  parameters: [
    {
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'data',
      in: 'body',
      description: 'The report\'s details',
      required: true,
      schema: {
        $ref: '#/definitions/report-generate-input',
      },
    },
  ],
  description: 'Returns a pdf report',
  summary: 'Returns a PDF file containing data from requests',
  produces: ['application/pdf'],
  responses: {
    200: {
      description: 'The PDF file containing the data',
      schema: { type: 'file' },
    },
    401: {
      description: 'Invalid credentials',
      schema: { $ref: '#/definitions/error' },
    },
    403: {
      description: 'Forbidden',
      schema: { $ref: '#/definitions/error' },
    },
    500: {
      description: 'Server error',
      schema: { $ref: '#/definitions/error' },
    },
  },
});

route.definition('report-generate-input', {
  required: ['filename', 'reportCss', 'compiledTemplate'],
  properties: {
    filename: { type: 'string' },
    reportCss: { type: 'string' },
    compiledTemplate: { type: 'string' },
  },
});
