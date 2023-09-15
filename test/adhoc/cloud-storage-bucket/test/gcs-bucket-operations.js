// Express WebServer
// -----------------------------

// Modules Dependencies:
//  - Assert (http://nodejs.org/api/assert.html)
//  - SuperAgent (http://visionmedia.github.io/superagent/)
const _ = require('lodash');
const rimraf = require('rimraf');
const assert = require('assert');
const fs = require('fs');
const GCStorage = require('@google-cloud/storage');

// modify for slow connections
const GLOBAL_TIMEOUT = 1000 * 0.5;

let fileContents = '';
const gcs = GCStorage({
  keyFilename: process.env.GCS_KEY_FILE,
});
const gcsBucket = gcs.bucket(process.env.GCS_BUCKET);

// Unit Tests
describe('Google Cloud Storage Tests', function() {

  before(function () {
    fileContents = fs.readFileSync('./mocks/sample.txt', 'utf8');
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

  describe('Bucket Operations', function() {

    it('Upload sample.txt', function(done) {
      const newKey = 'sample.txt';
      const filePath = `./mocks/${newKey}`;
      const destinationPath = newKey;
      gcsBucket.upload(filePath, { destination: destinationPath })
        .then((res) => {
          // console.log(res[0]);
          // assert.equal(res.legth, 1, 'One file obj expected')
          done();
        }).catch(done);
    });

    it('Download sample.txt file from Bucket', function(done) {
      const newKey = 'sample.txt';
      gcsBucket
        .file(newKey)
        .download({ destination: `./temp/${newKey}` })
        .then(() => {
          const text = fs.readFileSync(`./temp/${newKey}`,'utf8');
          assert.equal(text, fileContents, 'File does not have the same contents');
          done();
        })
        .catch(done);
    });

    it('Find sample.txt using prefixes', function(done) {
      gcsBucket.getFiles({prefix: 'sample'})
        .then(results => {
          // console.log("success:", results)
          const files = results[0];
          const fileExists = _.find(files, {name: 'sample.txt'});
          assert.equal(fileExists.name, 'sample.txt', 'Unable to find file sample.txt')
          done();
        })
        .catch(done);
    });

    // it('update');
    it('Delete sample.txt file', function(done) {
      const newKey = 'sample.txt';
      gcsBucket
        .file(newKey)
        .delete()
        .then((res) => {
          done();
        })
        .catch(done);
    });

    it('Check unable to download sample.txt from Bucket', function(done) {
      const newKey = 'sample.txt';
      gcsBucket
        .file(newKey)
        .download({ destination: `./temp/deleted-${newKey}` })
        .then((resp) => {
          const text = fs.readFileSync(`./temp/deleted-${newKey}`,'utf8');
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

    it('Check unable to find sample.txt using prefixes', function(done) {
      gcsBucket.getFiles({prefix: 'sample'})
        .then(results => {
          // console.log("success:", results)
          const files = results[0];
          const fileExists = _.find(files, {name: 'sample.txt'});
          assert.ok(typeof fileExists === 'undefined', 'Should not be able to find removed file');
          // files.forEach(file => {
          //   console.log(file.name);
          // });
          done();
        })
        .catch(done);
    });

    it('Upload sample.txt with different content', function(done) {
      const newKey = 'sample.txt';
      const filePath = `./mocks/sample2.txt`;
      const destinationPath = newKey;
      gcsBucket.upload(filePath, { destination: destinationPath })
        .then((res) => {
          // console.log(res[0]);
          // assert.equal(res.legth, 1, 'One file obj expected')
          done();
        }).catch(done);
    });

    it('Download sample.txt as stream', function(done) {
      const newKey = 'sample.txt';
      const downloadDestination = './temp/local-sample.txt';
      gcsBucket.file(newKey).createReadStream()
        .on('error', function(err) { done(err); })
        .on('data', function(data) {
          // console.log("data:", data.toString('utf8'));
          const content = data.toString('utf8');
          assert.ok(content.match(/.*another random content.*/i, 'Content expected does not match'));
        })
        .on('response', function(response) {
          // Server connected and responded with the specified status and headers.
          // console.log(response);
         })
        .on('end', function() {
          // The file is fully downloaded.
          // console.log("done");
          done();
        })
        .pipe(fs.createWriteStream(downloadDestination));
    });

    it('Remove using prefixes', function(done) {
      gcsBucket.deleteFiles({ prefix: 'sample' })
        .then((res) => {
          done();
        })
        .catch(done);
    });

    it('Check unable to find sample.txt using prefixes', function(done) {
      gcsBucket.getFiles({prefix: 'sample'})
        .then(results => {
          // console.log("success:", results)
          const files = results[0];
          const fileExists = _.find(files, {name: 'sample.txt'});
          assert.ok(typeof fileExists === 'undefined', 'Should not be able to find removed file');

          // console.log('Files:');
          // files.forEach(file => {
          //   console.log(file.name);
          // });
          done();
        })
        .catch(done);
    });
    /*
    it('Remove using prefixes', function(done) {
      gcsBucket.deleteFiles({ prefix: '58f60d08963daf9a13ce1889' })
        .then((res) => {
          done();
        })
        .catch(done);
    });
    */
  });

  after(function() {
  });

});
