const _ = require('lodash');
const { v4: uuidV4 } = require('uuid');
const Promise = require('bluebird');
const SchemaAwareAPI = require('../../../../../schema-aware-api');
const FileStorageFacade = require('../../../../../../components/file-storage');
const FileStorageFactory = require('../../../../../../components/file-storage/file-storage');
const { RestError } = require('../../../../../../components/api-response');
const RequestAPI = require('../../../../request/request-api');
const PDFImageConvert = require('../../../../../../components/pdf');

const isImageRegexp = /.+\\.(gif|jpg|jpeg|tiff|png)$/;
const pdfRegexp = /.+\\.pdf$/;

class BasicCatToolDocumentAPI extends SchemaAwareAPI {
  constructor(options) {
    super(options.log, options);
    this.configuration = options.configuration;
    this.FileStorageFacade = FileStorageFacade;
    this.FileStorageFactory = FileStorageFactory;
    this.mock = _.get(options, 'mock');
    this.bucket = options.bucket;
  }

  async generateImageFromDocument(companyId, requestId, documentId, page) {
    const { lspId } = this;
    const fileStorageFacade = new this.FileStorageFacade(lspId, this.configuration, this.logger);
    const { document, file } = await this.findFile(
      companyId,
      requestId,
      documentId,
      fileStorageFacade,
    );

    if (isImageRegexp.test(document.name)) {
      if (page !== 0) {
        throw new RestError(404, { message: `Document has no ${page}` });
      }

      return {
        file: file.path,
        onServed: () => Promise.resolve(),
      };
    } if (pdfRegexp.test(document.name)) {
      const pdfImageConvert = new PDFImageConvert();
      const tempFileName = `${uuidV4()}.jpg`;
      const tempFile = fileStorageFacade.tempFile(tempFileName);

      try {
        await pdfImageConvert.convertPDFPage(file.path, page, tempFile.path);
      } catch (err) {
        const message = err.message || err;

        this.logger.error(`Error converting pdf page ${page} for pdf: "${file.path}. Error: ${message}"`);
        throw new RestError(500, { message: 'Could not generate PDF page', stack: err.stack });
      }

      return {
        file: tempFile,
        onServed: () => tempFile.delete(),
      };
    }
  }

  async documentInfo(companyId, requestId, documentId) {
    const { lspId } = this;
    const fileStorageFacade = new this.FileStorageFacade(lspId, this.configuration, this.logger);
    const { document, file } = await this.findFile(
      companyId,
      requestId,

      documentId,

      fileStorageFacade,
    );

    if (pdfRegexp.test(document.name)) {
      const pdfImageConvert = new PDFImageConvert();

      try {
        const info = await pdfImageConvert.pdfInfo(file.path);
        let fileSize = 0;

        try {
          fileSize = parseInt(info['File size'].split(' ')[0], 10);
        } catch (err) {
          this.logger.info(`Error parsing file size ${info['File size']}`);
        }
        const pdfInfo = {
          encripted: info.Encrypted !== 'no',
          size: fileSize,
          optimized: info.Optimized !== 'no',
          pdfVersion: info['PDF version'],
          pageRotation: parseInt(info['Page rot'], 10),
          pageSize: info['Page size'],
          pageCount: parseInt(info.Pages, 10),
          title: info.Title,
        };

        return pdfInfo;
      } catch (err) {
        const message = err.message || err;

        this.logger.error(`Error retrieving info for pdf: "${file.path}. Error: ${message}"`);
        throw new RestError(500, { message: 'Could not generate PDF page', stack: err.stack });
      }
    }
    throw new RestError(400, { message: 'Only PDF files have info' });
  }

  async findFile(companyID, requestId, documentId, fileStorageFacade) {
    let file;
    const api = new RequestAPI({
      user: this.user,
      configuration: this.configuration,
      log: this.logger,
      mock: this.mock,
      bucket: this.bucket,
    });
    const request = await api.findOne(requestId);
    const document = request.documents.find((doc) => doc._id.toString() === documentId);
    const params = [request.company._id.toString(), requestId, document];

    if (!document) {
      throw new RestError(404, { message: `The document ${documentId} does not exist` });
    }
    if (document.final) {
      file = fileStorageFacade.translationRequestFinalFile(...params);
    } else {
      file = fileStorageFacade.translationRequestFile(...params);
    }
    const fileExist = await file.exists();

    if (!fileExist) {
      this.logger.info(`The file "${file.path}" does not exist`);
      throw new RestError(404, { message: 'File does not exist' });
    }

    return {
      document,
      file,
    };
  }
}

module.exports = BasicCatToolDocumentAPI;
