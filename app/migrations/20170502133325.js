const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const flowPrism = {
  name: 'flowPrism',
  options: {
    wsdlTest: 'https://test.protranslating.com/services/FlowRequest?wsdl',
    wsdl: 'https://flow.protranslating.com/services/FlowRequest?wsdl',
  },
};

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const externalAPIS = db.collection('external_apis');
    return externalAPIS.findOne({ name: flowPrism.name }).then((dbFlow) => {
      if (dbFlow) {
        return externalAPIS.update({ name: flowPrism.name }, { $set: {
          options: {
            wsdlTest: 'https://test.protranslating.com/services/FlowRequest?wsdl',
            wsdl: 'https://flow.protranslating.com/services/FlowRequest?wsdl',
          },
        } });
      }
      return externalAPIS.insert(flowPrism);
    });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
