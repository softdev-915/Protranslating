const mongoose = require('mongoose');
const mongoConnection = require('../index');
const appLogger = require('../../../log/logger');

const { ObjectId } = mongoose.Types;

class GenericService {
  constructor(collectionName, logger, db = mongoConnection.db) {
    this.db = db;
    this.collectionName = collectionName;
    if (logger) {
      this.logger = logger;
    } else {
      this.logger = appLogger;
    }
    this._testData = false;
  }

  get testData() { return this._testData; }

  set testData(testData) {
    this._testData = testData;
  }

  findOne(query) {
    this.logger.debug(`executing findOne for ${this.collectionName}`);
    const collection = this.collection();
    return collection.findOne(query);
  }

  find(query) {
    this.logger.debug(`executing find for ${this.collectionName}`);
    const collection = this.collection();
    return collection.find(query);
  }

  insert(object) {
    try {
      this.logger.debug(`executing insert for ${this.collectionName}`);
      if (this._testData) {
        object.__test__data__ = true;
      }
      const collection = this.collection();
      return collection.insert(object);
    } catch (err) {
      this.logger.error(err);
    }
  }

  updateOne(query, object, options) {
    this.logger.debug(`executing updateOne for ${this.collectionName}`);
    const collection = this.collection();
    return collection.updateOne(query, object, options);
  }

  updateMany(query, object, options) {
    this.logger.debug(`executing updateMany for ${this.collectionName}`);
    const collection = this.collection();
    return collection.updateMany(query, object, options);
  }

  deleteOne(query, options) {
    this.logger.debug(`executing deleteOne for ${this.collectionName}`);
    const collection = this.collection();
    return collection.deleteOne(query, options);
  }

  deleteMany(query, options) {
    this.logger.debug(`executing deleteMany for ${this.collectionName}`);
    const collection = this.collection();
    return collection.deleteMany(query, options);
  }

  collection() {
    return this.db.collection(this.collectionName);
  }

  collectionRef(name) {
    return this.db.collection(name);
  }

  objectId(id) {
    return ObjectId.createFromHexString(id);
  }

  _removeTestData() {
    return this.deleteMany({ __test__data__: true });
  }
}

module.exports = GenericService;
