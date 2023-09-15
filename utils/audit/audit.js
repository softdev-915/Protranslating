/* eslint-disable no-console */
const { spawn } = require('child_process');
const _ = require('lodash');
const Auditrc = require('./auditrc');

class Audit {
  constructor(failOn) {
    this.failOn = failOn;
    this.allVulnerabilities = [];
    this.filtered = [];
    this.audit = null;
  }

  start() {
    this.audit = spawn('npm', ['audit', '--json']);
    this.audit.stdout.on('data', this.onData.bind(this));
    this.audit.stderr.on('data', this.onError);
    this.audit.on('close', this.onClose);
  }

  hasVulnerabilities() {
    return this.filtered.some((pckg) => this.failOn.includes(pckg.severity));
  }

  report() {
    this.filtered.forEach((pckg) => {
      const name = `${pckg.name} (`;
      const color = pckg.severity === 'critical' ? '\x1b[35m' : '\x1b[31m';
      const viaChain = pckg.via.map(p => p.name ?? p).join(' <- ');
      const link = `) via [${viaChain}]`;
      console.error(`%s${color}%s\x1b[0m%s`, name, pckg.severity, link);
    });
    console.log();
  }

  onData(data) {
    const vulnerabilitiesData = _.get(JSON.parse(data), 'vulnerabilities', {});
    this.allVulnerabilities = Object.values(vulnerabilitiesData);
    this.filtered = new Auditrc(this.failOn).filter(this.allVulnerabilities);
    if (this.hasVulnerabilities()) {
      this.report();
      process.exit(1);
    }
    console.info('\x1b[32m%s\x1b[0m', 'No security issues');
    process.exit();
  }

  onError(data) {
    console.error('ERROR:', JSON.parse(data));
  }

  onClose(code) {
    console.log(`'npm audit' exited with code ${code}`);
  }
}

module.exports = Audit;
