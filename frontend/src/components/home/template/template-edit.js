import _ from 'lodash';
import { mapActions, mapGetters } from 'vuex';
import { hasRole } from '../../../utils/user';
import { toSelectOptionFormat } from '../../../utils/select2';
import { entityEditMixin } from '../../../mixins/entity-edit';
import { customFieldTypesMixin } from '../../report-preview/custom-field-types-mixin';
import RichTextEditor from '../../rich-text-editor/rich-text-editor.vue';
import VariablesReference from '../../template-editor/variables-reference/variables-reference.vue';
import FooterTemplateAjaxBasicSelect from '../footer-template/footer-template-ajax-basic-select.vue';
import TemplateLogoAjaxSelect from './template-logo-ajax-select.vue';
import TemplateCustomFieldList from './template-custom-field-list.vue';
import TemplateService from '../../../services/template-service';
import FooterTemplateService from '../../../services/footer-template-service';
import { formattedExtraFields } from '../../../utils/template/custom-fields-helper';

const QUOTE_EMAIL_TYPE = 'Quote Email';
const QUOTE_TYPE = 'Quote';
const INVOICE_TYPE = 'Invoice';
const templateService = new TemplateService();
const footerTemplateService = new FooterTemplateService();
const buildInitialState = () => ({
  richTextEditorOptions: {
    height: 700,
  },
  loading: false,
  sanitizingTemplate: false,
  templateError: null,
  selectedLogoOption: null,
  footerTemplateOptions: [],
  template: {
    _id: '',
    name: '',
    type: '',
    template: '',
    footerTemplate: null,
    logoName: 'BIG Language Solutions_logo.svg',
    variables: {
      path: 'https://portal.protranslating.com/',
      lspLogo: 'lsp logo',
      templateLogo: '/static/lspLogos/BIG Language Solutions_logo.svg',
      request: {
        _id: 'request-id',
        no: 'R-789653',
        catTool: 'MemoQ',
        projectedCostTotal: 0,
        projectedCostGp: 0,
        foreignProjectedCostTotal: 0,
        billTotal: 0,
        billGp: 0,
        foreignBillTotal: 0,
        invoiceTotal: 0,
        foreignInvoiceTotal: 0,
        contact: '{{ username request.contact }}',
        schedulingCompany: {
          name: 'ACME',
        },
        schedulingContact: {
          firstName: 'John',
          lastName: 'Doe 3',
        },
        company: {
          name: 'Company',
          billingInformation: {
            quoteCurrency: {
              isoCode: 'USD',
            },
          },
          billingAddress: {
            city: 'Miami',
            state: {
              name: 'Florida',
            },
            country: {
              name: 'United states',
            },
            zip: '669',
          },
          addressInformation: {
            city: 'Miami',
            state: {
              name: 'Florida',
            },
            country: {
              name: 'United states',
            },
            zip: '669',
          },
        },
        externalAccountingCode: {
          _id: null,
          name: '',
        },
        otherContact: {
          firstName: 'Alice',
          lastName: 'Doe',
        },
        receptionDate: new Date(),
        title: 'New translation request',
        deliveryDate: new Date(),
        comments: 'Translation request comment',
        otherCC: 'another_email@lsp.com',
        status: 'Request status',
        location: {
          name: 'Location',
        },
        finalDocuments: [{
          deleted: false,
          final: false,
          isReference: false,
          name: 'final document name',
        }],
        documents: [{
          deleted: false,
          final: false,
          isReference: false,
          name: 'document name',
        }],
        languageCombinations: [{
          srcLangs: [{
            name: 'English',
            isoCode: 'ENG',
          }],
          tgtLangs: [{
            name: 'Spanish',
            isoCode: 'SPA',
          }],
        }],
        requireQuotation: false,
        createdAt: new Date(),
        createdBy: new Date(),
        quoteDueDate: new Date(),
        expectedQuoteCloseDate: new Date(),
        deliveryMethod: {
          name: 'delivery method 01',
        },
        documentTypes: [{
          name: 'Excel',
        }],
        internalDepartment: 'department01',
        repSignOff: false,
        late: false,
        rush: false,
        departmentNotes: '',
        salesRep: '{{ username request.salesRep }}',
        turnaroundTime: '3 business days',
        softwareRequirements: [{
          name: 'Software requirement 01',
        }],
        projectManagers: [{
          email: 'pmEmail@sample.com',
          firstName: 'PM',
          lastName: 'last name',
          middleName: 'middle name',
        }],
        workflowTotals: {
          invoice: 231,
          projectedCost: 0,
        },
        invoices: [{
          rate: 0,
          quantity: 0,
          total: 0,
          unitPrice: 0,
          workflow: {
            srcLang: {
              name: 'Spanish',
            },
            tgtLang: {
              name: 'English',
            },
            subtotal: 'Workflow subtotal',
          },
          task: {
            ability: 'Translation',
            description: 'task description',
          },
        }],
        workflows: [{
          description: 'workflow description',
          discount: 5,
          subtotal: 288,
          language: {
            isoCode: 'ISO3',
            name: 'workflow target language',
          },
          tasks: [{
            ability: 'ability01',
            description: 'task description',
            minCharge: 0,
            total: 0,
            invoiceDetails: [{
              invoice: {
                breakdown: {
                  name: 'fuzzy01',
                },
                quantity: 10,
                total: 303,
                foreignUnitPrice: 0,
                translationUnit: {
                  name: 'Words',
                },
                unitPrice: 0.1,
              },
            }],
            foreignTotal: 0,
          }],
          workflowDueDate: new Date(),
        }],
      },
    },
    customFields: {
      memo: '',
      audioFeed: '',
      receiverDistribution: '',
      paymentTerms: '',
      termsAndConditions: '',
      overtime: '',
      materialTerms: '',
      setup: '',
      equipment: '',
      cancelDate: '',
      cancellationPolicy: '',
      additionalHours: '',
      quoteNotes: '',
      numberOfWords: '',
      languagesExtra: '',
      ...formattedExtraFields,
      quoteTermsAndConditions: '',
      selectableTermsAndConditions: {
        type: '',
        value: '',
        options: [],
      },
      rates: '2 decimals',
      recipient: '',
      language: 'English',
      vatOptionsForTotalAmount: 'Net Total, VAT, TOTAL',
      vatRate: '22%',
      vatAmount: '0.00',
      externalAccountingCodeLabel: '',
    },
    emailCustomFields: {
      paymentTerms: '',
      cancellationPolicy: '',
      termsAndConditions: '',
    },
    groupTaskItemsPerWorkflow: false,
    hideCustomSaveToTemplate: false,
    hiddenFields: [],
    hideableFields: [],
  },
  areValidCustomFields: false,
});

