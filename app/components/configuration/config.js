exports.config = {
  paths: {
    api: '/api',
    apiDocs: '/swagger-docs',
    readme: '/docs',
    swaggerUi: '/api-docs',
  },
  email: {
    ssl: false,
    tls: false,
    authentication: [],
  },
  mongodb: {
    database: 'lms',
  },
  security: {
    session: {
      cookieName: 'lms-session',
      secret: 'aB53YaSJsWsX2g1WadarvfQcoJ6zaeY2pVwaGMZ3',
      saveUninitialized: false,
      resave: false,
    },
  },
  swagger: {
    docTitle: 'LMS Rest API',
    docDescription: 'LMS Server Rest Api',
  },
};
