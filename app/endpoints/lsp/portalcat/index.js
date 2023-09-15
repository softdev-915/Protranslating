const Router = require('../../../components/application/route');
const controller = require('./portalcat-controller');

const router = Router.create();

router.post('/lsp/{lspId}/portalcat/{requestId}/pipelines/stop',
  controller.stopPipelines,
  {
    tags: [
      'PortalCAT',
    ],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'requestId',
      in: 'path',
      description: 'The request\'s id to stop pipelines for',
      required: true,
      type: 'string',
    },
    {
      name: 'data',
      in: 'body',
      description: 'JSON containing configs for pipelines run operation',
      required: true,
      schema: {
        $ref: '#/definitions/portalcat-manipulate-pipelines-body',
      },
    }],
    description: 'Stop pipelines execution',
    summary: 'Stop pipelines execution',
    responses: {
      200: {
        description: 'Pipelines were stoped successfuly',
      },
    },
  });

router.post('/lsp/{lspId}/portalcat/{requestId}/pipelines/run',
  controller.runPipelines,
  {
    tags: [
      'PortalCAT',
    ],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'requestId',
      in: 'path',
      description: 'The request\'s id to run pipelines for',
      required: true,
      type: 'string',
    },
    {
      name: 'data',
      in: 'body',
      description: 'JSON containing configs for pipelines run operation',
      required: true,
      schema: {
        $ref: '#/definitions/portalcat-manipulate-pipelines-body',
      },
    }],
    description: 'Run pipelines',
    summary: 'Run pipelines',
    responses: {
      200: {
        description: 'Run operation started successfuly',
      },
    },
  });

router.get('/lsp/{lspId}/portalcat/{requestId}/pipelines/status',
  controller.getPipelinesStatus,
  {
    tags: [
      'PortalCAT',
    ],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'requestId',
      in: 'path',
      description: 'The request\'s id pipeline belongs to',
      required: true,
      type: 'string',
    },
    {
      name: 'pipelineId',
      in: 'query',
      description: 'The pipeline\'s id to get a status of',
      type: 'string',
    },
    {
      name: 'fileIds',
      in: 'query',
      description: 'The file ids to get a status of',
      type: 'array',
      items: {
        type: 'string',
      },
    },
    {
      name: 'srcLangs',
      in: 'query',
      description: 'Source languages filter',
      type: 'array',
      items: {
        type: 'string',
      },
    },
    {
      name: 'tgtLangs',
      in: 'query',
      description: 'Target languages filter',
      type: 'array',
      items: {
        type: 'string',
      },
    },
    {
      name: 'types',
      in: 'query',
      description: 'The pipeline\'s type for filtering',
      type: 'array',
      items: {
        type: 'string',
        enum: ['import', 'export', 'mt'],
      },
    }],
    description: 'Returns pipelines current status',
    summary: 'Returns pipelines current status',
    responses: {
      200: {
        description: 'Pipelines statuses',
        schema: {
          type: 'object',
          properties: {
            statuses: {
              type: 'array',
              items: {
                $ref: '#/definitions/portalcat-pipeline-status',
              },
            },
          },
        },
      },
    },
  });

router.put('/lsp/{lspId}/portalcat/{requestId}/tfsh',
  controller.assignFileSegmentsToUser,
  {
    tags: [
      'PortalCAT',
    ],
    'x-swagger-security': {
      roles: [
        'WORKFLOW_UPDATE_ALL',
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
      name: 'requestId',
      in: 'path',
      description: 'The request\'s id',
      required: true,
      type: 'string',
    },
    {
      name: 'data',
      in: 'body',
      description: 'JSON containing assign data to set',
      required: true,
      schema: {
        $ref: '#/definitions/portalcat-tfsh-assign-body',
      },
    }],
    description: 'Assigns file\'s segments to user',
    summary: 'Returns assigned file\'s segments',
    responses: {
      200: {
        description: 'List of assigned file segments',
        schema: {
          type: 'array',
          items: {
            type: 'object',
          },
        },
      },
    },
  });

