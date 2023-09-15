/* eslint-disable no-unused-expressions,class-terms-use-this */
/* global describe, it, before, beforeEach, after, afterEach 
const chai = require('chai');
const mongoose = require('mongoose');
const { Types: { ObjectId } } = require('mongoose');
const faker = require('faker');
require('mocha');

const expect = chai.expect;
const { buildSchema } = require('../../../components/database/mongo/schemas');
const { loadData } = require('../../../components/database/mongo/schemas/helper');
const nullLogger = require('../../../../../app/components/log/null-logger');
const InternalDepartmentAPI = require('../../../../../app/endpoints/lsp/internal-department/internal-department-api');

const mockSchema = (schema, internalDepartments) => {
  if (internalDepartments) {
    return loadData(schema, { InternalDepartment: internalDepartments });
  }
  return schema;
};

const lspId = {
  _id: new ObjectId(),
};

const lspId2 = {
  _id: new ObjectId(),
};

const currentUser = {
  email: 'test@protranslating.com',
  lsp: lspId,
  groups: [
    {
      roles: ['INTERNAL-DEPARTMENT_READ_ALL'],
    },
  ],
};

const anotherUser = {
  email: 'test@anotherLsp.com',
  lsp: lspId2,
  groups: [
    {
      roles: ['INTERNAL-DEPARTMENT_READ_ALL'],
    },
  ],
};

const testConfig = {
  get() {

  },
  environment {
    return {};
  },
};

const mockInternalDepartment = (templateInternalDepartment) => {
  const internalDepartment = {
    _id: new mongoose.Types.ObjectId(),
    name: faker.lorem.word(),
    deletedAt: new Date(),
    restoredAt: new Date(),
    deleted: false,
  };
  if (templateInternalDepartment) {
    Object.assign(internalDepartment, templateInternalDepartment);
  }
  return internalDepartment;
};

const mockInternalDepartments = (howMany, lsp) => {
  const list = [];
  let template;
  if (howMany > 0) {
    for (let i = 1; i <= howMany; i++) {
      template = {
        lspId: lsp,
      };
      const internalDepartment = mockInternalDepartment(template);
      list.push(internalDepartment);
    }
  }
  return list;
};


const internalDepartmentsLSP1 = mockInternalDepartments(3, lspId._id);

const internalDepartmentsLSP2 = mockInternalDepartments(3, lspId2._id);

const allInternalDepartments = internalDepartmentsLSP1.concat(internalDepartmentsLSP2);

describe('Internal Department API', () => {
  let schema;
  beforeEach(() => buildSchema().then((s) => {
    schema = s;
  }));

  it('should return an empty list', async () => {
    const internalDepartmentAPI = new InternalDepartmentAPI(nullLogger,
      { user: currentUser, configuration: testConfig });
    internalDepartmentAPI.logger = nullLogger;
    internalDepartmentAPI.schema = schema;
    await mockSchema(schema, []);
    const result = await internalDepartmentAPI.list({});
    expect(result).to.exist;
    expect(result.list).to.exist;
    expect(result.list.length).to.eql(0);
  });

  it('should only returns internal departments from LSP1', async () => {
    const internalDepartmentAPI = new InternalDepartmentAPI(nullLogger,
      { user: currentUser, configuration: testConfig });
    internalDepartmentAPI.logger = nullLogger;
    internalDepartmentAPI.schema = schema;
    await mockSchema(schema, allInternalDepartments);
    const result = await internalDepartmentAPI.list({});
    expect(result).to.exist;
    expect(result.list).to.exist;
    expect(result.list.length).to.eql(3);
    expect(result.list[0].lspId.toString()).to.eql(lspId._id.toString());
    expect(result.list[1].lspId.toString()).to.eql(lspId._id.toString());
    expect(result.list[2].lspId.toString()).to.eql(lspId._id.toString());
  });

  it('should only returns internal departments from LSP2', async () => {
    const internalDepartmentAPI = new InternalDepartmentAPI(nullLogger,
      { user: anotherUser, configuration: testConfig });
    internalDepartmentAPI.logger = nullLogger;
    internalDepartmentAPI.schema = schema;
    await mockSchema(schema, allInternalDepartments);
    const result = await internalDepartmentAPI.list({});
    expect(result).to.exist;
    expect(result.list).to.exist;
    expect(result.list.length).to.eql(3);
    expect(result.list[0].lspId.toString()).to.eql(lspId2._id.toString());
    expect(result.list[1].lspId.toString()).to.eql(lspId2._id.toString());
    expect(result.list[2].lspId.toString()).to.eql(lspId2._id.toString());
  });

  it('should return a internal department when passing an id', async () => {
    const internalDepartmentAPI = new InternalDepartmentAPI(nullLogger,
      { user: currentUser, configuration: testConfig });
    internalDepartmentAPI.logger = nullLogger;
    internalDepartmentAPI.schema = schema;
    const existingDepartment = internalDepartmentsLSP1[0]._id.toString();
    await mockSchema(schema, internalDepartmentsLSP1);
    const result = await internalDepartmentAPI.list({ _id: existingDepartment });
    expect(result).to.exist;
    expect(result.list).to.exist;
    expect(result.list.length).to.eql(1);
    expect(result.list[0].id).to.equal(existingDepartment);
  });

  it('should create an internal department', async () => {
    const newinternalDepartment = {
      name: 'Department 4',
      _id: '',
    };
    const internalDepartmentAPI = new InternalDepartmentAPI(nullLogger,
      { user: currentUser, configuration: testConfig });
    internalDepartmentAPI.logger = nullLogger;
    internalDepartmentAPI.schema = schema;
    await mockSchema(schema, []);
    const internalDepartmentCreated = await internalDepartmentAPI.create(newinternalDepartment);
    expect(internalDepartmentCreated.name).to.eql(newinternalDepartment.name);
    expect(internalDepartmentCreated.lspId.toString()).to.eql(lspId._id.toString());
  });

  it('should throw an error when trying to create an internal department if there is already one with the same name for the same lsp', async () => {
    const internalDepartmentAPI = new InternalDepartmentAPI(nullLogger, { user: currentUser,
      configuration: testConfig });
    internalDepartmentAPI.logger = nullLogger;
    internalDepartmentAPI.schema = schema;
    await mockSchema(schema, allInternalDepartments);
    try {
      await internalDepartmentAPI.create(allInternalDepartments[0]);
    } catch (err) {
      expect(err).to.exist;
      expect(err.code).to.eql(409);
      expect(err.message).to.eql('Internal department already exists');
    }
  });

  it('should create an internal department for another lsp even if another with the same name already exist', async () => {
    const newInternalDepartment = mockInternalDepartment();
    const internalDepartmentAPI = new InternalDepartmentAPI(nullLogger, {
      user: anotherUser,
      configuration: testConfig,
    });
    internalDepartmentAPI.logger = nullLogger;
    internalDepartmentAPI.schema = schema;
    await mockSchema(schema, allInternalDepartments);
    const internalDepartmentCreated = await internalDepartmentAPI.create(newInternalDepartment);
    expect(internalDepartmentCreated.name).to.eql(newInternalDepartment.name);
    expect(internalDepartmentCreated.lspId.toString()).to.eql(lspId2._id.toString());
  });

  it('should update a internal department', async () => {
    const updateinternalDepartment = {
      name: 'Department 1 updated',
      _id: allInternalDepartments[1]._id.toString(),
    };
    const internalDepartmentAPI = new InternalDepartmentAPI(nullLogger,
      { user: currentUser, configuration: testConfig });
    internalDepartmentAPI.logger = nullLogger;
    internalDepartmentAPI.schema = schema;
    await mockSchema(schema, allInternalDepartments);
    const internalDepartmentUpdated = await internalDepartmentAPI.update(updateinternalDepartment);
    expect(internalDepartmentUpdated.name).to.eql(updateinternalDepartment.name);
    expect(internalDepartmentUpdated.lspId.toString()).to.eql(lspId._id.toString());
  });

  it('should append the deleted flag with true when deleting a internal department', async () => {
    const deleteinternalDepartment = {
      name: 'Net 60',
      _id: allInternalDepartments[1]._id.toString(),
      deleted: true,
    };
    const internalDepartmentAPI = new InternalDepartmentAPI(nullLogger,
      { user: currentUser, configuration: testConfig });
    internalDepartmentAPI.logger = nullLogger;
    internalDepartmentAPI.schema = schema;
    await mockSchema(schema, allInternalDepartments);
    const internalDepartmentUpdated = await internalDepartmentAPI.update(deleteinternalDepartment);
    expect(internalDepartmentUpdated.name).to.eql(deleteinternalDepartment.name);
    expect(internalDepartmentUpdated.deleted).to.eql(true);
    expect(internalDepartmentUpdated.lspId.toString()).to.eql(lspId._id.toString());
  });

  it('should only returns internal departments user belongs to for INTERNAL-DEPARTMENT_READ_OWN role', async () => {
    const internalDepartmentID = new ObjectId();
    const userReadOwn = {
      email: 'test@asd.com',
      lsp: lspId,
      internalDepartments: [internalDepartmentID.toString()],
      groups: [
        {
          roles: ['INTERNAL-DEPARTMENT_READ_OWN'],
        },
      ],
    };

    const internalDepartmentAPI = new InternalDepartmentAPI(nullLogger,
      { user: userReadOwn, configuration: testConfig });
    internalDepartmentAPI.logger = nullLogger;
    internalDepartmentAPI.schema = schema;
    const internalDepartmentsToMock = [
      ...internalDepartmentsLSP1,
      mockInternalDepartment({ lspId: lspId, _id: internalDepartmentID }),
    ];
    await mockSchema(schema, internalDepartmentsToMock);
    const result = await internalDepartmentAPI.list({});
    expect(result).to.exist;
    expect(result.list).to.exist;
    expect(result.list.length).to.eql(1);
    expect(result.list[0]._id.toString()).to.eql(internalDepartmentID.toString());
  });

  it.skip('should return the internal department list with 3 results', () => {});
  it.skip('should return the internal department list filtered by name', () => {});
});
*/