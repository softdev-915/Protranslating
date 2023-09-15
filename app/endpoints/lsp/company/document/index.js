const Router = require('../../../../components/application/route');
const { customizableList } = require('../../../../components/application/definitions');
const controller = require('./company-document-controller');

const route = module.exports = Router.create();

route.get('/lsp/{lspId}/company/{id}/pc-settings/resources',
  controller.pcSettingsResourcesList, {
    tags: [
      'Company',
      'PortalCAT Settings',
    ],
    description: 'Retrieves company\'s PortalCAT settings resources by type',
    summary: 'Retrieves company\'s PortalCAT settings resources by type',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lspId',
      type: 'string',
      required: true,
    }, {
      name: 'id',
      in: 'path',
      description: 'Existing company id',
      required: true,
      type: 'string',
      format: 'uuid',
    }, {
      name: 'type',
      in: 'query',
      description: 'PortalCAT settings resource type',
      type: 'string',
      required: true,
      enum: ['sr', 'tb', 'tm'],
    }, {
      name: 'srcLang',
      in: 'query',
      description: 'PortalCAT settings resource source lang',
      type: 'string',
    }, {
      name: 'tgtLang',
      in: 'query',
      description: 'PortalCAT settings resource target lang',
      type: 'string',
    }],
    responses: {
      200: {
        description: 'SRX Files',
        schema: {
          $ref: '#/definitions/company-pc-resources-list',
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

route.delete('/lsp/{lspId}/company/{id}/pc-settings/resources',
  controller.deletePcSettingsResources, {
    tags: [
      'Company',
      'PortalCAT Settings',
    ],
    'x-swagger-security': {
      roles: [
        'CAT-RESOURCES_DELETE_ALL',
      ],
    },
    description: 'Removes PortalCAT settings resources with specified ids',
    summary: 'Removes PortalCAT settings resources with specified ids',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lspId',
      type: 'string',
      required: true,
    }, {
      name: 'id',
      in: 'path',
      description: 'Existing company id',
      required: true,
      type: 'string',
      format: 'uuid',
    }, {
      name: 'data',
      in: 'body',
      required: true,
      schema: {
        $ref: '#/definitions/company-delete-pc-resources-body',
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

route.get('/lsp/{lspId}/company/{id}/pc-settings/resources/{resourceId}/download',
  controller.servePcSettingsResource, {
    tags: [
      'Company',
      'PortalCAT Settings',
    ],
    description: 'Serves PortalCAT settings resource as export file',
    summary: 'Serves PortalCAT settings resource as export file',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lspId',
      type: 'string',
      required: true,
    }, {
      name: 'id',
      in: 'path',
      description: 'Existing company id',
      required: true,
      type: 'string',
      format: 'uuid',
    }, {
      name: 'resourceId',
      in: 'path',
      description: 'The resourceId',
      type: 'string',
      required: true,
    }, {
      name: 'type',
      in: 'query',
      description: 'PortalCAT settings resource type',
      type: 'string',
      required: true,
      enum: ['sr', 'tb', 'tm'],
    }],
    responses: {
      200: {
        description: 'Resource export file',
      },
      401: {
        description: 'Invalid credentials',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.patch('/lsp/{lspId}/company/{id}/pc-settings/resources/{resourceId}/name',
  controller.updatePcSettingsResourceName, {
    tags: [
      'Company',
      'PortalCAT Settings',
    ],
    description: 'Update PortalCAT resource name',
    summary: 'Update PortalCAT resource name',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lspId',
      type: 'string',
      required: true,
    }, {
      name: 'id',
      in: 'path',
      description: 'Existing company id',
      required: true,
      type: 'string',
      format: 'uuid',
    }, {
      name: 'resourceId',
      in: 'path',
      description: 'The resourceId',
      type: 'string',
      required: true,
    }, {
      name: 'type',
      in: 'query',
      description: 'PortalCAT settings resource type',
      type: 'string',
      required: true,
      enum: ['sr', 'tb', 'tm'],
    }, {
      name: 'data',
      in: 'body',
      required: true,
      schema: {
        $ref: '#/definitions/company-pc-resources-update-name-body',
      },
    }],
    responses: {
      200: {
        description: 'Updated resource descriptor',
      },
      401: {
        description: 'Invalid credentials',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.post('/lsp/{lspId}/company/{id}/pc-settings/resources/zip',
  controller.servePcSettingsResourcesZip, {
    tags: [
      'Company',
      'PortalCAT Settings',
    ],
    description: 'Serves all PortalCAT settings resources as a zip archive',
    summary: 'Serves all PortalCAT settings resources as a zip archive',
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lspId',
      type: 'string',
      required: true,
    }, {
      name: 'id',
      in: 'path',
      description: 'Existing company id',
      required: true,
      type: 'string',
      format: 'uuid',
    }, {
      name: 'data',
      in: 'body',
      required: true,
      schema: {
        $ref: '#/definitions/company-pc-resources-zip-body',
      },
    }],
    responses: {
      200: {
        description: 'Zip archive with all PortalCAT settings resources',
      },
      401: {
        description: 'Invalid credentials',
        schema: {
          $ref: '#/definitions/error',
        },
      },
    },
  });

route.definition('company-pc-resource-language', {
  properties: {
    name: {
      type: 'string',
    },
    isoCode: {
      type: 'string',
    },
  },
});

route.definition('company-pc-resources-list', customizableList({
  $ref: '#/definitions/company-pc-resource',
}));

route.definition('company-pc-resource', {
  properties: {
    lsp: {
      type: 'string',
    },
    companyId: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
    language: {
      $ref: '#/definitions/company-pc-resource-language',
    },
    srcLang: {
      $ref: '#/definitions/company-pc-resource-language',
    },
    tgtLang: {
      $ref: '#/definitions/company-pc-resource-language',
    },
  },
});

route.definition('company-delete-pc-resources-body', {
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

route.definition('company-pc-resources-zip-body', {
  properties: {
    resourceIds: {
      type: 'array',
      items: {
        type: 'string',
        format: 'uuid',
      },
    },
    type: {
      type: 'string',
      enum: ['sr', 'tb', 'tm'],
    },
  },
  required: ['resourceIds', 'type'],
});

route.definition('company-pc-resources-update-name-body', {
  properties: {
    name: {
      type: 'string',
    },
  },
  required: ['name'],
});