router.get('/lsp/{lspId}/portalcat/{requestId}/tfsh',
  controller.getFileSegments,
  {
    tags: [
      'PortalCAT',
    ],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'requestId',
      in: 'path',
      description: 'The request\'s id to retrieve segments for',
      required: true,
      type: 'string',
    },
    {
      name: 'workflowId',
      in: 'query',
      description: 'The workflow\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'fileId',
      in: 'query',
      description: 'The file\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'filter',
      in: 'query',
      description: 'The filter to apply',
      type: 'string',
    }],
    description: 'Returns file\'s segments',
    summary: 'Returns file\'s segments',
    responses: {
      200: {
        description: 'List of file segments',
        schema: {
          type: 'array',
          items: {
            type: 'object',
          },
        },
      },
    },
  });

router.post('/lsp/{lspId}/portalcat/{requestId}/tfsh/search',
  controller.searchFileSegments,
  {
    tags: [
      'PortalCAT',
    ],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'requestId',
      in: 'path',
      description: 'The request\'s id to search segments for',
      required: true,
      type: 'string',
    },
    {
      name: 'workflowId',
      in: 'query',
      description: 'The workflow\'s id to search segments for',
      required: true,
      type: 'string',
    },
    {
      name: 'data',
      in: 'body',
      description: 'The search and replace params',
      required: true,
      schema: {
        $ref: '#/definitions/portalcat-tfsh-search-body',
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

router.post('/lsp/{lspId}/portalcat/{requestId}/tfsh/join',
  controller.joinFileSegments,
  {
    tags: [
      'PortalCAT',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: [
          'SEGMENT-JOIN_UPDATE_OWN',
          'SEGMENT-JOIN_UPDATE_ALL',
        ] },
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
      name: 'requestId',
      in: 'path',
      description: 'The request\'s id',
      required: true,
      type: 'string',
    },
    {
      name: 'data',
      in: 'body',
      description: 'JSON containing configs for file segments join',
      required: true,
      schema: {
        $ref: '#/definitions/portalcat-tfsh-join-body',
      },
    }],
    description: 'Joins file segments',
    summary: 'Joins file segments',
    responses: {
      200: {
        description: 'File segments were joined',
      },
    },
  });

router.post('/lsp/{lspId}/portalcat/{requestId}/tfsh/split',
  controller.splitFileSegments,
  {
    tags: [
      'PortalCAT',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: [
          'SEGMENT-JOIN_UPDATE_OWN',
          'SEGMENT-JOIN_UPDATE_ALL',
        ] },
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
      name: 'requestId',
      in: 'path',
      description: 'The request\'s id',
      required: true,
      type: 'string',
    },
    {
      name: 'data',
      in: 'body',
      description: 'JSON containing configs for file segments join',
      required: true,
      schema: {
        $ref: '#/definitions/portalcat-tfsh-split-body',
      },
    }],
    description: 'Split file segments',
    summary: 'Split file segments',
    responses: {
      200: {
        description: 'File segments were splitted',
      },
    },
  });

router.get('/lsp/{lspId}/portalcat/{requestId}/tfsh/{segmentId}',
  controller.getFileSegmentById,
  {
    tags: [
      'PortalCAT',
    ],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'requestId',
      in: 'path',
      description: 'The request\'s id to retrieve segment for',
      required: true,
      type: 'string',
    },
    {
      name: 'segmentId',
      in: 'path',
      description: 'The segment\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'workflowId',
      in: 'query',
      description: 'The workflow\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'fileId',
      in: 'query',
      description: 'The file\'s id',
      type: 'string',
      required: true,
    }],
    description: 'Returns one file\'s segment',
    summary: 'Returns one file\'s segment',
    responses: {
      200: {
        description: 'File segment',
      },
    },
  });

router.post('/lsp/{lspId}/portalcat/{requestId}/tfsh/search/replace',
  controller.replaceFileSegmentsContent,
  {
    tags: [
      'PortalCAT',
    ],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'requestId',
      in: 'path',
      description: 'The request\'s id to search segments for',
      required: true,
      type: 'string',
    },
    {
      name: 'workflowId',
      in: 'query',
      description: 'The workflow\'s id to search segments for',
      required: true,
      type: 'string',
    },
    {
      name: 'data',
      in: 'body',
      description: 'The search and replace params',
      required: true,
      schema: {
        $ref: '#/definitions/portalcat-tfsh-replace-body',
      },
    }],
    description: 'Replaces segments content',
    summary: 'Replaces segments content',
    responses: {
      200: {
        description: 'Replace results',
      },
    },
  });

