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
  username: process.env.E2E_USER,
  password: process.env.E2E_PASS,
};
// modify for slow connections
const GLOBAL_TIMEOUT = 1000 * 0.5;

// Request
let lspId = '';
const companyId = '';
const requestId = '';
let csrfToken = '';
const accountInfo = {};
const requestSuffix = moment().format();
const newDocument1 = {
  _id: '',
  name: 'delta.txt',
  size: 0,
};
const newDocument2 = {
  _id: '',
  name: 'alpha.txt',
  size: 0,
};
const newDocument3 = {
  _id: '',
  name: 'beta.txt',
  size: 0,
};
const newDocument4 = {
  _id: '',
  name: 'gamma.txt',
  size: 0,
};
let fileContents = '';
let fileContentsBeta = '';
let fileContentsGamma = '';
let fileContentsEpsilon = '';

// Workflow Id
const workflowId = '';

// Provider Task Id
const providerTaskQuoteId = '';
const providerTaskValAndDelId = '';

// Task Id
const validationAndDeliveryTaskId = '';
const validationAndDeliveryTask_ProviderTaskId = '';
const gammaQuoteTaskId = '';
const gammaQuoteTaskId_ProviderTaskId = '';

// Workflow
const providers = [];
const provider1 = {};
const provider2 = {};

// Scheduler
const schedulerId = '';
const schedulerLastRun = '';