export default {
  mixins: [entityEditMixin, customFieldTypesMixin],
  components: {
    RichTextEditor,
    VariablesReference,
    FooterTemplateAjaxBasicSelect,
    TemplateLogoAjaxSelect,
    TemplateCustomFieldList,
  },
  data() {
    return buildInitialState();
  },
  created() {
    this.typeOptions = [QUOTE_EMAIL_TYPE, 'Invoice Email', QUOTE_TYPE, INVOICE_TYPE, 'Generic Email', 'Bill'].map(toSelectOptionFormat);
    this.retrieveFooterTemplateOptions();
  },
  watch: {
    'template.type'(newValue) {
      if (newValue === QUOTE_EMAIL_TYPE) {
        _.unset(this.template.variables, 'customFields');
        const emailCustomFields = {
          termsAndConditions: '',
          cancellationPolicy: '',
        };
        this.$set(this.template.variables, 'emailCustomFields', emailCustomFields);
      } else if (newValue === QUOTE_TYPE) {
        _.unset(this.template.variables, 'emailCustomFields');
        const customFields = {
          termsAndConditions: '',
          paymentTerms: '',
          memo: '',
        };
        if (this.isPtiLsp) {
          Object.assign(customFields, {
            receiverDistribution: '',
            audioFeed: '',
          });
        }
        this.$set(this.template.variables, 'customFields', customFields);
      }
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged', 'lsp']),
    ...mapGetters('template', ['templateClipboard']),
    isNew() {
      return _.isEmpty(this, 'template._id', '');
    },
    entityName() {
      return 'template';
    },
    canEdit() {
      return hasRole(this.userLogged, 'TEMPLATE_UPDATE_ALL');
    },
    hasTemplateInClipboard() {
      return !_.isEmpty(this.templateClipboard);
    },
    isValid() {
      return this.customFieldData.types.length === 0 || this.areValidCustomFields;
    },
    selectedType() {
      return toSelectOptionFormat(this.template.type);
    },
    isTemplateQuoteType() {
      return this.template.type === QUOTE_TYPE;
    },
    isTemplateInvoiceType() {
      return this.template.type === INVOICE_TYPE;
    },
    customFieldData() {
      let label;
      let types;
      switch (this.template.type) {
        case QUOTE_TYPE:
          types = this.quoteTemplateCustomFieldTypes(this.template.customFields);
          label = 'Quote Custom Fields';
          break;
        case INVOICE_TYPE:
          types = this.invoiceTemplateCustomFieldTypes(this.template.customFields);
          label = 'Invoice Custom Fields';
          break;
        case QUOTE_EMAIL_TYPE:
          types = this.quoteEmailCustomFieldTypes;
          label = 'Email Custom Fields';
          break;
        default:
          label = '';
          types = [];
      }
      types = this.getAvailableCustomFieldTypes(types, this.template.template);
      return { label, types };
    },
    customFieldValues: {
      get() {
        return this.template.type === QUOTE_EMAIL_TYPE
          ? this.template.emailCustomFields
          : this.template.customFields;
      },
      set(newValue) {
        if (this.template.type === QUOTE_EMAIL_TYPE) {
          this.template.emailCustomFields = newValue;
        } else {
          this.template.customFields = newValue;
        }
      },
    },
    selectedFooterTemplate() {
      const selectedFooterTemplate = this.footerTemplateOptions
        .find(option => option._id === this.template.footerTemplate);
      return _.get(selectedFooterTemplate, 'description');
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    ...mapActions('template', ['copyTemplateContent']),
    _service() {
      return templateService;
    },
    _handleEditResponse(response) {
      const newReadDate = _.get(response, 'data.template.readDate');
      if (newReadDate) {
        this.template.readDate = newReadDate;
      }
    },
    _handleRetrieve(response) {
      this.template = response.data.template;
      this.selectedLogoOption = { value: this.template.logoName };
    },
    _refreshEntity(freshEntity) {
      this.$set(this, 'template', freshEntity);
    },
    _handleCreate(response) {
      this.template._id = response.data.template._id;
    },
    onTemplateError(templateError) {
      this.templateError = templateError;
      this.pushNotification({
        title: 'Error parsing template',
        message: 'Could not parse the template. Please check for errors',
        state: 'error',
      });
    },
    onTemplateSanitizing(sanitizing) {
      this.sanitizingTemplate = sanitizing;
    },
    save() {
      if (_.isNil(this.templateError) && _.isEmpty(this.error) && this.isValid) {
        this._save(this.template);
      }
    },
    copyTemplate() {
      const template = _.pick(this.template, ['template']);
      this.copyTemplateContent(template).then(() => {
        this.pushNotification({
          title: 'Copied',
          message: 'The template has been copied',
          state: 'info',
        });
      });
    },
    pasteTemplate() {
      if (!_.isEmpty(this.templateClipboard)) {
        _.forEach(_.keys(this.templateClipboard), (k) => {
          this.$set(this.template, k, this.templateClipboard[k]);
        });
      }
    },
    onTypeSelect(newValue) {
      this.template.type = _.get(newValue, 'text');
    },
    async retrieveFooterTemplateOptions() {
      if (hasRole(this.userLogged, 'FOOTER-TEMPLATE_READ_ALL')) {
        const footerTemplateOptions = await footerTemplateService.retrieve();
        this.footerTemplateOptions = _.get(footerTemplateOptions, 'data.list', []);
      }
    },
    onLogoNameSelected(option) {
      this.selectedLogoOption = option;
      this.template.logoName = _.get(option, 'value');
    },
    setValidCustomFields(isValid) {
      this.areValidCustomFields = isValid;
    },
    setHiddenFields(newValue) {
      this.template.hiddenFields = newValue;
    },
    setHideableFields(newValue) {
      this.template.hideableFields = newValue;
    },
  },
};
