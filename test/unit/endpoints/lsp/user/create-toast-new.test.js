/*const chai = require('chai');
const { Types: { ObjectId } } = require('mongoose');
require('mocha');

const { buildSchema } = require('../../../components/database/mongo/schemas');
const { loadData } = require('../../../components/database/mongo/schemas/helper');

const { createUserToastForNewUser } = require('../../../../../app/endpoints/lsp/user/user-api-helper');

const newUser = {
  _id: new ObjectId(),
  email: '1@protranslating.com',
  lsp: new ObjectId(),
  firstName: '1',
  lastName: 'Test1',
  deleted: false,
};

const mockSchema = schema => loadData(schema, {
  User: [newUser],
});

const expect = chai.expect;

describe('createUserToastForNewUser', () => {
  let schema;
  beforeEach(() => buildSchema().then((s) => {
    schema = s;
    return mockSchema(s);
  }));


  it('should create all user toast for toast with all users', (done) => {
    const userId = new ObjectId();
    schema.Toast.create([{
      lspId: newUser.lsp,
      title: 'Single user toast',
      message: 'This toast is for a single user',
      users: [userId],
      state: 'danger',
      usersCache: [{ _id: userId, firstName: 'Sample', lastName: 'User', email: 'sampleuser@test.com' }],
      requireDismiss: false,
    }, {
      lspId: newUser.lsp,
      title: 'All user toast',
      message: 'This toast is for all users',
      users: [],
      state: 'info',
      usersCache: [],
      requireDismiss: true,
    }])
    .then(() => createUserToastForNewUser(schema, newUser))
    .then(() => schema.UserToast.find({}))
    .then((userToasts) => {
      expect(userToasts).to.exist;
      expect(userToasts.length).to.eql(1);
      const ut = userToasts[0];
      expect(ut.title).to.eql('All user toast');
      expect(ut.message).to.eql('This toast is for all users');
      expect(ut.state).to.eql('info');
      expect(ut.requireDismiss).to.eql(true);
    })
    .then(() => { done(); });
  });
});
*/