const _ = require('lodash');
const handlebars = require('handlebars');
const helpers = require('helpers-for-handlebars');
const path = require('path');
const fs = require('fs');
const { getUserFromSession } = require('../../../utils/request');
const ArApTestsApi = require('./ar-ap-tests-api');
const loadCustomHelpers = require('../../../utils/handlebars');

helpers({ handlebars });
loadCustomHelpers(handlebars);

module.exports = {
  async createTestRequestsForApAr(req, res) {
    const user = getUserFromSession(req);
    const quantity = _.get(req, 'swagger.params.quantity.value');
    const mockBills = _.get(req, 'swagger.params.mockBills.value');
    const paymentMethod = _.get(req, 'swagger.params.paymentMethod.value');
    const isE2e = _.get(req, 'swagger.params.isE2e.value');
    const api = new ArApTestsApi(req.$logger, { user, flags: req.flags });
    const entitiesData = await api.createTestRequests({
      quantity, mockBills, paymentMethod, isE2e,
    });
    const templatePath = path.join(__dirname, 'templates', 'ar-ap-requests.html');
    const templateHtml = fs.readFileSync(templatePath, { encoding: 'utf-8' });
    const template = handlebars.compile(templateHtml);

    res.send(template(entitiesData));
  },

  async purgeTestData(req, res) {
    const user = getUserFromSession(req);
    const requestNumbers = _.get(req, 'swagger.params.requestNumbers.value');
    const api = new ArApTestsApi(req.$logger, { user, flags: req.flags });
    await api.purgeTestData(requestNumbers);
    res.send(`
      <div data-e2e-type="test-entities-body">
        <p>Entities were purged successfully</p>
      </div>
    `);
  },
};