const getProvidersWithAbility = (providers, ability) => providers.filter((provider) => {
  const accounts = _.get(provider, 'accounts', []);

  if (accounts.length === 0) {
    return false;
  }

  const currentAccount = accounts.find(acc => _.get(acc, 'lsp._id') === lspId);

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

let userId;
let temporalDoc;
const testUser = {
  readDate: null,
  roles: [],
  groups: [],
  email: `jl_borges_${Date.now()}@sample.com`,
  type: 'Staff',
  firstName: 'Jorge',
  middleName: 'Luis',
  lastName: 'Borges',
  password: 'ElLibroDeArena123456!!',
  projectManagers: [],
  abilities: [],
  languageCombinations: [],
  catTools: [],
  contactDetails: {
    qualificationStatus: 'Identifying',
    linkedInUrl: '',
    salesRep: {
      _id: '',
      firstName: '',
      lastName: '',
      deleted: false,
      terminated: false,
    },
    mainPhone: {
      number: '',
      ext: '',
    },
    mailingAddress: {
      line1: '',
      line2: '',
      city: '',
      state: {
        name: '',
        code: '',
        country: {
          name: '',
          code: '',
        },
      },
      country: {
        name: '',
        code: '',
      },
      zip: '',
    },
    billingAddress: {
      line1: '',
      line2: '',
      city: '',
      state: {
        name: '',
        country: {
          name: '',
          code: '',
          country: '',
        },
      },
      country: {
        name: '',
        code: '',
      },
      zip: '',
    },
    billingEmail: '',
  },
  staffDetails: {
    competenceLevels: [],
    remote: false,
    phoneNumber: '',
    jobTitle: '',
    approvalMethod: 'Experience & Education',
    hireDate: '2019-01-17T15:00:00.000Z',
    comments: '',
    hiringDocuments: [],
  },
  deleted: false,
  terminated: false,
};

// Unit Tests
describe('Storage User Tests', () => {
  before(() => {
    // Start agent
    agent = superagent.agent();
    fileContents = fs.readFileSync('./mocks/delta.txt', 'utf8');
    fileContentsAlpha = fs.readFileSync('./mocks/alpha.txt', 'utf8');
    fileContentsBeta = fs.readFileSync('./mocks/beta.txt', 'utf8');
    fileContentsGamma = fs.readFileSync('./mocks/gamma.txt', 'utf8');
    fileContentsEpsilon = fs.readFileSync('./mocks/epsilon.txt', 'utf8');
  });

  beforeEach((done) => {
    setTimeout(done, GLOBAL_TIMEOUT);
  });

  before((done) => {
    // console.log('Removing temporal files');
    rimraf('./temp/*.txt', (err) => {
      done(err);
    });
  });

  describe('Authenticate', () => {
    it('POST /auth Initializes the proper login strategy', (done) => {
      agent
        .post(`${d}/api/auth`)
        .set('Content-Type', 'application/json')
        .set('lms-mock', 'true')
        .send({ email: credentials.username, password: credentials.password })
        .then((res) => {
          // Extract the csrf token
          csrfToken = _.get(res, 'body.data.csrfToken');
          const accounts = _.get(res, 'body.data.user.accounts');
          assert.ok(accounts.length >= 1, 'At least one account was expected');
          // Extract lspid
          lspId = _.get(accounts[0], 'lsp._id');
          // console.log(lspId);
          assert.ok(res.ok);
          done();
        }).catch((err) => {
          done(err);
        });
    });

    it('GET /auth/me Returns the current user', (done) => {
      agent
        .get(`${d}/api/auth/me`)
        .then((res) => {
          // console.log(res);
          // console.log(res.body);
          const currentEmail = _.get(res, 'body.data.user.email') || false;
          // console.log(currentEmail);
          assert.ok(res.ok);
          assert.equal(currentEmail, process.env.E2E_USER, 'Should be the expected user');
          done();
        }).catch((err) => {
          console.log(err);
          done(err);
        });
    });
  });

  describe('Create User', () => {
    it('POST /api/lsp/:lsp/company Create user', (done) => {
      agent
        .set('csrf-token', csrfToken)
        .post(`${d}/api/lsp/${lspId}/user`)
        .send(testUser)
        .then((res) => {
          console.log(res.body);
          userId = _.get(res, 'body.data.user._id');
          userEmail = _.get(res, 'body.data.user.email');
          // console.log(userEmail, '->', userId);
          assert.ok(res.ok);
          done();
        }).catch((err) => {
          console.log(err);
          done(err);
        });
    });

    it('POST /api/lsp/:lsp/user/:user/document Upload delta.txt user document prospect', (done) => {
      agent
        .post(`${d}/api/lsp/${lspId}/user/${userId}/document/?fileType=CV/Resume/Certification`)
        .set('csrf-token', csrfToken)
        .attach('file', './mocks/delta.txt')
        .then((res) => {
          // console.log(res);
          // console.log(res.body);
          assert.ok(res.ok);
          temporalDoc = _.get(res, 'body.data.document') || {};
          assert.ok(!!temporalDoc._id, 'Property _id for temporal file was expected');
          done();
        }).catch((err) => {
          console.log('====>', err);
          done(err);
        });
    });

    it('AWS Download delta.txt (prospect file) file from Bucket', (done) => {
      const s3 = bucket.S3;
      const Key = `${lspId}/user_hiring_files/${userId}/${temporalDoc._id}.txt`;
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: Key,
      };
      const file = fs.createWriteStream(`./temp/${temporalDoc._id}-aws.txt`);
      const s3Stream = s3.getObject(params).createReadStream();
      s3Stream.pipe(file);
      s3Stream.on('end', () => {
        const text = fs.readFileSync(`./temp/${temporalDoc._id}-aws.txt`, 'utf8');
        assert.equal(text, fileContents, 'File does not have the same contents');
        // console.log('ended', text);
        done();
      });

      s3Stream.on('error', (err) => {
        console.log('error', err);
        done(err);
      });
    });

    it('GCS Download delta.txt (prospect file) file from Bucket', (done) => {
      const Key = `${lspId}/user_hiring_files/${userId}/${temporalDoc._id}.txt`;
      // console.log(Key);process.exit();
      gcsBucket
        .file(Key)
        .download({ destination: `./temp/${temporalDoc._id}-gcs.txt` })
        .then(() => {
          const text = fs.readFileSync(`./temp/${temporalDoc._id}-gcs.txt`, 'utf8');
          assert.equal(text, fileContents, 'File does not have the same contents');
          done();
        })
        .catch(done);
    });

    it('PUT /api/lsp/:lsp/company Update user hiring documents', (done) => {
      testUser.staffDetails.hiringDocuments = [[temporalDoc]];
      agent
        .set('csrf-token', csrfToken)
        .put(`${d}/api/lsp/${lspId}/user`)
        .send(testUser)
        .then((res) => {
          // console.log(res.body);
          userId = _.get(res, 'body.data.user._id');
          userEmail = _.get(res, 'body.data.user.email');
          assert.ok(res.ok);
          done();
        }).catch((err) => {
          console.log(err);
          done(err);
        });
    });

    it('GET /api/lsp/:lsp/user/:user/document/:doc/filename/:name Download hiring documents', (done) => {
      agent
        .set('csrf-token', csrfToken)
        .get(`${d}/api/lsp/${lspId}/user/${userId}/document/${temporalDoc._id}/filename/delta.txt`)
        .then((res) => {
          // console.log('->', res);
          assert.ok(res.ok);
          assert.equal(res.text, fileContents, 'File contents does not match');
          done();
        }).catch((err) => {
          console.log(err);
          done(err);
        });
    });

    it('AWS Download delta.txt (user file) file from Bucket', (done) => {
      const s3 = bucket.S3;
      const Key = `${lspId}/user_hiring_files/${userId}/${temporalDoc._id}/${temporalDoc._id}.txt`;
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: Key,
      };
      const file = fs.createWriteStream(`./temp/final-${temporalDoc._id}-aws.txt`);
      const s3Stream = s3.getObject(params).createReadStream();
      s3Stream.pipe(file);
      s3Stream.on('end', () => {
        const text = fs.readFileSync(`./temp/final-${temporalDoc._id}-aws.txt`, 'utf8');
        assert.equal(text, fileContents, 'File does not have the same contents');
        // console.log('ended', text);
        done();
      });

      s3Stream.on('error', (err) => {
        console.log('error', err);
        done(err);
      });
    });

    it('GCS Download delta.txt (user file) file from Bucket', (done) => {
      const Key = `${lspId}/user_hiring_files/${userId}/${temporalDoc._id}/${temporalDoc._id}.txt`;
      // console.log(Key);process.exit();
      gcsBucket
        .file(Key)
        .download({ destination: `./temp/final-${temporalDoc._id}-gcs.txt` })
        .then(() => {
          const text = fs.readFileSync(`./temp/final-${temporalDoc._id}-gcs.txt`, 'utf8');
          assert.equal(text, fileContents, 'File does not have the same contents');
          done();
        })
        .catch(done);
    });


    it('GET /api/lsp/:lsp/user/:user/documents/zip Download Zipped User Files (delta.txt)', (done) => {
      const tempPath = `./temp/${requestId}-user-files-1.zip`;
      const tempStream = fs.createWriteStream(tempPath);

      agent
        .get(`${d}/api/lsp/${lspId}/user/${userId}/documents/zip`)
        // .responeType('blob')
        .pipe(tempStream);

      tempStream
        .on('finish', () => {
          // console.log("Reading zip file");

          const filesExpectedOnZip = ['delta.txt'];

          const zip = new StreamZip({
            file: tempPath,
            storeEntries: true,
          });

          zip.on('ready', () => {
            console.log(`Entries read: ${zip.entriesCount}`);
            const filesOnZip = [];
            for (const entry of Object.values(zip.entries())) {
              const desc = entry.isDirectory ? 'directory' : `${entry.size} bytes`;
              console.log(`Entry ${entry.name}: ${desc}`);
              filesOnZip.push(entry.name);
            }
            // Do not forget to close the file once you're done
            zip.close();
            console.log(filesOnZip.sort(), filesExpectedOnZip.sort(), 'All files expected are there');
            assert.deepEqual(filesOnZip.sort(), filesExpectedOnZip.sort(), 'Some files expected on zip are missing');
            done();
          });

          zip.on('error', (err) => {
            console.log('error while unzipping');
            done(err);
          });
        })
        .on('error', (err) => {
          console.log('error in request');
          done(err);
        });
    });

    it('PUT /api/lsp/:lsp/company Delete user hiring documents', (done) => {
      testUser.staffDetails.hiringDocuments = [];
      agent
        .set('csrf-token', csrfToken)
        .put(`${d}/api/lsp/${lspId}/user`)
        .send(testUser)
        .then((res) => {
          // console.log(res.body);
          const files = _.get(res, 'body.data.user.staffDetails.hiringDocuments');
          assert.ok(res.ok);
          assert.ok(files.length === 0, 'Expected no hring docs');
          done();
        }).catch((err) => {
          console.log(err);
          done(err);
        });
    });

    it('AWS Check unable to download delta.txt (user file) from Bucket', (done) => {
      const s3 = bucket.S3;
      const Key = `${lspId}/user_hiring_files/${userId}/${temporalDoc._id}/${temporalDoc._id}.txt`;
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: Key,
      };
      const file = fs.createWriteStream(`./temp/${temporalDoc._id}-deleted.txt`);
      const s3Stream = s3.getObject(params).createReadStream();
      s3Stream.pipe(file);
      s3Stream.on('end', () => {
        const text = fs.readFileSync(`./temp/${temporalDoc._id}-deleted.txt`, 'utf8');
        console.log('ended', text);
        done(new Error('No file stream expected, when the file was marked as deleted'));
      });

      s3Stream.on('error', (err) => {
        // console.log("error", err.message);
        const msg = err.message || '';
        const keyRegExp = new RegExp('.*The specified key does not exist.*', 'i');
        assert.ok(msg.match(keyRegExp), 'NoSuchKey error should be triggered');
        done();
      });
    });

    it('GCS Check unable to download delta.txt (user file) from Bucket', (done) => {
      const Key = `${lspId}/user_hiring_files/${userId}/${temporalDoc._id}/${temporalDoc._id}.txt`;
      gcsBucket
        .file(Key)
        .download({ destination: `./temp/${temporalDoc._id}-deleted-gcs.txt` })
        .then((resp) => {
          const text = fs.readFileSync(`./temp/${temporalDoc._id}-deleted-gcs.txt`, 'utf8');
          assert.equal(text, fileContents, 'File does not have the same contents');
          done(new Error('Should not be able to download removed files'));
        })
        .catch((err) => {
          const msg = err.message || '';
          const keyRegExp = new RegExp('.*No such object.*', 'i');
          assert.ok(msg.match(keyRegExp), 'NoSuchKey error should be triggered');
          done();
        });
    });

    it('AWS List delta.txt file versions and delete markers from Bucket', (done) => {
      const Key = `${lspId}/user_hiring_files/${userId}/${temporalDoc._id}/${temporalDoc._id}.txt`;
      bucket.listFileVersions({
        Key: Key,
      }).then((res) => {
        assert.ok(typeof res.DeleteMarkers !== 'undefined', 'File Delete Markers were expected');
        assert.ok(typeof res.Versions !== 'undefined', 'File Version Markers were expected');
        // Note: Check delete marker exist
        assert.ok(res.Versions.length === 1, 'One version marker was expected');
        assert.ok(res.DeleteMarkers.length === 1, 'One deleted markers were expected');
        done();
      }).catch((err) => {
        done(err);
      });
    });
  });


  after(() => {
    console.log('  User Summary');
    console.log('    Id: ', userId);
    console.log('    Email: ', userEmail);
  });

  after((done) => {
    // console.log('Removing temporal files');
    rimraf('./temp/*.*', (err) => {
      done(err);
    });
  });
});
