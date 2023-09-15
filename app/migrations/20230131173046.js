const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const NA_NAME = 'NA';
const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then(async (db) => {
    const lspCol = db.collection('lsp');
    const internalDepartments = db.collection('internalDepartments');
    const competenceLevels = db.collection('competenceLevels');
    const lsps = await lspCol.find({
      $or: [{
        name: 'Protranslating',
      }, {
        name: 'PTI',
      }, {
        name: 'BIG IP',
      }],
    }).toArray();

    await Promise.map(lsps, async (lsp) => {
      const promises = [];
      const internalDepartment = await internalDepartments.findOne({
        name: NA_NAME,
        lspId: lsp._id,
      });
      if (!internalDepartment) {
        const newDep = internalDepartments.insertOne({
          name: 'NA',
          lspId: lsp._id,
          accountingDepartmentId: 2050,
          deleted: false,
          createdBy: 'e2e@sample.com',
        });
        promises.push(newDep);
      }

      const competenceLevel = await competenceLevels.findOne({
        name: NA_NAME,
        lspId: lsp._id,
      });
      if (!competenceLevel) {
        const newCompLevel = competenceLevels.insertOne({
          name: 'NA',
          lspId: lsp._id,
          deleted: false,
          createdBy: 'e2e@sample.com',
        });
        promises.push(newCompLevel);
      }
      return Promise.all(promises);
    });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => {
    throw err;
  });
} else {
  module.exports = migration;
}
