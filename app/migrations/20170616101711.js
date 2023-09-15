const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const flowPrismOptions = {
  wsdlTest: 'https://test.protranslating.com/services/FlowRequest?wsdl',
  wsdl: 'https://flow.protranslating.com/services/FlowRequest?wsdl',
  filesEndpointProd: 'https://flow.protranslating.com/services/getFlowFile',
  filesEndpointTest: 'https://test.protranslating.com/services/getFlowFile',
};

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then(db => db.collection('external_apis').findOneAndUpdate(
    { name: 'flowPrism' },
    { $set: { options: flowPrismOptions } },
    { upsert: true },
    (err) => {
      if (err) throw new Error(`Error updating flowPrism options, ${err}`);
    }));

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
