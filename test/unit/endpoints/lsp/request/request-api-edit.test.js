/* eslint-disable no-unused-expressions,class-methods-use-this */
/* global describe, it, before, beforeEach, after, afterEach */
/*
const chai = require('chai');
const faker = require('faker');
const mongoose = require('mongoose');
require('mocha');

const nullLogger = require('../../../../../app/components/log/null-logger');

const expect = chai.expect;

const mockConf = require('../../../components/configuration');
const FileStorageFacadeMock = require('../../../components/file-storage/mock-file-storage-facade');

const RequestAPI = require('../../../../../app/endpoints/lsp/request/request-api');

const { buildSchema } = require('../../../components/database/mongo/schemas');
const { loadData } = require('../../../components/database/mongo/schemas/helper');

const mockSchema = (schema, data) => loadData(schema, {
  Company: data.company,
  User: data.users,
  DocumentProspect: data.documents,
  Request: data.request,
});

const mockRequestAPI = (schema, data, userLogged) => {
  const user = userLogged || { email: '', password: '' };
  const requestAPI = new RequestAPI({
    user,
    configuration: mockConf,
    log: nullLogger,
  });
  requestAPI.cidrCheck = () => true;
  FileStorageFacadeMock._clearInstances();
  return mockSchema(schema, data).then(() => {
    requestAPI.schema = schema;
    requestAPI.FileStorageFacade = FileStorageFacadeMock;
    return requestAPI;
  });
};

const mockUser = (templateUser) => {
  const firstName = faker.name.firstName();
  const lastName = faker.name.lastName();
  const randomNumber = faker.random.number();
  const email = `${firstName}.${lastName}_${randomNumber}@protranslating.com`;
  const lspId = mongoose.Types.ObjectId();
  const user = {
    _id: new mongoose.Types.ObjectId(),
    email,
    firstName,
    lastName,
    roles: [],
    groups: [],
    lsp: lspId,
  };
  if (templateUser) {
    Object.assign(user, templateUser);
  }
  return user;
};

describe('RequestAPI.edit', () => {
  let schema;
  beforeEach(() => buildSchema().then((s) => {
    schema = s;
  }));

  it.skip('should throw an error if requestId is invalid', (done) => {
    let requestAPI;
    const companyId = mongoose.Types.ObjectId();
    const user = mockUser({ company: { _id: companyId }, roles: ['REQUEST_CREATE_ALL'] });
    const lspId = user.lsp._id;
    const company = {
      lspId,
      _id: companyId,
      name: 'company',
      parentId: null,
      subParentId: null,
      subSubParentId: null,
    };
    const editRequest = {
      _id: 'invalidID',
      company: company._id.toString(),
    };
    mockRequestAPI(schema, {
      company,
    }, user).then((reqAPI) => {
      requestAPI = reqAPI;
      return requestAPI.edit(user, editRequest);
    })
    .then(() => {
      done('it should have thrown an error');
    }).catch((err) => {
      expect(err).to.exist;
      expect(err.code).to.eql(400);
      expect(err.message).to.eql('The given requestId is invalid');
      done();
    })
    .catch(done);
  });

  it.skip('should throw an error if the request does not exist', (done) => {
    let requestAPI;
    const companyId = mongoose.Types.ObjectId();
    const user = mockUser({ company: { _id: companyId }, roles: ['REQUEST_CREATE_ALL'] });
    const lspId = user.lsp._id;
    const company = {
      lspId,
      _id: companyId,
      name: 'company',
      parentId: null,
      subParentId: null,
      subSubParentId: null,
    };
    const editRequest = {
      _id: '507f1f77bcf86cd799439011',
      company: company._id.toString(),
    };
    mockRequestAPI(schema, {
      company,
    }, user).then((reqAPI) => {
      requestAPI = reqAPI;
      return requestAPI.edit(user, editRequest);
    })
    .then(() => {
      done('it should have thrown an error');
    }).catch((err) => {
      expect(requestAPI.schema.Request.findOne.called).to.eql(true);
      expect(err).to.exist;
      expect(err.code).to.eql(404);
      expect(err.message).to.eql(`Request ${editRequest._id} does not exist`);
      done();
    })
    .catch(done);
  });

  it.skip('should deny a user to edit a request on behalf other contact if the user does not have the REQUEST_CREATE_ALL and CUSTOMER_READ_ALL role', (done) => {
    let requestAPI;
    const companyId = mongoose.Types.ObjectId();
    const contactId = mongoose.Types.ObjectId();
    const user = mockUser({ company: { _id: companyId }, roles: ['REQUEST_UPDATE_OWN'] });
    const lspId = user.lsp._id;
    const request = {
      lspId,
      _id: '507f1f77bcf86cd799439011',
    };
    const company = {
      lspId,
      _id: companyId,
      name: 'company',
      parentId: null,
      subParentId: null,
      subSubParentId: null,
    };
    const contact = {
      _id: contactId,
      firstName: 'Contact',
      lastName: 'Protranslating',
      email: 'contact@protranslating.com',
      lsp: lspId,
      type: 'Contact',
      company: { _id: companyId },
    };
    const editRequest = {
      lspId,
      _id: '507f1f77bcf86cd799439011',
      company: company._id.toString(),
      contact: contact._id.toString(),
    };
    mockRequestAPI(schema, {
      company,
      users: [contact],
      request,
    }, user).then((reqAPI) => {
      requestAPI = reqAPI;
      return requestAPI.edit(user, editRequest);
    })
    .then(() => {
      done('it should have thrown an error');
    }).catch((err) => {
      expect(requestAPI.schema.Request.findOne.called).to.eql(true);
      expect(requestAPI.schema.User.findOneAndPopulate.called).to.eql(false);
      expect(err).to.exist;
      expect(err.code).to.eql(403);
      expect(err.message).to.eql('The user is not authorized to update this request');
      done();
    })
    .catch(done);
  });

  it.skip('should deny a user to edit a request on behalf other contact if the user does not have the REQUEST_CREATE_ALL role', (done) => {
    let requestAPI;
    const companyId = mongoose.Types.ObjectId();
    const contactId = mongoose.Types.ObjectId();
    const user = mockUser({ company: { _id: companyId }, roles: ['CUSTOMER_READ_ALL'] });
    const lspId = user.lsp._id;
    const request = {
      lspId,
      _id: '507f1f77bcf86cd799439011',
    };
    const company = {
      lspId,
      _id: companyId,
      name: 'company',
      parentId: null,
      subParentId: null,
      subSubParentId: null,
    };
    const contact = {
      _id: contactId,
      firstName: 'Contact',
      lastName: 'Protranslating',
      email: 'contact@protranslating.com',
      lsp: lspId,
      type: 'Contact',
      company: { _id: companyId },
    };
    const editRequest = {
      _id: '507f1f77bcf86cd799439011',
      company: company._id.toString(),
      contact: contact._id.toString(),
    };
    mockRequestAPI(schema, {
      company,
      users: [contact],
      request,
    }, user).then((reqAPI) => {
      requestAPI = reqAPI;
      return requestAPI.edit(user, editRequest);
    })
    .then(() => {
      done('it should have thrown an error');
    }).catch((err) => {
      expect(requestAPI.schema.Request.findOne.called).to.eql(true);
      expect(requestAPI.schema.User.findOneAndPopulate.called).to.eql(false);
      expect(err).to.exist;
      expect(err.code).to.eql(403);
      expect(err.message).to.eql('The user is not authorized to update this request');
      done();
    })
    .catch(done);
  });

  it.skip('should deny a user to edit a request on behalf other contact if the user does not have the CUSTOMER_READ_ALL role', (done) => {
    let requestAPI;
    const companyId = mongoose.Types.ObjectId();
    const otherCompanyId = mongoose.Types.ObjectId();
    const contactId = mongoose.Types.ObjectId();
    const otherContactId = mongoose.Types.ObjectId();
    const user = mockUser({ company: { _id: companyId }, roles: ['REQUEST_UPDATE_ALL'] });
    const lspId = user.lsp._id;
    const request = {
      lspId,
      _id: '507f1f77bcf86cd799439011',
    };
    const company = {
      lspId,
      _id: companyId,
      name: 'company',
      parentId: null,
      subParentId: null,
      subSubParentId: null,
    };
    const otherCompany = {
      lspId,
      _id: otherCompanyId,
      name: 'other company',
      parentId: null,
      subParentId: null,
      subSubParentId: null,
    };
    const contact = {
      _id: contactId,
      lsp: lspId,
      type: 'Contact',
      company: companyId,
    };
    const otherContact = {
      _id: otherContactId,
      lsp: lspId,
      type: 'Contact',
      company: otherCompanyId,
    };
    const editRequest = {
      _id: '507f1f77bcf86cd799439011',
      company: company._id.toString(),
      contact: otherContact._id.toString(),
    };
    mockRequestAPI(schema, {
      company: [company, otherCompany],
      users: [contact, otherContact],
      request,
    }, user).then((reqAPI) => {
      requestAPI = reqAPI;
      return requestAPI.edit(user, editRequest);
    })
    .then(() => {
      done('it should have thrown an error');
    }).catch((err) => {
      expect(requestAPI.schema.Request.findOne.called).to.eql(true);
      expect(requestAPI.schema.User.findOneAndPopulate.called).to.eql(true);
      expect(err).to.exist;
      expect(err.code).to.eql(403);
      expect(err.message).to.eql('Cannot update request on behalf of other users');
      done();
    })
    .catch(done);
  });

  it.skip('should throw an error if contact does not exist', (done) => {
    let requestAPI;
    const companyId = mongoose.Types.ObjectId();
    const contactId = mongoose.Types.ObjectId();
    const user = mockUser({ company: { _id: companyId }, roles: ['REQUEST_UPDATE_ALL', 'CUSTOMER_READ_ALL'] });
    const lspId = user.lsp._id;
    const request = {
      lspId,
      _id: '507f1f77bcf86cd799439011',
    };
    const company = {
      lspId,
      _id: companyId,
      name: 'company',
      parentId: null,
      subParentId: null,
      subSubParentId: null,
    };
    const contact = {
      _id: contactId,
      lsp: lspId,
      type: 'Contact',
      company: companyId,
    };
    const editRequest = {
      _id: '507f1f77bcf86cd799439011',
      company: company._id.toString(),
      contact: new mongoose.Types.ObjectId(), // does not exist.
      documents: [],
    };
    mockRequestAPI(schema, {
      company,
      users: [contact],
      request,
    }, user).then((reqAPI) => {
      requestAPI = reqAPI;
      return requestAPI.edit(user, editRequest);
    })
    .then(() => {
      done('it should have thrown an error');
    }).catch((err) => {
      expect(requestAPI.schema.Request.findOne.called).to.eql(true);
      expect(requestAPI.schema.User.findOneAndPopulate.called).to.eql(true);
      expect(err).to.exist;
      expect(err.code).to.eql(400);
      expect(err.message).to.eql(`Contact ${editRequest.contact} does not exist`);
      done();
    })
    .catch(done);
  });

  it.skip('should deny a user to edit a request on behalf other contact if the company is not in the visible hierarchy and the user does not have the REQUEST_CREATE_ALL role', (done) => {
    let requestAPI;
    const companyId = mongoose.Types.ObjectId();
    const otherContactId = mongoose.Types.ObjectId();
    const otherCompanyId = mongoose.Types.ObjectId();
    const contactId = mongoose.Types.ObjectId();
    const user = mockUser({ company: { _id: companyId }, roles: ['CUSTOMER_READ_ALL'] });
    const lspId = user.lsp._id;
    const request = {
      lspId,
      _id: '507f1f77bcf86cd799439011',
    };
    const company = {
      lspId,
      _id: companyId,
      name: 'Company',
      parentId: null,
      subParentId: null,
      subSubParentId: null,
    };
    const otherCompany = {
      lspId,
      _id: otherCompanyId,
      name: 'Other Company',
      parentId: null,
      subParentId: null,
      subSubParentId: null,
    };
    const contact = {
      _id: contactId,
      firstName: 'first',
      lastName: 'Contact',
      lsp: lspId,
      type: 'Contact',
      company: { _id: companyId },
    };
    const otherContact = {
      _id: otherContactId,
      firstName: 'Other',
      lastName: 'Contact',
      lsp: lspId,
      type: 'Contact',
      company: otherCompanyId,
    };
    const editRequest = {
      _id: '507f1f77bcf86cd799439011',
      company: company._id.toString(),
      contact: otherContact._id.toString(),
    };
    mockRequestAPI(schema, {
      company: [company, otherCompany],
      users: [contact, otherContact],
      request,
    }, user).then((reqAPI) => {
      requestAPI = reqAPI;
      return requestAPI.edit(user, editRequest);
    })
    .then(() => {
      done('it should have thrown an error');
    }).catch((err) => {
      expect(requestAPI.schema.Request.findOne.called).to.eql(true);
      expect(requestAPI.schema.User.findOneAndPopulate.called).to.eql(false);
      expect(err).to.exist;
      expect(err.code).to.eql(403);
      expect(err.message).to.eql('The user is not authorized to update this request');
      done();
    })
    .catch(done);
  });

  it.skip('should throw an error when attempting to edit a request changing other contact with an unexisting one', (done) => {
    let requestAPI;
    const companyId = mongoose.Types.ObjectId();
    const contactId = mongoose.Types.ObjectId();
    const otherCompanyId = mongoose.Types.ObjectId();
    const otherContactId = mongoose.Types.ObjectId();
    const user = mockUser({ company: { _id: companyId }, roles: ['CUSTOMER_READ_ALL', 'REQUEST_UPDATE_ALL'] });
    const lspId = user.lsp._id;
    const request = {
      lspId,
      _id: '507f1f77bcf86cd799439011',
    };
    const company = {
      lspId,
      _id: companyId,
      name: 'company',
      parentId: null,
      subParentId: null,
      subSubParentId: null,
    };
    const contact = {
      _id: contactId,
      firstName: 'First',
      lastName: 'Contact',
      lsp: lspId,
      type: 'Contact',
      company: company._id,
    };
    const otherContact = {
      _id: otherContactId,
      firstName: 'Other',
      lastName: 'Contact',
      lsp: lspId,
      type: 'Contact',
      company: otherCompanyId,
    };
    const editRequest = {
      _id: '507f1f77bcf86cd799439011',
      company: company._id.toString(),
      contact: contact._id.toString(),
      otherContact: new mongoose.Types.ObjectId().toString(), // doesn't exist
    };
    mockRequestAPI(schema, {
      company,
      users: [contact, otherContact],
      request,
    }, user).then((reqAPI) => {
      requestAPI = reqAPI;
      return requestAPI.edit(user, editRequest);
    })
    .then(() => {
      done('it should have thrown an error');
    }).catch((err) => {
      expect(requestAPI.schema.Request.findOne.called).to.eql(true);
      expect(requestAPI.schema.User.findOneAndPopulate.called).to.eql(true);
      expect(err).to.exist;
      expect(err.code).to.eql(400);
      expect(err.message).to.eql(`Contact ${editRequest.otherContact} does not exist`);
      done();
    })
    .catch(done);
  });
  it.skip('should throw an error when attempting to edit a request changing other contact with a non contact one', (done) => {
    let requestAPI;
    const companyId = mongoose.Types.ObjectId();
    const contactId = mongoose.Types.ObjectId();
    const otherContactId = mongoose.Types.ObjectId();
    const otherCompanyId = mongoose.Types.ObjectId();
    const user = mockUser({ company: { _id: companyId }, roles: ['REQUEST_UPDATE_ALL'] });
    const lspId = user.lsp._id;
    const request = {
      lspId,
      _id: '507f1f77bcf86cd799439011',
    };
    const company = {
      lspId,
      _id: companyId,
      name: 'company',
      parentId: null,
      subParentId: null,
      subSubParentId: null,
    };
    const contact = {
      _id: contactId,
      firstName: 'First',
      lastName: 'Contact',
      lsp: lspId,
      type: 'Contact',
      company: company._id,
    };
    const otherContact = {
      _id: otherContactId,
      firstName: 'Other',
      lastName: 'Contact',
      lsp: lspId,
      type: 'Contact',
      company: otherCompanyId,
    };
    const editRequest = {
      _id: '507f1f77bcf86cd799439011',
      company: company._id.toString(),
      contact: contact._id.toString(),
      otherContact: otherContact._id.toString(),
    };
    mockRequestAPI(schema, {
      company,
      users: [contact, otherContact],
      request,
    }, user).then((reqAPI) => {
      requestAPI = reqAPI;
      return requestAPI.edit(user, editRequest);
    })
    .then(() => {
      done('it should have thrown an error');
    }).catch((err) => {
      expect(requestAPI.schema.Request.findOne.called).to.eql(true);
      expect(requestAPI.schema.User.findOneAndPopulate.called).to.eql(true);
      expect(err).to.exist;
      expect(err.code).to.eql(403);
      expect(err.message).to.eql('Cannot bind to other contact which don\'t have access to');
      done();
    })
    .catch(done);
  });

  it.skip('should throw an error when attempting to edit a request changing other contact if the company is not in the visible hierarchy and the user does not have the REQUEST_UPDATE_ALL role', (done) => {
    let requestAPI;
    const companyId = mongoose.Types.ObjectId();
    const contactId = mongoose.Types.ObjectId();
    const otherContactId = mongoose.Types.ObjectId();
    const otherCompanyId = mongoose.Types.ObjectId();
    const user = mockUser({ company: { _id: companyId }, roles: ['REQUEST_UPDATE_ALL'] });
    const lspId = user.lsp._id;
    const request = {
      lspId,
      _id: '507f1f77bcf86cd799439011',
    };
    const company = {
      lspId,
      _id: companyId,
      name: 'company',
      parentId: null,
      subParentId: null,
      subSubParentId: null,
    };
    const contact = {
      _id: contactId,
      firstName: 'First',
      lastName: 'Contact',
      lsp: lspId,
      type: 'Contact',
      company: company._id,
    };
    const otherContact = {
      _id: otherContactId,
      firstName: 'Other',
      lastName: 'Contact',
      lsp: lspId,
      type: 'Contact',
      company: otherCompanyId,
    };
    const editRequest = {
      _id: '507f1f77bcf86cd799439011',
      company: company._id.toString(),
      contact: contact._id.toString(),
      otherContact: otherContact._id.toString(),
    };
    mockRequestAPI(schema, {
      company,
      users: [contact, otherContact],
      request,
    }, user).then((reqAPI) => {
      requestAPI = reqAPI;
      return requestAPI.edit(user, editRequest);
    })
    .then(() => {
      done('it should have thrown an error');
    }).catch((err) => {
      expect(requestAPI.schema.Request.findOne.called).to.eql(true);
      expect(requestAPI.schema.User.findOneAndPopulate.called).to.eql(true);
      expect(err).to.exist;
      expect(err.code).to.eql(403);
      expect(err.message).to.eql('Cannot bind to other contact which don\'t have access to');
      done();
    })
    .catch(done);
  });

  it.skip('should deny a user to edit a request if no documents are provided', (done) => {
    let requestAPI;
    const companyId = mongoose.Types.ObjectId();
    const contactId = mongoose.Types.ObjectId();
    const otherContactId = mongoose.Types.ObjectId();
    const otherCompanyId = mongoose.Types.ObjectId();
    const user = mockUser({ company: { _id: companyId }, roles: ['REQUEST_UPDATE_ALL', 'CUSTOMER_READ_ALL'] });
    const lspId = user.lsp._id;
    const request = {
      lspId,
      _id: '507f1f77bcf86cd799439011',
    };
    const company = {
      lspId,
      _id: companyId,
      name: 'company',
      parentId: null,
      subParentId: null,
      subSubParentId: null,
    };
    const otherCompany = {
      lspId,
      _id: otherCompanyId,
      name: 'company',
      parentId: null,
      subParentId: null,
      subSubParentId: null,
    };
    const contact = {
      _id: contactId,
      firstName: 'First',
      lastName: 'Contact',
      lsp: lspId,
      type: 'Contact',
      company: company._id,
    };
    const otherContact = {
      _id: otherContactId,
      firstName: 'Other',
      lastName: 'Contact',
      lsp: lspId,
      type: 'Contact',
      company: companyId,
    };
    const editRequest = {
      _id: '507f1f77bcf86cd799439011',
      company: company._id.toString(),
      contact: contact._id.toString(),
      otherContact: otherContact._id.toString(),
      documents: [],
    };
    mockRequestAPI(schema, {
      company: [company, otherCompany],
      users: [contact, otherContact],
      request,
    }, user).then((reqAPI) => {
      requestAPI = reqAPI;
      return requestAPI.edit(user, editRequest);
    })
    .then(() => {
      done('it should have thrown an error');
    }).catch((err) => {
      expect(requestAPI.schema.Request.findOne.called).to.eql(true);
      expect(requestAPI.schema.User.findOneAndPopulate.called).to.eql(true);
      expect(err).to.exist;
      expect(err.code).to.eql(400);
      expect(err.message).to.eql('Request has no documents');
      done();
    })
    .catch(done);
  });

  it.skip('should deny a user to edit a request if at least one document is not found in the database', (done) => {
    let requestAPI;
    const companyId = mongoose.Types.ObjectId();
    const contactId = mongoose.Types.ObjectId();
    const otherContactId = mongoose.Types.ObjectId();
    const user = mockUser({ company: { _id: companyId }, roles: ['REQUEST_UPDATE_ALL', 'CUSTOMER_READ_ALL'] });
    const lspId = user.lsp._id;
    const request = {
      lspId,
      _id: '507f1f77bcf86cd799439011',
      documents: [{
        _id: '507f1f77bcf86cd799439011',
      }],
    };
    const company = {
      lspId,
      _id: companyId,
      name: 'company',
      parentId: null,
      subParentId: null,
      subSubParentId: null,
    };
    const contact = {
      _id: contactId,
      firstName: 'First',
      lastName: 'Contact',
      lsp: lspId,
      type: 'Contact',
      company: company._id,
    };
    const otherContact = {
      _id: otherContactId,
      firstName: 'Other',
      lastName: 'Contact',
      lsp: lspId,
      type: 'Contact',
      company: company._id,
    };
    const editRequest = {
      _id: '507f1f77bcf86cd799439011',
      company: company._id.toString(),
      contact: contact._id.toString(),
      otherContact: otherContact._id.toString(),
      documents: [{
        _id: '507f1f77bcf86cd799439011',
        isNew: true,
      },
      {
        _id: '507f1f77bcf86cd799439012',
        isNew: true,
      }],
    };
    mockRequestAPI(schema, {
      company,
      users: [contact, otherContact],
      request,
      documents: [{
        lspId,
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
        name: '1.txt',
        createdBy: user.email,
      }],
    }, user).then((reqAPI) => {
      requestAPI = reqAPI;
      return requestAPI.edit(user, editRequest);
    })
    .then(() => {
      done('it should have thrown an error');
    }).catch((err) => {
      expect(requestAPI.schema.Request.findOne.called).to.eql(true);
      expect(requestAPI.schema.User.findOneAndPopulate.called).to.eql(true);
      expect(err).to.exist;
      expect(err.code).to.eql(400);
      expect(err.message).to.eql('Some documents were not found');
      done();
    })
    .catch(done);
  });

  it.skip('should replace the original document content if a document name is repeated', (done) => {
    let requestAPI;
    const companyId = mongoose.Types.ObjectId();
    const contactId = mongoose.Types.ObjectId();
    const otherContactId = mongoose.Types.ObjectId();
    const user = mockUser({ company: { _id: companyId }, roles: ['REQUEST_UPDATE_ALL', 'CUSTOMER_READ_ALL'] });
    const lspId = user.lsp._id;
    const request = {
      lspId,
      company: companyId,
      _id: '507f1f77bcf86cd799439011',
      documents: [{
        _id: '507f1f77bcf86cd799439011',
        name: '1.txt',
      }],
    };
    const company = {
      lspId,
      _id: companyId,
      name: 'company',
      parentId: null,
      subParentId: null,
      subSubParentId: null,
    };
    const contact = {
      _id: contactId,
      firstName: 'First',
      lastName: 'Contact',
      lsp: lspId,
      type: 'Contact',
      company: company._id,
    };
    const otherContact = {
      _id: otherContactId,
      firstName: 'Other',
      lastName: 'Contact',
      lsp: lspId,
      type: 'Contact',
      company,
    };
    const editRequest = {
      _id: '507f1f77bcf86cd799439011',
      company: company._id.toString(),
      contact: contact._id.toString(),
      otherContact: otherContact._id.toString(),
      documents: [{
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
        oldId: '507f1f77bcf86cd799439011',
        name: '1.txt',
        isNew: true,
      }],
    };
    mockRequestAPI(schema, {
      company,
      users: [contact, otherContact],
      request,
      documents: [{
        lspId,
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
        name: '1.txt',
        createdBy: user.email,
      }],
    }, user).then((reqAPI) => {
      requestAPI = reqAPI;
      requestAPI.bucket = {
        uploadFile: () => Promise.resolve(),
        deleteFiles: () => Promise.resolve(),
      };
      return requestAPI.edit(user, editRequest);
    })
    .then((response) => {
      expect(requestAPI.schema.Request.findOne.called).to.eql(true);
      expect(requestAPI.schema.User.findOneAndPopulate.called).to.eql(true);
      expect(response.documents.length).to.eql(1);
      expect(response.documents[0]._id.toString()).to.eql('507f1f77bcf86cd799439011');
      done();
    }).catch(done);
  });

  it.skip('should ignore company', (done) => {
    let requestAPI;
    const companyId = mongoose.Types.ObjectId();
    const otherCompanyId = mongoose.Types.ObjectId();
    const contactId = mongoose.Types.ObjectId();
    const otherContactId = mongoose.Types.ObjectId();
    const user = mockUser({ company: { _id: companyId }, roles: ['REQUEST_UPDATE_ALL', 'CUSTOMER_READ_ALL'] });
    const lspId = user.lsp._id;
    const request = {
      lspId,
      company: companyId,
      _id: '507f1f77bcf86cd799439011',
      documents: [{
        _id: '507f1f77bcf86cd799439011',
        name: '1.txt',
      }],
    };
    const company = {
      lspId,
      _id: companyId,
      name: 'company',
      parentId: null,
      subParentId: null,
      subSubParentId: null,
    };
    const contact = {
      _id: contactId,
      firstName: 'First',
      lastName: 'Contact',
      lsp: lspId,
      type: 'Contact',
      company: company._id,
    };
    const otherContact = {
      _id: otherContactId,
      firstName: 'Other',
      lastName: 'Contact',
      lsp: lspId,
      type: 'Contact',
      company: company,
    };
    const editRequest = {
      _id: '507f1f77bcf86cd799439011',
      company: otherCompanyId.toString(),
      contact: contact._id.toString(),
      otherContact: otherContact._id.toString(),
      documents: [{
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
        oldId: '507f1f77bcf86cd799439011',
        name: '1.txt',
        isNew: true,
      }],
    };
    mockRequestAPI(schema, {
      company,
      users: [contact, otherContact],
      request,
      documents: [{
        lspId,
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
        name: '1.txt',
        createdBy: user.email,
      }],
    }, user).then((reqAPI) => {
      requestAPI = reqAPI;
      requestAPI.bucket = {
        uploadFile: () => Promise.resolve(),
        deleteFiles: () => Promise.resolve(),
      };
      return requestAPI.edit(user, editRequest);
    })
    .then((response) => {
      expect(requestAPI.schema.Request.findOne.called).to.eql(true);
      expect(requestAPI.schema.User.findOneAndPopulate.called).to.eql(true);
      expect(response.documents.length).to.eql(1);
      expect(response.documents[0]._id.toString()).to.eql('507f1f77bcf86cd799439011');
      expect(response.company._id.equals(otherCompanyId)).to.eql(false);
      expect(response.company._id.equals(companyId)).to.eql(true);
      done();
    }).catch(done);
  });

  it.skip('should edit a request and delete documents missing', (done) => {
    let requestAPI;
    const companyId = mongoose.Types.ObjectId();
    const contactId = mongoose.Types.ObjectId();
    const otherContactId = mongoose.Types.ObjectId();
    const user = mockUser({ company: { _id: companyId }, roles: ['REQUEST_UPDATE_ALL', 'CUSTOMER_READ_ALL'] });
    const lspId = user.lsp._id;
    const request = {
      lspId,
      _id: '507f1f77bcf86cd799439011',
      company: companyId.toString(),
      documents: [{
        _id: '507f1f77bcf86cd799439011',
        name: '1.txt',
        final: false,
        importSuccess: false,
      }],
    };
    const company = {
      lspId,
      _id: companyId,
      name: 'company',
      parentId: null,
      subParentId: null,
      subSubParentId: null,
    };
    const contact = {
      _id: contactId,
      firstName: 'First',
      lastName: 'Contact',
      lsp: lspId,
      type: 'Contact',
      company: company._id,
    };
    const otherContact = {
      _id: otherContactId,
      firstName: 'Other',
      lastName: 'Contact',
      lsp: lspId,
      type: 'Contact',
      company: company._id,
    };
    const editRequest = {
      _id: '507f1f77bcf86cd799439011',
      company: company._id.toString(),
      contact: contact._id.toString(),
      otherContact: otherContact._id.toString(),
      documents: [{
        _id: '507f1f77bcf86cd799439012',
        name: '2.txt',
        isNew: true,
      }, {
        _id: '507f1f77bcf86cd799439011',
        name: '1.txt',
        final: false,
        removed: true,
        importSuccess: false,
      }],
    };
    mockRequestAPI(schema, {
      company,
      users: [contact, otherContact],
      request,
      documents: [{
        lspId,
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
        name: '1.txt',
        importSuccess: false,
        createdBy: user.email,
      },
      {
        lspId,
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'),
        name: '2.txt',
        importSuccess: false,
        createdBy: user.email,
      },
      {
        lspId,
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439013'),
        name: '1.txt',
        importSuccess: false,
        createdBy: user.email,
      }],
    }, user).then((reqAPI) => {
      requestAPI = reqAPI;
      requestAPI.bucket = {
        uploadFile: () => Promise.resolve(),
        deleteFiles: () => Promise.resolve(),
      };
      return requestAPI.edit(user, editRequest);
    })
    .then(() => {
      expect(requestAPI.schema.Request.findOne.called).to.eql(true);
      expect(requestAPI.schema.User.findOneAndPopulate.called).to.eql(true);
      done();
    }).catch((err) => {
      done(err);
    });
  });

  it.skip('should edit a request if cidr rules match', async () => {
    const companyId = mongoose.Types.ObjectId();
    const user = mockUser({ company: { _id: companyId }, roles: ['REQUEST_UPDATE_ALL', 'CUSTOMER_READ_ALL'] });
    const lspId = user.lsp._id;
    const request = {
      lspId,
      _id: '507f1f77bcf86cd799439011',
      company: companyId.toString(),
      documents: [{
        _id: '507f1f77bcf86cd799439011',
        name: '1.txt',
        final: false,
        importSuccess: false,
      }],
    };
    const company = {
      lspId,
      _id: companyId,
      name: 'company',
      cidr: [
        { ip: '192.168.1.188/30', description: 'Test' },
      ],
    };
    const editRequest = {
      _id: '507f1f77bcf86cd799439011',
      company: company._id.toString(),
      documents: [{
        _id: '507f1f77bcf86cd799439012',
        name: '2.txt',
        isNew: true,
      }, {
        _id: '507f1f77bcf86cd799439011',
        name: '1.txt',
        final: false,
        removed: true,
        importSuccess: false,
      }],
    };
    await mockSchema(schema, {
      company,
      users: [user],
      request,
      documents: [{
        lspId,
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
        name: '1.txt',
        importSuccess: false,
        createdBy: user.email,
      },
      {
        lspId,
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'),
        name: '2.txt',
        ip: '192.168.1.190',
        importSuccess: false,
        createdBy: user.email,
      },
      {
        lspId,
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439013'),
        name: '1.txt',
        importSuccess: false,
        createdBy: user.email,
      }],
    });
    const mockBucket = {
      uploadFile: () => Promise.resolve(),
      deleteFiles: () => Promise.resolve(),
    };
    const requestAPI = new RequestAPI({
      user,
      configuration: mockConf,
      log: nullLogger,
      bucket: mockBucket,
    });
    requestAPI.schema = schema;
    requestAPI.FileStorageFacade = FileStorageFacadeMock;
    const editedRequest = await requestAPI.edit(user, editRequest);
    expect(editedRequest).to.exist;
  });

  it.skip('should not edit a request if cidr rules does not match and a file has been uploaded', async () => {
    let errorThrown;
    const companyId = mongoose.Types.ObjectId();
    const user = mockUser({ company: { _id: companyId }, roles: ['REQUEST_UPDATE_ALL', 'CUSTOMER_READ_ALL'] });
    const lspId = user.lsp._id;
    const request = {
      lspId,
      _id: '507f1f77bcf86cd799439011',
      company: companyId.toString(),
      documents: [{
        _id: '507f1f77bcf86cd799439011',
        name: '1.txt',
        ip: '1.1.1.1',
        final: false,
        importSuccess: false,
      }],
    };
    const company = {
      lspId,
      _id: companyId,
      name: 'company',
      cidr: [
        { ip: '192.168.1.188/30', description: 'Test' },
      ],
    };
    const editRequest = {
      _id: '507f1f77bcf86cd799439011',
      company: company._id.toString(),
      documents: [{
        _id: '507f1f77bcf86cd799439012',
        name: '2.txt',
        isNew: true,
      }, {
        _id: '507f1f77bcf86cd799439011',
        name: '1.txt',
        final: false,
        removed: true,
        importSuccess: false,
      }],
    };
    await mockSchema(schema, {
      company,
      users: [user],
      request,
      documents: [{
        lspId,
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
        name: '1.txt',
        importSuccess: false,
        createdBy: user.email,
      },
      {
        lspId,
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'),
        name: '2.txt',
        ip: '1.1.1.1',
        importSuccess: false,
        createdBy: user.email,
      },
      {
        lspId,
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439013'),
        name: '1.txt',
        importSuccess: false,
        createdBy: user.email,
      }],
    });
    const requestAPI = new RequestAPI({
      user,
      configuration: mockConf,
      log: nullLogger,
    });
    requestAPI.schema = schema;
    requestAPI.FileStorageFacade = FileStorageFacadeMock;
    try {
      await requestAPI.edit(user, editRequest);
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).to.exist;
    expect(errorThrown.code).eql(403);
    expect(errorThrown.message).to.eql('Document "2.txt" was uploaded from IP "1.1.1.1" which is not allowed to upload files for this company');
  });

  it.skip('should edit a request if cidr rules does not match but no file has been uploaded', async () => {
    const companyId = mongoose.Types.ObjectId();
    const user = mockUser({ company: { _id: companyId }, roles: ['REQUEST_UPDATE_ALL', 'CUSTOMER_READ_ALL'] });
    const lspId = user.lsp._id;
    const request = {
      lspId,
      _id: '507f1f77bcf86cd799439011',
      company: companyId.toString(),
      documents: [{
        _id: '507f1f77bcf86cd799439011',
        name: '1.txt',
        ip: '1.1.1.1',
        final: false,
        importSuccess: false,
      }],
    };
    const company = {
      lspId,
      _id: companyId,
      name: 'company',
      cidr: [
        { ip: '192.168.1.188/30', description: 'Test' },
      ],
    };
    const editRequest = {
      _id: '507f1f77bcf86cd799439011',
      company: company._id.toString(),
      documents: [{
        _id: '507f1f77bcf86cd799439011',
        name: '1.txt',
        final: false,
      }],
    };
    await mockSchema(schema, {
      company,
      users: [user],
      request,
      documents: [{
        lspId,
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
        name: '1.txt',
        importSuccess: false,
        createdBy: user.email,
      }],
    });
    const requestAPI = new RequestAPI({
      user,
      configuration: mockConf,
      log: nullLogger,
    });
    requestAPI.schema = schema;
    requestAPI.FileStorageFacade = FileStorageFacadeMock;
    const editedRequest = await requestAPI.edit(user, editRequest);
    expect(editedRequest).to.exist;
  });

  it.skip('should remove deleted files from the file system', async () => {
    const companyId = mongoose.Types.ObjectId();
    const contactId = mongoose.Types.ObjectId();
    const otherContactId = mongoose.Types.ObjectId();
    const user = mockUser({ company: { _id: companyId }, roles: ['REQUEST_UPDATE_ALL', 'CUSTOMER_READ_ALL'] });
    const lspId = user.lsp._id;
    const request = {
      lspId,
      _id: '507f1f77bcf86cd799439011',
      company: companyId.toString(),
      documents: [{
        _id: '507f1f77bcf86cd799439011',
        name: '1.txt',
        final: false,
        importSuccess: false,
      }],
    };
    const company = {
      lspId,
      _id: companyId,
      name: 'company',
      parentId: null,
      subParentId: null,
      subSubParentId: null,
    };
    const contact = {
      _id: contactId,
      firstName: 'First',
      lastName: 'Contact',
      lsp: lspId,
      type: 'Contact',
      company: company._id,
    };
    const otherContact = {
      _id: otherContactId,
      firstName: 'Other',
      lastName: 'Contact',
      lsp: lspId,
      type: 'Contact',
      company: company._id,
    };
    const editRequest = {
      _id: '507f1f77bcf86cd799439011',
      company: company._id.toString(),
      contact: contact._id.toString(),
      otherContact: otherContact._id.toString(),
      documents: [{
        _id: '507f1f77bcf86cd799439012',
        name: '2.txt',
        isNew: true,
      }, {
        _id: '507f1f77bcf86cd799439011',
        name: '1.txt',
        final: false,
        removed: true,
        importSuccess: false,
      }],
    };
    const requestAPI = await mockRequestAPI(schema, {
      company,
      users: [contact, otherContact],
      request,
      documents: [{
        lspId,
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
        name: '1.txt',
        importSuccess: false,
        createdBy: user.email,
      },
      {
        lspId,
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'),
        name: '2.txt',
        importSuccess: false,
        createdBy: user.email,
      },
      {
        lspId,
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439013'),
        name: '1.txt',
        importSuccess: false,
        createdBy: user.email,
      }],
    }, user);
    requestAPI.bucket = {
      uploadFile: () => Promise.resolve(),
      deleteFiles: () => Promise.resolve(),
    };
    await requestAPI.edit(user, editRequest);
    expect(requestAPI.schema.Request.findOne.called).to.eql(true);
    expect(requestAPI.schema.User.findOneAndPopulate.called).to.eql(true);
    const fileStorageFacades = requestAPI.FileStorageFacade.instances();
    expect(fileStorageFacades.length).to.eql(2);
    const calls = fileStorageFacades[0].translationRequestFile.getCalls();
    expect(calls.length).to.eql(1);
    const call = calls[0];
    expect(call.args.length).to.eql(3);
    expect(call.args[0]).to.eql(request.company);
    expect(call.args[1]).to.eql(request._id);
    expect(typeof call.args[2]).to.eql('object');
    const deletedFile = call.args[2];
    expect(deletedFile._id).to.eql('507f1f77bcf86cd799439011');
    expect(deletedFile.name).to.eql('1.txt');
    expect(deletedFile.final).to.eql(false);
  });

  it.skip('should send completed email when request is completed', async () => {
    const companyId = mongoose.Types.ObjectId();
    const user = mockUser({ company: { _id: companyId }, roles: ['REQUEST_UPDATE_ALL', 'CUSTOMER_READ_ALL'] });
    const lspId = user.lsp._id;
    const request = {
      lspId,
      _id: '507f1f77bcf86cd799439011',
      company: companyId.toString(),
      contact: user._id,
      status: 'To be processed',
      documents: [{
        _id: '507f1f77bcf86cd799439011',
        name: '1.txt',
        final: false,
        importSuccess: false,
      }],
    };
    const company = {
      lspId,
      _id: companyId,
      name: 'company',
    };
    const editRequest = {
      _id: '507f1f77bcf86cd799439011',
      company: company._id.toString(),
      contact: user._id,
      status: 'delivered',
      documents: [{
        _id: '507f1f77bcf86cd799439011',
        name: '1.txt',
        final: false,
        isNew: false,
      }],
    };
    await mockSchema(schema, {
      company,
      users: [user],
      request,
      documents: [{
        lspId,
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
        name: '1.txt',
        importSuccess: false,
        createdBy: user.email,
      }],
    });
    const requestAPI = new RequestAPI({
      user,
      configuration: mockConf,
      log: nullLogger,
    });
    requestAPI.emailQueue._emails = [];
    requestAPI.emailQueue.send = async function (email) {
      this._emails.push(email);
    };
    requestAPI.schema = schema;
    requestAPI.FileStorageFacade = FileStorageFacadeMock;
    await requestAPI.edit(user, editRequest);
    expect(requestAPI.emailQueue._emails).to.exist;
    expect(requestAPI.emailQueue._emails.length).to.be.greaterThan(0);
    const completedEmailSent = requestAPI.emailQueue._emails.find(e => e.templateName === 'request-completed-email');
    expect(completedEmailSent).to.exist;
    expect(completedEmailSent.context).to.exist;
    expect(completedEmailSent.context.user).to.exist;
    expect(completedEmailSent.context.user.lsp).to.exist;
  });
});
*/
