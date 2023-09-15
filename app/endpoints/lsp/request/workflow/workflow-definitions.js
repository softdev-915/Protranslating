const { defineResponse } = require('../../../../components/application/definitions');

const workflow = {
  properties: {
    languageCombinationId: {
      type: 'string',
    },
    _id: {
      type: 'string',
    },
    language: {
      type: 'object',
      $ref: '#/definitions/language',
    },
    workflowDueDate: {
      type: 'string',
      format: 'date-time',
    },
    description: {
      type: 'string',
    },
    subtotal: {
      type: 'number',
    },
    discount: {
      type: 'number',
    },
    tasks: {
      type: 'array',
      items: {
        $ref: '#/definitions/task',
      },
    },
  },
};

const workflowResponse = defineResponse({
  workflow: { $ref: '#/definitions/workflow' },
  isUserIpAllowed: {
    type: 'boolean',
  },
});

module.exports = {
  workflow,
  'workflow-response': workflowResponse,
};
