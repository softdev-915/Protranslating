const nullLogger = require('../../../../app/components/log/null-logger');
const FileStorageFacade = require('../../../../app/components/file-storage');
const testConfig = require('../configuration');
const MockFileStorage = require('./mock-file-storage');

const fileStorageFacade = new FileStorageFacade('test', testConfig, nullLogger);
fileStorageFacade.FileStorage = MockFileStorage;

module.exports = fileStorageFacade;
