const fs = require('fs');
const path = require('path');
const _ = require('lodash');

class Auditrc {
  constructor(failOn) {
    this.failOn = failOn;
    this.data = this.readFile();
    this.newVulnerabilities = _.get(this.data, 'exceptions.vulnerabilities', []);
    this.packages = _.get(this.data, 'exceptions.packages', []);
  }

  readFile() {
    try {
      const auditrcFilePath = path.join(__dirname, '../../', '.auditrc');
      const auditrcFile = fs.readFileSync(auditrcFilePath, 'utf8');
      return JSON.parse(auditrcFile);
    } catch (err) {
      return {};
    }
  }

  _filterByPackages(packages) {
    const result = _.differenceWith(packages, this.packages, (a, b) => a.name === b);
    return result;
  }

  filter(allVulnerabilities) {
    const vulnerabilities = _.omitBy(allVulnerabilities, (v) => !v.isDirect);
    const packages = Object.keys(vulnerabilities).map((key) => vulnerabilities[key]);
    return this._filterByPackages(packages);
  }
}

module.exports = Auditrc;
