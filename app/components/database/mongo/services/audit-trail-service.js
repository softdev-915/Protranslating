const GenericService = require('./generic-service');
const mongoConnection = require('../index');
const nullLogger = require('../../../log/null-logger');

const AUDIT_TRAILS = 'audit_trails';

class AuditTrailService extends GenericService {
  constructor(logger = nullLogger) {
    super(AUDIT_TRAILS, logger, mongoConnection.auditDb);
  }
}

module.exports = AuditTrailService;
