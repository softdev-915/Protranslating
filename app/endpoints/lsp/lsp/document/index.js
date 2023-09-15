const Router = require('../../../../components/application/route');
const { customizableList } = require('../../../../components/application/definitions');

const route = module.exports = Router.create();

const controller = require('./lsp-document-controller');

route.get('/lsp/{lspId}/pc-settings/sr',
  controller.srList, {
    tags: [
      'Lsp',
      'SRX Files',
    ],
    description: 'Retrieves the current lsp SR descriptors',
    summary: 'Retrieves the current lsp SR descriptors',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lspId',
      type: 'string',
      required: true,
    }],
    responses: {
      200: {
        description: 'SR descriptors',
        schema: {
          $ref: '#/definitions/lsp-sr-descriptors-list',
        },
      },
      401: {
        description: 'Invalid credentials',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.delete('/lsp/{lspId}/pc-settings/sr',
  controller.deleteSr, {
    tags: [
      'Lsp',
      'SRX Files',
    ],
    'x-swagger-security': {
      roles: [
        'LSP-SETTINGS_UPDATE_OWN',
      ],
    },
    description: 'Removes SRs with specified ids',
    summary: 'Removes SRs with specified ids',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lspId',
      type: 'string',
      required: true,
    }, {
      name: 'data',
      in: 'body',
      required: true,
      schema: {
        $ref: '#/definitions/sr-delete-body',
      },
    }],
    responses: {
      401: {
        description: 'Invalid credentials',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.get('/lsp/{lspId}/pc-settings/sr/{descriptorId}/download',
  controller.serverSrx, {
    tags: [
      'Lsp',
      'SRX Files',
    ],
    description: 'Serves SRX file',
    summary: 'Serves SRX file',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lspId',
      type: 'string',
      required: true,
    }, {
      name: 'descriptorId',
      in: 'path',
      description: 'The descriptorId',
      type: 'string',
      required: true,
    }],
    responses: {
      200: {
        description: 'SRX file',
      },
      401: {
        description: 'Invalid credentials',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.post('/lsp/{lspId}/pc-settings/sr/zip',
  controller.serveSrxZip, {
    tags: [
      'Lsp',
      'SRX Files',
    ],
    description: 'Serves all SRX as a zip archive',
    summary: 'Serves all SRX as a zip archive',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lspId',
      type: 'string',
      required: true,
    }, {
      name: 'data',
      in: 'body',
      required: true,
      schema: {
        $ref: '#/definitions/sr-zip-body',
      },
    }],
    responses: {
      200: {
        description: 'Zip archive with all SRX',
      },
      401: {
        description: 'Invalid credentials',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.definition('lsp-sr-descriptors-list', customizableList({
  $ref: '#/definitions/lsp-sr',
}));

route.definition('lsp-sr', {
  properties: {
    lsp: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
    mime: {
      type: 'string',
    },
    encoding: {
      type: 'string',
    },
    size: {
      type: 'string',
    },
    language: {
      type: 'string',
    },
    md5Hash: {
      type: 'string',
    },
    cloudKey: {
      type: 'string',
    },
  },
});

route.definition('sr-delete-body', {
  properties: {
    resourceIds: {
      type: 'array',
      items: {
        type: 'string',
        format: 'uuid',
      },
    },
  },
  required: ['resourceIds'],
});

route.definition('sr-zip-body', {
  properties: {
    resourceIds: {
      type: 'array',
      items: {
        type: 'string',
        format: 'uuid',
      },
    },
  },
  required: ['resourceIds'],
});
