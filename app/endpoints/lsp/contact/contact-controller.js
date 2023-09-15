const _ = require('lodash');
const requestUtils = require('../../../utils/request');
const configuration = require('../../../components/configuration');
const ContactApi = require('./contact-api');
const { RestError, sendResponse } = require('../../../components/api-response');

module.exports = {
  async contactList(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const companyId = _.get(req, 'swagger.params.companyId.value');
    try {
      const contactApi = new ContactApi(req.$logger, { user, configuration });
      const listData = await contactApi.contactList(companyId);
      return sendResponse(res, 200, listData);
    } catch (error) {
      throw new RestError(500, { message: `Failed to retrieve contact list ${error}` });
    }
  },

  async contactSalesRepDetails(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const contactId = _.get(req, 'swagger.params.contactId.value');
    const contactApi = new ContactApi(req.$logger, { user, configuration });
    const contact = await contactApi.contactSalesRepDetails(contactId);
    return sendResponse(res, 200, { contact });
  },

  async contactHierarchyList(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const companyId = _.get(req, 'swagger.params.companyId.value');
    try {
      const contactApi = new ContactApi(req.$logger, { user, configuration });
      const contactList = await contactApi.getContactsHierarchy(companyId);
      const response = { list: contactList, total: contactList.length };
      return sendResponse(res, 200, response);
    } catch (error) {
      throw new RestError(500, { message: `Failed to retrieve contact list ${error}` });
    }
  },
};
