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

// Unit Tests
describe('Platfrom Cloud Storage Tests (AWS + GCS)', function() {

  before(function () {
    // Start agent
    agent = superagent.agent();
    fileContents = fs.readFileSync('./mocks/delta.txt', 'utf8');
    fileContentsAlpha = fs.readFileSync('./mocks/alpha.txt', 'utf8');
    fileContentsBeta = fs.readFileSync('./mocks/beta.txt', 'utf8');
    fileContentsGamma = fs.readFileSync('./mocks/gamma.txt', 'utf8');
    fileContentsEpsilon = fs.readFileSync('./mocks/epsilon.txt', 'utf8');
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
          // Extract the csrf token
          csrfToken = _.get(res, 'body.data.csrfToken');
          const user = _.get(res, 'body.data.user');
          // Extract lspid
          lspId = _.get(user, 'lsp');
          // console.log(lspId);
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

    it('POST /api/lsp/:lsp/company Upsert Company named AWSBucketTestCompany', function(done) {
      const testCompany = {
        name: 'AWSBucketTestCompany',
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

    it('GET /api/lsp/:lsp/company Obtain "AWSBucketTestCompany" company id', function(done) {
      agent
        .get(d+`/api/lsp/${lspId}/company`)
        .then(function (res) {
          // console.log(res);
          let total = _.get(res, 'body.data.total', 0);
          assert.ok(total >= 1, 'At least one company is needed to perform this test')
          let companies = _.get(res, 'body.data.list');
          let testCompany = companies.find(c => c.name === "AWSBucketTestCompany");
          // Set company id
          companyId = _.get(testCompany, '_id', '');
          assert.ok(companyId.length === 24, 'Company named "AWSBucketTestCompany" is mandatory to perform this test, invalid Object Id Provided');

          done();
        }).catch(function(err) {
          console.log(err);
          done(err);
        });
    });

    it('POST /api/lsp/:lsp/company/:company/document-prospect Upload epsilon.txt document prospect', function(done) {
      agent
        .post(d+`/api/lsp/${lspId}/company/${companyId}/document-prospect`)
        .set('csrf-token', csrfToken)
        .attach('files', './mocks/epsilon.txt')
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

    it('AWS Download epsilon.txt (prospect file) file from Bucket', function(done) {
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
        const text = fs.readFileSync(`./temp/${newDocument1._id}.txt`,'utf8');
        assert.equal(text, fileContentsEpsilon, 'File does not have the same contents');
        // console.log('ended', text);
        done();
      });

      s3Stream.on('error', function(err){
        console.log("error", err);
        done(err);
      });

    });

    it('GCS Download epsilon.txt (prospect file) file from Bucket', function(done) {
      const newKey = `${lspId}/prospect_documents/${newDocument1._id}.txt`;
      gcsBucket
        .file(newKey)
        .download({ destination: `./temp/${newDocument1._id}-gcs.txt` })
        .then(() => {
          const text = fs.readFileSync(`./temp/${newDocument1._id}-gcs.txt`,'utf8');
          assert.equal(text, fileContentsEpsilon, 'File does not have the same contents');
          done();
        })
        .catch(done);
    });


    it('DELETE /api/lsp/:lsp/document-prospect Remove epsilon.txt document prospect', function(done) {
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

    it('AWS Check unable to download epsilon.txt (prospect file) from Bucket', function(done) {
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

    it('GCS Check unable to download epsilon.txt (prospect file) from Bucket', function(done) {
      const newKey = `${lspId}/prospect_documents/${newDocument1._id}.txt`;
      gcsBucket
        .file(newKey)
        .download({ destination: `./temp/${newDocument1._id}-deleted-gcs.txt` })
        .then((resp) => {
          const text = fs.readFileSync(`./temp/${newDocument1._id}-deleted-gcs.txt`,'utf8');
          assert.equal(text, fileContents, 'File does not have the same contents');
          done(new Error('Should not be able to download removed files'));
        })
        .catch((err) => {
          const msg = err.message || '';
          const keyRegExp = new RegExp('.*No such object.*', "i")
          assert.ok(msg.match(keyRegExp), 'NoSuchKey error should be triggered');
          done();
        });
    });

    it('AWS List epsilon.txt file versions and delete markers from Bucket (expect none)', function(done) {
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

    it('POST /api/lsp/:lsp/document-prospect Upload delta.txt document prospect', function(done) {
      agent
        .post(d+`/api/lsp/${lspId}/company/${companyId}/document-prospect`)
        .set('csrf-token', csrfToken)
        .attach('files', './mocks/delta.txt')
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

    it('POST /api/lsp/:lsp/document-prospect Upload alpha.txt document prospect', function(done) {
      agent
        .post(d+`/api/lsp/${lspId}/company/${companyId}/document-prospect`)
        .set('csrf-token', csrfToken)
        .attach('files', './mocks/alpha.txt')
        .then(function (res) {
          // console.log(res);
          // console.log(res.body);
          assert.ok(res.ok);
          const temporalDocs = _.get(res, 'body.data.documents') || [];
          assert.ok(temporalDocs.length === 1, 'Only one temporal file was expected')
          // console.log(temporalDocs)
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

    it('AWS Download delta.txt (source file) file from Bucket', function(done) {
      const s3 = bucket.S3;
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        // lspId/request_files/company/request/file.txt
        Key: `${lspId}/request_files/${companyId}/${requestId}/${newDocument1._id}.txt`
      };
      console.log('params...', params);
      const file = fs.createWriteStream(`./temp/${newDocument1._id}-delta.txt`);
      const s3Stream = s3.getObject(params).createReadStream();
      s3Stream.pipe(file);
      s3Stream.on('end', function(){
        const text = fs.readFileSync(`./temp/${newDocument1._id}-delta.txt`,'utf8');
        assert.equal(text, fileContents, 'File does not have the same contents');
        // console.log('ended', text);
        done();
      });

      s3Stream.on('error', function(err){
        console.log("error", err);
        done(err);
      });

    });

    it('AWS Download alpha.txt source file from Bucket', function(done) {
      const s3 = bucket.S3;
      const newKey = `${lspId}/request_files/${companyId}/${requestId}/${newDocument2._id}.txt`
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        // lspId/request_files/company/request/file.txt
        Key: newKey
      };
      const file = fs.createWriteStream(`./temp/${newDocument2._id}.txt`);
      const s3Stream = s3.getObject(params).createReadStream();
      s3Stream.pipe(file);
      s3Stream.on('end', function(){
        const text = fs.readFileSync(`./temp/${newDocument2._id}.txt`,'utf8');
        assert.equal(text, fileContentsAlpha, 'File does not have the same contents');
        // console.log('ended', text);
        done();
      });

      s3Stream.on('error', function(err){
        console.log("error", err);
        done(err);
      });

    });

    it('AWS List alpha.txt file versions and delete markers from Bucket', function(done) {
      const newKey = `${lspId}/request_files/${companyId}/${requestId}/${newDocument2._id}.txt`
      bucket.listFileVersions({
        Key: newKey,
      }).then(function(res){
        // console.log(res);
        assert.ok(typeof res.DeleteMarkers !== 'undefined', 'File Delete Markers were expected');
        assert.ok(typeof res.Versions !== 'undefined', 'File Version Markers were expected');
        // Note: Check delete marker exist
        assert.ok(res.Versions.length === 1, 'Exactly one version marker was expected');
        assert.ok(res.DeleteMarkers.length === 0, 'No deleted markers were expected');
        done();
      }).catch(function(err){
        done(err);
      });
    });

    it('GCS Download delta.txt (source file) file from Bucket', function(done) {
      const newKey = `${lspId}/request_files/${companyId}/${requestId}/${newDocument1._id}.txt`
      gcsBucket
        .file(newKey)
        .download({ destination: `./temp/${newDocument1._id}-gcs.txt` })
        .then(() => {
          const text = fs.readFileSync(`./temp/${newDocument1._id}-gcs.txt`,'utf8');
          assert.equal(text, fileContents, 'File does not have the same contents');
          done();
        })
        .catch(done);
    });

    it('GCS Download alpha.txt source file from Bucket', function(done) {
      const newKey = `${lspId}/request_files/${companyId}/${requestId}/${newDocument2._id}.txt`
      gcsBucket
        .file(newKey)
        .download({ destination: `./temp/${newDocument2._id}-gcs.txt` })
        .then(() => {
          const text = fs.readFileSync(`./temp/${newDocument2._id}-gcs.txt`,'utf8');
          assert.equal(text, fileContentsAlpha, 'File does not have the same contents');
          done();
        })
        .catch(done);
    });

    it('GCS Check files exist listing by prefix', function(done) {
      gcsBucket.getFiles({prefix: `${lspId}/request_files/${companyId}/${requestId}`})
        .then(results => {
          const files = results[0] || [];
          assert.equal(files.length, 2, 'Exactly 2 files were expected for this request');
          done();
        })
        .catch(done);
    });

    it('GET /api/lsp/:lsp/company/:company/request/:request/documents/src/zip Download Zipped Source Files (alpha.txt, delta.txt)', function(done) {
      const tempPath = `./temp/${requestId}-source-files-1.zip`;
      const tempStream = fs.createWriteStream(tempPath);

      agent
        .get(d+`/api/lsp/${lspId}/company/${companyId}/request/${requestId}/documents/src/zip`)
        // .responeType('blob')
        .pipe(tempStream);

        tempStream
        .on("finish", () => {
          console.log("Reading zip file");

          const filesExpectedOnZip = ['alpha.txt', 'delta.txt'];

          const zip = new StreamZip({
            file: tempPath,
            storeEntries: true
          });

          zip.on('ready', () => {
            console.log('Entries read: ' + zip.entriesCount);
            const filesOnZip = [];
            for (const entry of Object.values(zip.entries())) {
              const desc = entry.isDirectory ? 'directory' : `${entry.size} bytes`;
              console.log(`Entry ${entry.name}: ${desc}`);
              filesOnZip.push(entry.name);
            }
            // Do not forget to close the file once you're done
            zip.close()
            console.log(filesOnZip.sort(), filesExpectedOnZip.sort(), 'All files expected are there');
            assert.deepEqual(filesOnZip.sort(), filesExpectedOnZip.sort(), 'Some files expected on zip are missing');
            done();
          });

          zip.on("error", (err) => {
            console.log("error while unzipping");
            done(err)
          });

        })
        .on("error", (err) => {
          console.log("error in request");
          done(err)
        });
    });
  });

  describe('Delete Source File delta.txt (source file) from Request', function () {
    it('PUT /api/lsp/:lsp/request/:request Update Request marking delta.txt file as removed', function(done) {
      const request = {
        catTool: "",
        comments: "<p>Demo007<br></p>",
        company: companyId,
        deliveryDate: "2018-06-30T15:00:00.000Z",
        otherCC: "",
        projectManagers: [],
        purchaseOrder: "",
        requireQuotation: false,
        srcLang: {name: "English", isoCode: "ENG"},
        tgtLangs: [{name: "Spanish (Spain)", isoCode: "SPA-EU"}],
        title: `TestAWS-${requestSuffix}`,
        documents: [{
          final: false,
          // is not new
          isNew: false,
          isReference: false,
          language: null,
          name: newDocument1.name,
          oldId: null,
          // Important: file marked as removed
          removed: true,
          size: newDocument1.size,
          _id: newDocument1._id,
        }, {
          final: false,
          // is not new
          isNew: false,
          isReference: false,
          language: null,
          name: newDocument2.name,
          oldId: null,
          removed: false,
          size: newDocument2.size,
          _id: newDocument2._id,
        }],
        _id: requestId
      };
      agent
        .put(d+`/api/lsp/${lspId}/request/${requestId}`)
        .set('csrf-token', csrfToken)
        .set('Content-Type', 'application/json')
        .send(request)
        .then(function (res) {
          // console.log(res.body.data.request);
          // console.log(requestId);
          assert.ok(res.ok);
          done();
        }).catch(function(err) {
          console.log(err);
          done(err);
        });
    });

    it('AWS Check unable to download delta.txt (source file) from Bucket', function(done) {
      const s3 = bucket.S3;
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        // lspId/request_files/company/request/file.txt
        Key: `${lspId}/request_files/${companyId}/${requestId}/${newDocument1._id}.txt`
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

    it('GCS Check unable to download delta.txt (source file) from Bucket', function(done) {
      const newKey = `${lspId}/request_files/${companyId}/${requestId}/${newDocument1._id}.txt`;
      gcsBucket
        .file(newKey)
        .download({ destination: `./temp/${newDocument1._id}-deleted-gcs.txt` })
        .then((resp) => {
          const text = fs.readFileSync(`./temp/${newDocument1._id}-deleted-gcs.txt`,'utf8');
          assert.equal(text, fileContents, 'File does not have the same contents');
          done(new Error('Should not be able to download removed files'));
        })
        .catch((err) => {
          const msg = err.message || '';
          const keyRegExp = new RegExp('.*No such object.*', "i")
          assert.ok(msg.match(keyRegExp), 'NoSuchKey error should be triggered');
          done();
        });
    });

    it('AWS List delta.txt file versions and markers from Bucket', function(done) {
      bucket.listFileVersions({
        Key: `${lspId}/request_files/${companyId}/${requestId}/${newDocument1._id}.txt`
      }).then(function(res){
        // console.log(res);
        assert.ok(typeof res.DeleteMarkers !== 'undefined', 'File Delete Markers were expected');
        assert.ok(typeof res.Versions !== 'undefined', 'File Version Markers were expected');
        // Note: Check delete marker exist
        assert.ok(res.Versions.length === 1, 'Exactly one version marker was expected');
        assert.ok(res.DeleteMarkers.length === 1, 'Exactly one deleted marker was expected');
        done();
      }).catch(function(err){
        done(err);
      });
    });

    it('GCS Check unable to find delta.txt listing by prefix', function(done) {
      gcsBucket.getFiles({
        prefix: `${lspId}/request_files/${companyId}/${requestId}/${newDocument1._id}.txt`
      })
      .then(results => {
        const files = results[0] || [];
        assert.equal(files.length, 0, 'Should not be able to find a removed file');
        done();
      })
      .catch(done);
    });

    it('GET /api/lsp/:lsp/company/:company/request/:request/documents/src/zip Download Zipped Source Files (alpha.txt)', function(done) {
      const tempPath = `./temp/${requestId}-source-files-1.zip`;
      const tempStream = fs.createWriteStream(tempPath);

      agent
        .get(d+`/api/lsp/${lspId}/company/${companyId}/request/${requestId}/documents/src/zip`)
        // .responeType('blob')
        .pipe(tempStream);

        tempStream
        .on("finish", () => {
          console.log("Reading zip file");

          const filesExpectedOnZip = ['alpha.txt'];

          const zip = new StreamZip({
            file: tempPath,
            storeEntries: true
          });

          zip.on('ready', () => {
            console.log('Entries read: ' + zip.entriesCount);
            const filesOnZip = [];
            for (const entry of Object.values(zip.entries())) {
              const desc = entry.isDirectory ? 'directory' : `${entry.size} bytes`;
              console.log(`Entry ${entry.name}: ${desc}`);
              filesOnZip.push(entry.name);
            }
            // Do not forget to close the file once you're done
            zip.close()
            console.log(filesOnZip.sort(), filesExpectedOnZip.sort(), 'All files expected are there');
            assert.deepEqual(filesOnZip.sort(), filesExpectedOnZip.sort(), 'Some files expected on zip are missing');
            done();
          });

          zip.on("error", (err) => {
            console.log("error while unzipping");
            done(err)
          });

        })
        .on("error", (err) => {
          console.log("error in request");
          done(err)
        });
    });

  });

  describe('Add Workflow and Upload final files', function () {

    it('GET /api/lsp/:lsp/user/provider Obtain one provider with Validation and Delivery ability', function (done) {
      agent
        .get(d+`/api/lsp/${lspId}/user/provider?ability=${encodeURI('Validation and Delivery')}&terminated=false`)
        .then(function (res) {
          // console.log(res);
          providers = _.get(res, 'body.data.list') || [];
          assert.ok(providers.length >= 1, 'At least one provider with ability "Validation and Delivery" is needed to perform this test')
          provider1 = providers[0];
          done();
        }).catch(function(err) {
          console.log(err);
          done(err);
        });
    });

    it('GET /api/lsp/:lsp/user/provider Obtain one provider with Quote ability', function(done) {
      agent
        .get(d+`/api/lsp/${lspId}/user/provider?ability=Quote&terminated=false`)
        .then(function (res) {
          // console.log(res);
          providers = _.get(res, 'body.data.list') || [];
          assert.ok(providers.length >= 1, 'At least one provider with ability "Quote" is needed to perform this test')
          provider2 = providers[0];
          done();
        }).catch(function(err) {
          console.log(err);
          done(err);
        });
    });


    it('POST /api/lsp/:lsp/document-prospect Upload beta.txt document prospect', function(done) {
      agent
        .post(d+`/api/lsp/${lspId}/company/${companyId}/document-prospect`)
        .set('csrf-token', csrfToken)
        .attach('files', './mocks/beta.txt')
        .then(function (res) {
          // console.log(res);
          // console.log(res.body);
          assert.ok(res.ok);
          const temporalDocs = _.get(res, 'body.data.documents') || [];
          assert.ok(temporalDocs.length === 1, 'Only one temporal file was expected')
          // console.log(temporalDocs)
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

    it('PUT /api/lsp/:lsp/request/:request Update Request create workflow', function(done) {
      const request = {
        catTool: "",
        comments: "<p>Demo007<br></p>",
        company: companyId,
        deliveryDate: "2018-06-30T15:00:00.000Z",
        internalComments: null,
        otherCC: "",
        projectManagers: [],
        purchaseOrder: "",
        requireQuotation: false,
        srcLang: {name: "English", isoCode: "ENG"},
        tgtLangs: [{name: "Spanish (Spain)", isoCode: "SPA-EU"}],
        title: `TestAWS-${requestSuffix}`,
        documents: [{
          final: false,
          // is not new
          isNew: false,
          isReference: false,
          language: null,
          name: newDocument2.name,
          oldId: null,
          removed: false,
          size: newDocument2.size,
          _id: newDocument2._id,
        }],
        _id: requestId,
        // adding workflows
        workflows: [{
          language: { name: "Spanish (Spain)", isoCode: "SPA-EU" },
          workflowDueDate: "2018-06-30T15:00:00.000Z",
          tasks: [{
            ability: "Validation and Delivery",
            providerTasks: [{
              notes: "",
              provider: provider1._id,
              quantity: [{amount: 0, units: ""}],
              status: "completed",
              taskDueDate: "2018-06-30T15:00:00.000Z",
              files: []
            }]
          }]
        }],
      };
      agent
        .put(d+`/api/lsp/${lspId}/request/${requestId}`)
        .set('csrf-token', csrfToken)
        .set('Content-Type', 'application/json')
        .send(request)
        .then(function (res) {
          // console.log(res.body.data.request);
          // console.log(requestId);
          validationAndDeliveryTaskId = _.get(res, 'body.data.request.workflows[0].tasks[0]._id');
          // console.log(validationAndDeliveryTaskId);
          assert.ok(res.ok);
          done();
        }).catch(function(err) {
          console.log(err);
          done(err);
        });
    });

    it('PUT /api/lsp/:lsp/request/:request Update Request adding beta.txt final file to workflow', function(done) {
      const request = {
        catTool: "",
        comments: "<p>Demo007<br></p>",
        company: companyId,
        deliveryDate: "2018-06-30T15:00:00.000Z",
        internalComments: null,
        otherCC: "",
        projectManagers: [],
        purchaseOrder: "",
        requireQuotation: false,
        srcLang: {name: "English", isoCode: "ENG"},
        tgtLangs: [{name: "Spanish (Spain)", isoCode: "SPA-EU"}],
        title: `TestAWS-${requestSuffix}`,
        documents: [{
          final: false,
          // is not new
          isNew: false,
          isReference: false,
          language: null,
          name: newDocument2.name,
          oldId: null,
          removed: false,
          size: newDocument2.size,
          _id: newDocument2._id,
        }, {
          // Note: should be final because this is Validation and Delivery
          final: true,
          isNew: true,
          isReference: false,
          language: null,
          // beta.txt should be added here too
          name: newDocument3.name,
          oldId: null,
          removed: false,
          size: newDocument3.size,
          _id: newDocument3._id,
        }],
        _id: requestId,
        // adding workflows
        workflows: [{
          language: { name: "Spanish (Spain)", isoCode: "SPA-EU" },
          workflowDueDate: "2018-06-30T15:00:00.000Z",
          tasks: [{
            _id: validationAndDeliveryTaskId,
            ability: "Validation and Delivery",
            providerTasks: [{
              notes: "",
              provider: provider1._id,
              quantity: [{amount: 0, units: ""}],
              status: "completed",
              taskDueDate: "2018-06-30T15:00:00.000Z",
              files: [{
                // Note: should be final because this is Validation and Delivery
                final: true,
                isConfidential: false,
                isNew: true,
                isReference: false,
                language: {name: "Spanish (Spain)", isoCode: "SPA-EU"},
                mime: "text/plain",
                name: newDocument3.name,
                size: newDocument3.size,
                temporary: true,
                uploading: false,
                _id: newDocument3._id,
              }]
            }]
          }]
        }],
      };
      agent
        .put(d+`/api/lsp/${lspId}/request/${requestId}`)
        .set('csrf-token', csrfToken)
        .set('Content-Type', 'application/json')
        .send(request)
        .then(function (res) {
          // console.log(res.body.data.request);
          validationAndDeliveryTask_ProviderTaskId = _.get(res, 'body.data.request.workflows[0].tasks[0].providerTasks[0]._id');
          // console.log(_.get(res, 'body.data.request.workflows[0].tasks[0].providerTasks[0]'), '<--');
          assert.ok(res.ok);
          done();
        }).catch(function(err) {
          console.log(err);
          done(err);
        });
    });

    it('AWS Download beta.txt final file from Bucket', function(done) {
      const s3 = bucket.S3;
      const newKey = `${lspId}/request_files/${companyId}/${requestId}/final/final_files/${newDocument3._id}.txt`;
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        // lspId/request_files/company/request/file.txt
        Key: newKey
      };
      const file = fs.createWriteStream(`./temp/${newDocument3._id}.txt`);
      const s3Stream = s3.getObject(params).createReadStream();
      s3Stream.pipe(file);
      s3Stream.on('end', function(){
        const text = fs.readFileSync(`./temp/${newDocument3._id}.txt`,'utf8');
        assert.equal(text, fileContentsBeta, 'File does not have the same contents');
        // console.log('ended', text);
        done();
      });

      s3Stream.on('error', function(err){
        console.log("error", err);
        done(err);
      });

    });

    it('GCS Download beta.txt final file from Bucket', function(done) {
      const newKey = `${lspId}/request_files/${companyId}/${requestId}/final/final_files/${newDocument3._id}.txt`;
      gcsBucket
        .file(newKey)
        .download({ destination: `./temp/${newDocument3._id}-gcs.txt` })
        .then(() => {
          const text = fs.readFileSync(`./temp/${newDocument3._id}-gcs.txt`,'utf8');
          assert.equal(text, fileContentsBeta, 'File does not have the same contents');
          done();
        })
        .catch(done);
    });

    it('GET /api/lsp/:lsp/request/:request/documents/src/zip Download Zipped Task Files (beta.txt)', function(done) {
      // http://localhost:8080/api/lsp/58f60d08963daf9a13ce1889/request/5bceaae4f6bf160007463f50/task/5bceaaf9f6bf160007463f83/providerTask/5bceaafaf6bf160007463f91/documents/zip?ptsCookieValue=6971001516
      const tempPath = `./temp/${requestId}-task-files-3.zip`;
      const tempStream = fs.createWriteStream(tempPath);
      let url = d+`/api/lsp/${lspId}/request/${requestId}/task/${validationAndDeliveryTaskId}`;
      url += `/providerTask/${validationAndDeliveryTask_ProviderTaskId}/documents/zip`
      console.log(url);

      agent
        .get(url)
        // .responeType('blob')
        .pipe(tempStream);

        tempStream
        .on("finish", () => {
          console.log("Reading zip file");

          const filesExpectedOnZip = ['beta.txt'];

          const zip = new StreamZip({
            file: tempPath,
            storeEntries: true
          });

          zip.on('ready', () => {
            console.log('Entries read: ' + zip.entriesCount);
            const filesOnZip = [];
            for (const entry of Object.values(zip.entries())) {
              const desc = entry.isDirectory ? 'directory' : `${entry.size} bytes`;
              console.log(`Entry ${entry.name}: ${desc}`);
              filesOnZip.push(entry.name);
            }
            // Do not forget to close the file once you're done
            zip.close()
            console.log(filesOnZip.sort(), filesExpectedOnZip.sort(), 'All files expected are there');
            assert.deepEqual(filesOnZip.sort(), filesExpectedOnZip.sort(), 'Some files expected on zip are missing');
            done();
          });

          zip.on("error", (err) => {
            console.log("error while unzipping");
            done(err)
          });

        })
        .on("error", (err) => {
          console.log("error in request");
          done(err)
        });
    });
  });

  describe('Add Workflow and Upload task files', function () {

    it('POST /api/lsp/:lsp/document-prospect Upload gamma.txt document prospect', function(done) {
      agent
        .post(d+`/api/lsp/${lspId}/company/${companyId}/document-prospect`)
        .set('csrf-token', csrfToken)
        .attach('files', './mocks/gamma.txt')
        .then(function (res) {
          // console.log(res);
          // console.log(res.body);
          assert.ok(res.ok);
          const temporalDocs = _.get(res, 'body.data.documents') || [];
          assert.ok(temporalDocs.length === 1, 'Only one temporal file was expected')
          // console.log(temporalDocs)
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

    it('PUT /api/lsp/:lsp/request/:request Update Request adding Quote task to workflow', function(done) {
      const request = {
        catTool: "",
        comments: "<p>Demo007<br></p>",
        company: companyId,
        deliveryDate: "2018-06-30T15:00:00.000Z",
        internalComments: null,
        otherCC: "",
        projectManagers: [],
        purchaseOrder: "",
        requireQuotation: false,
        srcLang: {name: "English", isoCode: "ENG"},
        tgtLangs: [{name: "Spanish (Spain)", isoCode: "SPA-EU"}],
        title: `TestAWS-${requestSuffix}`,
        documents: [{
          final: false,
          // is not new
          isNew: false,
          isReference: false,
          language: null,
          name: newDocument2.name,
          oldId: null,
          removed: false,
          size: newDocument2.size,
          _id: newDocument2._id,
        }, {
          // Note: should be final because this is Validation and Delivery
          final: true,
          isNew: false,
          isReference: false,
          language: null,
          // beta.txt should be added here too
          name: newDocument3.name,
          oldId: null,
          removed: false,
          size: newDocument3.size,
          _id: newDocument3._id,
        }],
        _id: requestId,
        // adding workflows
        workflows: [{
          language: { name: "Spanish (Spain)", isoCode: "SPA-EU" },
          workflowDueDate: "2018-06-30T15:00:00.000Z",
          tasks: [{
            _id: validationAndDeliveryTaskId,
            ability: "Validation and Delivery",
            providerTasks: [{
              notes: "",
              provider: provider1._id,
              quantity: [{amount: 0, units: ""}],
              status: "completed",
              taskDueDate: "2018-06-30T15:00:00.000Z",
              files: [{
                // Note: should be final because this is Validation and Delivery
                final: true,
                isConfidential: false,
                isNew: true,
                isReference: false,
                language: {name: "Spanish (Spain)", isoCode: "SPA-EU"},
                mime: "text/plain",
                name: newDocument3.name,
                size: newDocument3.size,
                temporary: true,
                uploading: false,
                _id: newDocument3._id,
              }]
            }]
          }, {
            // Note: Created a new task without file
            ability: "Quote",
            providerTasks: [{
              notes: "",
              // Note: provider 2 qith Quotes ability
              provider: provider2._id,
              quantity: [{amount: 0, units: ""}],
              status: "notStarted",
              taskDueDate: "2018-06-30T15:00:00.000Z",
              // Note files on next test case
              files: []
            }]
          }]
        }],
      };
      agent
        .put(d+`/api/lsp/${lspId}/request/${requestId}`)
        .set('csrf-token', csrfToken)
        .set('Content-Type', 'application/json')
        .send(request)
        .then(function (res) {
          // console.log(res.body.data.request);
          // console.log(requestId);
          // Get Quote Task Id
          gammaQuoteTaskId = _.get(res, 'body.data.request.workflows[0].tasks[1]._id');
          assert.ok(res.ok);
          done();
        }).catch(function(err) {
          console.log(err);
          done(err);
        });
    });

    it('PUT /api/lsp/:lsp/request/:request Update Request adding non final file to workflow Quote task', function(done) {
      const request = {
        catTool: "",
        comments: "<p>Demo007<br></p>",
        company: companyId,
        deliveryDate: "2018-06-30T15:00:00.000Z",
        internalComments: null,
        otherCC: "",
        projectManagers: [],
        purchaseOrder: "",
        requireQuotation: false,
        srcLang: {name: "English", isoCode: "ENG"},
        tgtLangs: [{name: "Spanish (Spain)", isoCode: "SPA-EU"}],
        title: `TestAWS-${requestSuffix}`,
        documents: [{
          final: false,
          // is not new
          isNew: false,
          isReference: false,
          language: null,
          name: newDocument2.name,
          oldId: null,
          removed: false,
          size: newDocument2.size,
          _id: newDocument2._id,
        }, {
          // Note: should be final because this is Validation and Delivery
          final: true,
          isNew: false,
          isReference: false,
          language: null,
          // beta.txt should be added here too
          name: newDocument3.name,
          oldId: null,
          removed: false,
          size: newDocument3.size,
          _id: newDocument3._id,
        }],
        _id: requestId,
        // adding workflows
        workflows: [{
          language: { name: "Spanish (Spain)", isoCode: "SPA-EU" },
          workflowDueDate: "2018-06-30T15:00:00.000Z",
          tasks: [{
            _id: validationAndDeliveryTaskId,
            ability: "Validation and Delivery",
            providerTasks: [{
              notes: "",
              provider: provider1._id,
              quantity: [{amount: 0, units: ""}],
              status: "completed",
              taskDueDate: "2018-06-30T15:00:00.000Z",
              files: [{
                // Note: should be final because this is Validation and Delivery
                final: true,
                isConfidential: false,
                isNew: true,
                isReference: false,
                language: {name: "Spanish (Spain)", isoCode: "SPA-EU"},
                mime: "text/plain",
                name: newDocument3.name,
                size: newDocument3.size,
                temporary: true,
                uploading: false,
                _id: newDocument3._id,
              }]
            }]
          }, {
            // Note: added extracted TaskId
            _id: gammaQuoteTaskId,
            // Note: Created a new task without file
            ability: "Quote",
            providerTasks: [{
              notes: "",
              // Note: provider 2 qith Quotes ability
              provider: provider2._id,
              quantity: [{amount: 0, units: ""}],
              status: "notStarted",
              taskDueDate: "2018-06-30T15:00:00.000Z",
              // Note files on next test case
              files: [{
                final: false,
                isConfidential: false,
                isNew: true,
                isReference: false,
                language: {name: "Spanish (Spain)", isoCode: "SPA-EU"},
                mime: "text/plain",
                name: newDocument4.name,
                size: newDocument4.size,
                // taskId: "5b40d3ed3aadd85525d7a799",
                temporary: false,
                uploading: false,
                _id: newDocument4._id
              }]
            }]
          }]
        }],
      };
      agent
        .put(d+`/api/lsp/${lspId}/request/${requestId}`)
        .set('csrf-token', csrfToken)
        .set('Content-Type', 'application/json')
        .send(request)
        .then(function (res) {
          // console.log(res.body.data.request);
          // console.log(requestId);
          gammaQuoteTaskId_ProviderTaskId = _.get(res, 'body.data.request.workflows[0].tasks[1].providerTasks[0]._id');
          assert.ok(res.ok);
          done();
        }).catch(function(err) {
          console.log(err);
          done(err);
        });
    });

    it('AWS Download gamma.txt task file from Bucket', function(done) {
      const s3 = bucket.S3;
      const newKey = `${lspId}/request_files/${companyId}/${requestId}/task/${gammaQuoteTaskId}/task_files/${newDocument4._id}.txt`;
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        // lspId/request_files/company/request/file.txt
        Key: newKey
      };
      const file = fs.createWriteStream(`./temp/${newDocument4._id}.txt`);
      const s3Stream = s3.getObject(params).createReadStream();
      s3Stream.pipe(file);
      s3Stream.on('end', function(){
        const text = fs.readFileSync(`./temp/${newDocument4._id}.txt`,'utf8');
        assert.equal(text, fileContentsGamma, 'File does not have the same contents');
        // console.log('ended', text);
        done();
      });

      s3Stream.on('error', function(err){
        console.log("error", err);
        done(err);
      });

    });

    it('GCS Download gamma.txt task file from Bucket', function(done) {
      const newKey = `${lspId}/request_files/${companyId}/${requestId}/task/${gammaQuoteTaskId}/task_files/${newDocument4._id}.txt`;
      gcsBucket
        .file(newKey)
        .download({ destination: `./temp/${newDocument4._id}-gcs.txt` })
        .then(() => {
          const text = fs.readFileSync(`./temp/${newDocument4._id}-gcs.txt`,'utf8');
          assert.equal(text, fileContentsGamma, 'File does not have the same contents');
          done();
        })
        .catch(done);
    });

    it('GET /api/lsp/:lsp/request/:request/documents/src/zip Download Zipped Task Files (gamma.txt)', function(done) {
      // http://localhost:8080/api/lsp/58f60d08963daf9a13ce1889/request/5bceaae4f6bf160007463f50/task/5bceaaf9f6bf160007463f83/providerTask/5bceaafaf6bf160007463f91/documents/zip?ptsCookieValue=6971001516
      const tempPath = `./temp/${requestId}-task-files-3.zip`;
      const tempStream = fs.createWriteStream(tempPath);
      let url = d+`/api/lsp/${lspId}/request/${requestId}/task/${gammaQuoteTaskId}`;
      url += `/providerTask/${gammaQuoteTaskId_ProviderTaskId}/documents/zip`
      console.log(url);

      agent
        .get(url)
        // .responeType('blob')
        .pipe(tempStream);

        tempStream
        .on("finish", () => {
          console.log("Reading zip file");

          const filesExpectedOnZip = ['gamma.txt'];

          const zip = new StreamZip({
            file: tempPath,
            storeEntries: true
          });

          zip.on('ready', () => {
            console.log('Entries read: ' + zip.entriesCount);
            const filesOnZip = [];
            for (const entry of Object.values(zip.entries())) {
              const desc = entry.isDirectory ? 'directory' : `${entry.size} bytes`;
              console.log(`Entry ${entry.name}: ${desc}`);
              filesOnZip.push(entry.name);
            }
            // Do not forget to close the file once you're done
            zip.close()
            console.log(filesOnZip.sort(), filesExpectedOnZip.sort(), 'All files expected are there');
            assert.deepEqual(filesOnZip.sort(), filesExpectedOnZip.sort(), 'Some files expected on zip are missing');
            done();
          });

          zip.on("error", (err) => {
            console.log("error while unzipping");
            done(err)
          });

        })
        .on("error", (err) => {
          console.log("error in request");
          done(err)
        });
    });

    it('GET /api/lsp/:lsp/request/:request/documents/src/zip Download Zipped Final Files (beta.txt)', function(done) {
      // http://localhost:8080/api/lsp/58f60d08963daf9a13ce1889/company/5b48c8460c7082001d5f905c/request/5bceb77cf6bf160007465571/documents/final/zip?ptsCookieValue=65785280799
      const tempPath = `./temp/${requestId}-final-files-4.zip`;
      const tempStream = fs.createWriteStream(tempPath);
      let url = d+`/api/lsp/${lspId}/company/${companyId}/request/${requestId}/documents/final/zip`
      console.log(url);

      agent
        .get(url)
        // .responeType('blob')
        .pipe(tempStream);

        tempStream
        .on("finish", () => {
          console.log("Reading zip file");

          const filesExpectedOnZip = ['beta.txt'];

          const zip = new StreamZip({
            file: tempPath,
            storeEntries: true
          });

          zip.on('ready', () => {
            console.log('Entries read: ' + zip.entriesCount);
            const filesOnZip = [];
            for (const entry of Object.values(zip.entries())) {
              const desc = entry.isDirectory ? 'directory' : `${entry.size} bytes`;
              console.log(`Entry ${entry.name}: ${desc}`);
              filesOnZip.push(entry.name);
            }
            // Do not forget to close the file once you're done
            zip.close()
            console.log(filesOnZip.sort(), filesExpectedOnZip.sort(), 'All files expected are there');
            assert.deepEqual(filesOnZip.sort(), filesExpectedOnZip.sort(), 'Some files expected on zip are missing');
            done();
          });

          zip.on("error", (err) => {
            console.log("error while unzipping");
            done(err)
          });

        })
        .on("error", (err) => {
          console.log("error in request");
          done(err)
        });
    });
  });

  describe('Delete Task File gamma.txt (non final file) from Quote Task', function () {
    it('PUT /api/lsp/:lsp/request/:request Update Request deleting non final file to workflow Quote task', function(done) {
      const request = {
        catTool: "",
        comments: "<p>Demo007<br></p>",
        company: companyId,
        deliveryDate: "2018-06-30T15:00:00.000Z",
        internalComments: null,
        otherCC: "",
        projectManagers: [],
        purchaseOrder: "",
        requireQuotation: false,
        srcLang: {name: "English", isoCode: "ENG"},
        tgtLangs: [{name: "Spanish (Spain)", isoCode: "SPA-EU"}],
        title: `TestAWS-${requestSuffix}`,
        documents: [{
          final: false,
          // is not new
          isNew: false,
          isReference: false,
          language: null,
          name: newDocument2.name,
          oldId: null,
          removed: false,
          size: newDocument2.size,
          _id: newDocument2._id,
        }, {
          // Note: should be final because this is Validation and Delivery
          final: true,
          isNew: false,
          isReference: false,
          language: null,
          // beta.txt should be added here too
          name: newDocument3.name,
          oldId: null,
          removed: false,
          size: newDocument3.size,
          _id: newDocument3._id,
        }],
        _id: requestId,
        // adding workflows
        workflows: [{
          language: { name: "Spanish (Spain)", isoCode: "SPA-EU" },
          workflowDueDate: "2018-06-30T15:00:00.000Z",
          tasks: [{
            _id: validationAndDeliveryTaskId,
            ability: "Validation and Delivery",
            providerTasks: [{
              notes: "",
              provider: provider1._id,
              quantity: [{amount: 0, units: ""}],
              status: "completed",
              taskDueDate: "2018-06-30T15:00:00.000Z",
              files: [{
                // Note: should be final because this is Validation and Delivery
                final: true,
                isConfidential: false,
                isNew: true,
                isReference: false,
                language: {name: "Spanish (Spain)", isoCode: "SPA-EU"},
                mime: "text/plain",
                name: newDocument3.name,
                size: newDocument3.size,
                temporary: true,
                uploading: false,
                _id: newDocument3._id,
              }]
            }]
          }, {
            // Note: added extracted TaskId
            _id: gammaQuoteTaskId,
            // Note: Created a new task without file
            ability: "Quote",
            providerTasks: [{
              notes: "",
              // Note: provider 2 qith Quotes ability
              provider: provider2._id,
              quantity: [{amount: 0, units: ""}],
              status: "notStarted",
              taskDueDate: "2018-06-30T15:00:00.000Z",
              // Note files on next test case
              files: [{
                createdAt: "2018-07-09T15:00:31.238Z",
                updatedAt: "2018-07-09T15:00:31.238Z",
                // Note: Deleted true (removed)
                deleted: true,
                deletedByRetentionPolicyAt: null,
                final: false,
                isConfidential: false,
                isNew: false,
                isReference: false,
                language: {name: "Spanish (Spain)", isoCode: "SPA-EU"},
                mime: "text/plain",
                name: newDocument4.name,
                size: newDocument4.size,
                // Task ID
                taskId: gammaQuoteTaskId,
                temporary: false,
                uploading: false,
                _id: newDocument4._id
              }]
            }]
          }]
        }],
      };
      agent
        .put(d+`/api/lsp/${lspId}/request/${requestId}`)
        .set('csrf-token', csrfToken)
        .set('Content-Type', 'application/json')
        .send(request)
        .then(function (res) {
          // console.log(res.body.data.request);
          // console.log(requestId);
          assert.ok(res.ok);
          done();
        }).catch(function(err) {
          console.log(err);
          done(err);
        });
    });

    it('AWS Check unable to download gamma.txt (non final file attached to task) from Bucket', function(done) {
      const s3 = bucket.S3;
      const newKey = `${lspId}/request_files/${companyId}/${requestId}/task/${gammaQuoteTaskId}/task_files/${newDocument4._id}.txt`;
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        // lspId/request_files/company/request/file.txt
        Key: newKey
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

    it('AWS List gamma.txt file versions and delete markers from Bucket', function(done) {
      const newKey = `${lspId}/request_files/${companyId}/${requestId}/task/${gammaQuoteTaskId}/task_files/${newDocument4._id}.txt`;
      bucket.listFileVersions({
        Key: newKey,
      }).then(function(res){
        // console.log(res);
        assert.ok(typeof res.DeleteMarkers !== 'undefined', 'File Delete Markers were expected');
        assert.ok(typeof res.Versions !== 'undefined', 'File Version Markers were expected');
        // Note: Check delete marker exist
        assert.ok(res.Versions.length === 1, 'Exactly one version marker was expected');
        assert.ok(res.DeleteMarkers.length === 1, 'Exactly one deleted marker was expected');
        done();
      }).catch(function(err){
        done(err);
      });
    });

    it('GCS Check unable to download gamma.txt (task file) from Bucket', function(done) {
      const newKey = `${lspId}/request_files/${companyId}/${requestId}/task/${gammaQuoteTaskId}/task_files/${newDocument4._id}.txt`;
      gcsBucket
        .file(newKey)
        .download({ destination: `./temp/${newDocument4._id}-deleted-gcs.txt` })
        .then((resp) => {
          const text = fs.readFileSync(`./temp/${newDocument4._id}-deleted-gcs.txt`,'utf8');
          assert.equal(text, fileContents, 'File does not have the same contents');
          done(new Error('Should not be able to download removed files'));
        })
        .catch((err) => {
          const msg = err.message || '';
          const keyRegExp = new RegExp('.*No such object.*', "i")
          assert.ok(msg.match(keyRegExp), 'NoSuchKey error should be triggered');
          done();
        });
    });

  });

  describe('Delete Task File beta.txt (final file) from Validation and Delivery Task', function () {
    it('PUT /api/lsp/:lsp/request/:request Update Request deleting beta.txt task final file from Validation and Delivery task', function(done) {
      const request = {
        catTool: "",
        comments: "<p>Demo007<br></p>",
        company: companyId,
        deliveryDate: "2018-06-30T15:00:00.000Z",
        internalComments: null,
        otherCC: "",
        projectManagers: [],
        purchaseOrder: "",
        requireQuotation: false,
        srcLang: {name: "English", isoCode: "ENG"},
        tgtLangs: [{name: "Spanish (Spain)", isoCode: "SPA-EU"}],
        title: `TestAWS-${requestSuffix}`,
        documents: [{
          final: false,
          isNew: false,
          isReference: false,
          language: null,
          name: newDocument2.name,
          oldId: null,
          removed: false,
          size: newDocument2.size,
          _id: newDocument2._id,
        }, {
          // Note: should be final because this is Validation and Delivery
          final: true,
          isNew: false,
          isReference: false,
          language: null,
          name: newDocument3.name,
          oldId: null,
          // Note: indicate that beta.txt was removed
          removed: true,
          size: newDocument3.size,
          _id: newDocument3._id,
        }],
        _id: requestId,
        // adding workflows
        workflows: [{
          language: { name: "Spanish (Spain)", isoCode: "SPA-EU" },
          workflowDueDate: "2018-06-30T15:00:00.000Z",
          tasks: [{
            _id: validationAndDeliveryTaskId,
            ability: "Validation and Delivery",
            providerTasks: [{
              notes: "",
              provider: provider1._id,
              quantity: [{amount: 0, units: ""}],
              status: "notStarted",
              taskDueDate: "2018-06-30T15:00:00.000Z",
              // Note: file is empty, because beta.txt was removed
              // Final files are handled via main document array
              // non final files are marked as deleted here
              files: []
            }]
          }, {
            // Note: added extracted TaskId
            _id: gammaQuoteTaskId,
            // Note: Created a new task without file
            ability: "Quote",
            providerTasks: [{
              notes: "",
              // Note: provider 2 qith Quotes ability
              provider: provider2._id,
              quantity: [{amount: 0, units: ""}],
              status: "notStarted",
              taskDueDate: "2018-06-30T15:00:00.000Z",
              // Note files on next test case
              files: []
            }]
          }]
        }],
      };
      agent
        .put(d+`/api/lsp/${lspId}/request/${requestId}`)
        .set('csrf-token', csrfToken)
        .set('Content-Type', 'application/json')
        .send(request)
        .then(function (res) {
          // console.log(res.body.data.request);
          // console.log(requestId);
          assert.ok(res.ok);
          done();
        }).catch(function(err) {
          console.log(err);
          done(err);
        });
    });

    it('AWS Check unable to download beta.txt (final file attached to task) from Bucket', function(done) {
      const s3 = bucket.S3;
      const newKey = `${lspId}/request_files/${companyId}/${requestId}/final/final_files/${newDocument3._id}.txt`;
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        // lspId/request_files/company/request/file.txt
        Key: newKey
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

    it('AWS List beta.txt file versions and delete markers from Bucket', function(done) {
      const newKey = `${lspId}/request_files/${companyId}/${requestId}/final/final_files/${newDocument3._id}.txt`;
      bucket.listFileVersions({
        Key: newKey,
      }).then(function(res){
        // console.log(res);
        assert.ok(typeof res.DeleteMarkers !== 'undefined', 'File Delete Markers were expected');
        assert.ok(typeof res.Versions !== 'undefined', 'File Version Markers were expected');
        // Note: Check delete marker exist
        // console.log(res);
        assert.ok(res.Versions.length === 1, 'Exactly one version marker was expected');
        assert.ok(res.DeleteMarkers.length === 1, 'Exactly one deleted marker was expected');
        done();
      }).catch(function(err){
        done(err);
      });
    });

    it('GCS Check unable to download beta.txt (final file) from Bucket', function(done) {
      const newKey = `${lspId}/request_files/${companyId}/${requestId}/final/final_files/${newDocument3._id}.txt`;
      gcsBucket
        .file(newKey)
        .download({ destination: `./temp/${newDocument3._id}-deleted-gcs.txt` })
        .then((resp) => {
          const text = fs.readFileSync(`./temp/${newDocument3._id}-deleted-gcs.txt`,'utf8');
          assert.equal(text, fileContents, 'File does not have the same contents');
          done(new Error('Should not be able to download removed files'));
        })
        .catch((err) => {
          const msg = err.message || '';
          const keyRegExp = new RegExp('.*No such object.*', "i")
          assert.ok(msg.match(keyRegExp), 'NoSuchKey error should be triggered');
          done();
        });
    });

  });

  describe('Upload files again (beta.txt and gamma.txt) to existing tasks', function(){

    it('POST /api/lsp/:lsp/document-prospect Upload beta.txt document prospect again', function(done) {
      agent
        .post(d+`/api/lsp/${lspId}/company/${companyId}/document-prospect`)
        .set('csrf-token', csrfToken)
        .attach('files', './mocks/beta.txt')
        .then(function (res) {
          // console.log(res);
          // console.log(res.body);
          assert.ok(res.ok);
          const temporalDocs = _.get(res, 'body.data.documents') || [];
          assert.ok(temporalDocs.length === 1, 'Only one temporal file was expected')
          // console.log(temporalDocs)
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


    it('POST /api/lsp/:lsp/document-prospect Upload gamma.txt document prospect again', function(done) {
      agent
        .post(d+`/api/lsp/${lspId}/document-prospect`)
        .set('csrf-token', csrfToken)
        .attach('files', './mocks/gamma.txt')
        .then(function (res) {
          // console.log(res);
          // console.log(res.body);
          assert.ok(res.ok);
          const temporalDocs = _.get(res, 'body.data.documents') || [];
          assert.ok(temporalDocs.length === 1, 'Only one temporal file was expected')
          // console.log(temporalDocs)
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

    it('PUT /api/lsp/:lsp/request/:request Update Request reuploading files to tasks', function(done) {
      const request = {
        catTool: "",
        comments: "<p>Demo007<br></p>",
        company: companyId,
        deliveryDate: "2018-06-30T15:00:00.000Z",
        internalComments: null,
        otherCC: "",
        projectManagers: [],
        purchaseOrder: "",
        requireQuotation: false,
        srcLang: {name: "English", isoCode: "ENG"},
        tgtLangs: [{name: "Spanish (Spain)", isoCode: "SPA-EU"}],
        title: `TestAWS-${requestSuffix}`,
        documents: [{
          final: false,
          // is not new
          isNew: false,
          isReference: false,
          language: null,
          name: newDocument2.name,
          oldId: null,
          removed: false,
          size: newDocument2.size,
          _id: newDocument2._id,
        }, {
          // Note: should be final because this is Validation and Delivery
          final: true,
          isNew: true,
          isReference: false,
          language: null,
          // beta.txt should be added here too
          name: newDocument3.name,
          oldId: null,
          removed: false,
          size: newDocument3.size,
          _id: newDocument3._id,
        }],
        _id: requestId,
        // adding workflows
        workflows: [{
          language: { name: "Spanish (Spain)", isoCode: "SPA-EU" },
          workflowDueDate: "2018-06-30T15:00:00.000Z",
          tasks: [{
            _id: validationAndDeliveryTaskId,
            ability: "Validation and Delivery",
            providerTasks: [{
              notes: "",
              provider: provider1._id,
              quantity: [{amount: 0, units: ""}],
              status: "notStarted",
              taskDueDate: "2018-06-30T15:00:00.000Z",
              files: [{
                // Note: should be final because this is Validation and Delivery
                final: true,
                isConfidential: false,
                isNew: true,
                isReference: false,
                language: {name: "Spanish (Spain)", isoCode: "SPA-EU"},
                mime: "text/plain",
                name: newDocument3.name,
                size: newDocument3.size,
                temporary: true,
                uploading: false,
                _id: newDocument3._id,
              }]
            }]
          }, {
            // Note: added extracted TaskId
            _id: gammaQuoteTaskId,
            // Note: Created a new task without file
            ability: "Quote",
            providerTasks: [{
              notes: "",
              // Note: provider 2 qith Quotes ability
              provider: provider2._id,
              quantity: [{amount: 0, units: ""}],
              status: "notStarted",
              taskDueDate: "2018-06-30T15:00:00.000Z",
              // Note files on next test case
              files: [{
                final: false,
                isConfidential: false,
                isNew: true,
                isReference: false,
                language: {name: "Spanish (Spain)", isoCode: "SPA-EU"},
                mime: "text/plain",
                name: newDocument4.name,
                size: newDocument4.size,
                // taskId: "5b40d3ed3aadd85525d7a799",
                temporary: false,
                uploading: false,
                _id: newDocument4._id
              }]
            }]
          }]
        }],
      };
      agent
        .put(d+`/api/lsp/${lspId}/request/${requestId}`)
        .set('csrf-token', csrfToken)
        .set('Content-Type', 'application/json')
        .send(request)
        .then(function (res) {
          // console.log(res.body.data.request);
          // console.log(requestId);
          providerTaskQuoteId = _.get(res, 'body.data.request.workflows[0].tasks[1].providerTasks[0]._id')
          providerTaskValAndDelId = _.get(res, 'body.data.request.workflows[0].tasks[0].providerTasks[0]._id')
          gammaQuoteTaskId = _.get(res, 'body.data.request.workflows[0].tasks[1]._id');
          workflowId = _.get(res, 'body.data.request.workflows[0]._id');
          // console.log('providerTaskQuoteId', providerTaskQuoteId);
          assert.ok(res.ok);
          done();
        }).catch(function(err) {
          console.log(err);
          done(err);
        });
    });

  });

  describe('Delete Provider Tasks Containing files', function() {
    it('PUT /api/lsp/:lsp/request/:request Update Request deleting Provider Tasks containing non final files', function(done) {
      const request = {
        title: `TestAWS-${requestSuffix}`,
        requireQuotation: false,
        purchaseOrder: "",
        srcLang: {
          name: "English",
          isoCode: "ENG"
        },
        tgtLangs: [{
          name: "Spanish (Spain)",
          isoCode: "SPA-EU"
        }],
        deliveryDate: "2018-06-30T15:00:00.000Z",
        company: companyId,
        otherCC: "",
        comments: "<p>Demo007<br></p>",
        internalComments: null,
        documents: [{
          _id: newDocument2._id,
          name: newDocument2.name,
          language: null,
          isReference: false,
          isNew: false,
          final: false,
          size: newDocument2.size,
          removed: false,
          oldId: null
        }, {
          _id: newDocument3._id,
          name: newDocument3.name,
          language: null,
          isReference: false,
          isNew: false,
          final: true,
          size: newDocument3.size,
          removed: false,
          oldId: null
        }],
        workflows: [{
          tasks: [{
            providerTasks: [{
              status: "notStarted",
              files: [{
                final: true,
                deletedByRetentionPolicyAt: null,
                _id: newDocument3._id,
                name: newDocument3.name,
                isReference: false,
                language: {
                  name: "Spanish (Spain)",
                  isoCode: "SPA-EU"
                },
                mime: "text/plain",
                size: newDocument3.size,
                temporary: true,
                createdAt: "2018-07-10T21:20:24.738Z",
                updatedAt: "2018-07-10T21:20:24.738Z"
              }],
              quantity: [{
                amount: 0,
                units: ""
              }],
              // TODO: missing providerTaskId
              _id:  providerTaskValAndDelId,
              notes: "",
              provider: provider1._id,
              taskDueDate: "2018-06-30T15:00:00.000Z"
            }],
            _id: validationAndDeliveryTaskId,
            ability: "Validation and Delivery"
          }, {
            providerTasks: [{
              taskDueDate: "2018-06-30T15:00:00.000Z",
              status: "notStarted",
              files: [],
              notes: "",
              quantity: [{
                amount: 0,
                units: ""
              }]
            }],
            _id: gammaQuoteTaskId,
            ability: "Quote"
          }],
          // Add workflow Id Required
          _id: workflowId,
          language: {
            name: "Spanish (Spain)",
            isoCode: "SPA-EU"
          },
          workflowDueDate: "2018-06-30T15:00:00.000Z"
        }],
        projectManagers: [],
        catTool: "",
        // readDate: "2018-07-10T21:20:24.739Z",
        // _id": "5b452302d7ff9756b8c23a08",
        _id: requestId,
        status: "To be processed"
      };
      // console.log(JSON.stringify(request));
      agent
        .put(d+`/api/lsp/${lspId}/request/${requestId}`)
        .set('csrf-token', csrfToken)
        .set('Content-Type', 'application/json')
        .send(request)
        .then(function (res) {
          // console.log(res.body.data.request);
          const obj = _.get(res, 'body.data.request.workflows[0].tasks[1]');
          // console.log(JSON.stringify(obj));
          assert.ok(res.ok);
          done();
        }).catch(function(err) {
          console.log(err);
          done(err);
        });
    });

    it('AWS Check unable to download gamma.txt (non final file attached to task) from Bucket', function(done) {
      const s3 = bucket.S3;
      const newKey = `${lspId}/request_files/${companyId}/${requestId}/task/${gammaQuoteTaskId}/task_files/${newDocument4._id}.txt`;
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        // lspId/request_files/company/request/file.txt
        Key: newKey
      };
      const file = fs.createWriteStream(`./temp/${newDocument4._id}-deleted-again.txt`);
      const s3Stream = s3.getObject(params).createReadStream();
      s3Stream.pipe(file);
      s3Stream.on('end', function(){
        const text = fs.readFileSync(`./temp/${newDocument4._id}-deleted-again.txt`,'utf8');
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

    it('AWS List gamma.txt file versions and delete markers from Bucket', function(done) {
      const newKey = `${lspId}/request_files/${companyId}/${requestId}/task/${gammaQuoteTaskId}/task_files/${newDocument4._id}.txt`;
      bucket.listFileVersions({
        Key: newKey,
      }).then(function(res){
        assert.ok(typeof res.DeleteMarkers !== 'undefined', 'File Delete Markers were expected');
        assert.ok(typeof res.Versions !== 'undefined', 'File Version Markers were expected');
        // Note: Check delete marker exist
        assert.ok(res.Versions.length === 1, 'Exactly one version marker was expected');
        assert.ok(res.DeleteMarkers.length === 1, 'Exactly one deleted marker was expected');
        done();
      }).catch(function(err){
        done(err);
      });
    });

    it('PUT /api/lsp/:lsp/request/:request Update Request deleting provider tasks containing final files (see documents removed)', function(done) {
      const request = {
        title: `TestAWS-${requestSuffix}`,
        requireQuotation: false,
        purchaseOrder: "",
        srcLang: {
          name: "English",
          isoCode: "ENG"
        },
        tgtLangs: [{
          name: "Spanish (Spain)",
          isoCode: "SPA-EU"
        }],
        deliveryDate: "2018-06-30T15:00:00.000Z",
        company: companyId,
        otherCC: "",
        comments: "<p>Demo007<br></p>",
        internalComments: null,
        documents: [{
          _id: newDocument2._id,
          name: newDocument2.name,
          language: null,
          isReference: false,
          isNew: false,
          final: false,
          size: newDocument2.size,
          removed: false,
          oldId: null
        }, {
          _id: newDocument3._id,
          name: newDocument3.name,
          language: null,
          isReference: false,
          isNew: false,
          final: true,
          size: newDocument3.size,
          // TODO: Issue in this case frontend should mark this as removed
          // removed true forced here
          removed: true,
          oldId: null
        }],
        workflows: [{
          tasks: [{
            providerTasks: [{
              taskDueDate: "2018-06-30T15:00:00.000Z",
              status: "notStarted",
              files: [],
              notes: "",
              quantity: [{
                amount: 0,
                units: ""
              }]
            }],
            _id: validationAndDeliveryTaskId,
            ability: "Validation and Delivery"
          }, {
            providerTasks: [{
              taskDueDate: "2018-06-30T15:00:00.000Z",
              status: "notStarted",
              files: [],
              notes: "",
              quantity: [{
                amount: 0,
                units: ""
              }]
            }],
            _id: gammaQuoteTaskId,
            ability: "Quote"
          }],
          // Add workflow Id Required
          _id: workflowId,
          language: {
            name: "Spanish (Spain)",
            isoCode: "SPA-EU"
          },
          workflowDueDate: "2018-06-30T15:00:00.000Z"
        }],
        projectManagers: [],
        catTool: "",
        // readDate: "2018-07-10T21:20:24.739Z",
        // _id": "5b452302d7ff9756b8c23a08",
        _id: requestId,
        status: "To be processed"
      };
      // console.log(JSON.stringify(request));
      agent
        .put(d+`/api/lsp/${lspId}/request/${requestId}`)
        .set('csrf-token', csrfToken)
        .set('Content-Type', 'application/json')
        .send(request)
        .then(function (res) {
          // console.log(res.body.data.request);
          const obj = _.get(res, 'body.data.request.workflows[0].tasks[1]');
          // console.log(JSON.stringify(obj));
          assert.ok(res.ok);
          done();
        }).catch(function(err) {
          console.log(err);
          done(err);
        });
    });

    it('AWS Check unable to download beta.txt (final file attached to task) from Bucket', function(done) {
      const s3 = bucket.S3;
      const newKey = `${lspId}/request_files/${companyId}/${requestId}/final/final_files/${newDocument3._id}.txt`;
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        // lspId/request_files/company/request/file.txt
        Key: newKey
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

    it('AWS List beta.txt file versions and delete markers from Bucket', function(done) {
      const newKey = `${lspId}/request_files/${companyId}/${requestId}/final/final_files/${newDocument3._id}.txt`;
      bucket.listFileVersions({
        Key: newKey,
      }).then(function(res){
        // console.log(res);
        assert.ok(typeof res.DeleteMarkers !== 'undefined', 'File Delete Markers were expected');
        assert.ok(typeof res.Versions !== 'undefined', 'File Version Markers were expected');
        // console.log(res);
        // Note: Check delete marker exist
        assert.ok(res.Versions.length === 1, 'Exactly one version marker was expected');
        assert.equal(res.DeleteMarkers.length, 2, 'Exactly two deleted markers were expected');
        done();
      }).catch(function(err){
        done(err);
      });
    });

  });

  describe('Upload files again (beta.txt and gamma.txt) to existing tasks and create Provider Tasks again', function(){

    it('POST /api/lsp/:lsp/document-prospect Upload beta.txt document prospect again', function(done) {
      agent
        .post(d+`/api/lsp/${lspId}/company/${companyId}/document-prospect`)
        .set('csrf-token', csrfToken)
        .attach('files', './mocks/beta.txt')
        .then(function (res) {
          // console.log(res);
          // console.log(res.body);
          assert.ok(res.ok);
          const temporalDocs = _.get(res, 'body.data.documents') || [];
          assert.ok(temporalDocs.length === 1, 'Only one temporal file was expected')
          // console.log(temporalDocs)
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


    it('POST /api/lsp/:lsp/document-prospect Upload gamma.txt document prospect again', function(done) {
      agent
        .post(d+`/api/lsp/${lspId}/document-prospect`)
        .set('csrf-token', csrfToken)
        .attach('files', './mocks/gamma.txt')
        .then(function (res) {
          // console.log(res);
          // console.log(res.body);
          assert.ok(res.ok);
          const temporalDocs = _.get(res, 'body.data.documents') || [];
          assert.ok(temporalDocs.length === 1, 'Only one temporal file was expected')
          // console.log(temporalDocs)
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

    it('PUT /api/lsp/:lsp/request/:request Update Request reuploading files to tasks', function(done) {
      const request = {
        catTool: "",
        comments: "<p>Demo007<br></p>",
        company: companyId,
        deliveryDate: "2018-06-30T15:00:00.000Z",
        internalComments: null,
        otherCC: "",
        projectManagers: [],
        purchaseOrder: "",
        requireQuotation: false,
        srcLang: {name: "English", isoCode: "ENG"},
        tgtLangs: [{name: "Spanish (Spain)", isoCode: "SPA-EU"}],
        title: `TestAWS-${requestSuffix}`,
        documents: [{
          final: false,
          // is not new
          isNew: false,
          isReference: false,
          language: null,
          name: newDocument2.name,
          oldId: null,
          removed: false,
          size: newDocument2.size,
          _id: newDocument2._id,
        }, {
          // Note: should be final because this is Validation and Delivery
          final: true,
          isNew: true,
          isReference: false,
          language: null,
          // beta.txt should be added here too
          name: newDocument3.name,
          oldId: null,
          removed: false,
          size: newDocument3.size,
          _id: newDocument3._id,
        }],
        _id: requestId,
        // adding workflows
        workflows: [{
          language: { name: "Spanish (Spain)", isoCode: "SPA-EU" },
          workflowDueDate: "2018-06-30T15:00:00.000Z",
          tasks: [{
            _id: validationAndDeliveryTaskId,
            ability: "Validation and Delivery",
            providerTasks: [{
              notes: "",
              provider: provider1._id,
              quantity: [{amount: 0, units: ""}],
              status: "notStarted",
              taskDueDate: "2018-06-30T15:00:00.000Z",
              files: [{
                // Note: should be final because this is Validation and Delivery
                final: true,
                isConfidential: false,
                isNew: true,
                isReference: false,
                language: {name: "Spanish (Spain)", isoCode: "SPA-EU"},
                mime: "text/plain",
                name: newDocument3.name,
                size: newDocument3.size,
                temporary: true,
                uploading: false,
                _id: newDocument3._id,
              }]
            }]
          }, {
            // Note: added extracted TaskId
            _id: gammaQuoteTaskId,
            // Note: Created a new task without file
            ability: "Quote",
            providerTasks: [{
              notes: "",
              // Note: provider 2 qith Quotes ability
              provider: provider2._id,
              quantity: [{amount: 0, units: ""}],
              status: "notStarted",
              taskDueDate: "2018-06-30T15:00:00.000Z",
              // Note files on next test case
              files: [{
                final: false,
                isConfidential: false,
                isNew: true,
                isReference: false,
                language: {name: "Spanish (Spain)", isoCode: "SPA-EU"},
                mime: "text/plain",
                name: newDocument4.name,
                size: newDocument4.size,
                // taskId: "5b40d3ed3aadd85525d7a799",
                temporary: false,
                uploading: false,
                _id: newDocument4._id
              }]
            }]
          }]
        }],
      };
      agent
        .put(d+`/api/lsp/${lspId}/request/${requestId}`)
        .set('csrf-token', csrfToken)
        .set('Content-Type', 'application/json')
        .send(request)
        .then(function (res) {
          // console.log(res.body.data.request);
          // console.log(requestId);
          providerTaskQuoteId = _.get(res, 'body.data.request.workflows[0].tasks[1].providerTasks[0]._id')
          providerTaskValAndDelId = _.get(res, 'body.data.request.workflows[0].tasks[0].providerTasks[0]._id')
          gammaQuoteTaskId = _.get(res, 'body.data.request.workflows[0].tasks[1]._id');
          workflowId = _.get(res, 'body.data.request.workflows[0]._id');
          // console.log('providerTaskQuoteId', providerTaskQuoteId);
          assert.ok(res.ok);
          done();
        }).catch(function(err) {
          console.log(err);
          done(err);
        });
    });

  });

  describe('Delete Tasks Containing files', function() {

    it('PUT /api/lsp/:lsp/request/:request Update Request deleting Tasks containing files (see documents removed)', function(done) {
      const request = {
        title: `TestAWS-${requestSuffix}`,
        requireQuotation: false,
        purchaseOrder: "",
        srcLang: {
          name: "English",
          isoCode: "ENG"
        },
        tgtLangs: [{
          name: "Spanish (Spain)",
          isoCode: "SPA-EU"
        }],
        deliveryDate: "2018-06-30T15:00:00.000Z",
        company: companyId,
        otherCC: "",
        comments: "<p>Demo007<br></p>",
        internalComments: null,
        documents: [{
          _id: newDocument2._id,
          name: newDocument2.name,
          language: null,
          isReference: false,
          isNew: false,
          final: false,
          size: newDocument2.size,
          removed: false,
          oldId: null
        }, {
          _id: newDocument3._id,
          name: newDocument3.name,
          language: null,
          isReference: false,
          isNew: false,
          final: true,
          size: newDocument3.size,
          // TODO: Issue in this case frontend should mark this as removed
          // removed true forced here
          removed: true,
          oldId: null
        }],
        workflows: [{
          tasks: [{
            // Note: this task is replacing the 2 existing previously
            providerTasks: [{
              taskDueDate: "2018-06-30T15:00:00.000Z",
              status: "notStarted",
              files: [],
              notes: "",
              quantity: [{
                amount: 0,
                units: ""
              }]
            }],
            ability: "Quote"
          }],
          // Add workflow Id Required
          _id: workflowId,
          language: {
            name: "Spanish (Spain)",
            isoCode: "SPA-EU"
          },
          workflowDueDate: "2018-06-30T15:00:00.000Z"
        }],
        projectManagers: [],
        catTool: "",
        _id: requestId,
        status: "To be processed"
      };
      // console.log(JSON.stringify(request));
      agent
        .put(d+`/api/lsp/${lspId}/request/${requestId}`)
        .set('csrf-token', csrfToken)
        .set('Content-Type', 'application/json')
        .send(request)
        .then(function (res) {
          // console.log(res.body.data.request);
          const obj = _.get(res, 'body.data.request.workflows[0].tasks[1]');
          // console.log(JSON.stringify(obj));
          assert.ok(res.ok);
          done();
        }).catch(function(err) {
          console.log(err);
          done(err);
        });
    });

    it('AWS Check unable to download gamma.txt (non final file attached to task) from Bucket', function(done) {
      const s3 = bucket.S3;
      const newKey = `${lspId}/request_files/${companyId}/${requestId}/task/${gammaQuoteTaskId}/task_files/${newDocument4._id}.txt`;
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        // lspId/request_files/company/request/file.txt
        Key: newKey
      };
      const file = fs.createWriteStream(`./temp/${newDocument4._id}-deleted-again.txt`);
      const s3Stream = s3.getObject(params).createReadStream();
      s3Stream.pipe(file);
      s3Stream.on('end', function(){
        const text = fs.readFileSync(`./temp/${newDocument4._id}-deleted-again.txt`,'utf8');
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

    it('AWS List gamma.txt file versions and delete markers from Bucket', function(done) {
      const newKey = `${lspId}/request_files/${companyId}/${requestId}/task/${gammaQuoteTaskId}/task_files/${newDocument4._id}.txt`;
      bucket.listFileVersions({
        Key: newKey,
      }).then(function(res){
        assert.ok(typeof res.DeleteMarkers !== 'undefined', 'File Delete Markers were expected');
        assert.ok(typeof res.Versions !== 'undefined', 'File Version Markers were expected');
        // Note: Check delete marker exist
        assert.ok(res.Versions.length === 1, 'Exactly one version marker was expected');
        assert.ok(res.DeleteMarkers.length === 1, 'Exactly one deleted marker was expected');
        done();
      }).catch(function(err){
        done(err);
      });
    });

    it('AWS Check unable to download beta.txt (final file attached to task) from Bucket', function(done) {
      const s3 = bucket.S3;
      const newKey = `${lspId}/request_files/${companyId}/${requestId}/final/final_files/${newDocument3._id}.txt`;
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        // lspId/request_files/company/request/file.txt
        Key: newKey
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

    it('AWS List beta.txt file versions and delete markers from Bucket', function(done) {
      const newKey = `${lspId}/request_files/${companyId}/${requestId}/final/final_files/${newDocument3._id}.txt`;
      bucket.listFileVersions({
        Key: newKey,
      }).then(function(res){
        // console.log(res);
        assert.ok(typeof res.DeleteMarkers !== 'undefined', 'File Delete Markers were expected');
        assert.ok(typeof res.Versions !== 'undefined', 'File Version Markers were expected');
        // Note: Check delete marker exist
        // console.log(res);
        assert.ok(res.Versions.length === 1, 'Exactly one version marker was expected');
        assert.equal(res.DeleteMarkers.length, 2, 'Exactly two deleted markers were expected');
        done();
      }).catch(function(err){
        done(err);
      });
    });

  });

  describe('Upload files again (beta.txt and gamma.txt) and create tasks again', function() {

    it('POST /api/lsp/:lsp/document-prospect Upload beta.txt document prospect again', function(done) {
      agent
        .post(d+`/api/lsp/${lspId}/company/${companyId}/document-prospect`)
        .set('csrf-token', csrfToken)
        .attach('files', './mocks/beta.txt')
        .then(function (res) {
          // console.log(res);
          // console.log(res.body);
          assert.ok(res.ok);
          const temporalDocs = _.get(res, 'body.data.documents') || [];
          assert.ok(temporalDocs.length === 1, 'Only one temporal file was expected')
          // console.log(temporalDocs)
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


    it('POST /api/lsp/:lsp/document-prospect Upload gamma.txt document prospect again', function(done) {
      agent
        .post(d+`/api/lsp/${lspId}/company/${companyId}/document-prospect`)
        .set('csrf-token', csrfToken)
        .attach('files', './mocks/gamma.txt')
        .then(function (res) {
          // console.log(res);
          // console.log(res.body);
          assert.ok(res.ok);
          const temporalDocs = _.get(res, 'body.data.documents') || [];
          assert.ok(temporalDocs.length === 1, 'Only one temporal file was expected')
          // console.log(temporalDocs)
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

    it('PUT /api/lsp/:lsp/request/:request Update Request reuploading files to tasks', function(done) {
      const request = {
        catTool: "",
        comments: "<p>Demo007<br></p>",
        company: companyId,
        deliveryDate: "2018-06-30T15:00:00.000Z",
        internalComments: null,
        otherCC: "",
        projectManagers: [],
        purchaseOrder: "",
        requireQuotation: false,
        srcLang: {name: "English", isoCode: "ENG"},
        tgtLangs: [{name: "Spanish (Spain)", isoCode: "SPA-EU"}],
        title: `TestAWS-${requestSuffix}`,
        documents: [{
          final: false,
          // is not new
          isNew: false,
          isReference: false,
          language: null,
          name: newDocument2.name,
          oldId: null,
          removed: false,
          size: newDocument2.size,
          _id: newDocument2._id,
        }, {
          // Note: should be final because this is Validation and Delivery
          final: true,
          isNew: true,
          isReference: false,
          language: null,
          // beta.txt should be added here too
          name: newDocument3.name,
          oldId: null,
          removed: false,
          size: newDocument3.size,
          _id: newDocument3._id,
        }],
        _id: requestId,
        // adding workflows
        workflows: [{
          language: { name: "Spanish (Spain)", isoCode: "SPA-EU" },
          workflowDueDate: "2018-06-30T15:00:00.000Z",
          tasks: [{
            _id: validationAndDeliveryTaskId,
            ability: "Validation and Delivery",
            providerTasks: [{
              notes: "",
              provider: provider1._id,
              quantity: [{amount: 0, units: ""}],
              status: "notStarted",
              taskDueDate: "2018-06-30T15:00:00.000Z",
              files: [{
                // Note: should be final because this is Validation and Delivery
                final: true,
                isConfidential: false,
                isNew: true,
                isReference: false,
                language: {name: "Spanish (Spain)", isoCode: "SPA-EU"},
                mime: "text/plain",
                name: newDocument3.name,
                size: newDocument3.size,
                temporary: true,
                uploading: false,
                _id: newDocument3._id,
              }]
            }]
          }, {
            // Note: added extracted TaskId
            _id: gammaQuoteTaskId,
            // Note: Created a new task without file
            ability: "Quote",
            providerTasks: [{
              notes: "",
              // Note: provider 2 qith Quotes ability
              provider: provider2._id,
              quantity: [{amount: 0, units: ""}],
              status: "notStarted",
              taskDueDate: "2018-06-30T15:00:00.000Z",
              // Note files on next test case
              files: [{
                final: false,
                isConfidential: false,
                isNew: true,
                isReference: false,
                language: {name: "Spanish (Spain)", isoCode: "SPA-EU"},
                mime: "text/plain",
                name: newDocument4.name,
                size: newDocument4.size,
                // taskId: "5b40d3ed3aadd85525d7a799",
                temporary: false,
                uploading: false,
                _id: newDocument4._id
              }]
            }]
          }]
        }],
      };
      agent
        .put(d+`/api/lsp/${lspId}/request/${requestId}`)
        .set('csrf-token', csrfToken)
        .set('Content-Type', 'application/json')
        .send(request)
        .then(function (res) {
          // console.log(res.body.data.request);
          // console.log(requestId);
          providerTaskQuoteId = _.get(res, 'body.data.request.workflows[0].tasks[1].providerTasks[0]._id')
          providerTaskValAndDelId = _.get(res, 'body.data.request.workflows[0].tasks[0].providerTasks[0]._id')
          gammaQuoteTaskId = _.get(res, 'body.data.request.workflows[0].tasks[1]._id');
          workflowId = _.get(res, 'body.data.request.workflows[0]._id');
          // console.log('providerTaskQuoteId', providerTaskQuoteId);
          assert.ok(res.ok);
          done();
        }).catch(function(err) {
          console.log(err);
          done(err);
        });
    });

  });

  describe('Delete Workflow containing files (and set status as cancelled)', function(){
    it('PUT /api/lsp/:lsp/request/:request Update Request deleting Workflow containing files (see documents removed)', function(done) {
      const request = {
        title: `TestAWS-${requestSuffix}`,
        requireQuotation: false,
        purchaseOrder: "",
        srcLang: {
          name: "English",
          isoCode: "ENG"
        },
        tgtLangs: [{
          name: "Spanish (Spain)",
          isoCode: "SPA-EU"
        }],
        deliveryDate: "2018-06-30T15:00:00.000Z",
        company: companyId,
        otherCC: "",
        comments: "<p>Demo007<br></p>",
        internalComments: null,
        documents: [{
          _id: newDocument2._id,
          name: newDocument2.name,
          language: null,
          isReference: false,
          isNew: false,
          final: false,
          size: newDocument2.size,
          removed: false,
          oldId: null
        }, {
          _id: newDocument3._id,
          name: newDocument3.name,
          language: null,
          isReference: false,
          isNew: false,
          final: true,
          size: newDocument3.size,
          // TODO: Issue in this case frontend should mark this as removed
          // removed true forced here
          removed: true,
          oldId: null
        }],
        workflows: [],
        projectManagers: [],
        catTool: "",
        _id: requestId,
        status: "cancelled"
      };
      // console.log(JSON.stringify(request));
      agent
        .put(d+`/api/lsp/${lspId}/request/${requestId}`)
        .set('csrf-token', csrfToken)
        .set('Content-Type', 'application/json')
        .send(request)
        .then(function (res) {
          // console.log(res.body.data.request);
          const obj = _.get(res, 'body.data.request.workflows[0].tasks[1]');
          // console.log(JSON.stringify(obj));
          assert.ok(res.ok);
          done();
        }).catch(function(err) {
          console.log(err);
          done(err);
        });
    });

    it.skip('AWS Check unable to download gamma.txt (non final file attached to task) from Bucket', function(done) {
      const s3 = bucket.S3;
      const newKey = `${lspId}/request_files/${companyId}/${requestId}/task/${gammaQuoteTaskId}/task_files/${newDocument4._id}.txt`;
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        // lspId/request_files/company/request/file.txt
        Key: newKey
      };
      const file = fs.createWriteStream(`./temp/${newDocument4._id}-deleted-again.txt`);
      const s3Stream = s3.getObject(params).createReadStream();
      s3Stream.pipe(file);
      s3Stream.on('end', function(){
        const text = fs.readFileSync(`./temp/${newDocument4._id}-deleted-again.txt`,'utf8');
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

    it.skip('AWS List gamma.txt file versions and delete markers from Bucket', function(done) {
      const newKey = `${lspId}/request_files/${companyId}/${requestId}/task/${gammaQuoteTaskId}/task_files/${newDocument4._id}.txt`;
      bucket.listFileVersions({
        Key: newKey,
      }).then(function(res){
        // console.log(res);
        assert.ok(typeof res.DeleteMarkers !== 'undefined', 'File Delete Markers were expected');
        assert.ok(typeof res.Versions !== 'undefined', 'File Version Markers were expected');
        // Note: Check delete marker exist
        assert.ok(res.Versions.length === 1, 'Exactly one version marker was expected');
        assert.ok(res.DeleteMarkers.length === 1, 'Exactly one deleted marker was expected');
        done();
      }).catch(function(err){
        done(err);
      });
    });

    it('AWS Check unable to download beta.txt (final file attached to task) from Bucket', function(done) {
      const s3 = bucket.S3;
      const newKey = `${lspId}/request_files/${companyId}/${requestId}/final/final_files/${newDocument3._id}.txt`;
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        // lspId/request_files/company/request/file.txt
        Key: newKey
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

    it('AWS List beta.txt file versions and delete markers from Bucket', function(done) {
      const newKey = `${lspId}/request_files/${companyId}/${requestId}/final/final_files/${newDocument3._id}.txt`;
      bucket.listFileVersions({
        Key: newKey,
      }).then(function(res){
        // console.log(res);
        assert.ok(typeof res.DeleteMarkers !== 'undefined', 'File Delete Markers were expected');
        assert.ok(typeof res.Versions !== 'undefined', 'File Version Markers were expected');
        // Note: Check delete marker exist
        assert.ok(res.Versions.length === 1, 'Exactly one version marker was expected');
        assert.ok(res.DeleteMarkers.length === 1, 'Exactly one deleted marker was expected');
        done();
      }).catch(function(err){
        done(err);
      });
    });

  });

  describe('Execute Document Retention Scheduler', function() {

    it('GET /api/lsp/:lsp/scheduler List all Schedulers and find Document Retention', function(done) {
      agent
        .get(d+`/api/lsp/${lspId}/scheduler`)
        .then(function (res) {
          // console.log(res);
          let total = _.get(res, 'body.data.total', 0);
          assert.ok(total >= 1, 'At least one scheduler is needed to perform this test');
          let schedulers = _.get(res, 'body.data.list');
          // Search document retention
          // companyId = _.get(companies[0], '_id');
          let retentionScheduler = schedulers.find(r => r.name === "document-retention-policy");
          schedulerId = _.get(retentionScheduler, '_id', '');
          // console.log(retentionScheduler, total, schedulerId);

          assert.ok(schedulerId.length === 24, 'Scheduler document-retention-policy is mandatory to perform this test, invalid Object Id Provided');
          done();
        }).catch(function(err) {
          console.log(err);
          done(err);
        });
    });

    it('PUT /api/lsp/:lsp/scheduler Run Document Retention Scheduler', function (done) {
      const reqBody = {
        schedulerId: schedulerId
      };
      agent
        .put(d+`/api/lsp/${lspId}/scheduler`)
        .set('csrf-token', csrfToken)
        .set('Content-Type', 'application/json')
        .send(reqBody)
        .then(function (res) {
          // console.log(res);
          assert.ok(res.ok);
          schedulerLastRun = _.get(res, 'body.data.scheduler.nextRunAt', null);
          schedulerLastRun = moment(schedulerLastRun);
          // console.log(schedulerLastRun.format())
          // wait extra 10 seconds and call done
          setTimeout(done, 1000 * 10);
        }).catch(function(err) {
          console.log(err);
          done(err);
        });
    });

    it('GET /api/lsp/:lsp/scheduler/:scheduler Wait for Scheduler to finish', function(done) {
      const MAX_POLL = 5;
      let attempt = 1;

      const poll = function() {
        let pollAgain = arguments.callee;
        agent
          .get(d+`/api/lsp/${lspId}/scheduler/${schedulerId}`)
          .then(function (res) {
            assert.ok(res.ok);
            // console.log(_.get(res, 'body.data.scheduler.executionHistory[0]'));
            let lastExec = _.get(res, 'body.data.scheduler.executionHistory[0]');
            // console.log("lastExec:", lastExec);
            let currentRunTime = _.get(lastExec, 'executed', null);
            // console.log("currentRunTime:", currentRunTime);
            currentRunTime = moment(currentRunTime);
            let isNewDateAfterLastSeen = currentRunTime.isAfter(schedulerLastRun);
            // console.log("schedulerLastRun:", schedulerLastRun);
            // console.log("currentRunTime:", currentRunTime);
            if (isNewDateAfterLastSeen) {
              if (lastExec.status === 'running') {
                attempt++;
                // console.log('Polling again... in 10 seconds');
                setTimeout(pollAgain, 1000 * 10);
              } else {
                assert.equal(lastExec.status, 'success', 'Last status should be success');
                // console.log('Polling success...');
                done();
              }
            } else {
              if (attempt <= MAX_POLL) {
                attempt++;
                // console.log('Polling again... in 10 seconds');
                setTimeout(pollAgain, 1000 * 10);
              } else {
                // console.log('Stop polling....');
                done(new Error('Max polling attempt reached, scheduller did not execute'))
              }
            }
          }).catch(function(err) {
            // console.log(err);
            done(err);
          });
      };

      // Start polling
      poll();

    });

    it('AWS Check unable to download gamma.txt (non final file attached to task) from Bucket', function(done) {
      const s3 = bucket.S3;
      const newKey = `${lspId}/request_files/${companyId}/${requestId}/task/${gammaQuoteTaskId}/task_files/${newDocument4._id}.txt`;
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        // lspId/request_files/company/request/file.txt
        Key: newKey
      };
      const file = fs.createWriteStream(`./temp/${newDocument4._id}-deleted-again.txt`);
      const s3Stream = s3.getObject(params).createReadStream();
      s3Stream.pipe(file);
      s3Stream.on('end', function(){
        const text = fs.readFileSync(`./temp/${newDocument4._id}-deleted-again.txt`,'utf8');
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

    it('AWS List gamma.txt file versions and delete markers from Bucket', function(done) {
      const newKey = `${lspId}/request_files/${companyId}/${requestId}/task/${gammaQuoteTaskId}/task_files/${newDocument4._id}.txt`;
      bucket.listFileVersions({
        Key: newKey,
      }).then(function(res){
        // console.log(res);
        assert.ok(typeof res.DeleteMarkers !== 'undefined', 'File Delete Markers were expected');
        assert.ok(typeof res.Versions !== 'undefined', 'File Version Markers were expected');
        // Note: Check delete marker exist
        assert.ok(res.Versions.length === 0, 'No version markers were expected after retention policy applied');
        assert.ok(res.DeleteMarkers.length === 0, 'No delete markers were expected after retention policy applied');
        done();
      }).catch(function(err){
        done(err);
      });
    });

    it('AWS Check unable to download alpha.txt (source file attached to request) from Bucket', function(done) {
      const s3 = bucket.S3;
      const newKey = `${lspId}/request_files/${companyId}/${requestId}/${newDocument2._id}.txt`
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        // lspId/request_files/company/request/file.txt
        Key: newKey
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

    it('AWS List alpha.txt file versions and delete markers from Bucket', function(done) {
      const newKey = `${lspId}/request_files/${companyId}/${requestId}/${newDocument2._id}.txt`
      bucket.listFileVersions({
        Key: newKey,
      }).then(function(res){
        // console.log(res);
        assert.ok(typeof res.DeleteMarkers !== 'undefined', 'File Delete Markers were expected');
        assert.ok(typeof res.Versions !== 'undefined', 'File Version Markers were expected');
        // Note: Check delete marker exist
        assert.ok(res.Versions.length === 0, 'No version markers were expected after retention policy applied');
        assert.ok(res.DeleteMarkers.length === 0, 'No delete markers were expected after retention policy applied');
        done();
      }).catch(function(err){
        done(err);
      });
    });

    it('AWS Check unable to download beta.txt (final file attached to task) from Bucket', function(done) {
      const s3 = bucket.S3;
      const newKey = `${lspId}/request_files/${companyId}/${requestId}/final/final_files/${newDocument3._id}.txt`;
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        // lspId/request_files/company/request/file.txt
        Key: newKey
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

    it('AWS List beta.txt file versions and delete markers from Bucket', function(done) {
      const newKey = `${lspId}/request_files/${companyId}/${requestId}/final/final_files/${newDocument3._id}.txt`;
      bucket.listFileVersions({
        Key: newKey,
      }).then(function(res){
        // console.log(res);
        assert.ok(typeof res.DeleteMarkers !== 'undefined', 'File Delete Markers were expected');
        assert.ok(typeof res.Versions !== 'undefined', 'File Version Markers were expected');
        // Note: Check delete marker exist
        assert.ok(res.Versions.length === 0, 'No version markers were expected after retention policy applied');
        assert.ok(res.DeleteMarkers.length === 0, 'No delete markers were expected after retention policy applied');
        done();
      }).catch(function(err){
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
