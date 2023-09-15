const _ = require('lodash');
const CloudStorage = require('../cloud-storage');
const configuration = require('../configuration');

const ENOUGH_CONFIDENCE_MOCK_DATA = [{
  fullTextAnnotation: {
    pages: [{
      confidence: 0.80,
    }],
  },
}];

const LOW_CONFIDENCE_MOCK_DATA = [{
  fullTextAnnotation: {
    pages: [{
      confidence: 0,
    }],
  },
}];

const MOCK_DATA = {
  'LSP-271_E2E_TEST_PDF_1.pdf': ENOUGH_CONFIDENCE_MOCK_DATA,
  'LSP-271_E2E_TEST_PDF_2.pdf': ENOUGH_CONFIDENCE_MOCK_DATA,
  'LSP-271_E2E_TEST_PDF_ERROR.pdf': LOW_CONFIDENCE_MOCK_DATA,
};
const SUCCESSFUL_TRANSFORMED_MOCK_DATA = [{ paragraphs: [{ text: ['Successful mock translation'] }] }];
const LOW_CONFIDENCE_TRANSFORMED_MOCK_DATA = [{ paragraphs: [{ text: ['Not enough confidence'] }] }];
const MOCK_TRANSFORMED_DATA = {
  'LSP-271_E2E_TEST_PDF_1.pdf': SUCCESSFUL_TRANSFORMED_MOCK_DATA,
  'LSP-271_E2E_TEST_PDF_2.pdf': SUCCESSFUL_TRANSFORMED_MOCK_DATA,
  'LSP-271_E2E_TEST_PDF_ERROR.pdf': LOW_CONFIDENCE_TRANSFORMED_MOCK_DATA,
};
const MOCK_OPERATION_CODE = 'MOCK_OPERATION_CODE';

class GoogleVisionMockService {
  constructor() {
    this.cloudStorage = new CloudStorage(configuration);
  }
  async batchAnnotateFiles(source, destinationPath, destination) {
    const file = await this.cloudStorage.gcsBucket.file(`${destination}ocr_data.txt`);
    const writeStream = await file.createWriteStream();
    await new Promise((resolve, reject) => {
      writeStream.on('finish', () => resolve());
      writeStream.on('error', err => reject(err));
      writeStream.write('MOCK RECOGNITION INFO');
      writeStream.end();
    });
    return [{}, { name: MOCK_OPERATION_CODE }];
  }

  transformRecognitionInfo(data, fileName) {
    return _.get(MOCK_TRANSFORMED_DATA, fileName, SUCCESSFUL_TRANSFORMED_MOCK_DATA);
  }

  checkConfidence(translationData, minimalConfidence) {
    return translationData.every(d =>
      (d.fullTextAnnotation ? d.fullTextAnnotation.pages[0].confidence >= minimalConfidence : 1),
    );
  }

  async checkAnnotationReady() {
    return true;
  }

  async getRecognitionInfo(prefix, fileName) {
    return _.get(MOCK_DATA, fileName, ENOUGH_CONFIDENCE_MOCK_DATA);
  }
}

module.exports = GoogleVisionMockService;
