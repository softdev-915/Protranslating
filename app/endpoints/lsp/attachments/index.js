const Router = require('../../../components/application/route');
const controller = require('./attachments-controller');

const route = module.exports = Router.create();
const BASE_URL = '/lsp/{lspId}/attachments/{entityName}/{entityId}/{attachmentId}';

route.delete(BASE_URL,
  controller.detach, {
    tags: ['Attachments'],
    description: 'Removes the attachment file of entityName by entityId',
    summary: 'Removes the attachment file of entityName by entityId',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lspId',
      type: 'string',
      required: true,
    }, {
      name: 'entityName',
      in: 'path',
      description: 'Attachments\'s entity name',
      type: 'string',
      required: true,
    }, {
      name: 'entityId',
      in: 'path',
      description: 'Attachments\'s entityId',
      type: 'string',
      required: true,
    }, {
      name: 'attachmentId',
      in: 'path',
      description: 'Attachments\'s id to remove',
      type: 'string',
      required: true,
    }],
    responses: {
      200: {
        description: 'Attachment successfully removed',
        schema: {
          type: 'array',
          items: {
            type: 'object',
            $ref: '#/definitions/document',
          },
        },
      },
      401: {
        description: 'Invalid credentials',
        schema: {
          $ref: '#/definitions/error',
        },
      },
      403: {
        description: 'Forbidden',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.get(BASE_URL,
  controller.streamFile, {
    tags: ['Attachments'],
    description: 'Generates attachment download link',
    summary: 'Generates attachment download link',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lspId',
      type: 'string',
      required: true,
    }, {
      name: 'entityName',
      in: 'path',
      description: 'Attachments\'s entity name',
      type: 'string',
      required: true,
    }, {
      name: 'entityId',
      in: 'path',
      description: 'Attachments\'s entityId',
      type: 'string',
      required: true,
    }, {
      name: 'attachmentId',
      in: 'path',
      description: 'Attachments\'s id to download',
      type: 'string',
      required: true,
    }],
    responses: {
      200: {
        description: 'Download link',
      },
      401: {
        description: 'Invalid credentials',
        schema: {
          $ref: '#/definitions/error',
        },
      },
      403: {
        description: 'Forbidden',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });
