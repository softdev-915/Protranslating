// Useful when pointing APP_URL to https://lms-nodejs-test:3443
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
// Express WebServer
// -----------------------------

// Modules Dependencies:
//  - Assert (http://nodejs.org/api/assert.html)
//  - SuperAgent (http://visionmedia.github.io/superagent/)
const _ = require('lodash');
const StreamZip = require('node-stream-zip');
const rimraf = require('rimraf');
const assert = require('assert');
const moment = require('moment');
const fs = require('fs');
const superagent = require('superagent');
const AWSBucket = require('s3-bucket-multipart-toolkit');
const GCStorage = require('@google-cloud/storage');

// Global Variables for the test case
const d = process.env.APP_URL;
const credentials = {
  username : process.env.E2E_USER,
  password : process.env.E2E_PASS,
};
// modify for slow connections
const GLOBAL_TIMEOUT = 1000 * 0.5;

// https://stackoverflow.com/a/49433633/467034
//
// Create a file of 1 GiB
// createEmptyFileOfSize('./1.txt', 1024*1024*1024);
const createEmptyFileOfSize = (fileName, size) => {
  return new Promise((resolve, reject) => {
    // Check size
    if (size < 0) {
        reject("Error: a negative size doesn't make any sense")
        return;
    }

    // Will do the processing asynchronously
    setTimeout(() => {
        try {
          // Open the file for writing; 'w' creates the file
          // (if it doesn't exist) or truncates it (if it exists)
          fd = fs.openSync(fileName, 'w');
          if (size > 0) {
              // Write one byte (with code 0) at the desired offset
              // This forces the expanding of the file and fills the gap
              // with characters with code 0
              fs.writeSync(fd, Buffer.alloc(1), 0, 1, size - 1);
          }
          // Close the file to commit the changes to the file system
          fs.closeSync(fd);

          // Promise fulfilled
          resolve(true);
        } catch (error) {
          // Promise rejected
          reject(error);
        }
    // Create the file after the processing of the current JavaScript event loop
    }, 0)
  });
};

const getFilesizeInBytes = (filename) => {
    const stats = fs.statSync(filename)
    const fileSizeInBytes = stats.size
    return fileSizeInBytes;
}

// Request
let lspId = '';
let companyId = '';
let requestId = '';
let csrfToken = '';
let accountInfo = {};
let requestSuffix = moment().format();
let newDocument1 = {
  _id: '',
  name: 'delta.txt',
  size: 0,
};
let newDocument2 = {
  _id: '',
  name: 'alpha.txt',
  size: 0,
};
let newDocument3 = {
  _id: '',
  name: 'beta.txt',
  size: 0,
};
let newDocument4 = {
  _id: '',
  name: 'gamma.txt',
  size: 0,
};
let fileContents = '';
let fileContentsBeta = '';
let fileContentsGamma = '';
let fileContentsEpsilon = '';

// Workflow Id
let workflowId = '';

// Provider Task Id
let providerTaskQuoteId = '';
let providerTaskValAndDelId = '';

// Task Id
let validationAndDeliveryTaskId = '';
let validationAndDeliveryTask_ProviderTaskId = '';
let gammaQuoteTaskId = '';
let gammaQuoteTaskId_ProviderTaskId = '';

// Workflow
let providers = [];
let provider1 = {};
let provider2 = {};

// Scheduler
let schedulerId = '';
let schedulerLastRun = '';

const getProvidersWithAbility = (providers, ability) => {
  return providers.filter(function(provider) {
    const accounts = _.get(provider, 'accounts', []);

    if (accounts.length === 0) {
      return false;
    }

    const currentAccount = accounts.find((acc) => _.get(acc, 'lsp._id') === lspId);

    if (_.isUndefined(currentAccount)) {
      return false;
    }

    // search for the ability
    const abilities = _.get(currentAccount, 'abilities', []);

    if (abilities.indexOf(ability) === -1) {
      return false;
    }

    return true;
  });
}

const bucket = new AWSBucket({
  accessKeyId: process.env.AWS_S3_KEY,
  secretAccessKey: process.env.AWS_S3_SECRET,
  region: 'us-east-1',
  bucketACL: 'private',
  bucketName: process.env.AWS_S3_BUCKET,
  pagingDelay: 5, // (optional) set a global delay in between s3 api calls, default: 500ms
});
const gcs = GCStorage({
  keyFilename: process.env.GCS_KEY_FILE,
});
const gcsBucket = gcs.bucket(process.env.GCS_BUCKET);

