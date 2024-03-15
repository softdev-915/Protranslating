import _ from 'lodash';
import { lspMixin } from '../../mixins/lsp-mixin';
import {
  primericaOnSiteTemplate,
  primericaRsiTemplate,
  primericaZoomSiTemplate,
  remoteConsecutiveTemplate,
  traditionalTemplate,
  zoomSiTemplate,
} from './custom-field-const';
import { generateExtraFieldsTypes } from '../../utils/template/custom-fields-helper';

export const vatOptions = {
  English: ['Net Total, VAT, TOTAL', 'TOTAL (Incl.VAT)', 'TOTAL (Net of VAT)'],
  German: ['Summe Netto, MwSt., GESAMT', 'GESAMT (Inkl. MwSt.)', 'GESAMT (ohne MwSt.)'],
  Italian: ['Imponible, IVA, TOTALE', 'TOTALE (IVA Inclusa)', 'TOTALE (IVA Esclusa)'],
  Spanish: ['Imponible, IVA, TOTAL', 'TOTAL (IVA Incluido)', 'TOTAL (IVA No Incl.)'],
};

export const customFieldTypesMixin = {
  mixins: [lspMixin],
  computed: {
    quoteEmailCustomFieldTypes() {
      return [
        {
          templateKey: 'cancellationPolicy',
          templatePath: 'emailCustom',
          type: 'text',
          isAvailable: true,
          validateRules: 'required',
        },
        {
          templateKey: 'termsAndConditions',
          templatePath: 'emailCustom',
          type: 'text',
          isAvailable: true,
          validateRules: 'required',
        },
      ];
    },
  },
  methods: {
    getAvailableCustomFieldTypes(customFieldTypes, templateContent) {
      return customFieldTypes.filter(customField => (customField.isAlwaysAvailable ||
        (customField.isAvailable && !_.isNil(templateContent.match(`${customField.templatePath}.${customField.templateKey}`)))
      ));
    },
    quoteTemplateCustomFieldTypes(customFields) {
      const languagesExtra = _.get(customFields, 'languagesExtra', '');
      const componentOptionsForExtras = { toolbar: this.$route.name === 'request-quote-detail' ?
        [
          ['fontname', ['fontname']],
          ['font', ['italic', 'underline', 'clear']],
          ['para', ['ul', 'ol']],
        ] : [
          ['fontname', ['fontname']],
          ['font', ['italic', 'underline', 'clear']],
          ['para', ['ul', 'ol']],
          ['view', ['codeview']],
        ],
      editorOptions: { height: 120 },
      };
      return [
        {
          templateKey: 'memo',
          templatePath: 'custom',
          type: 'text',
          label: 'Memo',
          validateRules: 'required',
          isAvailable: true,
        },
        {
          templateKey: 'audioFeed',
          templatePath: 'custom',
          type: 'text',
          label: 'Audio Feed',
          validateRules: 'required',
          isAvailable: this.isPtiLsp,
        },
        {
          templateKey: 'paymentTerms',
          templatePath: 'custom',
          type: 'text',
          label: 'Payment Terms',
          validateRules: 'required',
          isAvailable: this.isPtiLsp,
        },
        {
          templateKey: 'additionalHours',
          templatePath: 'custom',
          type: 'text',
          label: 'Additional Hours',
          validateRules: 'required',
          isAvailable: this.isPtiLsp,
        },
        {
          templateKey: 'overtime',
          templatePath: 'custom',
          type: 'text',
          label: 'Overtime',
          validateRules: 'required',
          isAvailable: this.isPtiLsp,
        },
        {
          templateKey: 'materialTerms',
          templatePath: 'custom',
          type: 'text',
          label: 'Materials',
          validateRules: 'required',
          isAvailable: this.isPtiLsp,
        },
        {
          templateKey: 'cancellationPolicy',
          templatePath: 'custom',
          type: 'text',
          label: 'Cancellation Policy',
          validateRules: 'required',
          isAvailable: this.isPtiLsp,
        },
        {
          templateKey: 'termsAndConditions',
          templatePath: 'custom',
          type: 'text',
          label: 'Terms and Conditions',
          validateRules: 'required',
          isAvailable: this.isPtiLsp,
        },
        {
          templateKey: 'equipment',
          templatePath: 'custom',
          type: 'text',
          label: 'Equipment',
          validateRules: 'required',
          isAvailable: this.isPtiLsp,
        },
        {
          templateKey: 'setup',
          templatePath: 'custom',
          type: 'text',
          label: 'Setup',
          validateRules: 'required',
          isAvailable: this.isPtiLsp,
        },
        {
          templateKey: 'cancelDate',
          templatePath: 'custom',
          type: 'text',
          validateRules: 'required',
          isAvailable: this.isPtiLsp,
        },
        {
          label: 'Quote Notes',
          templateKey: 'quoteNotes',
          templatePath: 'custom',
          type: 'text-editor',
          isAvailable: true,
        },
        {
          label: 'Number of Words',
          templateKey: 'numberOfWords',
          templatePath: 'custom',
          type: 'text-editor',
          isAvailable: true,
          componentOptions: { toolbar: false, editorOptions: { height: 90 } },
        },
        {
          label: 'Languages Extra',
          templateKey: 'languagesExtra',
          templatePath: 'custom',
          type: 'dropdown',
          isAvailable: true,
          options: ['English', 'French', 'German', 'Italian', 'Spanish'],
          subtitle: 'Extras',
        },
        ...generateExtraFieldsTypes(languagesExtra, componentOptionsForExtras),
        {
          label: 'Terms and Conditions',
          templateKey: 'quoteTermsAndConditions',
          templatePath: 'custom',
          type: 'text-editor',
          isAvailable: true,
        },
        {
          label: 'Terms and Conditions',
          templateKey: 'selectableTermsAndConditions',
          templatePath: 'custom',
          type: 'selectable-text-editor',
          validateRules: 'required',
          isAvailable: true,
          componentOptions: {
            getDefaultOptions: () => ([
              {
                type: 'Primerica On Site',
                value: primericaOnSiteTemplate,
              },
              {
                type: 'Primerica RSI',
                value: primericaRsiTemplate,
              },
              {
                type: 'Primerica Zoom SI',
                value: primericaZoomSiTemplate,
              },
              {
                type: 'Remote Consecutive',
                value: remoteConsecutiveTemplate,
              },
              {
                type: 'Traditional',
                value: traditionalTemplate,
              },
              {
                type: 'Zoom SI',
                value: zoomSiTemplate,
              },
            ]),
          },
        },
      ];
    },
    invoiceTemplateCustomFieldTypes(customFields) {
      const language = _.get(customFields, 'language', '');
      const vatOptionsForTotalAmount = _.get(customFields, 'vatOptionsForTotalAmount', '');
      const vatOptionsForSelectedLanguage = _.get(vatOptions, `${language}`, []);
      return [
        {
          label: 'Rates',
          templateKey: 'rates',
          templatePath: 'custom',
          type: 'button-group',
          isAvailable: this.isPtiLsp || this.isBlsLsp,
          options: ['2 decimals', '3 decimals', '4 decimals'],
        },
        {
          label: 'Recipient',
          templateKey: 'recipient',
          templatePath: 'custom',
          type: 'input',
          isAvailable: this.isBlsLsp,
          placeholder: 'John Smith',
        },
        {
          label: 'Language',
          templateKey: 'language',
          templatePath: 'custom',
          type: 'button-group',
          isAvailable: true,
          options: ['English', 'German', 'Italian', 'Spanish'],
          onChange: (languageValue, customFieldsValues) => {
            customFieldsValues.vatOptionsForTotalAmount = vatOptions[languageValue][0];
          },
        },
        {
          label: 'VAT Options for Total Amount',
          templateKey: 'vatOptionsForTotalAmount',
          templatePath: 'custom',
          type: 'button-group',
          isAvailable: true,
          options: vatOptionsForSelectedLanguage,
        },
        {
          label: 'VAT Rate',
          templateKey: 'vatRate',
          templatePath: 'custom',
          type: 'dropdown',
          isAvailable: vatOptionsForTotalAmount === vatOptionsForSelectedLanguage[0] ||
            vatOptionsForTotalAmount === vatOptionsForSelectedLanguage[1],
          options: ['19%', '21%', '22%', '0%'],
          columnSize: 'col-6',
        },
        {
          label: 'VAT Amount',
          templateKey: 'vatAmount',
          templatePath: 'custom',
          type: 'input',
          isAvailable: vatOptionsForTotalAmount === vatOptionsForSelectedLanguage[0] ||
          vatOptionsForTotalAmount === vatOptionsForSelectedLanguage[1],
          columnSize: 'col-6',
          readOnly: true,
        },
        {
          label: 'External Accounting Code Label',
          templateKey: 'externalAccountingCodeLabel',
          templatePath: 'custom',
          type: 'input',
          isAvailable: true,
          placeholder: 'Examples: Budget Code, GL Code',
          canHideField: true,
        },
      ];
    },
  },
};
