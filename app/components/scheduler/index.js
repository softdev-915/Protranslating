const { Agenda } = require('@hokify/agenda');
const mongoConnection = require('../database/mongo');
const ApplicationScheduler = require('./application-scheduler');

const JOBS_COLLECTION_NAME = 'agendaJobs';
let instance;
const buildApplicationScheduler = async (configuration) => {
  if (!instance) {
    const jobsCollection = mongoConnection.mongoose.connection.collection(JOBS_COLLECTION_NAME);

    await jobsCollection.createIndex({
      nextRunAt: 1,
      lockedAt: 1,
      name: 1,
      priority: 1,
    });

    const agenda = new Agenda({
      defaultConcurrency: 1,
      mongo: jobsCollection.conn,
    });

    instance = new ApplicationScheduler(agenda, configuration);
  }
  return instance;
};

module.exports = buildApplicationScheduler;
