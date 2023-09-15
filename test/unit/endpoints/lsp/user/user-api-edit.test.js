/* eslint-disable global-require */
const { Types: { ObjectId } } = global.mongoose || require('mongoose');

/* global describe, it, before, beforeEach, after, afterEach */
require('mocha');
const { expect } = require('chai');
const sinon = require('sinon');
const Promise = require('bluebird');
const { buildSchema } = require('../../../components/database/mongo/schemas');
const { loadData } = require('../../../components/database/mongo/schemas/helper');
const nullLogger = require('../../../../../app/components/log/null-logger');
const UserAPI = require('../../../../../app/endpoints/lsp/user/user-api');
const cryptoFactory = require('../../../components/crypto');

const OL_CE_SUCCESS = {
  status: {
    error: false,
    code: 200,
  },
};

const mockOneLoginFactory = (knownUsers = [], changePasswordResponse, createUserResponse,
  changeEmailResponse = OL_CE_SUCCESS) => ({
  getUsers: sinon.spy((params) => {
    const usersFiltered = knownUsers.filter(u => u.email === params.email);
    return Promise.resolve({
      status: {
        error: false,
        code: 200,
      },
      data: usersFiltered,
    });
  }),
  changePassword: sinon.spy(() => Promise.resolve(changePasswordResponse)),
  createUser: sinon.spy(() => Promise.resolve(createUserResponse)),
  changeEmail: sinon.spy(() => Promise.resolve(changeEmailResponse)),
  unlockUser: sinon.spy(() => Promise.resolve()),
});

const currentUser = {
  email: 'test@protranslating.com',
  lsp: {
    _id: '5907892364414170ef952e1c',
  },
  roles: ['USER-EMAIL_UPDATE_ALL', 'USER_CREATE_ALL', 'USER_UPDATE_ALL'],
  deleted: false,
};

const testConfig = {
  get() {

  },
  environment {
    return {};
  },
};

const newUser = {
  _id: new ObjectId(),
  email: '1@protranslating.com',
  lsp: '5907892364414170ef952e1c',
  roles: ['USER-EMAIL_UPDATE_ALL', 'USER_CREATE_ALL', 'USER_UPDATE_ALL'],
  deleted: false,
  firstName: '1',
  lastName: 'Test1',
};

const dbUsers = [
  newUser,
  {
    _id: new ObjectId(),
    email: '2@protranslating.com',
    lsp: '5907892364414170ef952e1c',
    roles: [],
    firstName: '2',
    lastName: 'Test2',
    deleted: false,
  },
  {
    _id: new ObjectId(),
    email: '3@protranslating.com',
    lsp: '5907892364414170ef952e1c',
    roles: [],
    firstName: '3',
    lastName: 'Test3',
    deleted: false,
  },
  {
    _id: new ObjectId(),
    email: 'deleted@protranslating.com',
    lsp: '5907892364414170ef952e1c',
    roles: [],
    firstName: '3',
    lastName: 'Test3',
    deleted: true,
  },
  {
    _id: new ObjectId(),
    lsp: '5907892364414170ef952e1c',
    type: 'Contact',
    roles: [],
    firstName: 'Emailess',
    lastName: 'Test',
    deleted: true,
  },
];

const mockSchema = schema => loadData(schema, {
  User: dbUsers,
});