router.get('/lsp/{lspId}/portalcat/{requestId}/tfsh/{segmentId}/mt',
  controller.getFileSegmentMt,
  {
    tags: [
      'PortalCAT',
    ],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'requestId',
      in: 'path',
      description: 'The request\'s id',
      required: true,
      type: 'string',
    },
    {
      name: 'segmentId',
      in: 'path',
      description: 'The segment\'s id',
      required: true,
      type: 'string',
    },
    {
      name: 'workflowId',
      in: 'query',
      description: 'The workflow\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'fileId',
      in: 'query',
      description: 'The file\'s id',
      type: 'string',
      required: true,
    }],
    description: 'Return machine translation of the given segment',
    summary: 'Return machine translation of the given segment',
    responses: {
      200: {
        description: 'File segment',
        schema: {
          type: 'object',
        },
      },
    },
  });

router.get('/lsp/{lspId}/portalcat/{requestId}/{workflowId}/files',
  controller.getSupportedFiles,
  {
    tags: [
      'PortalCAT',
    ],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'requestId',
      in: 'path',
      description: 'The request\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'workflowId',
      in: 'path',
      description: 'The workflow\'s id',
      type: 'string',
      required: true,
    }],
    description: 'Returns request\'s files supported by PortalCAT',
    summary: 'Get request\'s files',
    responses: {
      200: {
        description: 'List of files',
        schema: {
          type: 'array',
          items: {
            type: 'object',
          },
        },
      },
    },
  });

router.get('/lsp/{lspId}/portalcat/{requestId}/pipelines',
  controller.getPipelines,
  {
    tags: [
      'PortalCAT',
    ],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'requestId',
      in: 'path',
      description: 'The request\'s id to retrieve pipelines for',
      required: true,
      type: 'string',
    },
    {
      name: 'workflowId',
      in: 'query',
      description: 'The workflow\'s id to retrieve pipelines for',
      type: 'string',
      required: true,
    },
    {
      name: 'type',
      in: 'query',
      description: 'The workflow\'s id to retrieve pipelines for',
      type: 'string',
      enum: ['import', 'export', 'analysis'],
    },
    {
      name: 'fileId',
      in: 'query',
      description: 'The workflow\'s id to retrieve pipelines for',
      type: 'string',
    }],
    description: 'Retrieves pipelines for specific request',
    summary: 'Retrieves pipelines for specific request',
    responses: {
      200: {
        description: 'Array of pipelines',
        schema: {
          type: 'object',
        },
      },
    },
  });

router.get('/lsp/{lspId}/portalcat/{requestId}/pipelines/{pipelineId}/action/{actionId}/config',
  controller.getPipelineActionConfig,
  {
    tags: [
      'PortalCAT',
    ],
    'x-swagger-security': {
      roles: [{ oneOf: ['ACTION-CONFIG_READ_ALL', 'ACTION-CONFIG_UPDATE_ALL'] }],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'requestId',
      in: 'path',
      description: 'The request\'s id',
      required: true,
      type: 'string',
    },
    {
      name: 'pipelineId',
      in: 'path',
      description: 'The pipeline\'s id',
      required: true,
      type: 'string',
    },
    {
      name: 'actionId',
      in: 'path',
      description: 'The action\'s id',
      required: true,
      type: 'string',
    }],
    description: 'Retrieve a config for the pipeline action',
    summary: 'Retrieve a config for the pipeline action',
    responses: {
      200: {
        description: 'Pipeline action config',
        schema: {
          type: 'object',
        },
      },
    },
  });

router.put('/lsp/{lspId}/portalcat/{requestId}/pipelines/{pipelineId}/action/{actionId}/config',
  controller.updatePipelineActionConfig,
  {
    tags: [
      'PortalCAT',
    ],
    'x-swagger-security': {
      roles: ['ACTION-CONFIG_UPDATE_ALL'],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'requestId',
      in: 'path',
      description: 'The request\'s id',
      required: true,
      type: 'string',
    },
    {
      name: 'pipelineId',
      in: 'path',
      description: 'The pipeline\'s id',
      required: true,
      type: 'string',
    },
    {
      name: 'actionId',
      in: 'path',
      description: 'The action\'s id',
      required: true,
      type: 'string',
    },
    {
      name: 'data',
      in: 'body',
      description: 'JSON containing action config',
      required: true,
      schema: {
        properties: {
          config: {
            type: 'string',
          },
        },
        required: ['config'],
      },
    }],
    description: 'Retrieve a config for the pipeline action',
    summary: 'Retrieve a config for the pipeline action',
    responses: {
      200: {
        description: 'Pipeline action config',
        schema: {
          type: 'object',
        },
      },
    },
  });

