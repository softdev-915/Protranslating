const Router = require('../../../../components/application/route');
const controller = require('./translation-memory-controller');

const router = module.exports = Router.create();

router.get('/lsp/{lspId}/company/{companyId}/translation-memory/{tmId}/segments',
  controller.getSegments,
  {
    tags: [
      'Translation Memory',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['CAT-RESOURCES_READ_ALL', 'CAT-RESOURCES_UPDATE_ALL'] },
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'companyId',
      in: 'path',
      description: 'The company\'s id to fetch segments for',
      required: true,
      type: 'string',
    },
    {
      name: 'tmId',
      in: 'path',
      description: 'The TM\'s id to fetch segments for',
      required: true,
      type: 'string',
    }],
    description: 'Get a list of segments in translation memory',
    summary: 'Get a list of segments in translation memory',
    responses: {
      200: {
        description: 'The list of segments',
      },
    },
  });

router.get('/lsp/{lspId}/company/{companyId}/translation-memory/{tmId}/segments/{originalId}/history',
  controller.getSegmentHistory,
  {
    tags: [
      'Translation Memory',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['CAT-RESOURCES_READ_ALL', 'CAT-RESOURCES_UPDATE_ALL'] },
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'companyId',
      in: 'path',
      description: 'The company\'s id to fetch segments for',
      required: true,
      type: 'string',
    },
    {
      name: 'tmId',
      in: 'path',
      description: 'The TM\'s id to fetch segments for',
      required: true,
      type: 'string',
    },
    {
      name: 'originalId',
      in: 'path',
      description: 'The segment\'s id to fetch history for',
      required: true,
      type: 'string',
    }],
    description: 'Get segment modification history',
    summary: 'Get segment modification history',
    responses: {
      200: {
        description: 'The list of history segments',
      },
    },
  });

router.get('/lsp/{lspId}/company/{companyId}/translation-memory/{tmId}/segments/{originalId}/info',
  controller.getSegmentDetails,
  {
    tags: [
      'Translation Memory',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['CAT-RESOURCES_READ_ALL', 'CAT-RESOURCES_UPDATE_ALL'] },
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'companyId',
      in: 'path',
      description: 'The company\'s id to fetch segments for',
      required: true,
      type: 'string',
    },
    {
      name: 'tmId',
      in: 'path',
      description: 'The TM\'s id to fetch segments for',
      required: true,
      type: 'string',
    },
    {
      name: 'originalId',
      in: 'path',
      description: 'The segment\'s id to fetch info for',
      required: true,
      type: 'string',
    }],
    description: 'Get segment info',
    summary: 'Get segment info',
    responses: {
      200: {
        description: 'The segment info',
      },
    },
  });

router.post('/lsp/{lspId}/company/{companyId}/translation-memory/{tmId}/segments',
  controller.createSegment,
  {
    tags: [
      'Translation Memory',
    ],
    'x-swagger-security': {
      roles: ['CAT-RESOURCES_CREATE_ALL'],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'companyId',
      in: 'path',
      description: 'The company\'s id to create segment for',
      required: true,
      type: 'string',
    },
    {
      name: 'tmId',
      in: 'path',
      description: 'The TM\'s id to create segment for',
      required: true,
      type: 'string',
    },
    {
      name: 'data',
      in: 'body',
      description: 'The new segment data',
      required: true,
      schema: {
        $ref: '#/definitions/translation-memory-create-segment-body',
      },
    }],
    description: 'Creates new segment',
    summary: 'Creates new segment',
    responses: {
      200: {
        description: 'The newly created segment',
      },
    },
  });

router.post('/lsp/{lspId}/company/{companyId}/translation-memory/{tmId}/segments/search',
  controller.searchSegments,
  {
    tags: [
      'Translation Memory',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['CAT-RESOURCES_READ_ALL', 'CAT-RESOURCES_UPDATE_ALL'] },
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'companyId',
      in: 'path',
      description: 'The company\'s id to search segments in',
      required: true,
      type: 'string',
    },
    {
      name: 'tmId',
      in: 'path',
      description: 'The TM\'s id to search segments in',
      required: true,
      type: 'string',
    },
    {
      name: 'data',
      in: 'body',
      description: 'The search params',
      required: true,
      schema: {
        $ref: '#/definitions/translation-memory-search-body',
      },
    }],
    description: 'Searches segments',
    summary: 'Searches segments',
    responses: {
      200: {
        description: 'Search results',
      },
    },
  });

