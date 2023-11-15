/* global document */
import Vue from 'vue';
import lspAwareUrl from '../resources/lsp-aware-url';

export default class ReportService {
  generatePdfReport(filename, compiledTemplate) {
    const urlPath = lspAwareUrl('report/generate-pdf');
    const postData = {
      reportCss: document.head.outerHTML,
      compiledTemplate,
      filename,
    };
    return Vue.http.post(urlPath, postData, { responseType: 'arraybuffer' });
  }
}