router.put('/lsp/{lspId}/portalcat/{requestId}/tfsh/{segmentId}',
  controller.updateFileSegment,
  {
    tags: [
      'PortalCAT',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: [
          'SEGMENT_UPDATE_ALL',
          'SEGMENT_UPDATE_OWN',
        ] },
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
      name: 'requestId',
      in: 'path',
      description: 'The request\'s id',
      required: true,
      type: 'string',
    },
    {
      name: 'segmentId',
      in: 'path',
      description: 'The segment\'s id',
      required: true,
      type: 'string',
    },
    {
      name: 'data',
      in: 'body',
      description: 'JSON containing segment data to set',
      required: true,
      schema: {
        $ref: '#/definitions/portalcat-tfsh-update-body',
      },
    }],
    description: 'Update file segment',
    summary: 'Update file segment',
    responses: {
      200: {
        description: 'Updated file segment',
      },
    },
  });

router.patch('/lsp/{lspId}/portalcat/{requestId}/{workflowId}/{fileId}/tfsh/{segmentId}/locked',
  controller.updateFileSegmentLocked,
  {
    tags: [
      'PortalCAT',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: [
          'SEGMENT-LOCK_UPDATE_ALL',
          'SEGMENT-LOCK_UPDATE_OWN',
        ] },
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
      name: 'requestId',
      in: 'path',
      description: 'The request\'s id',
      required: true,
      type: 'string',
    },
    {
      name: 'workflowId',
      in: 'path',
      description: 'The workflow\'s id',
      required: true,
      type: 'string',
    },
    {
      name: 'fileId',
      in: 'path',
      description: 'The file\'s id',
      required: true,
      type: 'string',
    },
    {
      name: 'segmentId',
      in: 'path',
      description: 'The segment\'s id',
      required: true,
      type: 'string',
    },
    {
      name: 'data',
      in: 'body',
      description: 'JSON containing locked value to be set',
      required: true,
      schema: {
        properties: {
          locked: {
            type: 'boolean',
          },
        },
        required: ['locked'],
      },
    }],
    description: 'Update file segments locked status',
    summary: 'Update file segments locked status',
    responses: {
      200: {
        description: 'Updated file segment',
      },
    },
  });

router.patch('/lsp/{lspId}/portalcat/{requestId}/{workflowId}/{taskId}/{fileId}/tfsh/{segmentId}/qaissues',
  controller.updateFileSegmentQaIssues,
  {
    tags: [
      'PortalCAT',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: [
          'SEGMENT_UPDATE_ALL',
          'SEGMENT_UPDATE_OWN',
        ] },
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
      name: 'requestId',
      in: 'path',
      description: 'The request\'s id',
      required: true,
      type: 'string',
    },
    {
      name: 'workflowId',
      in: 'path',
      description: 'The workflow\'s id',
      required: true,
      type: 'string',
    },
    {
      name: 'taskId',
      in: 'path',
      description: 'The task\'s id',
      required: true,
      type: 'string',
    },
    {
      name: 'fileId',
      in: 'path',
      description: 'The file\'s id',
      required: true,
      type: 'string',
    },
    {
      name: 'segmentId',
      in: 'path',
      description: 'The segment\'s id',
      required: true,
      type: 'string',
    },
    {
      name: 'data',
      in: 'body',
      description: 'JSON containing qaIssues value to be set',
      required: true,
      schema: {
        properties: {
          qaIssues: {
            type: 'array',
          },
        },
        required: ['qaIssues'],
      },
    }],
    description: 'Update file segments QA issues',
    summary: 'Update file segments QA issues',
    responses: {
      200: {
        description: 'Updated file segment',
      },
    },
  });

