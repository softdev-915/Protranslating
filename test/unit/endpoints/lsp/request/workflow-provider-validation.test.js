const _ = require('lodash');
const moment = require('moment');
const { expect } = require('chai');
const faker = require('faker');
const { Types: { ObjectId } } = require('mongoose');
require('mocha');

const WorkflowTaskProviderValidator = require('../../../../../app/endpoints/lsp/request/workflow-task-provider-validator');
const { buildSchema } = require('../../../components/database/mongo/schemas');
const { loadData } = require('../../../components/database/mongo/schemas/helper');

const lspId = new ObjectId();

const mockSchema = (schema, data) => loadData(schema, {
  Company: data.company,
  User: data.users,
  Request: data.request,
  Ability: ['1', '2', '3', '4'],
});

const mockUser = (templateUser) => {
  const firstName = faker.name.firstName();
  const lastName = faker.name.lastName();
  const randomNumber = faker.random.number();
  const email = `${firstName}.${lastName}_${randomNumber}@protranslating.com`;
  const user = {
    _id: new ObjectId(),
    email,
    firstName,
    lastName,
    roles: [],
    abilities: [],
    groups: [],
    lsp: lspId,
  };
  if (templateUser) {
    Object.assign(user, templateUser);
  }
  return user;
};


describe('Workflow provider validation', () => {
  let schema;
  let vendors;
  let user;
  beforeEach(async () => {
    schema = await buildSchema();
    const companyId = new ObjectId();
    user = mockUser({ company: { _id: companyId }, roles: ['REQUEST_UPDATE_ALL', 'CUSTOMER_READ_ALL', 'WORKFLOW_UPDATE_ALL'] });
    vendors = [
      mockUser({ abilities: ['1', '2'], type: 'Vendor', languageCombinations: ['ENG-SPA'] }),
      mockUser({ abilities: ['3', '4'], type: 'Vendor', languageCombinations: ['ENG-SPA'] }),
      mockUser({ abilities: ['1', '2'], type: 'Vendor', languageCombinations: ['ENG-SPA'], terminated: true }),
      mockUser({ abilities: ['3', '4'], type: 'Vendor', languageCombinations: ['ENG-SPA'], terminated: true }),
    ];
  });

  it.skip('should not throw any error if providers are valid', async () => {
    const newWorkflows = [{
      _id: new ObjectId().toString(),
      language: {
        name: 'Spanish',
        isoCode: 'SPA',
      },
      tasks: [{
        _id: new ObjectId().toString(),
        ability: '1',
        providerTasks: [{
          _id: new ObjectId().toString(),
          files: [],
          notes: '',
          provider: vendors[0]._id,
          quantity: [{
            amount: 0,
            units: '',
          }],
          status: 'notStarted',
          taskDueDate: moment.utc().add(4, 'days').toDate(),
          workflowDueDate: moment.utc().add(10, 'days').toDate(),
        }],
      }, {
        _id: new ObjectId().toString(),
        ability: '3',
        providerTasks: [{
          _id: new ObjectId().toString(),
          files: [],
          notes: '',
          provider: vendors[1]._id,
          quantity: [{
            amount: 0,
            units: '',
          }],
          status: 'notStarted',
          taskDueDate: moment.utc().add(4, 'days').toDate(),
          workflowDueDate: moment.utc().add(10, 'days').toDate(),
        }],
      }],
    }];
    await mockSchema(schema, {
      users: vendors,
      abilities: ['1', '2', '3', '4'],
    });
    let errorThrown;
    try {
      const workflowTaskProviderValidator = new WorkflowTaskProviderValidator(user, schema);
      await workflowTaskProviderValidator.validateWorkflowTasks(newWorkflows, undefined);
      await workflowTaskProviderValidator.validateWorkflowTasks(newWorkflows, []);
      await workflowTaskProviderValidator.validateWorkflowTasks(newWorkflows, newWorkflows);
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).to.not.exist;
  });

  it.skip('should not throw any error if providers are terminated but were originally present', async () => {
    const newWorkflows = [{
      _id: new ObjectId().toString(),
      language: {
        name: 'Spanish',
        isoCode: 'SPA',
      },
      tasks: [{
        _id: new ObjectId().toString(),
        ability: '1',
        providerTasks: [{
          _id: new ObjectId().toString(),
          files: [],
          notes: '',
          provider: vendors[0]._id,
          quantity: [{
            amount: 0,
            units: '',
          }],
          status: 'notStarted',
          taskDueDate: moment.utc().add(4, 'days').toDate(),
          workflowDueDate: moment.utc().add(10, 'days').toDate(),
        }],
      }, {
        _id: new ObjectId().toString(),
        ability: '3',
        providerTasks: [{
          _id: new ObjectId().toString(),
          files: [],
          notes: '',
          provider: vendors[3]._id,
          quantity: [{
            amount: 0,
            units: '',
          }],
          status: 'notStarted',
          taskDueDate: moment.utc().add(4, 'days').toDate(),
          workflowDueDate: moment.utc().add(10, 'days').toDate(),
        }],
      }],
    }];
    const originalWorkflows = _.cloneDeep(newWorkflows);
    originalWorkflows[0].tasks[0].providerTasks[0].provider = vendors[2]._id;
    await mockSchema(schema, {
      users: vendors,
    });
    let errorThrown;
    try {
      const workflowTaskProviderValidator = new WorkflowTaskProviderValidator(user, schema);
      await workflowTaskProviderValidator.validateWorkflowTasks(newWorkflows, originalWorkflows);
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).to.not.exist;
  });

  it.skip('should throw an error when trying to assign a terminated provider', async () => {
    const newWorkflows = [{
      _id: new ObjectId().toString(),
      language: {
        name: 'Spanish',
        isoCode: 'SPA',
      },
      tasks: [{
        _id: new ObjectId().toString(),
        ability: '1',
        providerTasks: [{
          _id: new ObjectId().toString(),
          files: [],
          notes: '',
          provider: vendors[0]._id,
          quantity: [{
            amount: 0,
            units: '',
          }],
          status: 'notStarted',
          taskDueDate: moment.utc().add(4, 'days').toDate(),
          workflowDueDate: moment.utc().add(10, 'days').toDate(),
        }],
      }, {
        _id: new ObjectId().toString(),
        ability: '3',
        providerTasks: [{
          _id: new ObjectId().toString(),
          files: [],
          notes: '',
          provider: vendors[3]._id,
          quantity: [{
            amount: 0,
            units: '',
          }],
          status: 'notStarted',
          taskDueDate: moment.utc().add(4, 'days').toDate(),
          workflowDueDate: moment.utc().add(10, 'days').toDate(),
        }],
      }],
    }];
    const originalWorkflows = _.cloneDeep(newWorkflows);
    originalWorkflows[0].tasks[1].providerTasks[0].provider = vendors[2]._id;
    await mockSchema(schema, {
      users: vendors,
    });
    let errorThrown;
    try {
      const workflowTaskProviderValidator = new WorkflowTaskProviderValidator(user, schema);
      await workflowTaskProviderValidator.validateWorkflowTasks(newWorkflows, originalWorkflows);
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).to.exist;
    expect(errorThrown.code).to.eql(400);
    expect(errorThrown.message).to.eql(`Provider ${vendors[3].firstName} ${vendors[3].lastName} is terminated`);
  });

  it.skip('should throw an error when trying to assign an inexisting provider', async () => {
    const newWorkflows = [{
      _id: new ObjectId().toString(),
      language: {
        name: 'Spanish',
        isoCode: 'SPA',
      },
      tasks: [{
        _id: new ObjectId().toString(),
        ability: '1',
        providerTasks: [{
          _id: new ObjectId().toString(),
          files: [],
          notes: '',
          provider: vendors[0]._id,
          quantity: [{
            amount: 0,
            units: '',
          }],
          status: 'notStarted',
          taskDueDate: moment.utc().add(4, 'days').toDate(),
          workflowDueDate: moment.utc().add(10, 'days').toDate(),
        }],
      }, {
        _id: new ObjectId().toString(),
        ability: '3',
        providerTasks: [{
          _id: new ObjectId().toString(),
          files: [],
          notes: '',
          provider: vendors[1]._id,
          quantity: [{
            amount: 0,
            units: '',
          }],
          status: 'notStarted',
          taskDueDate: moment.utc().add(4, 'days').toDate(),
          workflowDueDate: moment.utc().add(10, 'days').toDate(),
        }],
      }],
    }];
    const originalWorkflows = _.cloneDeep(newWorkflows);
    newWorkflows[0].tasks[1].providerTasks[0].provider = new ObjectId();
    await mockSchema(schema, {
      users: vendors,
    });
    let errorThrown;
    try {
      const workflowTaskProviderValidator = new WorkflowTaskProviderValidator(user, schema);
      await workflowTaskProviderValidator.validateWorkflowTasks(newWorkflows, originalWorkflows);
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).to.exist;
    expect(errorThrown.code).to.eql(400);
    expect(errorThrown.message).to.eql('Not all providers were found');
  });

  it.skip('should throw an error when trying to assign aa provider that does not have the proper ability', async () => {
    const newWorkflows = [{
      _id: new ObjectId().toString(),
      language: {
        name: 'Spanish',
        isoCode: 'SPA',
      },
      tasks: [{
        _id: new ObjectId().toString(),
        ability: '1',
        providerTasks: [{
          _id: new ObjectId().toString(),
          files: [],
          notes: '',
          provider: vendors[0]._id,
          quantity: [{
            amount: 0,
            units: '',
          }],
          status: 'notStarted',
          taskDueDate: moment.utc().add(4, 'days').toDate(),
          workflowDueDate: moment.utc().add(10, 'days').toDate(),
        }],
      }, {
        _id: new ObjectId().toString(),
        ability: '1',
        providerTasks: [{
          _id: new ObjectId().toString(),
          files: [],
          notes: '',
          provider: vendors[1]._id,
          quantity: [{
            amount: 0,
            units: '',
          }],
          status: 'notStarted',
          taskDueDate: moment.utc().add(4, 'days').toDate(),
          workflowDueDate: moment.utc().add(10, 'days').toDate(),
        }],
      }],
    }];
    const originalWorkflows = _.cloneDeep(newWorkflows);
    await mockSchema(schema, {
      users: vendors,
    });
    let errorThrown;
    try {
      const workflowTaskProviderValidator = new WorkflowTaskProviderValidator(user, schema);
      await workflowTaskProviderValidator.validateWorkflowTasks(newWorkflows, originalWorkflows);
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).to.exist;
    expect(errorThrown.code).to.eql(400);
    expect(errorThrown.message).to.eql(`Provider ${vendors[1].firstName} ${vendors[1].lastName} doesn't have the ability "1"`);
  });
});
