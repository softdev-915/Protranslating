const { ImageAnnotatorClient } = require('@google-cloud/vision');
const _ = require('lodash');
const CloudStorage = require('../cloud-storage/index.js');
const configuration = require('../configuration');
const { streamToString } = require('../cloud-storage/cloud-storage-helpers');
const Promise = require('bluebird');

class GoogleVisionService {
  constructor(logger) {
    this.logger = logger;
    const environmentConfig = configuration.environment;
    this.imageAnnotatorClient = new ImageAnnotatorClient({
      keyFilename: environmentConfig.GCS_KEY_FILE,
    });
    this.cloudStorage = new CloudStorage(configuration);
  }

  async batchAnnotateFiles(filePath, destination) {
    const inputConfig = {
      mimeType: 'application/pdf',
      gcsSource: {
        uri: filePath,
      },
    };
    const features = [{ type: 'DOCUMENT_TEXT_DETECTION' }];
    const outputConfig = {
      gcsDestination: {
        uri: destination,
      },
      batchSize: 1, // The max number of responses to output in each JSON file
    };
    const fileRequest = {
      inputConfig: inputConfig,
      features: features,
      outputConfig,
      imageContext: {
        textDetectionParams: {
          enableTextDetectionConfidenceScore: true,
        },
      },
    };
    const request = {
      requests: [fileRequest],
    };
    this.logger.debug(`Google Vision: send to recognition file ${filePath} with params`, JSON.stringify(fileRequest));
    const data = await this.imageAnnotatorClient.asyncBatchAnnotateFiles(request);
    this.logger.debug(`Google Vision: received operation code for recognition of ${filePath}: ${_.get(data, '[1].name')}`);
    return data;
  }

  transformRecognitionInfo(data) {
    const pages = [];
    data.forEach((d) => {
      if (_.isNil(d.fullTextAnnotation)) pages.push({ paragraphs: [{ text: '' }] });
      else {
        const pageData = d.fullTextAnnotation.pages[0];
        const paragraphsForPage = [];
        pageData.blocks.forEach((bl) => {
          const blocks = bl.paragraphs.map(p =>
            p.words.map(w =>
              w.symbols.map(s => s.text).join(''), // Symbols into words
            ).join(' '), // Words into blocks
          );
          paragraphsForPage.push(...blocks.map(b => ({ text: b }))); // Blocks into paragraphs
        });
        pages.push({
          paragraphs: paragraphsForPage,
        });
      }
    });
    return pages;
  }

  checkConfidence(translationData, minimalConfidence) {
    return translationData.every(d =>
      (d.fullTextAnnotation ? d.fullTextAnnotation.pages[0].confidence >= minimalConfidence : 1),
    );
  }

  async checkAnnotationReady(operationName) {
    this.logger.debug(`Google Vision: sent request to check recognition operation with code ${operationName}`);
    const [data] = await this.imageAnnotatorClient.operationsClient
      .getOperation({ name: operationName });
    this.logger.debug(`Google Vision: received status of ${operationName}. Done: ${data.done}, result: ${data.result}`);
    return data.done && data.result === 'response';
  }

  async getRecognitionInfo(prefix) {
    const stream = this.cloudStorage.gcsBucket.getFilesStream({ prefix });
    const pagesInfoPromises = [];
    return new Promise((resolve, reject) => {
      stream
        .on('error', reject)
        .on('data', (file) => {
          const fileStream = file.createReadStream();
          pagesInfoPromises.push(streamToString(fileStream));
        })
        .on('end', () => {
          Promise.all(pagesInfoPromises)
            .then((data) => {
              const parsedData = data.map(JSON.parse).map(d => d.responses[0]);
              const sortedData = _.sortBy(parsedData, 'context.pageNumber');
              resolve(sortedData);
            })
            .catch(err => reject(err));
        });
    });
  }
}

module.exports = GoogleVisionService;