router.get('/lsp/{lspId}/portalcat/{requestId}/tfsh/{segmentId}/history',
  controller.getFileSegmentHistory,
  {
    tags: [
      'PortalCAT',
    ],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'requestId',
      in: 'path',
      description: 'The request\'s id',
      required: true,
      type: 'string',
    },
    {
      name: 'segmentId',
      in: 'path',
      description: 'The segment\'s id',
      required: true,
      type: 'string',
    },
    {
      name: 'fileId',
      in: 'query',
      description: 'The file\'s id',
      required: true,
      type: 'string',
    },
    {
      name: 'workflowId',
      in: 'query',
      description: 'The workflow\'s id',
      required: true,
      type: 'string',
    }],
    description: 'Get file segment history',
    summary: 'Get file segment history',
    responses: {
      200: {
        description: 'File segment history',
      },
    },
  });

router.get('/lsp/{lspId}/portalcat/{requestId}/repetitions',
  controller.getRequestRepetitions,
  {
    tags: [
      'PortalCAT',
    ],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'requestId',
      in: 'path',
      description: 'The request\'s id',
      required: true,
      type: 'string',
    },
    {
      name: 'tgtLang',
      in: 'query',
      description: 'Target language for filtering',
      type: 'string',
    }],
    description: 'Get all segments repetitions',
    summary: 'Get all segments repetitions',
    responses: {
      200: {
        description: 'Segments repetitions',
      },
    },
  });

router.get('/lsp/{lspId}/portalcat/{requestId}/tm/search',
  controller.searchTm,
  {
    tags: [
      'PortalCAT',
    ],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'requestId',
      in: 'path',
      description: 'The request\'s id',
      required: true,
      type: 'string',
    },
    {
      name: 'workflowId',
      in: 'query',
      description: 'The workflow\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'searchIn',
      in: 'query',
      description: 'Where to search (source or target)',
      type: 'string',
      required: true,
      enum: ['source', 'target'],
    },
    {
      name: 'threshold',
      in: 'query',
      description: 'Minimum allowed match',
      type: 'number',
    },
    {
      name: 'isConcordanceSearch',
      in: 'query',
      description: 'Specifies if concordance search should be performed',
      type: 'boolean',
    },
    {
      name: 'text',
      in: 'query',
      description: 'Text search term',
      type: 'string',
      required: true,
    }],
    description: 'Searches TM for segment matches',
    summary: 'Searches TM for segment matches',
    responses: {
      200: {
        description: 'Array of segments',
        schema: {
          type: 'object',
        },
      },
    },
  });

router.get('/lsp/{lspId}/portalcat/{requestId}/tb/search',
  controller.searchTb,
  {
    tags: [
      'PortalCAT',
    ],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'requestId',
      in: 'path',
      description: 'The request\'s id',
      required: true,
      type: 'string',
    },
    {
      name: 'workflowId',
      in: 'query',
      description: 'The workflow\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'searchIn',
      in: 'query',
      description: 'Where to search (source or target)',
      type: 'string',
      required: true,
      enum: ['source', 'target'],
    },
    {
      name: 'threshold',
      in: 'query',
      description: 'Minimum allowed match',
      type: 'number',
    },
    {
      name: 'text',
      in: 'query',
      description: 'Text search term',
      type: 'string',
      required: true,
    }],
    description: 'Searches TB for segment matches',
    summary: 'Searches TB for segment matches',
    responses: {
      200: {
        description: 'Array of segments',
        schema: {
          type: 'object',
        },
      },
    },
  });

