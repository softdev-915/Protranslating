const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  const collectionsNames = [
    'pc_default_pipelines',
    'pc_pipelines',
    'pc_quartz_actions',
    'pc_quartz_calendars',
    'pc_quartz_jobs',
    'pc_quartz_locks',
    'pc_quartz_schedulers',
    'pc_quartz_triggers',
    'pc_tfa',
    'pc_tfsh',
    'pc_tmsh',
    'pc_tbeh',
    'pc_ra',
    'pc_reps',
  ];
  const promises = collectionsNames.map(name => db.createCollection(name));
  return Promise.all(promises);
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
