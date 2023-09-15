const _ = require('lodash');
const Promise = require('bluebird');
const readline = require('readline');
const mongo = require('../../../components/database/mongo');
const configuration = require('../../../components/configuration');
const mongooseSchema = require('../../../components/database/mongo').models;

const lspName = process.argv[2];
if (_.isEmpty(lspName)) {
  throw new Error('Lsp name is mandatory');
}

const prompt = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

prompt.question(`I understand that this will delete the LSP named ${lspName}: Type Y to proceed: `, (reply) => {
  if (reply.toLowerCase() !== 'y') {
    process.exit();
  }
  mongo.connect(configuration)
    .then((connections) => {
      const { auditDb } = connections;
      const lmsAuth = connections.mongooseAuth;
      return {
        db: connections.mongoose.connection,
        auditDb,
        lmsAuth,
      };
    })
    .then(async ({ db, auditDb, lmsAuth }) => {
      console.log('Checking if the lsp exists...');
      const models = await mongooseSchema.loadSchemas();
      const lsp = await db.collection('lsp').findOne({ name: lspName }, { _id: 1 });
      // Removing lmsAuth records
      await lmsAuth.collection('lmsAuth').remove({ lspId: lsp._id });
      await Promise.map(Object.keys(models), async (modelName) => {
        if (_.isNil(lsp) || _.isNil(lsp._id)) {
          throw new Error('Lsp not found');
        }
        console.log('Lsp was found. Will delete related records now...');
        let query = { lspId: lsp._id };
        if (modelName === 'User') {
          query = { lsp: lsp._id };
        } else if (modelName === 'Lsp') {
          query = { _id: lsp._id };
        }
        console.log(`Removing records from model ${modelName}`);
        await models[modelName].deleteMany(query);
      })
        .catch((err) => {
          console.log(err);
        })
        .then(() => {
          console.log('Removing audit records');
          return auditDb.collection('audit_trails').remove({ lspId: lsp._id.toString() });
        })
        .finally(() => {
          console.log('Finished');
          process.exit();
        });
    });
});