router.post('/lsp/{lspId}/company/{companyId}/translation-memory/{tmId}/segments/search/replace',
  controller.replaceSegmentsContent,
  {
    tags: [
      'Translation Memory',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['CAT-RESOURCES_READ_ALL', 'CAT-RESOURCES_UPDATE_ALL'] },
      ],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'companyId',
      in: 'path',
      description: 'The company\'s id to search segments in',
      required: true,
      type: 'string',
    },
    {
      name: 'tmId',
      in: 'path',
      description: 'The TM\'s id to search segments in',
      required: true,
      type: 'string',
    },
    {
      name: 'data',
      in: 'body',
      description: 'Replace params',
      required: true,
      schema: {
        $ref: '#/definitions/translation-memory-replace-body',
      },
    }],
    description: 'Replaces segments content',
    summary: 'Replaces segments content',
    responses: {
      200: {
        description: 'Search results',
      },
    },
  });

router.put('/lsp/{lspId}/company/{companyId}/translation-memory/{tmId}/segments/{originalId}',
  controller.updateSegment,
  {
    tags: [
      'Translation Memory',
    ],
    'x-swagger-security': {
      roles: ['CAT-RESOURCES_UPDATE_ALL'],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'companyId',
      in: 'path',
      description: 'The company\'s id to search segments in',
      required: true,
      type: 'string',
    },
    {
      name: 'tmId',
      in: 'path',
      description: 'The TM\'s id to search segments in',
      required: true,
      type: 'string',
    },
    {
      name: 'originalId',
      in: 'path',
      description: 'The segment\'s original ID',
      required: true,
      type: 'string',
    },
    {
      name: 'data',
      in: 'body',
      description: 'The segment body to set',
      required: true,
      schema: {
        $ref: '#/definitions/translation-memory-update-segment-body',
      },
    }],
    description: 'Updates a segment',
    summary: 'Updates a segment',
    responses: {
      200: {
        description: 'Updated segment',
      },
    },
  });

router.delete('/lsp/{lspId}/company/{companyId}/translation-memory/{tmId}/segments/{originalId}',
  controller.deleteSegment,
  {
    tags: [
      'Translation Memory',
    ],
    'x-swagger-security': {
      roles: ['CAT-RESOURCES_DELETE_ALL'],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'companyId',
      in: 'path',
      description: 'The company\'s id',
      required: true,
      type: 'string',
    },
    {
      name: 'tmId',
      in: 'path',
      description: 'The TM\'s id',
      required: true,
      type: 'string',
    },
    {
      name: 'originalId',
      in: 'path',
      description: 'The segment\'s id to delete',
      required: true,
      type: 'string',
    }],
    description: 'Delete a segment',
    summary: 'Delete a segment',
    responses: {
      200: {
        description: 'Segment removed successfully',
      },
    },
  });

router.definition('translation-memory-create-segment-body', {
  properties: {
    source: {
      type: 'object',
    },
    target: {
      type: 'object',
    },
  },
  required: ['source', 'target'],
});

router.definition('translation-memory-search-body', {
  properties: {
    params: {
      type: 'object',
    },
  },
  required: ['params'],
});

router.definition('translation-memory-replace-body', {
  properties: {
    params: {
      type: 'object',
    },
    scope: {
      type: 'string',
      enum: ['one', 'all'],
    },
  },
  required: ['params', 'scope'],
});

router.definition('translation-memory-update-segment-body', {
  properties: {
    target: {
      type: 'object',
    },
    source: {
      type: 'object',
    },
    status: {
      type: 'string',
    },
  },
  required: ['target', 'source'],
});
