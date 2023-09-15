/* eslint-disable import/no-extraneous-dependencies */
require('mocha');
const path = require('path');
const chai = require('chai');
const Promise = require('bluebird');
const { Types: { ObjectId } } = require('mongoose');
const moment = require('moment');
const stdoutLogger = require('../../../app/components/log/stdout-logger');
const FileStorageFacade = require('../../../app/components/file-storage');
const { loadData } = require('../../unit/components/database/mongo/schemas/helper');
const documentRetentionTestData = require('./data.json');
const mongo = require('../../../app/components/database/mongo');
const schema = require('../../../app/components/database/mongo').models;
const DocumentRetentionPolicyApplier = require('../../../app/components/document-retention');

const { expect } = chai;
const mockConfig = {
  environment: {
    LMS_FILES_PATH: path.join(__dirname, 'data'),
    MONGODB_LMS_CONNECTION_STRING: 'mongodb://napi:Welcome123@127.0.0.1:27017/lms?ssl=true',
    MONGODB_LMS_AUTH_CONNECTION_STRING: 'mongodb://napi:Welcome123@127.0.0.1:27017/lms_auth?ssl=true',
    MONGODB_LMS_AUDIT_CONNECTION_STRING: 'mongodb://napi:Welcome123@127.0.0.1:27017/lms_audit?ssl=true',
    GCS_KEY_FILE: '',
    GCS_BUCKET: '',
    S3_START_MULTIPART_COPY_AT_BYTES: 0,
    ARCHIVE_FILES_IN_AWS: false,

  },
};
const toRemove = [];
const toKeep = [];
const _prepareFile = (request, file) => {
  const shouldRemove = request.title !== 'valid';

  if (shouldRemove) {
    expireFileCount++;
  }
  file._id = new ObjectId().toString();
  return (rem, keep, fStorage) => {
    if (shouldRemove) {
      rem.push(fStorage);
    } else {
      keep.push(fStorage);
    }
  };
};

const _generateFileStorage = (doc, request, task, fileStorageFacade) => {
  let tId;
  const cId = request.company.toString();
  const rId = request._id.toString();
  let fileStorage;
  const shouldTrak = _prepareFile(request, doc);

  if (task) {
    tId = task._id.toString();
    fileStorage = fileStorageFacade.translationRequestTaskFile(cId, rId, tId, doc);
  } else if (doc.final) {
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

const _generateFile = (doc, request, task, fileStorageFacade) => {
  const fStorage = _generateFileStorage(doc, request, task, fileStorageFacade);

  if (fStorage) {
    return fStorage.saveOrReplace(doc.name);
  }
  return Promise.resolve();
};

const _prepareData = async (data) => {
  const filePathFactory = new FileStorageFacade('5a8103300000000000000000', mockConfig, stdoutLogger);

  await Promise.map(data.Request, (r) => {
    let allPromises = [];

    if (r.title === 'completed') {
      r.completedAt = moment.utc().add(-2, 'days').toDate();
    } else if (r.title === 'cancelled') {
      r.cancelledAt = moment.utc().add(-2, 'days').toDate();
    }
    if (r.documents) {
      allPromises = allPromises
        .concat(r.documents.map((d) => _generateFile(d, r, null, filePathFactory)));
    }
    if (r.workflows) {
      r.workflows.forEach((w) => {
        w.tasks.forEach((t) => {
          t.providerTasks.forEach((pt) => {
            pt.files.forEach((f) => {
              allPromises.push(_generateFile(f, r, t, filePathFactory));
            });
          });
        });
      });
    }
    return Promise.all(allPromises);
  });
  return data;
};

const mockData = async () => {
  await schema.Lsp.remove({ _id: documentRetentionTestData.Lsp.map((r) => r._id) });
  await schema.Company.remove({ _id: documentRetentionTestData.Company.map((r) => r._id) });
  await schema.Request.remove({ _id: documentRetentionTestData.Request.map((r) => r._id) });
  const mockedData = await _prepareData(documentRetentionTestData);

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

  it('should not delete non expired documents', async () => {
    const documentRPA = new DocumentRetentionPolicyApplier(stdoutLogger, mockConfig, schema);

    await documentRPA.findExceedingRetentionDocument();
    expect(toRemove).to.exist;
    expect(toRemove.length).to.eql(26);
    expect(toKeep).to.exist;
    expect(toKeep.length).to.eql(18);
    await Promise.map(toRemove, (fStorage) => fStorage.exists().then((exists) => {
      expect(exists).to.eql(false);
    }));
    await Promise.map(toKeep, (fStorage) => fStorage.exists().then((exists) => {
      expect(exists).to.eql(true);
    }));
  });
});