// File sizes
const file500mb = './mocks/dummy-500mb.txt';
const file1gb = './mocks/dummy-1gb.txt';
const file3gb = './mocks/dummy-3gb.txt';
const file5gb = './mocks/dummy-5gb.txt';

// Unit Tests
describe('Platfrom Cloud Storage Tests (AWS + GCS)', function() {

  before(function (done) {
    // Start agent
    agent = superagent.agent();
    // check if file of 500mb exists ortherwise create it
    if (!fs.existsSync(file500mb)) {
      const p = [
        createEmptyFileOfSize(file500mb, 1024*1024*500),
        createEmptyFileOfSize(file1gb, 1024*1024*1024),
        createEmptyFileOfSize(file3gb, 1024*1024*1024*3),
        createEmptyFileOfSize(file5gb, 1024*1024*1024*5),
      ];

      Promise.all(p).then(() => done()).catch(done);
    }
    done();
  });

  beforeEach(function (done) {
    setTimeout(done, GLOBAL_TIMEOUT);
  });

  before(function(done){
    // console.log('Removing temporal files');
    rimraf('./temp/*.txt', (err) => {
      done(err);
    });
  })

  describe('Authenticate', function () {
    it('POST /auth Initializes the proper login strategy', function(done) {
      agent
        .post(d+'/api/auth')
        .set('Content-Type', 'application/json')
        .set('lms-mock', 'true')
        .send({email: credentials.username, password: credentials.password })
        .then(function (res) {
          csrfToken = _.get(res, 'body.data.csrfToken');
          assert.ok(res.ok);
          done();
        }).catch((err) => {
          done(err);
        });
    });

    it('GET /auth/me Returns the current user', function(done) {
      agent
        .get(d+'/api/auth/me')
        .then(function (res) {
          // console.log(res);
          // console.log(res.body);
          const currentEmail = _.get(res, 'body.data.user.email') || false;
          // console.log(currentEmail);
          assert.ok(res.ok);
          assert.equal(currentEmail, process.env.E2E_USER, 'Should be the expected user')
          done();
        }).catch(function(err) {
          console.log(err);
          done(err);
        });
    });
  });

  describe('Create Request', function () {

    it('POST /api/lsp/:lsp/company Upsert Company named AWSBigFilesCompany', function(done) {
      const testCompany = {
        name: 'AWSBigFilesCompany',
        parentId: '', subParentId: '', subSubParentId: '',
        subcompanies: [],
        // mandatory
        status: 'Won', industry: 'Automotive', customerTierLevel: '1',
        pursuitActive: false,
        website: '', primaryPhoneNumber: '', notes: '', salesRep: '',
        mailingAddress: { line1: '', line2: '', city: '', zip: '' },
        billingAddress: { line1: '', line2: '', city: '', zip: '' },
        billingEmail: '',
        cidr: [
          { ip: '0.0.0.0/0', description: 'All IPv4' },
          { ip: '0:0:0:0:0:0:0:0/0', description: 'All IPv6' }
        ],
        // Note: 1 minute retention
        retention: { days: 0, hours: 0, minutes: 1 },
        readDate: null
      };
      agent
        .set('csrf-token', csrfToken)
        .post(d+`/api/lsp/${lspId}/company`)
        .send(testCompany)
        .then(function (res) {
          assert.ok(res.ok);
          done();
        }).catch(function(err) {
          // console.log('>>>>>', err);
          // const statusCode = _.get(err, 'status');
          // assert.notEqual(statusCode, 409, 'Unexpected error code');
          // Upserting so ignore the error
          assert.ok(typeof err.message === 'string', 'Error message was expected');
          assert.ok(err.message.match(/*Conflict*/), 'While upserting only Conflict error was expected');
          done();
        });
    });

    it('GET /api/lsp/:lsp/company Obtain "AWSBigFilesCompany" company id', function(done) {
      agent
        .get(d+`/api/lsp/${lspId}/company`)
        .then(function (res) {
          // console.log(res);
          // let total = _.get(res, 'body.data.total', 0);
          // assert.ok(total >= 1, 'At least one company is needed to perform this test')
          let companies = _.get(res, 'body.data.list');
          let testCompany = companies.find(c => c.name === "AWSBigFilesCompany");
          // Set company id
          companyId = _.get(testCompany, '_id', '');
          assert.ok(companyId.length === 24, 'Company named "AWSBigFilesCompany" is mandatory to perform this test, invalid Object Id Provided');

          done();
        }).catch(function(err) {
          console.log(err);
          done(err);
        });
    });

    it('POST /api/lsp/:lsp/company/:company/document-prospect Upload dummy-500mb.txt document prospect', function(done) {
      agent
        .post(d+`/api/lsp/${lspId}/company/${companyId}/document-prospect`)
        .set('csrf-token', csrfToken)
        .attach('files', './mocks/dummy-500mb.txt')
        .then(function (res) {
          // console.log(res);
          // console.log(res.body);
          assert.ok(res.ok);
          const temporalDocs = _.get(res, 'body.data.documents') || [];
          assert.ok(temporalDocs.length === 1, 'Only one temporal file was expected')
          // populate newDocument1 data
          newDocument1._id = _.get(temporalDocs[0], '_id');
          newDocument1.name = _.get(temporalDocs[0], 'name');
          newDocument1.size = _.get(temporalDocs[0], 'size');
          done();
        }).catch(function(err) {
          console.log(err);
          done(err);
        });
    });

    it('AWS Download dummy-500mb.txt (prospect file) file from Bucket', function(done) {
      const s3 = bucket.S3;
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        // lspId/request_files/company/request/file.txt
        Key: `${lspId}/prospect_documents/${newDocument1._id}.txt`
      };
      const file = fs.createWriteStream(`./temp/${newDocument1._id}.txt`);
      const s3Stream = s3.getObject(params).createReadStream();
      s3Stream.pipe(file);
      s3Stream.on('end', function(){
        const sizeInMb = getFilesizeInBytes(`./temp/${newDocument1._id}.txt`) / 1000000.0;
        assert.ok(sizeInMb > 500, 'File does not have the expected size');
        done();
      });

      s3Stream.on('error', function(err){
        console.log("error", err);
        done(err);
      });

    });

    it('GCS Download dummy-500mb.txt (prospect file) file from Bucket', function(done) {
      const newKey = `${lspId}/prospect_documents/${newDocument1._id}.txt`;
      gcsBucket
        .file(newKey)
        .download({ destination: `./temp/${newDocument1._id}-gcs.txt` })
        .then(() => {
          const sizeInMb = getFilesizeInBytes(`./temp/${newDocument1._id}-gcs.txt`) / 1000000.0;
          assert.ok(sizeInMb > 500, 'File does not have the expected size');
          done();
        })
        .catch(done);
    });


    it.skip('DELETE /api/lsp/:lsp/document-prospect Remove dummy-500mb.txt document prospect', function(done) {
      agent
        .delete(d+`/api/lsp/${lspId}/document-prospect/${newDocument1._id}`)
        .set('csrf-token', csrfToken)
        .then(function (res) {
          // console.log(res);
          // console.log(res.body);
          assert.ok(res.ok);
          const temporalDoc = _.get(res, 'body.data.document', false);
          assert.ok(temporalDoc, 'Only one temporal file was expected')
          // populate newDocument1 data
          newDocument1._id = _.get(temporalDoc, '_id');
          newDocument1.name = _.get(temporalDoc, 'name');
          newDocument1.size = _.get(temporalDoc, 'size');
          done();
        }).catch(function(err) {
          // console.log(err);
          done(err);
        });
    });

    it.skip('AWS Check unable to download dummy-500mb.txt (prospect file) from Bucket', function(done) {
      const s3 = bucket.S3;
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        // lspId/request_files/company/request/file.txt
        Key: `${lspId}/prospect_documents/${newDocument1._id}.txt`
      };
      const file = fs.createWriteStream(`./temp/${newDocument1._id}-deleted.txt`);
      const s3Stream = s3.getObject(params).createReadStream();
      s3Stream.pipe(file);
      s3Stream.on('end', function(){
        const text = fs.readFileSync(`./temp/${newDocument1._id}-deleted.txt`,'utf8');
        console.log('ended', text);
        done(new Error('No file stream expected, when the file was marked as deleted'));
      });

      s3Stream.on('error', function(err){
        // console.log("error", err.message);
        const msg = err.message || '';
        const keyRegExp = new RegExp(".*The specified key does not exist.*", "i");
        assert.ok(msg.match(keyRegExp), 'NoSuchKey error should be triggered');
        done();
      });

    });

    it.skip('GCS Check unable to download dummy-500mb.txt (prospect file) from Bucket', function(done) {
      const newKey = `${lspId}/prospect_documents/${newDocument1._id}.txt`;
      gcsBucket
        .file(newKey)
        .download({ destination: `./temp/${newDocument1._id}-deleted-gcs.txt` })
        .then((resp) => {
          const text = fs.readFileSync(`./temp/${newDocument1._id}-deleted-gcs.txt`,'utf8');
          done(new Error('Should not be able to download removed files'));
        })
        .catch((err) => {
          const msg = err.message || '';
          const keyRegExp = new RegExp('.*No such object.*', "i")
          assert.ok(msg.match(keyRegExp), 'NoSuchKey error should be triggered');
          done();
        });
    });

    it.skip('AWS List dummy-500mb.txt file versions and delete markers from Bucket (expect none)', function(done) {
      const newKey = `${lspId}/prospect_documents/${newDocument1._id}.txt`;
      bucket.listFileVersions({
        Key: newKey,
      }).then(function(res){
        // console.log(res);
        assert.ok(typeof res.DeleteMarkers !== 'undefined', 'File Delete Markers were expected');
        assert.ok(typeof res.Versions !== 'undefined', 'File Version Markers were expected');
        // Note: Check delete marker exist
        assert.ok(res.Versions.length === 0, 'None version marker was expected');
        assert.ok(res.DeleteMarkers.length === 0, 'No deleted markers were expected');
        done();
      }).catch(function(err){
        done(err);
      });
    });

    it('POST /api/lsp/:lsp/company/:company/document-prospect Upload dummy-1gb.txt document prospect', function(done) {
      agent
        .post(d+`/api/lsp/${lspId}/company/${companyId}/document-prospect`)
        .set('csrf-token', csrfToken)
        .attach('files', './mocks/dummy-1gb.txt')
        .then(function (res) {
          // console.log(res);
          // console.log(res.body);
          assert.ok(res.ok);
          const temporalDocs = _.get(res, 'body.data.documents') || [];
          assert.ok(temporalDocs.length === 1, 'Only one temporal file was expected')
          // populate newDocument2 data
          newDocument2._id = _.get(temporalDocs[0], '_id');
          newDocument2.name = _.get(temporalDocs[0], 'name');
          newDocument2.size = _.get(temporalDocs[0], 'size');
          done();
        }).catch(function(err) {
          console.log(err);
          done(err);
        });
    });

    it('AWS Download dummy-1gb.txt (prospect file) file from Bucket', function(done) {
      const s3 = bucket.S3;
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        // lspId/request_files/company/request/file.txt
        Key: `${lspId}/prospect_documents/${newDocument2._id}.txt`
      };
      const file = fs.createWriteStream(`./temp/${newDocument2._id}.txt`);
      const s3Stream = s3.getObject(params).createReadStream();
      s3Stream.pipe(file);
      s3Stream.on('end', function(){
        const sizeInMb = getFilesizeInBytes(`./temp/${newDocument2._id}.txt`) / 1000000.0;
        assert.ok(sizeInMb > 1024, 'File does not have the expected size');
        // console.log('ended', text);
        done();
      });

      s3Stream.on('error', function(err){
        console.log("error", err);
        done(err);
      });

    });

    it('GCS Download dummy-1gb.txt (prospect file) file from Bucket', function(done) {
      const newKey = `${lspId}/prospect_documents/${newDocument2._id}.txt`;
      gcsBucket
        .file(newKey)
        .download({ destination: `./temp/${newDocument2._id}-gcs.txt` })
        .then(() => {
          const sizeInMb = getFilesizeInBytes(`./temp/${newDocument2._id}-gcs.txt`) / 1000000.0;
          assert.ok(sizeInMb > 1024, 'File does not have the expected size');
          done();
        })
        .catch(done);
    });


    it.skip('DELETE /api/lsp/:lsp/document-prospect Remove dummy-1gb.txt document prospect', function(done) {
      agent
        .delete(d+`/api/lsp/${lspId}/document-prospect/${newDocument2._id}`)
        .set('csrf-token', csrfToken)
        .then(function (res) {
          // console.log(res);
          // console.log(res.body);
          assert.ok(res.ok);
          const temporalDoc = _.get(res, 'body.data.document', false);
          assert.ok(temporalDoc, 'Only one temporal file was expected')
          // populate newDocument2 data
          newDocument2._id = _.get(temporalDoc, '_id');
          newDocument2.name = _.get(temporalDoc, 'name');
          newDocument2.size = _.get(temporalDoc, 'size');
          done();
        }).catch(function(err) {
          // console.log(err);
          done(err);
        });
    });

    it.skip('AWS Check unable to download dummy-1gb.txt (prospect file) from Bucket', function(done) {
      const s3 = bucket.S3;
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        // lspId/request_files/company/request/file.txt
        Key: `${lspId}/prospect_documents/${newDocument2._id}.txt`
      };
      const file = fs.createWriteStream(`./temp/${newDocument2._id}-deleted.txt`);
      const s3Stream = s3.getObject(params).createReadStream();
      s3Stream.pipe(file);
      s3Stream.on('end', function(){
        const text = fs.readFileSync(`./temp/${newDocument2._id}-deleted.txt`,'utf8');
        console.log('ended', text);
        done(new Error('No file stream expected, when the file was marked as deleted'));
      });

      s3Stream.on('error', function(err){
        // console.log("error", err.message);
        const msg = err.message || '';
        const keyRegExp = new RegExp(".*The specified key does not exist.*", "i");
        assert.ok(msg.match(keyRegExp), 'NoSuchKey error should be triggered');
        done();
      });

    });

    it.skip('GCS Check unable to download dummy-1gb.txt (prospect file) from Bucket', function(done) {
      const newKey = `${lspId}/prospect_documents/${newDocument2._id}.txt`;
      gcsBucket
        .file(newKey)
        .download({ destination: `./temp/${newDocument2._id}-deleted-gcs.txt` })
        .then((resp) => {
          const text = fs.readFileSync(`./temp/${newDocument2._id}-deleted-gcs.txt`,'utf8');
          done(new Error('Should not be able to download removed files'));
        })
        .catch((err) => {
          const msg = err.message || '';
          const keyRegExp = new RegExp('.*No such object.*', "i")
          assert.ok(msg.match(keyRegExp), 'NoSuchKey error should be triggered');
          done();
        });
    });

    it.skip('AWS List dummy-1gb.txt file versions and delete markers from Bucket (expect none)', function(done) {
      const newKey = `${lspId}/prospect_documents/${newDocument2._id}.txt`;
      bucket.listFileVersions({
        Key: newKey,
      }).then(function(res){
        // console.log(res);
        assert.ok(typeof res.DeleteMarkers !== 'undefined', 'File Delete Markers were expected');
        assert.ok(typeof res.Versions !== 'undefined', 'File Version Markers were expected');
        // Note: Check delete marker exist
        assert.ok(res.Versions.length === 0, 'None version marker was expected');
        assert.ok(res.DeleteMarkers.length === 0, 'No deleted markers were expected');
        done();
      }).catch(function(err){
        done(err);
      });
    });

    it('POST /api/lsp/:lsp/company/:company/document-prospect Upload dummy-3gb.txt document prospect', function(done) {
      agent
        .post(d+`/api/lsp/${lspId}/company/${companyId}/document-prospect`)
        .set('csrf-token', csrfToken)
        .attach('files', './mocks/dummy-3gb.txt')
        .then(function (res) {
          // console.log(res);
          // console.log(res.body);
          assert.ok(res.ok);
          const temporalDocs = _.get(res, 'body.data.documents') || [];
          assert.ok(temporalDocs.length === 1, 'Only one temporal file was expected')
          // populate newDocument3 data
          newDocument3._id = _.get(temporalDocs[0], '_id');
          newDocument3.name = _.get(temporalDocs[0], 'name');
          newDocument3.size = _.get(temporalDocs[0], 'size');
          done();
        }).catch(function(err) {
          console.log(err);
          done(err);
        });
    });

    it('AWS Download dummy-3gb.txt (prospect file) file from Bucket', function(done) {
      const s3 = bucket.S3;
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        // lspId/request_files/company/request/file.txt
        Key: `${lspId}/prospect_documents/${newDocument3._id}.txt`
      };
      const file = fs.createWriteStream(`./temp/${newDocument3._id}.txt`);
      const s3Stream = s3.getObject(params).createReadStream();
      s3Stream.pipe(file);
      s3Stream.on('end', function(){
        const sizeInMb = getFilesizeInBytes(`./temp/${newDocument3._id}.txt`) / 1000000.0;
        assert.ok(sizeInMb > (1024 * 3), 'File does not have the expected size');
        // console.log('ended', text);
        done();
      });

      s3Stream.on('error', function(err){
        console.log("error", err);
        done(err);
      });

    });

    it('GCS Download dummy-3gb.txt (prospect file) file from Bucket', function(done) {
      const newKey = `${lspId}/prospect_documents/${newDocument3._id}.txt`;
      gcsBucket
        .file(newKey)
        .download({ destination: `./temp/${newDocument3._id}-gcs.txt` })
        .then(() => {
          const sizeInMb = getFilesizeInBytes(`./temp/${newDocument3._id}-gcs.txt`) / 1000000.0;
          assert.ok(sizeInMb > (1024 * 3), 'File does not have the expected size');
          done();
        })
        .catch(done);
    });


    it.skip('DELETE /api/lsp/:lsp/document-prospect Remove dummy-3gb.txt document prospect', function(done) {
      agent
        .delete(d+`/api/lsp/${lspId}/document-prospect/${newDocument3._id}`)
        .set('csrf-token', csrfToken)
        .then(function (res) {
          // console.log(res);
          // console.log(res.body);
          assert.ok(res.ok);
          const temporalDoc = _.get(res, 'body.data.document', false);
          assert.ok(temporalDoc, 'Only one temporal file was expected')
          // populate newDocument3 data
          newDocument3._id = _.get(temporalDoc, '_id');
          newDocument3.name = _.get(temporalDoc, 'name');
          newDocument3.size = _.get(temporalDoc, 'size');
          done();
        }).catch(function(err) {
          // console.log(err);
          done(err);
        });
    });

    it.skip('AWS Check unable to download dummy-3gb.txt (prospect file) from Bucket', function(done) {
      const s3 = bucket.S3;
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        // lspId/request_files/company/request/file.txt
        Key: `${lspId}/prospect_documents/${newDocument3._id}.txt`
      };
      const file = fs.createWriteStream(`./temp/${newDocument3._id}-deleted.txt`);
      const s3Stream = s3.getObject(params).createReadStream();
      s3Stream.pipe(file);
      s3Stream.on('end', function(){
        const text = fs.readFileSync(`./temp/${newDocument3._id}-deleted.txt`,'utf8');
        console.log('ended', text);
        done(new Error('No file stream expected, when the file was marked as deleted'));
      });

      s3Stream.on('error', function(err){
        // console.log("error", err.message);
        const msg = err.message || '';
        const keyRegExp = new RegExp(".*The specified key does not exist.*", "i");
        assert.ok(msg.match(keyRegExp), 'NoSuchKey error should be triggered');
        done();
      });

    });

    it.skip('GCS Check unable to download dummy-3gb.txt (prospect file) from Bucket', function(done) {
      const newKey = `${lspId}/prospect_documents/${newDocument3._id}.txt`;
      gcsBucket
        .file(newKey)
        .download({ destination: `./temp/${newDocument3._id}-deleted-gcs.txt` })
        .then((resp) => {
          const text = fs.readFileSync(`./temp/${newDocument3._id}-deleted-gcs.txt`,'utf8');
          done(new Error('Should not be able to download removed files'));
        })
        .catch((err) => {
          const msg = err.message || '';
          const keyRegExp = new RegExp('.*No such object.*', "i")
          assert.ok(msg.match(keyRegExp), 'NoSuchKey error should be triggered');
          done();
        });
    });

    it.skip('AWS List dummy-3gb.txt file versions and delete markers from Bucket (expect none)', function(done) {
      const newKey = `${lspId}/prospect_documents/${newDocument3._id}.txt`;
      bucket.listFileVersions({
        Key: newKey,
      }).then(function(res){
        // console.log(res);
        assert.ok(typeof res.DeleteMarkers !== 'undefined', 'File Delete Markers were expected');
        assert.ok(typeof res.Versions !== 'undefined', 'File Version Markers were expected');
        // Note: Check delete marker exist
        assert.ok(res.Versions.length === 0, 'None version marker was expected');
        assert.ok(res.DeleteMarkers.length === 0, 'No deleted markers were expected');
        done();
      }).catch(function(err){
        done(err);
      });
    });

    it('POST /api/lsp/:lsp/company/:company/document-prospect Upload dummy-5gb.txt document prospect', function(done) {
      agent
        .post(d+`/api/lsp/${lspId}/company/${companyId}/document-prospect`)
        .set('csrf-token', csrfToken)
        .attach('files', './mocks/dummy-5gb.txt')
        .then(function (res) {
          // console.log(res);
          // console.log(res.body);
          assert.ok(res.ok);
          const temporalDocs = _.get(res, 'body.data.documents') || [];
          assert.ok(temporalDocs.length === 1, 'Only one temporal file was expected')
          // populate newDocument4 data
          newDocument4._id = _.get(temporalDocs[0], '_id');
          newDocument4.name = _.get(temporalDocs[0], 'name');
          newDocument4.size = _.get(temporalDocs[0], 'size');
          done();
        }).catch(function(err) {
          console.log(err);
          done(err);
        });
    });

    it('AWS Download dummy-5gb.txt (prospect file) file from Bucket', function(done) {
      const s3 = bucket.S3;
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        // lspId/request_files/company/request/file.txt
        Key: `${lspId}/prospect_documents/${newDocument4._id}.txt`
      };
      const file = fs.createWriteStream(`./temp/${newDocument4._id}.txt`);
      const s3Stream = s3.getObject(params).createReadStream();
      s3Stream.pipe(file);
      s3Stream.on('end', function(){
        const sizeInMb = getFilesizeInBytes(`./temp/${newDocument4._id}.txt`) / 1000000.0;
        assert.ok(sizeInMb > (1024 * 5), 'File does not have the expected size');
        // console.log('ended', text);
        done();
      });

      s3Stream.on('error', function(err){
        console.log("error", err);
        done(err);
      });

    });

    it('GCS Download dummy-5gb.txt (prospect file) file from Bucket', function(done) {
      const newKey = `${lspId}/prospect_documents/${newDocument4._id}.txt`;
      gcsBucket
        .file(newKey)
        .download({ destination: `./temp/${newDocument4._id}-gcs.txt` })
        .then(() => {
          const sizeInMb = getFilesizeInBytes(`./temp/${newDocument4._id}-gcs.txt`) / 1000000.0;
          assert.ok(sizeInMb > (1024 * 5), 'File does not have the expected size');
          done();
        })
        .catch(done);
    });


    it.skip('DELETE /api/lsp/:lsp/document-prospect Remove dummy-5gb.txt document prospect', function(done) {
      agent
        .delete(d+`/api/lsp/${lspId}/document-prospect/${newDocument4._id}`)
        .set('csrf-token', csrfToken)
        .then(function (res) {
          // console.log(res);
          // console.log(res.body);
          assert.ok(res.ok);
          const temporalDoc = _.get(res, 'body.data.document', false);
          assert.ok(temporalDoc, 'Only one temporal file was expected')
          // populate newDocument4 data
          newDocument4._id = _.get(temporalDoc, '_id');
          newDocument4.name = _.get(temporalDoc, 'name');
          newDocument4.size = _.get(temporalDoc, 'size');
          done();
        }).catch(function(err) {
          // console.log(err);
          done(err);
        });
    });

    it.skip('AWS Check unable to download dummy-5gb.txt (prospect file) from Bucket', function(done) {
      const s3 = bucket.S3;
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        // lspId/request_files/company/request/file.txt
        Key: `${lspId}/prospect_documents/${newDocument4._id}.txt`
      };
      const file = fs.createWriteStream(`./temp/${newDocument4._id}-deleted.txt`);
      const s3Stream = s3.getObject(params).createReadStream();
      s3Stream.pipe(file);
      s3Stream.on('end', function(){
        const text = fs.readFileSync(`./temp/${newDocument4._id}-deleted.txt`,'utf8');
        console.log('ended', text);
        done(new Error('No file stream expected, when the file was marked as deleted'));
      });

      s3Stream.on('error', function(err){
        // console.log("error", err.message);
        const msg = err.message || '';
        const keyRegExp = new RegExp(".*The specified key does not exist.*", "i");
        assert.ok(msg.match(keyRegExp), 'NoSuchKey error should be triggered');
        done();
      });

    });

    it.skip('GCS Check unable to download dummy-5gb.txt (prospect file) from Bucket', function(done) {
      const newKey = `${lspId}/prospect_documents/${newDocument4._id}.txt`;
      gcsBucket
        .file(newKey)
        .download({ destination: `./temp/${newDocument4._id}-deleted-gcs.txt` })
        .then((resp) => {
          const text = fs.readFileSync(`./temp/${newDocument4._id}-deleted-gcs.txt`,'utf8');
          done(new Error('Should not be able to download removed files'));
        })
        .catch((err) => {
          const msg = err.message || '';
          const keyRegExp = new RegExp('.*No such object.*', "i")
          assert.ok(msg.match(keyRegExp), 'NoSuchKey error should be triggered');
          done();
        });
    });

    it.skip('AWS List dummy-5gb.txt file versions and delete markers from Bucket (expect none)', function(done) {
      const newKey = `${lspId}/prospect_documents/${newDocument4._id}.txt`;
      bucket.listFileVersions({
        Key: newKey,
      }).then(function(res){
        // console.log(res);
        assert.ok(typeof res.DeleteMarkers !== 'undefined', 'File Delete Markers were expected');
        assert.ok(typeof res.Versions !== 'undefined', 'File Version Markers were expected');
        // Note: Check delete marker exist
        assert.ok(res.Versions.length === 0, 'None version marker was expected');
        assert.ok(res.DeleteMarkers.length === 0, 'No deleted markers were expected');
        done();
      }).catch(function(err){
        done(err);
      });
    });

    it('POST /api/lsp/:lsp/request/ Create Request', function(done) {
      const request = {
        catTool: "",
        comments: "<p>Demo007<br></p>",
        company: companyId,
        deliveryDate: "2018-06-30T15:00:00.000Z",
        otherCC: "",
        projectManagers: [],
        purchaseOrder: "",
        requireQuotation: false,
        competenceLevels: ["5aac273df81d54edbbcb5a56"],
        srcLang: {name: "English", isoCode: "ENG"},
        tgtLangs: [{name: "Spanish (Spain)", isoCode: "SPA-EU"}],
        title: `TestAWS-${requestSuffix}`,
        documents: [{
          final: false,
          isNew: true,
          isReference: false,
          language: null,
          name: newDocument1.name,
          oldId: null,
          removed: false,
          size: newDocument1.size,
          _id: newDocument1._id,
        }, {
          final: false,
          isNew: true,
          isReference: false,
          language: null,
          name: newDocument2.name,
          oldId: null,
          removed: false,
          size: newDocument2.size,
          _id: newDocument2._id,
        }, {
          final: false,
          isNew: true,
          isReference: false,
          language: null,
          name: newDocument3.name,
          oldId: null,
          removed: false,
          size: newDocument3.size,
          _id: newDocument3._id,
        }, {
          final: false,
          isNew: true,
          isReference: false,
          language: null,
          name: newDocument4.name,
          oldId: null,
          removed: false,
          size: newDocument4.size,
          _id: newDocument4._id,
        }]
      };
      agent
        .post(d+`/api/lsp/${lspId}/request`)
        .set('csrf-token', csrfToken)
        .set('Content-Type', 'application/json')
        .send(request)
        .then(function (res) {
          // console.log(res.body);
          requestId = _.get(res, 'body.data.request._id');
          // console.log(requestId);
          assert.ok(res.ok);
          setTimeout(done, 1000 * 5);
        }).catch(function(err) {
          console.log(err);
          done(err);
        });
    });
  });

  after(function() {
    const gammaKey = `${lspId}/request_files/${companyId}/${requestId}/task/${gammaQuoteTaskId}/task_files/${newDocument4._id}.txt`;
    console.log('  AWS Upload Summary');
    console.log('    Request Id: ', requestId);
    console.log('    Path gamma.txt: ', gammaKey);
  });

  after(function(done){
    // console.log('Removing temporal files');
    rimraf('./temp/*.*', (err) => {
      done(err);
    });
  })

});