describe('UserAPI', () => {
  let schema;
  beforeEach(() => buildSchema().then((s) => {
    schema = s;
    return mockSchema(s);
  }));

  it.skip('should throw invalid password', async () => {
    const oneLogin = mockOneLoginFactory();
    const options = { configuration: testConfig, user: currentUser };
    const userAPI = new UserAPI(nullLogger, options, cryptoFactory);
    userAPI.schema = schema;
    userAPI.oneLogin = oneLogin;
    let errorThrown;
    try {
      await userAPI.userEdit({
        email: 'staff-email@test.com',
        password: '123',
        type: 'Staff',
      });
    } catch (e) {
      errorThrown = e;
    }
    expect(errorThrown).to.exist;
    expect(errorThrown.code).to.eql(400);
    expect(errorThrown.message).to.eql('Invalid or empty password');
  });

  it.skip('should throw 404 if user does not exist', async () => {
    const oneLogin = mockOneLoginFactory([]);
    const options = { configuration: testConfig, user: currentUser };
    const userAPI = new UserAPI(nullLogger, options, cryptoFactory);
    userAPI.schema = schema;
    userAPI.oneLogin = oneLogin;
    let errorThrown;
    // random object id
    const _id = new ObjectId().toString();
    try {
      await userAPI.userEdit({
        _id,
        email: 'staff-email@test.com',
        password: 'thisIsATestingPassword123!!!',
        firstName: 'Test',
        lastName: 'Staff',
        type: 'Staff',
      });
    } catch (e) {
      errorThrown = e;
    }
    expect(errorThrown).to.exist;
    expect(errorThrown.code).to.eql(404);
    expect(errorThrown.message).to.eql(`User ${_id} does not exist`);
  });

  it.skip('should throw 400 if new email is not valid', async () => {
    const oneLogin = mockOneLoginFactory([{
      id: 1,
      email: '1@protranslating.com',
      firstName: '1@protranslating.com',
      lastName: '1@protranslating.com',
      username: '1@protranslating.com',
    }]);
    const options = { configuration: testConfig, user: currentUser };
    const userAPI = new UserAPI(nullLogger, options, cryptoFactory);
    userAPI.schema = schema;
    userAPI.oneLogin = oneLogin;
    let errorThrown;
    try {
      await userAPI.userEdit({
        _id: newUser._id.toString(),
        oldEmail: '1@protranslating.com',
        email: 'invalid',
        password: 'KewlePass123!!!',
        type: 'Staff',
      });
    } catch (e) {
      errorThrown = e;
    }
    expect(errorThrown).to.exist;
    expect(errorThrown.code).to.eql(400);
    expect(errorThrown.message).to.eql('Invalid or empty email');
  });

  it.skip('should throw 409 if new email already exists in the database when changing a user email', async () => {
    const oneLogin = mockOneLoginFactory([{
      id: 1,
      email: '1@protranslating.com',
      firstName: '1@protranslating.com',
      lastName: '1@protranslating.com',
      username: '1@protranslating.com',
    }, {
      id: 2,
      email: '2@protranslating.com',
      firstName: '2@protranslating.com',
      lastName: '2@protranslating.com',
      username: '2@protranslating.com',
    }]);
    const options = { configuration: testConfig, user: currentUser };
    const userAPI = new UserAPI(nullLogger, options, cryptoFactory);
    userAPI.schema = schema;
    userAPI.oneLogin = oneLogin;
    let errorThrown;
    try {
      await userAPI.userEdit({
        _id: newUser._id.toString(),
        oldEmail: '2@protranslating.com',
        email: '1@protranslating.com',
        password: 'KewlePass123!!!',
        type: 'Staff',
      });
    } catch (e) {
      errorThrown = e;
    }
    expect(errorThrown).to.exist;
    expect(errorThrown.code).to.eql(409);
    expect(errorThrown.message).to.eql('User with email 1@protranslating.com already exists');
  });

  it.skip('should only let a contact with no email to not use password', async () => {
    const oneLogin = mockOneLoginFactory();
    const options = { configuration: testConfig, user: currentUser };
    const userAPI = new UserAPI(nullLogger, options, cryptoFactory);
    userAPI.schema = schema;
    userAPI.oneLogin = oneLogin;
    let errorThrown;
    try {
      await userAPI.userEdit({
        _id: newUser._id.toString(),
        oldEmail: '1@protranslating.com',
        email: '',
        type: 'Staff',
      });
    } catch (e) {
      errorThrown = e;
    }
    expect(errorThrown).to.exist;
    expect(errorThrown.code).to.eql(400);
    expect(errorThrown.message).to.eql('Only contacts are allowed to not have emails');
    errorThrown = null;
    try {
      await userAPI.userEdit({
        _id: newUser._id.toString(),
        email: '',
        type: 'Vendor',
      });
    } catch (e) {
      errorThrown = e;
    }
    expect(errorThrown).to.exist;
    expect(errorThrown.code).to.eql(400);
    expect(errorThrown.message).to.eql('Only contacts are allowed to not have emails');
  });

  it.skip('should change the email if provided with email and oldEmail and the new email does not exist in onelogin', async () => {
    const oneLogin = mockOneLoginFactory([{
      id: 1,
      email: '1@protranslating.com',
      firstName: '1@protranslating.com',
      lastName: '1@protranslating.com',
      username: '1@protranslating.com',
    }]);
    const options = { configuration: testConfig, user: currentUser };
    const userAPI = new UserAPI(nullLogger, options, cryptoFactory);
    userAPI.schema = schema;
    userAPI.oneLogin = oneLogin;
    let errorThrown;
    try {
      await userAPI.userEdit({
        _id: newUser._id.toString(),
        oldEmail: '1@protranslating.com',
        email: '4@protranslating.com',
        password: 'KewlePass123!!!',
        type: 'Staff',
      });
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).not.exist;
    expect(oneLogin.changeEmail.getCalls().length).to.eql(1);
  });

  it.skip('should change the email if provided with email and oldEmail and the new email does exist in onelogin', async () => {
    const oneLogin = mockOneLoginFactory([{
      id: 1,
      email: '1@protranslating.com',
      firstName: '1@protranslating.com',
      lastName: '1@protranslating.com',
      username: '1@protranslating.com',
    }]);
    const options = { configuration: testConfig, user: currentUser };
    const userAPI = new UserAPI(nullLogger, options, cryptoFactory);
    userAPI.schema = schema;
    userAPI.oneLogin = oneLogin;
    let errorThrown;
    try {
      await userAPI.userEdit({
        _id: newUser._id.toString(),
        oldEmail: '1@protranslating.com',
        email: '4@protranslating.com',
        password: 'KewlePass123!!!',
        type: 'Staff',
      });
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).not.exist;
    expect(oneLogin.changeEmail.getCalls().length).to.eql(1);
  });

  it.skip('should update the user in the db', async () => {
    const oneLogin = mockOneLoginFactory([{
      id: 1,
      email: '1@protranslating.com',
      firstName: '1@protranslating.com',
      lastName: '1@protranslating.com',
      username: '1@protranslating.com',
    }]);
    const options = { configuration: testConfig, user: currentUser };
    const userAPI = new UserAPI(nullLogger, options, cryptoFactory);
    userAPI.schema = schema;
    userAPI.oneLogin = oneLogin;
    let errorThrown;
    try {
      await userAPI.userEdit({
        _id: newUser._id.toString(),
        email: '1@protranslating.com',
        password: 'KewlePass123!!!',
        type: 'Staff',
      });
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).to.not.exist;
    const changePasswordCalls = oneLogin.changePassword.getCalls();
    expect(changePasswordCalls.length).to.eql(1);
    expect(oneLogin.unlockUser.getCalls().length).to.eql(1);
    const user = await schema.User.findOne({ _id: newUser._id });
    expect(user).to.exist;
    expect(user.deleted).to.eql(false);
    expect(user.lsp).to.exist;
    expect(user.roles).to.exist;
    expect(user.roles.length).to.eql(3);
    expect(user.oneLogin).to.exist;
    expect(user.oneLogin.id).to.eql(1);
    expect(user.lsp.toString()).to.eql(currentUser.lsp._id);
  });

  it.skip('should update the user in the db with no password', async () => {
    const oneLogin = mockOneLoginFactory([{
      id: 1,
      email: '1@protranslating.com',
      firstName: '1@protranslating.com',
      lastName: '1@protranslating.com',
      username: '1@protranslating.com',
    }]);
    const options = { configuration: testConfig, user: currentUser };
    const userAPI = new UserAPI(nullLogger, options, cryptoFactory);
    userAPI.schema = schema;
    userAPI.oneLogin = oneLogin;
    let errorThrown;
    try {
      await userAPI.userEdit({
        _id: newUser._id.toString(),
        email: '1@protranslating.com',
        type: 'Staff',
      });
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).to.not.exist;
    const changePasswordCalls = oneLogin.changePassword.getCalls();
    expect(changePasswordCalls.length).to.eql(0);
    const user = await schema.User.findOne({ _id: newUser._id });
    expect(user).to.exist;
    expect(user.deleted).to.eql(false);
    expect(user.lsp).to.exist;
    expect(user.roles).to.exist;
    expect(user.roles.length).to.eql(3);
    expect(user.oneLogin).to.exist;
    expect(user.oneLogin.id).to.eql(1);
    expect(user.lsp.toString()).to.eql(currentUser.lsp._id);
  });

  it.skip('should allow editing a deleted user', async () => {
    const oneLogin = mockOneLoginFactory([{
      id: 3,
      email: 'deleted@protranslating.com',
      firstName: 'deleted@protranslating.com',
      lastName: 'deleted@protranslating.com',
      username: 'deleted@protranslating.com',
    }]);
    const options = { configuration: testConfig, user: currentUser };
    const userAPI = new UserAPI(nullLogger, options, cryptoFactory);
    userAPI.schema = schema;
    userAPI.oneLogin = oneLogin;
    let errorThrown;
    try {
      await userAPI.userEdit({
        _id: dbUsers[3]._id.toString(),
        email: 'deleted@protranslating.com',
        password: 'deleted123DontCare!!!',
        type: 'Staff',
        deleted: true,
      });
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).to.not.exist;
    expect(oneLogin.changePassword.getCalls().length).to.eql(1);
  });

  it.skip('should change the password in onelogin', async () => {
    const oneLogin = mockOneLoginFactory([{
      id: 1,
      email: '1@protranslating.com',
      firstName: '1@protranslating.com',
      lastName: '1@protranslating.com',
      username: '1@protranslating.com',
    }, {
      id: 2,
      email: '2@protranslating.com',
      firstName: '2@protranslating.com',
      lastName: '2@protranslating.com',
      username: '2@protranslating.com',
    }]);
    const options = { configuration: testConfig, user: currentUser };
    const userAPI = new UserAPI(nullLogger, options, cryptoFactory);
    userAPI.schema = schema;
    userAPI.oneLogin = oneLogin;
    let errorThrown;
    try {
      await userAPI.userEdit({
        _id: dbUsers[1]._id.toString(),
        email: '2@protranslating.com',
        password: 'KewlePass123!!!',
        type: 'Staff',
      });
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).to.not.exist;
    const changePasswordCalls = oneLogin.changePassword.getCalls();
    expect(changePasswordCalls.length).to.eql(1);
    expect(oneLogin.unlockUser.getCalls().length).to.eql(1);
  });

  it.skip('should create a user if old email and new email does not exist in one login', async () => {
    const oneLogin = mockOneLoginFactory([{
      id: 1,
      email: '1@protranslating.com',
      firstName: '1@protranslating.com',
      lastName: '1@protranslating.com',
      username: '1@protranslating.com',
    }, {
      id: 2,
      email: '2@protranslating.com',
      firstName: '2@protranslating.com',
      lastName: '2@protranslating.com',
      username: '2@protranslating.com',
    }], null, {
      status: {
        error: false,
      },
      data: [{
        id: 3,
      }],
    });
    const options = { configuration: testConfig, user: currentUser };
    const userAPI = new UserAPI(nullLogger, options, cryptoFactory);
    userAPI.schema = schema;
    userAPI.oneLogin = oneLogin;
    let errorThrown;
    try {
      await userAPI.userEdit({
        _id: newUser._id.toString(),
        oldEmail: '3@protranslating.com',
        email: '4@protranslating.com',
        password: 'KewlePass123!!!',
        type: 'Staff',
      });
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).not.exist;
    expect(oneLogin.createUser.getCalls().length).to.eql(1);
  });

  it.skip('should edit a contact user with no email', async () => {
    const oneLogin = mockOneLoginFactory([{
      id: 1,
      email: '1@protranslating.com',
      firstName: '1@protranslating.com',
      lastName: '1@protranslating.com',
      username: '1@protranslating.com',
    }]);
    const options = { configuration: testConfig, user: currentUser };
    const userAPI = new UserAPI(nullLogger, options, cryptoFactory);
    userAPI.schema = schema;
    userAPI.oneLogin = oneLogin;
    let errorThrown;
    try {
      await userAPI.userEdit({
        _id: dbUsers[4]._id.toString(),
        firstName: 'Emailess',
        lastName: 'LastName',
        type: 'Contact',
      });
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).not.exist;
    expect(oneLogin.createUser.getCalls().length).to.eql(0);
    expect(oneLogin.getUsers.getCalls().length).to.eql(0);
    expect(oneLogin.unlockUser.getCalls().length).to.eql(0);
    expect(oneLogin.changeEmail.getCalls().length).to.eql(0);
    expect(oneLogin.changePassword.getCalls().length).to.eql(0);
  });

  it.skip('should edit a contact user with no email', async () => {
    const oneLogin = mockOneLoginFactory([], null, {
      status: {
        error: false,
      },
      data: [{
        id: 3,
      }],
    });
    const options = { configuration: testConfig, user: currentUser };
    const userAPI = new UserAPI(nullLogger, options, cryptoFactory);
    userAPI.schema = schema;
    userAPI.oneLogin = oneLogin;
    let errorThrown;
    try {
      await userAPI.userEdit({
        _id: dbUsers[4]._id.toString(),
        email: 'new-email@protranslating.com',
        oldEmail: '',
        password: 'KewlePass123!!!',
        firstName: 'Emailess',
        lastName: 'LastName',
        type: 'Contact',
      });
    } catch (err) {
      errorThrown = err;
    }
    expect(errorThrown).not.exist;
    expect(oneLogin.createUser.getCalls().length).to.eql(1);
    expect(oneLogin.getUsers.getCalls().length).to.eql(1);
    expect(oneLogin.unlockUser.getCalls().length).to.eql(1);
    expect(oneLogin.changeEmail.getCalls().length).to.eql(0);
    expect(oneLogin.changePassword.getCalls().length).to.eql(1);
  });
});
