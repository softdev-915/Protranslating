const sinon = require('sinon');
const nullLogger = require('../../../../app/components/log/null-logger');
const FileStorageFacade = require('../../../../app/components/file-storage');
const testConfig = require('../configuration');
const MockFileStorage = require('./mock-file-storage');

const knownMethods = [
  'translationRequestFile',
  'translationRequestFinalFile',
  'translationRequestTaskFile',
];

class FileStorageFacadeMock extends FileStorageFacade {
  constructor(lspId = 'test') {
    super(lspId, testConfig, nullLogger);
    this.FileStorage = MockFileStorage;
    knownMethods.forEach((method) => {
      this[method] = () => new this.FileStorage('', null, null);
      sinon.spy(this, method);
    });
    FileStorageFacadeMock._addInstance(this);
  }

  static _clearInstances() {
    FileStorageFacadeMock._instances = [];
  }

  static _addInstance(instance) {
    FileStorageFacadeMock._instances.push(instance);
  }

  static instances() {
    return FileStorageFacadeMock._instances;
  }
}

FileStorageFacadeMock._instances = [];

module.exports = FileStorageFacadeMock;
