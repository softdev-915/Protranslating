const Audit = require('./audit');

const severityArguments = process.argv[2].split('=')[1].split('|');
const auditProcess = new Audit(severityArguments);
auditProcess.start();
