/* global document window Blob getComputedStyle Node */
import { mapActions, mapGetters } from 'vuex';
import _ from 'lodash';
import Handlebars from 'handlebars/dist/handlebars';
import loadHelpers from '../../utils/handlebars';
import MarginsSelect from './margins-select.vue';
import ReportService from '../../services/report-service';
import CustomFieldList from './custom-field-list.vue';
import DocumentPageContainer from './document-page-container.vue';
import { marginPresetOptions } from './margin-select-const';
import { setPageStyles } from '../../utils/pdf';

loadHelpers(Handlebars);

const reportService = new ReportService();
const a4Scale = 297 / 210;
const pageElementsChunksMaxStep = 200;
const pageBreakElementMaxDeepLevel = 20;

export default {
  components: {
    MarginsSelect,
    CustomFieldList,
    DocumentPageContainer,
  },
  props: {
    template: {
      required: true,
      type: String,
    },
    templateData: {
      type: Object,
      default: () => ({}),
    },
    templateBlockId: {
      type: String,
      default: '',
    },
    templateCustomFieldTypes: {
      type: Array,
      default: () => [],
    },
    templatePreviewCustomFieldTypes: {
      type: Array,
      default: () => [],
    },
    templateCustomFieldValues: {
      type: Object,
      default: () => ({}),
    },
    templateCustomFieldsLabel: {
      type: String,
      default: '',
    },
    needSaveTemplateCustomFields: {
      type: Boolean,
      default: false,
    },
    emailCustomFieldTypes: {
      type: Array,
      default: () => [],
    },
    emailCustomFieldValues: {
      type: Object,
      default: () => ({}),
    },
    emailCustomFieldsLabel: {
      type: String,
      default: '',
    },
    needSaveEmailCustomFields: {
      type: Boolean,
      default: false,
    },
    footerTemplate: {
      type: String,
      default: '',
    },
    allowSavingCustomFieldsToTemplate: {
      type: Boolean,
      default: true,
    },
    allowSavingEmailCustomFieldsToTemplate: {
      type: Boolean,
      default: true,
    },
    isPreviewAvailable: {
      type: Boolean,
      default: true,
    },
    notAvailablePreviewDescription: {
      type: String,
      default: 'Please select a template',
    },
    hiddenFields: {
      type: Array,
      default: () => ([]),
    },
    hideableFields: {
      type: Array,
      default: () => ([]),
    },
  },
  data() {
    return {
      marginsData: {
        margins: {
          top: marginPresetOptions[0].value[0],
          right: marginPresetOptions[0].value[1],
          bottom: marginPresetOptions[0].value[2],
          left: marginPresetOptions[0].value[3],
        },
        unit: marginPresetOptions[0].unit,
      },
      previewDocumentContainerScale: 1,
      previewContainerHeight: 0,
      invalidTemplateContainerHeight: 0,
      currentPage: 1,
      pageTemplates: [],
    };
  },
  computed: {
    ...mapGetters('app', ['lspAddressFooter']),
    ...mapGetters('sideBar', ['isCollapsedAfterAnimation']),
    compiledTemplate() {
      let result = '';
      const data = {
        ...this.templateData,
      };
      const customFieldsValues = _.omit(this.previewCustomFieldValues, this.hiddenFields);
      if (!_.isEmpty(customFieldsValues)) {
        Object.assign(data, customFieldsValues);
      }
      try {
        const compiledTemplate = Handlebars.compile(this.template);
        result = compiledTemplate(data);
      } catch (e) {
        const errMessage = _.get(e, 'message', e);
        this.pushNotification({
          title: 'Error parsing template',
          message: `Could not parse the template: ${errMessage}`,
          state: 'danger',
        });
      }
      return result;
    },
    showPreview() {
      const result = this.isTemplateValid && this.isPreviewAvailable;
      this.$emit('preview-is-shown', result);
      return result;
    },
    isTemplateValid() {
      return !_.isEmpty(this.compiledTemplate) && !_.isEmpty(this.pageTemplates);
    },
    cssMarginData() {
      const { margins, unit } = this.marginsData;
      const result = {};
      ['top', 'right', 'bottom', 'left'].forEach((marginType) => {
        result[marginType] = this.convertToCssValue(margins[marginType], unit);
      });
      return result;
    },
    reportPrintableMarginsValue() {
      const cssMarginData = this.cssMarginData;
      return `${cssMarginData.top} ${cssMarginData.right} ${cssMarginData.bottom} ${cssMarginData.left}`;
    },
    previewDocumentContainerStyles() {
      const scaleCss = `scale(${this.previewDocumentContainerScale})`;
      return {
        transform: scaleCss,
        msTransform: scaleCss,
      };
    },
    previewContainerStyles() {
      return this.showPreview ? { height: `${this.previewContainerHeight}px` } : {};
    },
    invalidTemplateContainerStyles() {
      return !this.showPreview ? { height: `${this.invalidTemplateContainerHeight}px` } : {};
    },
    templateOptionsStyles() {
      return { height: `${this.previewContainerHeight - 55}px` };
    },
    pageCount() {
      return this.pageTemplates.length;
    },
    isPreviousPageAvailable() {
      return this.currentPage !== 1;
    },
    isNextPageAvailable() {
      return this.currentPage !== this.pageCount;
    },
    templateCustomFieldValuesSync: {
      get() {
        return this.templateCustomFieldValues;
      },
      set(newValue) {
        this.$emit('update:templateCustomFieldValues', newValue);
      },
    },
    needSaveTemplateCustomFieldsSync: {
      get() {
        return this.needSaveTemplateCustomFields;
      },
      set(newValue) {
        this.$emit('update:needSaveTemplateCustomFields', newValue);
      },
    },
    emailCustomFieldValuesSync: {
      get() {
        return this.emailCustomFieldValues;
      },
      set(newValue) {
        this.$emit('update:emailCustomFieldValues', newValue);
      },
    },
    needSaveEmailCustomFieldsSync: {
      get() {
        return this.needSaveEmailCustomFields;
      },
      set(newValue) {
        this.$emit('update:needSaveEmailCustomFields', newValue);
      },
    },
    customFieldValues() {
      const result = {};
      this.templateCustomFieldTypes.forEach((customField) => {
        const value = _.get(this.templateCustomFieldValuesSync, customField.templateKey, '');
        _.set(
          result,
          [customField.templatePath, customField.templateKey],
          value,
        );
      });
      this.emailCustomFieldTypes.forEach((customField) => {
        const value = _.get(this.emailCustomFieldValuesSync, customField.templateKey, '');
        _.set(
          result,
          [customField.templatePath, customField.templateKey],
          value,
        );
      });
      return result;
    },
    previewCustomFieldValues() {
      const result = {};
      this.templatePreviewCustomFieldTypes.forEach((customField) => {
        const value = _.get(this.templateCustomFieldValuesSync, customField.templateKey, '');
        _.set(
          result,
          [customField.templatePath, customField.templateKey],
          value,
        );
      });
      return _.merge(result, this.customFieldValues);
    },
    footerContent() {
      return this.footerTemplate || this.lspAddressFooter || '';
    },
  },
  watch: {
    cssMarginData: {
      immediate: true,
      handler() {
        this.$nextTick(() => {
          setPageStyles(this.footerContent, this.cssMarginData);
          this.resizeHandler();
          this.makeTemplatePagination(this.compiledTemplate);
        });
      },
    },
    footerContent: {
      immediate: true,
      handler() {
        this.$nextTick(() => {
          setPageStyles(this.footerContent, this.cssMarginData);
        });
      },
    },
    compiledTemplate: {
      immediate: true,
      handler(newValue) {
        this.$nextTick(() => this.makeTemplatePagination(newValue));
      },
    },
    pageTemplates: {
      immediate: true,
      handler() {
        this.$nextTick(this.resizeHandler);
        setTimeout(() => {
          this.resizeHandler();
        }, 500);
      },
    },
    isCollapsedAfterAnimation: {
      immediate: true,
      handler() {
        this.$nextTick(this.resizeHandler);
      },
    },
  },
  mounted() {
    this.$nextTick(this.resizeHandler);
    window.addEventListener('resize', this.resizeHandler);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.resizeHandler);
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    convertToCssValue(value, unit) {
      return value !== 0 ? `${value}${unit}` : `${value}`;
    },
    async downloadPdf(reportFilename) {
      try {
        const { pdfBlob, filename } = await this.getGeneratedPdfFile(reportFilename);
        const result = document.createElement('a');
        result.href = window.URL.createObjectURL(pdfBlob);
        result.download = filename;
        result.click();
      } catch (err) {
        this.pushNotification({
          title: 'Error',
          message: 'Could not generate a template',
          state: 'danger',
          response: err,
        });
      }
    },
    async getGeneratedPdfFile(reportFilename) {
      try {
        const response = await reportService.generatePdfReport(
          reportFilename,
          this.$refs['preview-document-container'].$refs['preview-document-template-container'].outerHTML,
        );
        const pdfBlob = new Blob(
          [response.data],
          { type: response.headers.get('content-type') },
        );
        const disposition = response.headers.get('content-disposition');
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        const filename = matches != null && matches[1]
          ? matches[1].replace(/['"]/g, '')
          : `${reportFilename}.pdf`;
        return { pdfBlob, filename: decodeURIComponent(filename) };
      } catch (err) {
        this.pushNotification({
          title: 'Error',
          message: 'Could not generate a template',
          state: 'danger',
          response: err,
        });
      }
    },
    cancelReportPreviewSettings() {
      if (this.showPreview) {
        this.$refs['margins-select'].cancelMarginValuesChanges();
      }
    },
    resizeHandler() {
      this.resizeDocumentPreviewContainer();
      this.setInvalidTemplateContainerHeight();
    },
    resizeDocumentPreviewContainer() {
      if (!this.showPreview) {
        return;
      }
      window.requestAnimationFrame(() => {
        const element = this.$refs['preview-document-container'].$el;
        const scale = this.getScaleAmountNeededToFit(element, 108);
        this.previewDocumentContainerScale = scale;
        this.setHeightForPreviewContainer(element, scale, 40 + 62);
      });
    },
    getScaleAmountNeededToFit(element, margin = 0) {
      const parentWidth = element.parentElement.clientWidth - (margin * 2);
      return parentWidth / element.clientWidth;
    },
    setHeightForPreviewContainer(element, scale, margins) {
      let blockHeight = (element.clientHeight * scale) + margins;
      blockHeight = Math.ceil(blockHeight);
      this.previewContainerHeight = blockHeight;
    },
    setInvalidTemplateContainerHeight() {
      if (this.showPreview) {
        return;
      }
      const invalidTemplateContainer = this.$refs['invalid-template-container'];
      const width = invalidTemplateContainer.clientWidth;
      this.invalidTemplateContainerHeight = Math.ceil(a4Scale * width);
    },
    clickPreviousPage() {
      if (!this.isPreviousPageAvailable) {
        return;
      }
      this.currentPage--;
    },
    clickNextPage() {
      if (!this.isNextPageAvailable) {
        return;
      }
      this.currentPage++;
    },
    setValidTemplateCustomFields(value) {
      this.$emit('are-valid-template-custom-fields', value);
    },
    setValidEmailCustomFields(value) {
      this.$emit('are-valid-email-custom-fields', value);
    },
    makeDocumentPreviewFormatForCustomFields(templateCustomFields, documentPreviewCustomFields) {
      return documentPreviewCustomFields.map((customField) => {
        const customFieldClone = { ...customField };
        const fieldName = customField.templateKey;
        if (_.has(templateCustomFields, fieldName)) {
          const value = templateCustomFields[fieldName];
          if (customField.type === 'dropdown') {
            customFieldClone.value = { text: value, value };
          } else {
            customFieldClone.value = value;
          }
        }
        return customFieldClone;
      });
    },
    makeTemplateFormatForCustomFields(templateCustomFields, documentPreviewCustomFields) {
      const result = {};
      Object.entries(templateCustomFields).forEach(([fieldName, fieldValue]) => {
        const foundCustomField = documentPreviewCustomFields.find(
          customField => customField.templateKey === fieldName
        );
        result[fieldName] = _.get(foundCustomField, 'value', fieldValue);
      });
      return result;
    },
    getUpdatedCustomFields(currentCustomFields, newCustomFields) {
      return currentCustomFields.map((customField) => {
        const customFieldClone = { ...customField };
        const foundCustomField = newCustomFields.find(
          newValue => newValue.templateKey === customField.templateKey
        );
        if (!_.isEmpty(foundCustomField)) {
          customFieldClone.value = foundCustomField.value;
        }
        return customFieldClone;
      });
    },
    makeTemplatePagination(htmlDocument) {
      if (_.isEmpty(htmlDocument)) {
        return;
      }
      const virtualPageContent = this.createVirtualPageContent(htmlDocument);
      const pageElementsChunks = this.getPageElementsChunks(virtualPageContent);
      this.clearVirtualPageContent(virtualPageContent);
      this.pageTemplates = pageElementsChunks.map(pageElements => pageElements.reduce(
        (result, pageElement) => result + pageElement.outerHTML,
        '',
      ));
    },
    createVirtualPageContent(htmlDocument) {
      const virtualPageContent = this.$refs['virtual-document-container']
        .$refs['document-preview-page-content'][0];
      virtualPageContent.innerHTML = htmlDocument;
      return virtualPageContent;
    },
    clearVirtualPageContent(virtualPageContent) {
      virtualPageContent.innerHTML = '';
    },
    getPageElementsChunks(virtualPageContent) {
      let cycleStep = 0;
      const pageElementsChunks = [];
      let currentPageElements = [];
      let virtualPageContentRect = virtualPageContent.getBoundingClientRect();
      for (let i = 0; i < virtualPageContent.children.length; i++) {
        cycleStep++;
        const currentElement = virtualPageContent.children[i];
        const currentElementRect = currentElement.getBoundingClientRect();
        if (cycleStep > pageElementsChunksMaxStep) {
          currentPageElements.push(currentElement);
          continue;
        }
        if (currentElementRect.bottom < virtualPageContentRect.bottom) {
          currentPageElements.push(currentElement);
          continue;
        }
        const {
          elementOnCurrentPage,
          elementOnNextPage,
        } = this.separatePageBreakElement(currentElement, virtualPageContent);
        currentPageElements.forEach(elem => elem.remove());
        currentElement.remove();
        if (!_.isNil(elementOnCurrentPage)) {
          currentPageElements.push(elementOnCurrentPage);
        }
        i -= currentPageElements.length;
        pageElementsChunks.push(currentPageElements);
        currentPageElements = [];
        if (!_.isNil(elementOnNextPage)) {
          virtualPageContent.insertBefore(elementOnNextPage, virtualPageContent.firstChild);
        }
        virtualPageContentRect = virtualPageContent.getBoundingClientRect();
      }
      if (currentPageElements.length > 0) {
        currentPageElements.forEach(elem => elem.remove());
        pageElementsChunks.push(currentPageElements);
      }
      return pageElementsChunks;
    },
    separatePageBreakElement(pageBreakElement, virtualPageContent, deepLevel = 1) {
      const result = {
        elementOnCurrentPage: null,
        elementOnNextPage: null,
      };
      const pageBreakProperties = this.getPageBreakProperties(pageBreakElement);
      const currentPageElements = [];
      const nextPageElements = [];
      if (
        deepLevel > pageBreakElementMaxDeepLevel
        || pageBreakElement.childNodes.length <= 1
        || pageBreakProperties.before
        || !pageBreakProperties.inside
      ) {
        result.elementOnNextPage = pageBreakElement;
        return result;
      }
      const virtualPageContentRect = virtualPageContent.getBoundingClientRect();
      let foundChildPageBreakElement = false;
      let pageBreakAfterPreviousElement = false;
      const tableHeaderGroup = this.findTableHeaderGroup(pageBreakElement);
      for (let i = 0; i < pageBreakElement.childNodes.length; i++) {
        const currentElement = pageBreakElement.childNodes[i];
        if (foundChildPageBreakElement) {
          nextPageElements.push(currentElement);
          continue;
        }
        const currentElementRect = this.getNodeClientRect(currentElement);
        if (_.isNil(currentElementRect)) {
          continue;
        }
        if (
          currentElementRect.height === 0
          || currentElementRect.bottom < virtualPageContentRect.bottom
        ) {
          currentPageElements.push(currentElement);
          continue;
        }
        foundChildPageBreakElement = true;
        const pageBreakPropertiesCurrentElement = this.getPageBreakProperties(currentElement);
        if (
          pageBreakAfterPreviousElement
          || pageBreakPropertiesCurrentElement.before
          || !pageBreakPropertiesCurrentElement.inside
        ) {
          nextPageElements.push(currentElement);
          continue;
        }
        const {
          elementOnCurrentPage: childElementOnCurrentPage,
          elementOnNextPage: childElementOnNextPage,
        } = this.separatePageBreakElement(currentElement, virtualPageContent, deepLevel + 1);
        if (!_.isNil(childElementOnCurrentPage)) {
          currentPageElements.push(childElementOnCurrentPage);
        }
        if (!_.isNil(childElementOnNextPage)) {
          nextPageElements.push(childElementOnNextPage);
        }
        pageBreakAfterPreviousElement = pageBreakPropertiesCurrentElement.after === true;
      }
      [
        result.elementOnCurrentPage,
        result.elementOnNextPage,
      ] = this.cloneRootElement(pageBreakElement, currentPageElements, nextPageElements);
      currentPageElements.forEach(elem => result.elementOnCurrentPage.appendChild(elem));
      if (!_.isNil(tableHeaderGroup)) {
        result.elementOnNextPage.appendChild(tableHeaderGroup.cloneNode(true));
      }
      nextPageElements.forEach(elem => result.elementOnNextPage.appendChild(elem));
      return result;
    },
    getNodeClientRect(nodeElement) {
      let result;
      if (nodeElement.nodeType === Node.TEXT_NODE) {
        const range = document.createRange();
        range.selectNode(nodeElement);
        result = range.getBoundingClientRect();
      } else if (_.isFunction(nodeElement.getBoundingClientRect)) {
        result = nodeElement.getBoundingClientRect();
      }
      return result;
    },
    findTableHeaderGroup(pageBreakElement) {
      const pageBreakElementStyle = getComputedStyle(pageBreakElement);
      if (pageBreakElementStyle.display !== 'table') {
        return null;
      }
      for (const node of pageBreakElement.children) {
        const nodeComputedStyle = getComputedStyle(node);
        if (nodeComputedStyle.display === 'table-header-group') {
          return node;
        }
      }
    },
    getPageBreakProperties(nodeElement) {
      const result = { before: null, after: null, inside: true };
      if (nodeElement.nodeType === Node.TEXT_NODE) {
        return result;
      }
      const nodeElementStyles = getComputedStyle(nodeElement);
      const before = _.get(nodeElementStyles, 'pageBreakBefore', null);
      const after = _.get(nodeElementStyles, 'pageBreakAfter', null);
      const inside = _.get(nodeElementStyles, 'pageBreakInside', null);
      if (before === 'always') {
        result.before = true;
      } else if (before === 'avoid') {
        result.before = false;
      } else {
        result.before = null;
      }
      if (after === 'always') {
        result.after = true;
      } else if (after === 'avoid') {
        result.after = false;
      } else {
        result.after = null;
      }
      result.inside = inside !== 'avoid';
      return result;
    },
    cloneRootElement(pageBreakElement, currentPageElements) {
      const rootElementOnCurrentPage = pageBreakElement.cloneNode();
      const rootElementOnNextPage = pageBreakElement.cloneNode();
      this.makeListStartIndex(pageBreakElement, currentPageElements, rootElementOnNextPage);
      return [rootElementOnCurrentPage, rootElementOnNextPage];
    },
    makeListStartIndex(pageBreakElement, currentPageElements, rootElementOnNextPage) {
      if (pageBreakElement.nodeType !== Node.ELEMENT_NODE || pageBreakElement.tagName.toLowerCase() !== 'ol') {
        return;
      }
      const countLiElements = _.reduce(
        currentPageElements,
        (count, currentPageElement) => (
          currentPageElement.nodeType === Node.ELEMENT_NODE && currentPageElement.tagName.toLowerCase() === 'li'
            ? count + 1
            : count
        ),
        0,
      );
      const currentStartIndex = Number(pageBreakElement.getAttribute('start')) || 1;
      rootElementOnNextPage.setAttribute('start', currentStartIndex + countLiElements);
    },
  },
};
