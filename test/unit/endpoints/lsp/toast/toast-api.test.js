/*const chai = require('chai');
const { Types: { ObjectId } } = require('mongoose');
const moment = require('moment');
require('mocha');

const nullLogger = require('../../../../../app/components/log/null-logger');

const { buildSchema } = require('../../../components/database/mongo/schemas');
const { loadData } = require('../../../components/database/mongo/schemas/helper');

const ToastAPI = require('../../../../../app/endpoints/lsp/toast/toast-api');

const currentUser = {
  email: 'test@protranslating.com',
  lsp: {
    _id: '5907892364414170ef952e1c',
  },
};

const users = [{
  _id: new ObjectId(),
  email: '1@protranslating.com',
  lsp: '5907892364414170ef952e1c',
  firstName: '1',
  lastName: 'Test1',
  deleted: false,
}, {
  _id: new ObjectId(),
  email: '2@protranslating.com',
  lsp: '5907892364414170ef952e1c',
  firstName: '2',
  lastName: 'Test2',
  deleted: false,
}, {
  _id: new ObjectId(),
  email: '3@protranslating.com',
  lsp: '5907892364414170ef952e1c',
  firstName: '3',
  lastName: 'Test3',
  deleted: false,
}, {
  _id: new ObjectId(),
  email: '4@protranslating.com',
  lsp: '5907892364414170ef952e1c',
  firstName: '4',
  lastName: 'Test4',
  deleted: false,
}, {
  _id: new ObjectId(),
  email: 'other@org.com',
  lsp: new ObjectId(),
  firstName: 'other',
  lastName: 'Org',
  deleted: false,
}];

const mockSchema = schema => loadData(schema, {
  User: users,
});

const expect = chai.expect;

const _checkUsers = (t, toastUsers) => {
  expect(toastUsers.length).to.eql(t.usersCache.length);
  t.usersCache.forEach((un) => {
    const found = toastUsers.find(tu => tu._id.equals(un._id));
    expect(found).to.exist;
    expect(found.firstName).to.eql(un.firstName);
    expect(found.lastName).to.eql(un.lastName);
    expect(found.email).to.eql(un.email);
  });
  expect(toastUsers.length).to.eql(t.users.length);
  t.users.forEach((uid) => {
    expect(toastUsers.findIndex(tu => tu._id.equals(uid))).to.not.eql(-1);
  });
};

const _checkUserToasts = (userToasts, ids, prospectToast, t) => {
  expect(userToasts).to.exist;
  expect(ids.length).to.eql(userToasts.length);
  userToasts.forEach((ut) => {
    const foundId = ids.find(i => i === ut.user.toString());
    expect(foundId).to.exist;
    expect(t._id.toString()).to.eql(ut.toast.toString());
    expect(prospectToast.title).to.eql(ut.title);
    expect(prospectToast.message).to.eql(ut.message);
    expect(prospectToast.context).to.eql(ut.context);
    expect(prospectToast.ttl).to.eql(ut.ttl);
    expect(prospectToast.state).to.eql(ut.state);
    expect(moment.utc(ut.from).diff(moment.utc(prospectToast.from), 'minutes')).to.eql(0);
    expect(moment.utc(ut.to).diff(moment.utc(prospectToast.to), 'minutes')).to.eql(0);
    expect(prospectToast.requireDismiss).to.eql(ut.requireDismiss);
  });
};

describe('Toast API', () => {
  let schema;
  beforeEach(() => buildSchema().then((s) => {
    schema = s;
    return mockSchema(s);
  }));

  it('should fail to create a toast if no users are given', (done) => {
    const toastAPI = new ToastAPI(nullLogger, { user: currentUser });
    toastAPI.logger = nullLogger;
    toastAPI.schema = schema;
    toastAPI.create({ users: [] })
    .then(() => {
      done('should have failed');
    }).catch((err) => {
      expect(err).to.exist;
      expect(err.code).to.exist;
      expect(400).to.eql(err.code);
      expect('Toast must have users').to.eql(err.message);
    }).then(() => { done(); });
  });

  it('should fail to create a toast if a user is missing', (done) => {
    const toastAPI = new ToastAPI(nullLogger, { user: currentUser });
    toastAPI.logger = nullLogger;
    toastAPI.schema = schema;
    const allUsers = users;
    const inexistingUser = allUsers.find(u => u.email === 'other@org.com');
    const ids = allUsers.map(u => u._id.toString()).slice(0, 2);
    const inexistingId = inexistingUser._id.toString();
    ids.push(inexistingId);
    toastAPI.create({ users: ids })
    .then(() => {
      done('should have failed');
    }).catch((err) => {
      expect(err).to.exist;
      expect(err.code).to.exist;
      expect(400).to.eql(err.code);
      expect('Some users don\'t exist').to.eql(err.message);
    }).then(() => { done(); });
  });

  it('should create a toast and it\'s child user toast', (done) => {
    let t;
    const toastAPI = new ToastAPI(nullLogger, { user: currentUser });
    toastAPI.logger = nullLogger;
    toastAPI.schema = schema;
    const toastUser = users.slice(0, 2);
    const existingIds = toastUser.map(u => u._id.toString());
    const now = moment.utc();
    const prospectToast = {
      state: 'warning',
      title: 'Toast title',
      message: 'Toast message',
      users: existingIds,
      requireDismiss: true,
      ttl: 5,
      from: now.add(-1, 'days').format(),
      to: now.format(),
    };
    toastAPI.create(prospectToast)
    .catch((err) => {
      done(err);
    })
    .then((toastCreated) => {
      t = toastCreated;
      expect(t.usersCache).to.exist;
      expect(2).to.eql(t.usersCache.length);
      _checkUsers(t, toastUser);
      return schema.UserToast.find({ toast: toastCreated._id });
    })
    .then((userToasts) => {
      _checkUserToasts(userToasts, existingIds, prospectToast, t);
    })
    .then(() => { done(); });
  });

  it('should delete user\'s toast when editing a toast and user is missing, and add the new ones', (done) => {
    let t;
    const toastAPI = new ToastAPI(nullLogger, { user: currentUser });
    toastAPI.logger = nullLogger;
    toastAPI.schema = schema;
    const toastUser = users.slice(0, 2);
    const existingIds = toastUser.map(u => u._id.toString());
    const editedToastUser = users.slice(1, 3);
    const editedIds = editedToastUser.map(u => u._id.toString());
    const now = moment.utc();
    const prospectToast = {
      state: 'warning',
      title: 'Toast title',
      message: 'Toast message',
      users: existingIds,
      requireDismiss: true,
      ttl: 5,
      from: now.add(-1, 'days').format(),
      to: now.format(),
    };
    toastAPI.create(prospectToast)
    .catch((err) => {
      done(err);
    })
    .then((toastCreated) => {
      expect(toastCreated).to.exist;
      expect(toastCreated._id).to.exist;
      prospectToast._id = toastCreated._id.toString();
      prospectToast.users = editedIds;
      return toastAPI.edit(prospectToast);
    })
    .catch((err) => {
      done(err);
    })
    .then((toastEdited) => {
      t = toastEdited;
      expect(toastEdited).to.exist;
      expect(toastEdited.usersCache).to.exist;
      _checkUsers(toastEdited, editedToastUser);
      return schema.UserToast.find({ toast: toastEdited._id });
    })
    .then((userToasts) => {
      _checkUserToasts(userToasts, editedIds, prospectToast, t);
    })
    .then(() => { done(); });
  });

  it('should update a user\'s toast when editing a toast', (done) => {
    let t;
    const toastAPI = new ToastAPI(nullLogger, { user: currentUser });
    toastAPI.logger = nullLogger;
    toastAPI.schema = schema;
    const toastUser = users.slice(0, 2);
    const existingIds = toastUser.map(u => u._id.toString());
    const editedToastUser = users.slice(1, 3);
    const editedIds = editedToastUser.map(u => u._id.toString());
    const now = moment.utc();
    const tomorrow = now.add(1, 'days');
    const prospectToast = {
      state: 'warning',
      title: 'Toast title',
      message: 'Toast message',
      users: existingIds,
      requireDismiss: true,
      ttl: 5,
      from: now.add(-1, 'days').format(),
      to: now.format(),
    };
    toastAPI.create(prospectToast)
    .catch((err) => {
      done(err);
    })
    .then((toastCreated) => {
      expect(toastCreated).to.exist;
      expect(toastCreated._id).to.exist;
      prospectToast._id = toastCreated._id.toString();
      prospectToast.users = editedIds;
      prospectToast.state = 'info';
      prospectToast.title = 'Edited Toast title';
      prospectToast.message = 'Edited Toast message';
      prospectToast.requireDismiss = false;
      prospectToast.ttl = 10;
      prospectToast.from = tomorrow.add(-1, 'days').format();
      prospectToast.to = tomorrow.format();
      return toastAPI.edit(prospectToast);
    })
    .catch((err) => {
      done(err);
    })
    .then((toastEdited) => {
      t = toastEdited;
      expect(toastEdited).to.exist;
      expect(toastEdited.usersCache).to.exist;
      _checkUsers(toastEdited, editedToastUser);
      return schema.UserToast.find({ toast: toastEdited._id });
    })
    .then((userToasts) => {
      _checkUserToasts(userToasts, editedIds, prospectToast, t);
    })
    .then(() => { done(); });
  });

  it('should delete all child user\'s toast when deleting a toast', (done) => {
    let toastCreatedId;
    const toastAPI = new ToastAPI(nullLogger, { user: currentUser });
    toastAPI.logger = nullLogger;
    toastAPI.schema = schema;
    const toastUser = users.slice(0, 2);
    const existingIds = toastUser.map(u => u._id.toString());
    const now = moment.utc();
    const prospectToast = {
      state: 'warning',
      title: 'Toast title',
      message: 'Toast message',
      users: existingIds,
      requireDismiss: true,
      ttl: 5,
      from: now.add(-1, 'days').format(),
      to: now.format(),
    };
    toastAPI.create(prospectToast)
    .catch((err) => {
      done(err);
    })
    .then((toastCreated) => {
      expect(toastCreated).to.exist;
      expect(toastCreated._id).to.exist;
      expect(toastCreated.users).to.exist;
      expect(toastCreated.users.length).to.eql(existingIds.length);
      toastCreatedId = toastCreated._id;
      prospectToast._id = toastCreated._id.toString();
      prospectToast.deleted = true;
      return toastAPI.edit(prospectToast);
    })
    .catch((err) => {
      done(err);
    })
    .then((toastEdited) => {
      expect(toastEdited).to.exist;
      return schema.UserToast.find({ toast: toastEdited._id });
    })
    .then((userToasts) => {
      expect(userToasts).to.exist;
      expect(userToasts.length).to.eql(0);
      return schema.Toast.findOneWithDeleted({ _id: toastCreatedId });
    })
    .then((toast) => {
      expect(toast).to.exist;
      expect(toast.deleted).to.eql(true);
      expect(toast.users).to.exist;
      expect(toast.users.length).to.eql(0);
    })
    .then(() => { done(); });
  });
});
*/