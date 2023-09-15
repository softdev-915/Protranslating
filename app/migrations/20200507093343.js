const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const Promise = require('bluebird');
const _ = require('lodash');

const buildLspSchedulers = (schedulers, lspId) => schedulers.map((scheduler) => {
  const newScheduler = _.assign({}, scheduler);
  delete newScheduler._id;
  newScheduler.lspId = lspId;
  return newScheduler;
});

const insertLspNewSchedulers = (schedulersCol, schedulers, lspId) => Promise.mapSeries(
  schedulers,
  s => schedulersCol.findOne({ name: s.name, lspId })
    .then((scheduler) => {
      if (!scheduler) {
        return schedulersCol.insertOne(s);
      }
    }),
);

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const lspCol = db.collection('lsp');
    const schedulersCol = db.collection('schedulers');
    const schedulersToCopy = [
      'inactivate-user',
      'request-completed-email',
      'request-creation-email',
      'request-modified-pm-email',
    ];
    return lspCol.findOne({ name: 'Protranslating' })
      .then(ptsLsp => schedulersCol.find({
        lspId: ptsLsp._id,
        name: { $in: schedulersToCopy },
      }).toArray())
      // Getting new LSPs
      .then(schedulers => Promise.all([
        lspCol.findOne({ name: 'Big IP' }),
        lspCol.findOne({ name: 'PTI' }),
      ])
        .then((lsps) => {
          const bigIp = lsps[0];
          const pti = lsps[1];
          const bigIpSchedulers = buildLspSchedulers(schedulers, bigIp._id);
          const ptiSchedulers = buildLspSchedulers(schedulers, pti._id);
          return Promise.all([
            insertLspNewSchedulers(schedulersCol, bigIpSchedulers, bigIp._id),
            insertLspNewSchedulers(schedulersCol, ptiSchedulers, pti._id),
          ]);
        }));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
