const zip = require('bestzip');
const path = require('path');
const { v4: uuidV4 } = require('uuid');
const FileStorageFacade = require('../../components/file-storage');
const FilePathFactory = require('../../components/file-storage/file-path-factory');

class ZipFileGenerator {
  constructor(logger, configuration) {
    this.logger = logger;
    this.configuration = configuration;
    this.FileStorageFacade = FileStorageFacade;
    this.FilePathFactory = FilePathFactory;
  }

  _generateZip(lspId, tempDirName, files) {
    const zipName = uuidV4();
    const fileStorageFacade = new this.FileStorageFacade(lspId, this.configuration, this.logger);
    const zipStorage = fileStorageFacade.tempFile(`${tempDirName}/${zipName}.zip`);

    return zipStorage._assertDirectory()
      .then(() => new Promise((resolve, reject) => {
        const allPaths = files.map((f) => f.path);
        const allFiles = {
          zip: zipStorage.path,
          files: allPaths,
        };

        zip(zipStorage.path, allPaths, (err) => {
          if (err) {
            err.files = allFiles;
            reject(err);
          } else {
            resolve(allFiles);
          }
        });
      }));
  }

  async deleteTempZipFileGenerators(user, files) {
    if (files && Array.isArray(files) && files.length) {
      const lspId = user.lsp._id;
      const fileStorageFacade = new this.FileStorageFacade(lspId, this.configuration, this.logger);
      const dirParts = path.dirname(files[0]).split('/');
      const dir = dirParts[dirParts.length - 1];

      try {
        await fileStorageFacade.tempFile(dir).delete();
      } catch (e) {
        const message = e.message || e;

        this.logger.error(`Error deleting temporary directory. Error: ${message}`);
      }
    }
  }
}

module.exports = ZipFileGenerator;
