const mongoose = require('mongoose');
const Promise = require('bluebird');
const getenv = require('getenv');

// configure Mongoose to use bluebird
mongoose.Promise = Promise;

global.mongoose = mongoose;

const MONGODB_LMS_CONNECTION_STRING = getenv('MONGODB_LMS_CONNECTION_STRING');
const mongooseOptions = {
  db: { native_parser: true },
  server: {
    socketOptions: {
      keepAlive: 120,
    },
  },
};

const mongooseConnection = mongoURL => new Promise((resolve, reject) => {
  mongoose.Promise = Promise;
  mongoose.connect(mongoURL, mongooseOptions, (err) => {
    if (err) {
      reject(err);
    } else {
      resolve(mongoose);
    }
  });
});

class MongoConnection {
  constructor() {
    this.mongoURLConnection = null;
    this.mongoose = null;
  }

  _buildConnectionURL() {
    const mongoOptions = {};
    this.logger.debug(`Mongo connection string: ${MONGODB_LMS_CONNECTION_STRING}`);
    mongoOptions.mongodbLmsConnectionString = MONGODB_LMS_CONNECTION_STRING;
    this.mongoURLConnection = mongoOptions.mongodbLmsConnectionString;
    this.mongooseOptions = {
      db: { native_parser: true },
      server: {
        socketOptions: {
          keepAlive: 120,
        },
      },
    };
  }

  /**
   * connect connects to mongodb
   * @returns {Promise} that resolves to the db object, otherwise it rejects with
   * an error
   */
  connect(logger) {
    this.logger = logger;
    if (this.mongoose) {
      this.logger.debug('Already connected to mongo, returning connection');
      return Promise.resolve(this.mongoose);
    }
    this._buildConnectionURL();
    const connection = mongooseConnection(this.mongoURLConnection);
    return connection.then((moongoose) => {
      logger.debug('Connected to the database');
      this.mongoose = moongoose;
      return this.mongoose;
    });
  }

  close() {
    const promise = this.mongoose.disconnect();
    this.db = null;
    this.auditDb = null;
    return promise;
  }
}

const mongoConnection = new MongoConnection();

module.exports = mongoConnection;