router.get('/lsp/{lspId}/portalcat/{requestId}/statistics/status',
  controller.getRequestAnalysisStatus,
  {
    tags: [
      'PortalCAT',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['STATISTICS_READ_ALL', 'STATISTICS_READ_OWN', 'STATISTICS_READ_COMPANY', 'STATISTICS_CREATE_ALL'] },
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
      name: 'requestId',
      in: 'path',
      description: 'The request\'s id request analysis belongs to',
      required: true,
      type: 'string',
    }],
    description: 'Returns the status of the statistical analysis',
    summary: 'Returns the status of the statistical analysis',
    responses: {
      200: {
        description: 'Analysis status',
        schema: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
            },
          },
        },
      },
      401: {
        description: 'User is not authenticated',
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

router.post('/lsp/{lspId}/portalcat/{requestId}/statistics',
  controller.performRequestAnalysis,
  {
    tags: [
      'PortalCAT',
    ],
    'x-swagger-security': {
      roles: ['STATISTICS_CREATE_ALL'],
    },
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'requestId',
      in: 'path',
      description: 'The request\'s id request analysis belongs to',
      required: true,
      type: 'string',
    },
    {
      name: 'data',
      in: 'body',
      description: 'request pcSettings',
      required: true,
      schema: {
        $ref: '#/definitions/request-pcSettings',
      },
    },
    ],
    description: 'Triggers the generation of the statistical analysis',
    summary: 'Triggers the generation of the statistical analysis',
    responses: {
      200: {
        description: 'Analysis generation started message',
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
            },
          },
        },
      },
      401: {
        description: 'User is not authenticated',
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

router.get('/lsp/{lspId}/portalcat/{requestId}/statistics',
  controller.getRequestAnalysis,
  {
    tags: [
      'PortalCAT',
    ],
    'x-swagger-security': {
      roles: [
        { oneOf: ['STATISTICS_READ_ALL', 'STATISTICS_READ_OWN', 'STATISTICS_READ_COMPANY'] },
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
      name: 'requestId',
      in: 'path',
      description: 'The request\'s id request analysis belongs to',
      required: true,
      type: 'string',
    },
    {
      name: 'withFuzzyMatches',
      in: 'query',
      description: 'Internal fuzzy matches were calculated in all files',
      type: 'boolean',
    }],
    description: 'Returns a statistical analysis of the request',
    summary: 'Returns a statistical analysis of the request',
    responses: {
      200: {
        description: 'Request analysis',
        schema: {
          type: 'object',
          properties: {
            requestAnalysis: {
              type: 'array',
              items: {
                $ref: '#/definitions/portalcat-request-analysis',
              },
            },
          },
        },
      },
      401: {
        description: 'User is not authenticated',
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

router.get('/lsp/{lspId}/portalcat/{requestId}/progress',
  controller.getRequestProgress,
  {
    tags: [
      'PortalCAT',
    ],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'requestId',
      in: 'path',
      description: 'The request\'s id to get progress for',
      required: true,
      type: 'string',
    }],
    description: 'Returns translation progress for a request',
    summary: 'Returns translation progress for a request',
    responses: {
      200: {
        description: 'Request progress',
      },
      401: {
        description: 'User is not authenticated',
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

router.get('/lsp/{lspId}/portalcat/{requestId}/qa-issues',
  controller.getRequestQaIssues,
  {
    tags: [
      'PortalCAT',
    ],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'requestId',
      in: 'path',
      description: 'The request\'s id to get issues for',
      required: true,
      type: 'string',
    }],
    description: 'Returns QA issues in a request',
    summary: 'Returns QA issues in a request',
    responses: {
      200: {
        description: 'Request QA issues',
      },
      401: {
        description: 'User is not authenticated',
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

router.get('/lsp/{lspId}/portalcat/{requestId}/{workflowId}/{taskId}/progress',
  controller.getTaskProgress,
  {
    tags: [
      'PortalCAT',
    ],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'requestId',
      in: 'path',
      description: 'The request\'s id to get progress for',
      required: true,
      type: 'string',
    },
    {
      name: 'workflowId',
      in: 'path',
      description: 'The workflow\'s id to get progress for',
      required: true,
      type: 'string',
    },
    {
      name: 'taskId',
      in: 'path',
      description: 'The tasks\'s id to get progress for',
      required: true,
      type: 'string',
    }],
    description: 'Returns translation progress for a task',
    summary: 'Returns translation progress for a task',
    responses: {
      200: {
        description: 'Task progress',
      },
      401: {
        description: 'User is not authenticated',
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

router.get('/lsp/{lspId}/portalcat/{requestId}/final/info',
  controller.getFinalFilesListByRequest,
  {
    tags: [
      'PortalCAT',
    ],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'requestId',
      in: 'path',
      description: 'The request\'s id to get names of final files for',
      required: true,
      type: 'string',
    }],
    description: 'Returns names of final files for a request',
    summary: 'Returns names of final files for a request',
    responses: {
      200: {
        description: 'Names of final files',
      },
      401: {
        description: 'User is not authenticated',
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

router.get('/lsp/{lspId}/portalcat/{requestId}/final/download',
  controller.getFinalFilesZipByRequest,
  {
    tags: [
      'PortalCAT',
    ],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'requestId',
      in: 'path',
      description: 'The request\'s id to get final files for',
      required: true,
      type: 'string',
    }],
    description: 'Returns zip file that contains final files for a request',
    summary: 'Returns zip file that contains final files for a request',
    responses: {
      200: {
        description: 'Final files',
      },
      401: {
        description: 'User is not authenticated',
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

router.get('/lsp/{lspId}/portalcat/{requestId}/sl/{srcLang}/tl/{tgtLang}/final/info',
  controller.getFinalFilesListByRequestLanguageCombination,
  {
    tags: [
      'PortalCAT',
    ],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'requestId',
      in: 'path',
      description: 'The request\'s id to get names of final files for',
      required: true,
      type: 'string',
    },
    {
      name: 'srcLang',
      in: 'path',
      description: 'The source language to get final files for',
      required: true,
      type: 'string',
    },
    {
      name: 'tgtLang',
      in: 'path',
      description: 'The target language to get final files for',
      required: true,
      type: 'string',
    }],
    description: 'Returns names of final files for a request with source and target language combination',
    summary: 'Returns names of final files for a request with source and target language combination',
    responses: {
      200: {
        description: 'Names of final files',
      },
      401: {
        description: 'User is not authenticated',
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

router.get('/lsp/{lspId}/portalcat/{requestId}/sl/{srcLang}/tl/{tgtLang}/final/download',
  controller.getFinalFilesZipByRequestLanguageCombination,
  {
    tags: [
      'PortalCAT',
    ],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'requestId',
      in: 'path',
      description: 'The request\'s id to get final files for',
      required: true,
      type: 'string',
    },
    {
      name: 'srcLang',
      in: 'path',
      description: 'The source language to get final files for',
      required: true,
      type: 'string',
    },
    {
      name: 'tgtLang',
      in: 'path',
      description: 'The target language to get final files for',
      required: true,
      type: 'string',
    }],
    description: 'Returns zip file that contains final files for a request with source and target language combination',
    summary: 'Returns zip file that contains final files for a request with source and target language combination',
    responses: {
      200: {
        description: 'Final files',
      },
      401: {
        description: 'User is not authenticated',
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

router.get('/lsp/{lspId}/portalcat/{requestId}/{workflowId}/{fileId}/segments/confirm',
  controller.confirmAllSegments,
  {
    tags: [
      'PortalCAT',
    ],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'requestId',
      in: 'path',
      description: 'The request\'s id to retrieve segments for',
      required: true,
      type: 'string',
    },
    {
      name: 'workflowId',
      in: 'path',
      description: 'The workflow\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'fileId',
      in: 'path',
      description: 'The file\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'status',
      in: 'query',
      description: 'The status to be set in all segments',
      type: 'string',
    }],
    description: 'Confirms all segments in a file',
    summary: 'Confirms all segments in a file',
    responses: {
      200: {
        description: 'All segments were successfully confirmed',
      },
    },
  });

router.get('/lsp/{lspId}/portalcat/{requestId}/{workflowId}/{fileId}/segments/ignore',
  controller.ignoreAllIssues,
  {
    tags: [
      'PortalCAT',
    ],
    parameters: [{
      name: 'lspId',
      in: 'path',
      description: 'The lsp\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'requestId',
      in: 'path',
      description: 'The request\'s id to retrieve segments for',
      required: true,
      type: 'string',
    },
    {
      name: 'workflowId',
      in: 'path',
      description: 'The workflow\'s id',
      type: 'string',
      required: true,
    },
    {
      name: 'fileId',
      in: 'path',
      description: 'The file\'s id',
      type: 'string',
      required: true,
    }],
    description: 'Ignores all QA issues in all segments',
    summary: 'Ignores all QA issues in all segments',
    responses: {
      200: {
        description: 'All segments were successfully updated',
      },
    },
  });

router.definition('portalcat-pipeline-status', {
  properties: {
    id: {
      type: 'string',
    },
    srcLang: {
      type: 'string',
    },
    tgtLang: {
      type: 'string',
    },
    fileName: {
      type: 'string',
    },
    status: {
      type: 'string',
    },
  },
});

router.definition('portalcat-manipulate-pipelines-body', {
  properties: {
    scope: {
      type: 'string',
      enum: ['file', 'task', 'request'],
    },
    pipelineId: {
      type: 'string',
    },
    workflowId: {
      type: 'string',
    },
  },
  required: ['scope', 'pipelineId', 'workflowId'],
});

router.definition('portalcat-tfsh-join-body', {
  properties: {
    workflowId: {
      type: 'string',
    },
    fileId: {
      type: 'string',
    },
    segmentsIds: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
  },
  required: ['workflowId', 'fileId', 'segmentsIds'],
});

router.definition('portalcat-tfsh-split-body', {
  properties: {
    workflowId: {
      type: 'string',
    },
    fileId: {
      type: 'string',
    },
    position: {
      type: 'number',
    },
    segmentId: {
      type: 'string',
    },
  },
  required: ['workflowId', 'fileId', 'segmentId', 'position'],
});

router.definition('portalcat-tfsh-update-body', {
  properties: {
    workflowId: {
      type: 'string',
    },
    fileId: {
      type: 'string',
    },
    taskId: {
      type: 'string',
    },
    segment: {
      type: 'object',
    },
  },
  required: ['workflowId', 'fileId', 'taskId', 'segment'],
});

router.definition('assignment-user', {
  properties: {
    userId: {
      type: 'string',
    },
    userType: {
      type: 'string',
    },
  },
});

router.definition('portalcat-tfsh-assign-body', {
  properties: {
    workflowId: {
      type: 'string',
    },
    fileId: {
      type: 'string',
    },
    users: {
      type: 'array',
      items: {
        $ref: '#/definitions/assignment-user',
      },
    },
    segmentsIds: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
  },
  required: ['workflowId', 'fileId', 'users', 'segmentsIds'],
});

router.definition('portalcat-analysis-bucket', {
  properties: {
    numSegments: {
      type: 'number',
    },
    numWords: {
      type: 'number',
    },
    numCharsNoSpaces: {
      type: 'number',
    },
    numCharsWithSpaces: {
      type: 'number',
    },
    percent: {
      type: 'number',
    },
  },
});

router.definition('portalcat-file-statistics', {
  properties: {
    resources: {
      type: 'string',
    },
    totals: {
      $ref: '#/definitions/portalcat-analysis-bucket',
    },
    repetitions: {
      $ref: '#/definitions/portalcat-analysis-bucket',
    },
    match101: {
      $ref: '#/definitions/portalcat-analysis-bucket',
    },
    match100: {
      $ref: '#/definitions/portalcat-analysis-bucket',
    },
    match95to99: {
      $ref: '#/definitions/portalcat-analysis-bucket',
    },
    match85to94: {
      $ref: '#/definitions/portalcat-analysis-bucket',
    },
    match75to84: {
      $ref: '#/definitions/portalcat-analysis-bucket',
    },
    noMatch: {
      $ref: '#/definitions/portalcat-analysis-bucket',
    },
  },
});

router.definition('portalcat-request-analysis', {
  properties: {
    requestAnalysis: {
      properties: {
        lspId: {
          type: 'string',
        },
        companyId: {
          type: 'string',
        },
        requestId: {
          type: 'string',
        },
        pipelines: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        createdWith: {
          type: 'string',
        },
        createdBy: {
          type: 'string',
        },
        createdAt: {
          type: 'string',
        },
        withFuzzyMatches: {
          type: 'boolean',
        },
        userId: {
          type: 'string',
        },
        userType: {
          type: 'string',
        },
        userName: {
          type: 'string',
        },
        statistics: {
          $ref: '#/definitions/portalcat-file-statistics',
        },
        statisticsByFile: {
          type: 'array',
          items: {
            $ref: '#/definitions/portalcat-file-statistics',
          },
        },
      },
    },
  },
});

router.definition('portalcat-tfsh-search-body', {
  properties: {
    params: {
      type: 'object',
    },
  },
  required: ['params'],
});

router.definition('portalcat-tfsh-replace-body', {
  properties: {
    params: {
      type: 'object',
    },
    scope: {
      type: 'string',
      enum: ['all', 'one'],
    },
    fileId: {
      type: 'string',
    },
  },
  required: ['params', 'scope', 'fileId'],
});
router.definition('request-pcSettings', {
  properties: {
    includeInClientStatistics: {
      type: 'boolean',
    },
    includeInProviderStatistics: {
      type: 'boolean',
    },
  },
  required: ['includeInClientStatistics', 'includeInProviderStatistics'],
});
module.exports = router;
