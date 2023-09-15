/*const chai = require('chai');
const { Types: { ObjectId } } = require('mongoose');
const moment = require('moment');
require('mocha');

const nullLogger = require('../../../../../../app/components/log/null-logger');

const { buildSchema } = require('../../../../components/database/mongo/schemas');
const { loadData } = require('../../../../components/database/mongo/schemas/helper');

const UserToastAPI = require('../../../../../../app/endpoints/lsp/user/toast/user-toast-api');

const storableUser = {
  _id: new ObjectId(),
  email: 'test@protranslating.com',
  lsp: '5907892364414170ef952e1c',
  firstName: '1',
  lastName: 'Test1',
  deleted: false,
};

const mockSchema = schema => loadData(schema, {
  User: [storableUser],
});

const _nonVisibleUserToast = user => [{
  lspId: user.lsp,
  user: user._id,
  state: 'info',
  title: 'Expired title',
  message: 'Expired message',
  lastReadTime: null,
  dismissedTime: null,
  requireDismiss: false,
  from: moment.utc().add(-2, 'days').toDate(),
  to: moment.utc().add(-1, 'days').toDate(),
}, {
  lspId: user.lsp,
  user: user._id,
  state: 'info',
  title: 'Dismissed title',
  message: 'Dismissed message',
  lastReadTime: new Date(),
  dismissedTime: new Date(),
  requireDismiss: true,
  from: null,
  to: null,
}, {
  lspId: user.lsp,
  user: user._id,
  state: 'info',
  title: 'Already read title',
  message: 'Already read message',
  lastReadTime: new Date(),
  dismissedTime: null,
  requireDismiss: false,
  from: null,
  to: null,
}];

const _visibleUserToast = user => [{
  lspId: user.lsp,
  user: user._id,
  state: 'info',
  title: 'Title 1',
  message: 'Message 1',
  lastReadTime: null,
  dismissedTime: null,
  requireDismiss: false,
  from: null,
  to: null,
}, {
  lspId: user.lsp,
  user: user._id,
  state: 'info',
  title: 'Non expired title',
  message: 'Non expired message',
  lastReadTime: null,
  dismissedTime: null,
  requireDismiss: false,
  from: moment.utc().add(-2, 'days').toDate(),
  to: moment.utc().add(3, 'days').toDate(),
}, {
  lspId: user.lsp,
  user: user._id,
  state: 'info',
  title: 'Non dismissed title',
  message: 'Non dismissed message',
  lastReadTime: new Date(),
  dismissedTime: null,
  requireDismiss: true,
  from: moment.utc().add(-2, 'days').toDate(),
  to: moment.utc().add(3, 'days').toDate(),
}];

const expect = chai.expect;

describe('User Toast API', () => {
  let schema;
  let user;
  let visibleToasts;
  let nonVisibleToasts;
  beforeEach(() => buildSchema().then((s) => {
    schema = s;
    return mockSchema(s)
    .then(() => schema.User.find({ _id: storableUser._id }))
    .then((userInDb) => {
      user = userInDb[0];
      const userToasts = _visibleUserToast(user);
      return schema.UserToast.create(userToasts);
    })
    .then((userToasts) => {
      visibleToasts = userToasts;
      const nonVisibleUserToasts = _nonVisibleUserToast(user);
      return schema.UserToast.create(nonVisibleUserToasts);
    })
    .then((userToasts) => {
      nonVisibleToasts = userToasts;
    });
  }));

  it('should retrieve visible toast', (done) => {
    const userToastAPI = new UserToastAPI(nullLogger, { user });
    userToastAPI.logger = nullLogger;
    userToastAPI.schema = schema;
    schema.UserToast.find().then((allUserToast) => {
      expect(allUserToast.length).to.eql(visibleToasts.length + nonVisibleToasts.length);
      return userToastAPI.list(user, user._id.toString());
    })
    .then((userToasts) => {
      expect(userToasts.length).to.eql(visibleToasts.length);
    })
    .then(() => { done(); })
    .catch((err) => {
      done(err);
    });
  });
});
*/