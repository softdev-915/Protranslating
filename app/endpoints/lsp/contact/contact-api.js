const mongoose = require('mongoose');
const _ = require('lodash');
const rolesUtils = require('../../../utils/roles');
const SchemaAwareAPI = require('../../schema-aware-api');
const apiResponse = require('../../../components/api-response');
const helper = require('../request/request-api-helper');
const { areObjectIdsEqual } = require('../../../utils/schema');

const { ObjectId } = mongoose.Types;
const { RestError } = apiResponse;

class ContactApi extends SchemaAwareAPI {
  /**
   * Returns the contact's list of the user company's hierarchy
   * @param {String} companyId if passed, it will be used for the company hierarchy filter
   */
  async contactList(companyId) {
    const company = _.get(this.user, 'company', null);
    const companyFilterId = companyId || _.get(company, '_id');
    if (_.isNil(companyFilterId)) {
      return { list: [], total: 0 };
    }
    const companyFamily = await this.schema.Company.find({
      lspId: this.lspId,
      $or: [{
        _id: new ObjectId(companyId),
      }, {
        'parentCompany._id': new ObjectId(companyId),
      }, {
        'parentCompany.parentCompany._id': new ObjectId(companyId),
      }, {
        'parentCompany.parentCompany.parentCompany._id': new ObjectId(companyId),
      }],
    }, { _id: 1, parentCompany: 1 });
    const givenCompany = companyFamily.find((c) => areObjectIdsEqual(c, companyId));
    this._checkUserCanReadContacts(givenCompany);
    const companyIds = companyFamily.map((c) => c._id);
    const contactList = await this._getContactsByCompanyIds(companyIds);
    return {
      list: contactList,
      total: contactList.length,
    };
  }

  async getContactsHierarchy(companyId) {
    const company = _.get(this.user, 'company', null);
    const companyFilterId = companyId || _.get(company, '_id');
    if (_.isNil(companyFilterId)) {
      return [];
    }
    const companiesHierarchy = await this.schema.Company.aggregate([
      { $match: { lspId: this.lspId, _id: new ObjectId(companyFilterId) } },
      {
        $graphLookup: {
          from: 'companies',
          startWith: '$parentCompany._id',
          connectFromField: 'parentCompany._id',
          connectToField: '_id',
          as: 'companyHierarchy',
          maxDepth: 3,
        },
      },
    ]);
    if (!companiesHierarchy.length) {
      throw new RestError(400, { message: `Company with ID ${companyFilterId} does not exist` });
    }
    const companyHierarchy = companiesHierarchy[0];
    this._checkUserCanReadContacts(companyHierarchy);
    const companyIds = companyHierarchy.companyHierarchy.map((c) => c._id);
    companyIds.push(companyHierarchy._id);
    const contactList = await this._getContactsByCompanyIds(companyIds);
    return contactList;
  }

  _checkUserCanReadContacts(company) {
    const userRoles = rolesUtils.getRoles(this.user);
    const canReadAll = rolesUtils.hasRole('CONTACT_READ_ALL', userRoles);
    if (!canReadAll && !helper._isCompanyOnHierarchy(this.user, company)) {
      throw new RestError(403, { message: 'You don\'t have access to this company' });
    }
  }

  async _getContactsByCompanyIds(companyIds) {
    const query = {
      lsp: this.lspId,
      type: 'Contact',
      company: { $in: companyIds },
    };
    const queryFields = {
      company: 1,
      deleted: 1,
      terminated: 1,
      email: 1,
      lsp: 1,
      _id: 1,
      firstName: 1,
      middleName: 1,
      lastName: 1,
      'contactDetails.billingAddress': 1,
      'contactDetails.billingEmail': 1,
      'contactDetails.salesRep': 1,
      'siConnector.isSynced': 1,
    };
    const result = await this.schema.User.findWithDeleted(query, queryFields).populate({
      path: 'contactDetails.salesRep',
      select: '_id firstName lastName email',
    });
    return result;
  }

  async contactSalesRepDetails(_id) {
    const query = { lsp: this.lspId, _id };
    const queryFields = { contactDetails: 1 };
    const contact = await this.schema.User.findOneWithDeleted(query, queryFields).populate({
      path: 'contactDetails.salesRep',
      select: '_id firstName lastName deleted terminated',
    });
    return contact;
  }
}

module.exports = ContactApi;
