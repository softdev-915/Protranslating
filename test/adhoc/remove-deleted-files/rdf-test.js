
/* eslint-disable import/no-extraneous-dependencies */
require('mocha');
const path = require('path');
const chai = require('chai');
const Promise = require('bluebird');
const { Types: { ObjectId } } = require('mongoose');
const stdoutLogger = require('../../../app/components/log/stdout-logger');
const FileStorageFacade = require('../../../app/components/file-storage');
const { loadData } = require('../../unit/components/database/mongo/schemas/helper');
const rddTestData = require('./data.json');
const mongo = require('../../../app/components/database/mongo');
const schema = require('../../../app/components/database/mongo/schemas');

const RemoveDeletedDocuments = require('../../../app/adhoc/scripts/remove-deleted-files/remove-deleted-files');

const { expect } = chai;

// expired file count used to make assertions and generate different object ids
let deletedCount = 0;

const mockConfig = {
  environment {
    return {
      LMS_FILES_PATH: path.join(__dirname, 'data'),
      MONGODB_LMS_CONNECTION_STRING: 'mongodb://napi:Welcome123@127.0.0.1:27017/lms?ssl=true',
      MONGODB_LMS_AUTH_CONNECTION_STRING: 'mongodb://napi:Welcome123@127.0.0.1:27017/lms_auth?ssl=true',
      MONGODB_LMS_AUDIT_CONNECTION_STRING: 'mongodb://napi:Welcome123@127.0.0.1:27017/lms_audit?ssl=true',
    };
  },
};

const toRemove = [];
const toKeep = [];

const _prepareFile = (file) => {
  if (file.deleted) {
    file._id = new ObjectId().toString();
    deletedCount++;
    return (rem, keep, fStorage) => {
      rem.push(fStorage);
    };
  }
  file._id = new ObjectId().toString();
  return (rem, keep, fStorage) => {
    keep.push(fStorage);
  };
};

const _generateFileStorage = (doc, request, fileStorageFacade) => {
  const cId = request.company.toString();
  const rId = request._id.toString();
  let fileStorage;
  const shouldTrak = _prepareFile(doc);
  if (doc.final) {
    fileStorage = fileStorageFacade.translationRequestFinalFile(cId, rId, doc);
  } else {
    fileStorage = fileStorageFacade.translationRequestFile(cId, rId, doc);
  }
  if (shouldTrak) {
    shouldTrak(toRemove, toKeep, fileStorage);
    return fileStorage;
  }
  return null;
};

const _generateFile = (doc, request, fileStorageFacade) => {
  const fStorage = _generateFileStorage(doc, request, fileStorageFacade);
  if (fStorage) {
    return fStorage.saveOrReplace(doc.name);
  }
  return Promise.resolve();
};

const _prepareData = async (data) => {
  const filePathFactory = new FileStorageFacade('5a8103300000000000000000', mockConfig, stdoutLogger);
  await Promise.map(data.Request, (r) => {
    if (r.documents) {
      return Promise.map(r.documents, d => _generateFile(d, r, filePathFactory));
    }
  });
  return data;
};

const mockData = async () => {
  await schema.Lsp.remove({ _id: rddTestData.Lsp.map(r => r._id) });
  await schema.Company.remove({ _id: rddTestData.Company.map(r => r._id) });
  await schema.Request.remove({ _id: rddTestData.Request.map(r => r._id) });
  const mockedData = await _prepareData(rddTestData);
  await loadData(schema, mockedData);
};

describe('Document retention policy adhoc test', () => {
  before(async () => {
    await mongo.connect(mockConfig);
  });

  beforeEach(async () => {
    await mockData();
  });

  after(async () => {
    await mongo.close();
  });

  it('should delete fules', async () => {
    const rdd = new RemoveDeletedDocuments(stdoutLogger, mockConfig, schema);
    await rdd.removeDeletedFiles();
    expect(toRemove).to.exist;
    expect(toRemove.length).to.eql(13);
    expect(toKeep).to.exist;
    expect(toKeep.length).to.eql(9);
    await Promise.map(toRemove, fStorage =>
      fStorage.exists().then((exists) => {
        expect(exists).to.eql(false);
      }));
    await Promise.map(toKeep, fStorage =>
      fStorage.exists().then((exists) => {
        expect(exists).to.eql(true);
      }));
  });
});
