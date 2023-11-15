import Home from './components/home/home.js';
import SideBar from './components/side-bar/side-bar.vue';
import Header from './components/app-header/app-header.vue';

const Login = () => import('./components/login/login.vue');
const ForgotPassword = () => import('./components/login/password/forgot-password.vue');
const ResetPassword = () => import('./components/login/reset/reset-password.vue');
const ChangePassword = () => import('./components/home/settings/change-password/change-password.vue');
const TwoFactorAuthSettings = () => import('./components/home/settings/two-factor-authentification/settings.vue');
const UISettings = () => import('./components/home/settings/ui-settings/index.vue');
const MockSamlRedirect = () => import('./components/mock-saml-redirect/mock-saml-redirect.vue');
const Lsp = () => import('./components/home/lsp/index.vue');
const LspSettings = () => import('./components/home/lsp/lsp-settings.vue');
const ListRequest = () => import('./components/home/list-request/index.vue');
const RequestQuote = () => import('./components/home/list-request/request-quote.vue');
const RequestFilesStatistics = () => import('./components/home/list-request/request-files-statistics.vue');
const RequestInlineEdit = () => import('./components/home/list-request/request-inline-edit.vue');
const RequestInlineGrid = () => import('./components/home/list-request/request-inline-grid.vue');
const Quotes = () => import('./components/home/quote/index.vue');
const QuoteGrid = () => import('./components/home/quote/quote-grid.vue');
const ListNotification = () => import('./components/home/list-notification/index.vue');
const ListNotificationGrid = () => import('./components/home/list-notification/notification-grid.vue');
const ListNotificationDetail = () => import('./components/home/list-notification/notification-detail.vue');
const ListNotificationAdvancedSettings = () => import(
  './components/home/list-notification/notification-advanced-settings.vue'
);
const Audit = () => import('./components/home/audit/index.vue');
const TaskManagement = () => import('./components/home/task-management/index.vue');
const TaskManagementList = () => import('./components/home/task-management/list-task.vue');
const Task = () => import('./components/home/task-grid/index.vue');
const TaskGrid = () => import('./components/home/task-grid/task-grid.vue');
const User = () => import('./components/home/user/index.vue');
const UserGrid = () => import('./components/home/user/user-grid.vue');
const UserEdit = () => import('./components/home/user/user-edit.vue');
const UserProfileImage = () => import('./components/home/user/profile-image/profile-image.vue');
const Group = () => import('./components/home/group/index.vue');
const GroupGrid = () => import('./components/home/group/group-grid.vue');
const GroupEdition = () => import('./components/home/group/group-edit.vue');
const Scheduler = () => import('./components/home/scheduler/index.vue');
const SchedulerGrid = () => import('./components/home/scheduler/scheduler-grid.vue');
const SchedulerEdit = () => import('./components/home/scheduler/scheduler-edit.vue');
const Company = () => import('./components/home/company/index.vue');
const CompanyGrid = () => import('./components/home/company/company-grid.vue');
const CompanyEdit = () => import('./components/home/company/company-edit.vue');
const Ability = () => import('./components/home/user/ability/index.vue');
const AbilityGrid = () => import('./components/home/user/ability/ability-grid.vue');
const AbilityEdit = () => import('./components/home/user/ability/ability-edit.vue');
const BasicCatToolContainer = () => import('./components/home/basic-cat-tool/index.vue');
const BasicCatTool = () => import('./components/home/basic-cat-tool/basic-cat-tool.vue');
const CatTool = () => import('./components/home/user/cat-tool/index.vue');
const CatToolGrid = () => import('./components/home/user/cat-tool/cat-tool-grid.vue');
const CatToolEdit = () => import('./components/home/user/cat-tool/cat-tool-edit.vue');
const CompetenceLevel = () => import('./components/home/user/competence-level/index.vue');
const CompetenceLevelGrid = () => import('./components/home/user/competence-level/competence-level-grid.vue');
const CompetenceLevelEdit = () => import('./components/home/user/competence-level/competence-level-edit.vue');
const Activity = () => import('./components/home/user/activity/index.vue');
const RequestActivityGrid = () => import('./components/home/list-request/activity/activity-grid.vue');
const RequestActivityEdit = () => import('./components/home/list-request/activity/activity-edit.vue');
const ActivityGrid = () => import('./components/home/user/activity/activity-grid.vue');
const ActivityEdit = () => import('./components/home/user/activity/activity-edit.vue');
const ActivityTag = () => import('./components/home/user/activity/tag/index.vue');
const ActivityTagGrid = () => import('./components/home/user/activity/tag/activity-tag-grid.vue');
const ActivityTagEdit = () => import('./components/home/user/activity/tag/activity-tag-edit.vue');
const Toast = () => import('./components/home/toast/index.vue');
const ToastGrid = () => import('./components/home/toast/toast-grid.vue');
const ToastEdit = () => import('./components/home/toast/toast-edit.vue');
const RequestType = () => import('./components/home/request/request-type/index.vue');
const RequestTypeGrid = () => import('./components/home/request/request-type/request-type-grid.vue');
const RequestTypeEdit = () => import('./components/home/request/request-type/request-type-edit.vue');
const SchedulingStatus = () => import('./components/home/request/scheduling-status/index.vue');
const SchedulingStatusGrid = () => import('./components/home/request/scheduling-status/scheduling-status-grid.vue');
const SchedulingStatusEdit = () => import('./components/home/request/scheduling-status/scheduling-status-edit.vue');
const Currency = () => import('./components/home/currency/index.vue');
const CurrencyGrid = () => import('./components/home/currency/currency-grid.vue');
const CurrencyEdit = () => import('./components/home/currency/currency-edit.vue');
const TranslationUnit = () => import('./components/home/translation-unit/index.vue');
const TranslationUnitGrid = () => import('./components/home/translation-unit/translation-unit-grid.vue');
const TranslationUnitEdit = () => import('./components/home/translation-unit/translation-unit-edit.vue');
const InternalDepartment = () => import('./components/home/internal-department/index.vue');
const InternalDepartmentGrid = () => import('./components/home/internal-department/internal-department-grid.vue');
const InternalDepartmentEdit = () => import('./components/home/internal-department/internal-department-edit.vue');
const PaymentMethod = () => import('./components/home/payment-method/index.vue');
const PaymentMethodGrid = () => import('./components/home/payment-method/payment-method-grid.vue');
const PaymentMethodEdit = () => import('./components/home/payment-method/payment-method-edit.vue');
const LeadSource = () => import('./components/home/lead-source/index.vue');
const LeadSourceGrid = () => import('./components/home/lead-source/lead-source-grid.vue');
const LeadSourceEdit = () => import('./components/home/lead-source/lead-source-edit.vue');
const TaxForm = () => import('./components/home/user/tax-form/index.vue');
const TaxFormGrid = () => import('./components/home/user/tax-form/tax-form-grid.vue');
const TaxFormEdit = () => import('./components/home/user/tax-form/tax-form-edit.vue');
const BillingTerm = () => import('./components/home/billing-term/index.vue');
const BillingTermGrid = () => import('./components/home/billing-term/billing-term-grid.vue');
const BillingTermEdit = () => import('./components/home/billing-term/billing-term-edit.vue');
const Breakdown = () => import('./components/home/breakdown/index.vue');
const BreakdownGrid = () => import('./components/home/breakdown/breakdown-grid.vue');
const BreakdownEdit = () => import('./components/home/breakdown/breakdown-edit.vue');
const Language = () => import('./components/home/user/language/index.vue');
const LanguageGrid = () => import('./components/home/user/language/language-grid.vue');
const LanguageEdit = () => import('./components/home/user/language/language-edit.vue');
const Opportunity = () => import('./components/home/opportunity/index.vue');
const OpportunityGrid = () => import('./components/home/opportunity/opportunity-grid.vue');
const OpportunityEdit = () => import('./components/home/opportunity/opportunity-edit.vue');
const AssignmentStatus = () => import('./components/home/assignment-status/index.vue');
const AssignmentStatusGrid = () => import('./components/home/assignment-status/assignment-status-grid.vue');
const AssignmentStatusEdit = () => import('./components/home/assignment-status/assignment-status-edit.vue');
const CompanyMinimumCharge = () => import('./components/home/company-minimum-charge/index.vue');
const CompanyMinimumChargeGrid = () => import(
  './components/home/company-minimum-charge/company-minimum-charge-grid.vue'
);
const CompanyMinimumChargeEdit = () => import(
  './components/home/company-minimum-charge/company-minimum-charge-edit.vue'
);
const DocumentType = () => import('./components/home/list-request/document-type/index.vue');
const DocumentTypeGrid = () => import('./components/home/list-request/document-type/document-type-grid.vue');
const DocumentTypeEdit = () => import('./components/home/list-request/document-type/document-type-edit.vue');
const DeliveryMethod = () => import('./components/home/list-request/delivery-method/index.vue');
const DeliveryMethodGrid = () => import('./components/home/list-request/delivery-method/delivery-method-grid.vue');
const DeliveryMethodEdit = () => import('./components/home/list-request/delivery-method/delivery-method-edit.vue');
const SoftwareRequirement = () => import('./components/home/list-request/software-requirement/index.vue');
const SoftwareRequirementGrid = () => import(
  './components/home/list-request/software-requirement/software-requirement-grid.vue'
);
const SoftwareRequirementEdit = () => import(
  './components/home/list-request/software-requirement/software-requirement-edit.vue'
);
const Template = () => import('./components/home/template/index.vue');
const TemplateGrid = () => import('./components/home/template/template-grid.vue');
const TemplateEdit = () => import('./components/home/template/template-edit.vue');
const Location = () => import('./components/home/location/index.vue');
const LocationGrid = () => import('./components/home/location/location-grid.vue');
const LocationEdit = () => import('./components/home/location/location-edit.vue');
const ExternalResource = () => import('./components/home/external-resources/index.vue');
const Certification = () => import('./components/home/user/certification/index.vue');
const CertificationGrid = () => import('./components/home/user/certification/certification-grid.vue');
const CertificationEdit = () => import('./components/home/user/certification/certification-edit.vue');
const GetFile = () => import('./components/get-file/get-file.vue');
const PortalCat = () => import('./components/home/portalcat/index.vue');
const MemoryEditor = () => import('./components/home/portalcat/memory-editor/index.vue');
const CustomQuery = () => import('./components/home/custom-query/index.vue');
const CustomQueryGrid = () => import('./components/home/custom-query/custom-query-grid.vue');
const CustomQueryEdit = () => import('./components/home/custom-query/custom-query-edit.vue');
const ExpenseAccount = () => import('./components/home/expense-account/index.vue');
const ExpenseAccountGrid = () => import('./components/home/expense-account/expense-account-grid.vue');
const ExpenseAccountEdit = () => import('./components/home/expense-account/expense-account-edit.vue');
const AbilityExpenseAccount = () => import('./components/home/ability-expense-account/index.vue');
const AbilityExpenseAccountGrid = () => import(
  './components/home/ability-expense-account/ability-expense-account-grid.vue'
);
const AbilityExpenseAccountEdit = () => import(
  './components/home/ability-expense-account/ability-expense-account-edit.vue'
);
const CompanyDepartmentRelationship = () => import(
  './components/home/company-department-relationship/index.vue'
);
const CompanyDepartmentRelationshipGrid = () => import(
  './components/home/company-department-relationship/company-department-relationship-grid.vue'
);
const CompanyDepartmentRelationshipEdit = () => import(
  './components/home/company-department-relationship/company-department-relationship-edit.vue'
);
const Invoice = () => import('./components/home/ar-invoice/index.vue');
const InvoiceGrid = () => import('./components/home/ar-invoice/ar-invoice-grid.vue');
const InvoiceEdit = () => import('./components/home/ar-invoice/ar-invoice-edit.vue');
const InvoicePreview = () => import('./components/home/ar-invoice/invoice-preview/invoice-preview.vue');
const Adjustments = () => import('./components/home/ar-adjustments/index.vue');
const AdjustmentsGrid = () => import('./components/home/ar-adjustments/ar-adjustment-grid.vue');
const AdjustmentEdit = () => import('./components/home/ar-adjustments/ar-adjustment-edit.vue');
const Advances = () => import('./components/home/ar-advances/index.vue');
const AdvancesGrid = () => import('./components/home/ar-advances/ar-advances-grid.vue');
const AdvanceEdit = () => import('./components/home/ar-advances/ar-advance-edit.vue');
const Payments = () => import('./components/home/ar-payments/index.vue');
const PaymentsGrid = () => import('./components/home/ar-payments/ar-payment-grid.vue');
const PaymentEdit = () => import('./components/home/ar-payments/ar-payment-edit.vue');
const Connector = () => import('./components/home/connector/index.vue');
const ConnectorGrid = () => import('./components/home/connector/connector-grid.vue');
const ConnectorEdit = () => import('./components/home/connector/connector-edit.vue');
const Bill = () => import('./components/home/bill/index.vue');
const BillGrid = () => import('./components/home/bill/bill-grid.vue');
const BillEdit = () => import('./components/home/bill/bill-edit.vue');
const BillAdjustment = () => import('./components/home/bill-adjustment/index.vue');
const BillAdjustmentGrid = () => import('./components/home/bill-adjustment/bill-adjustment-grid.vue');
const BillAdjustmentEdit = () => import('./components/home/bill-adjustment/bill-adjustment-edit.vue');
const BillAdjustmentDetails = () => import('./components/home/bill-adjustment/bill-adjustment-details.vue');
const RevenueAccounts = () => import('./components/home/revenue-accounts/index.vue');
const RevenueAccountsGrid = () => import('./components/home/revenue-accounts/revenue-accounts-grid.vue');
const RevenueAccountEdit = () => import('./components/home/revenue-accounts/revenue-account-edit.vue');
const CcPayments = () => import('./components/home/cc-payments/index.vue');
const CcPaymentsGrid = () => import('./components/home/cc-payments/cc-payments-grid.vue');
const BankAccount = () => import('./components/home/bank-account/index.vue');
const BankAccountGrid = () => import('./components/home/bank-account/bank-account-grid.vue');
const BankAccountEdit = () => import('./components/home/bank-account/bank-account-edit.vue');
const IPQuoteEpoCreate = () => import('./components/home/ip-quote/epo-create.vue');
const IPOrderEpoCreate = () => import('./components/home/ip-order/create.vue');
const ApPayment = () => import('./components/home/ap-payment/index.vue');
const ApPaymentGrid = () => import('./components/home/ap-payment/ap-payment-grid.vue');
const ApPaymentDetails = () => import('./components/home/ap-payment/ap-payment-details.vue');
const ApPaymentEdit = () => import('./components/home/ap-payment/ap-payment-edit.vue');
const ApPrintChecks = () => import('./components/home/ap-print-checks/index.vue');
const ApPrintChecksDetails = () => import('./components/home/ap-print-checks/ap-print-checks-details.vue');
const VendorMinimumCharge = () => import('./components/home/vendor-minimum-charge/index.vue');
const VendorMinimumChargeGrid = () => import('./components/home/vendor-minimum-charge/vendor-minimum-charge-grid.vue');
const VendorMinimumChargeEdit = () => import('./components/home/vendor-minimum-charge/vendor-minimum-charge-edit.vue');
const IPOrder = () => import('./components/home/ip-order/index.vue');
const IPOrderGrid = () => import('./components/home/ip-order/grid.vue');
const IPQuote = () => import('./components/home/ip-quote/index.vue');
const IPQuoteGrid = () => import('./components/home/ip-quote/grid.vue');
const IPQuoteCreate = () => import('./components/home/ip-quote/create.vue');
const IPQuoteCreateNoDB = () => import('./components/home/ip-quote/nodb/nodb.vue');
const IPQuoteCreateNoDBFiling = () => import('./components/home/ip-quote/nodb-filing/nodb.vue');
const IPOrderCreateNoDB = () => import('./components/home/ip-order/nodb/nodb.vue');
const IPOrderCreateNoDBFiling = () => import('./components/home/ip-order/nodb-filing/nodb.vue');
const IPOrderWipoCreate = () => import('./components/home/ip-quote/create.vue');
const MtEngines = () => import('./components/home/mt-engines/index.vue');
const MtEnginesGrid = () => import('./components/home/mt-engines/mt-engines-grid.vue');
const MtEnginesEdit = () => import('./components/home/mt-engines/mt-engines-edit.vue');
const MtModel = () => import('./components/home/mt-model/index.vue');
const MtModelGrid = () => import('./components/home/mt-model/mt-model-grid.vue');
const MtModelEdit = () => import('./components/home/mt-model/mt-model-edit.vue');
const MtTranslator = () => import('./components/home/mt-translator/mt-translator.vue');
const VendorDashboard = () => import('./components/home/vendor-dashboard/index.vue');
const ContactDashboard = () => import('./components/home/contact-dashboard/index.vue');
const ImportEntities = () => import('./components/home/import-entities/index.vue');
const BillPreview = () => import('./components/home/bill/bill-preview/bill-preview.vue');
const CompromisedPassword = () => import('./components/home/compromised-password/index.vue');
const CompromisedPasswordGrid = () => import('./components/home/compromised-password/compromised-password-grid.vue');
const ProviderPoolingOfferGrid = () => import('./components/home/provider-pooling-offer/ppo-grid.vue');
const ProviderPoolingOfferDashboard = () => import('./components/home/provider-pooling-offer/index.vue');
const RequestProviderPoolingOffer = () => import('./components/home/list-request/request-provider-pooling-offer.vue');
const ActiveUserSessions = () => import('./components/home/active-user-sessions/index.vue');
const ProviderInstructions = () => import('./components/home/provider-instructions/index.vue');
const ProviderInstructionsGrid = () => import('./components/home/provider-instructions/provider-instructions-grid.vue');
const ProviderInstructionsEdit = () => import('./components/home/provider-instructions/provider-instructions-edit.vue');
const FooterTemplate = () => import('./components/home/footer-template/index.vue');
const FooterTemplateGrid = () => import('./components/home/footer-template/footer-template-grid.vue');
const FooterTemplateEdit = () => import('./components/home/footer-template/footer-template-edit.vue');
const CompanyExternalAccountingCodes = () => import('./components/home/company-external-accounting-codes/index.vue');
const CompanyExternalAccountingCodesGrid = () => import('./components/home/company-external-accounting-codes/company-external-accounting-codes-grid.vue');
const CompanyExternalAccountingCodesEdit = () => import('./components/home/company-external-accounting-codes/company-external-accounting-codes-edit.vue');
const ServiceType = () => import('./components/home/service-type/index.vue');
const ServiceTypeEdit = () => import('./components/home/service-type/service-type-edit.vue');
const DeliveryType = () => import('./components/home/delivery-type/index.vue');
const DeliveryTypeGrid = () => import('./components/home/delivery-type/delivery-type-grid.vue');
const DeliveryTypeEdit = () => import('./components/home/delivery-type/delivery-type-edit.vue');
const IpInstructionsDeadline = () => import('./components/home/ip-instructions-deadline/index.vue');
const IpInstructionsDeadlineGrid = () => import('./components/home/ip-instructions-deadline/ip-instructions-deadline-grid.vue');
const IpInstructionsDeadlineEdit = () => import('./components/home/ip-instructions-deadline/ip-instructions-deadline-edit.vue');
const ServiceTypeGrid = () => import('./components/home/service-type/service-type-grid.vue');

export const routes = [
  {
    path: '/login',
    name: 'login',
    components: {
      login: Login,
    },
    meta: { analytics: 'login', public: true },
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    props: true,
    components: {
      login: ForgotPassword,
    },
    meta: { analytics: 'forgot-password', public: true },
  },
  {
    path: '/reset-password',
    name: 'reset-password',
    components: {
      login: ResetPassword,
    },
    meta: { analytics: 'reset-password', public: true },
  },
  {
    path: '/get-file',
    name: 'get-file',
    component: GetFile,
    meta: { analytics: 'get-file', standaloneRoute: true },
  },
  {
    path: '/home',
    name: 'home',
    components: {
      default: Home,
      sidebar: SideBar,
      header: Header,
    },
    meta: { analytics: 'home' },
  },
  {
    path: '/change-password',
    name: 'change-password',
    components: {
      default: ChangePassword,
      sidebar: SideBar,
      header: Header,
    },
    meta: { analytics: 'change-password' },
  },
  {
    path: '/2fa-settings',
    name: 'two-factor-authentification-settings',
    components: {
      default: TwoFactorAuthSettings,
      sidebar: SideBar,
      header: Header,
    },
    meta: { analytics: 'edit-2fa-settings' },
  },
  {
    path: '/ui-settings',
    name: 'ui-settings',
    components: {
      default: UISettings,
      sidebar: SideBar,
      header: Header,
    },
    meta: { analytics: 'ui-settings' },
  },
  {
    path: '/quotes',
    components: {
      default: Quotes,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'quote-list',
        component: QuoteGrid,
        meta: {
          analytics: 'quote-list',
          role: {
            oneOf: ['QUOTE_READ_ALL', 'QUOTE_READ_OWN', 'QUOTE_READ_COMPANY'],
            family: 'quotes',
          },
        },
      },
      {
        path: ':requestId/details/quote',
        name: 'quote-quote-detail',
        component: RequestQuote,
        props: true,
        meta: {
          analytics: 'quote',
          role: 'REQUEST_CREATE_OWN',
          family: 'quotes',
        },
      },
      {
        path: 'create',
        name: 'create-quote',
        component: RequestInlineEdit,
        props: true,
        meta: {
          analytics: 'quote-create',
          role: 'REQUEST_CREATE_OWN',
          family: 'quotes',
        },
      },
      {
        path: ':requestId/details',
        name: 'quote-edition',
        component: RequestInlineEdit,
        props: true,
        meta: {
          analytics: 'quote-edit',
          role: 'REQUEST_CREATE_OWN',
          family: 'quotes',
        },
      },
      {
        path: ':requestId/details/statistics',
        name: 'quote-files-statistics',
        component: RequestFilesStatistics,
        props: true,
        meta: {
          analytics: 'quote-files-statistics',
          family: 'quotes',
        },
      },
      {
        path: ':requestId/portal-cat',
        name: 'quote-task-portalcat',
        components: {
          portalcat: PortalCat,
        },
        props: true,
        meta: {
          analytics: 'portalcat',
          family: 'quote',
        },
      },
      {
        path: ':requestId/details/activities',
        name: 'quote-activity-list',
        component: RequestActivityGrid,
        props: true,
        meta: {
          analytics: 'quote-activity-list',
          role: { oneOf: ['QUOTE_READ_COMPANY', 'QUOTE_READ_OWN'] },
          family: 'quotes',
        },
      },
      {
        path: ':requestId/details/quote/activities/create',
        name: 'quote-activity-creation',
        component: RequestActivityEdit,
        props: true,
        meta: {
          analytics: 'quote-activity-creation',
          role: { oneOf: ['QUOTE_UPDATE_COMPANY', 'QUOTE_UPDATE_OWN'] },
          family: 'quote',
        },
      },
      {
        path: ':requestId/details/quote/activities/:entityId/details',
        name: 'quote-activity-edition',
        component: RequestActivityEdit,
        props: true,
        meta: {
          analytics: 'quote-activity-edition',
          role: { oneOf: ['QUOTE_UPDATE_COMPANY', 'QUOTE_UPDATE_OWN'] },
          family: 'quotes',
        },
      },
    ],
  },
  {
    path: '/requests',
    components: {
      default: ListRequest,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'list-request',
        component: RequestInlineGrid,
        meta: {
          analytics: 'request-list',
          role: {
            oneOf: ['REQUEST_READ_OWN', 'REQUEST_READ_COMPANY'],
            family: 'request',
          },
        },
      },
      {
        path: ':requestId/details/quote',
        name: 'request-quote-detail',
        component: RequestQuote,
        props: true,
        meta: {
          analytics: 'request-quote',
          role: 'REQUEST_CREATE_OWN',
          family: 'request',
        },
      },
      {
        path: ':requestId/details',
        name: 'request-edition',
        component: RequestInlineEdit,
        props: true,
        meta: {
          analytics: 'request-edit',
          role: 'REQUEST_CREATE_OWN',
          family: 'request',
        },
      },
      {
        path: ':requestId/details/statistics',
        name: 'request-files-statistics',
        component: RequestFilesStatistics,
        props: true,
        meta: {
          analytics: 'request-files-statistics',
          family: 'request',
          role: { oneOf: ['STATISTICS_READ_ALL', 'STATISTICS_READ_OWN', 'STATISTICS_READ_COMPANY'] },
        },
      },
      {
        path: ':requestId/portal-cat',
        name: 'portal-cat',
        components: {
          portalcat: PortalCat,
        },
        props: true,
        meta: {
          analytics: 'portal-cat',
          family: 'request',
        },
      },
      {
        path: ':requestId/details/provider-pooling-offer/create',
        name: 'request-provider-pooling-offer-create',
        component: RequestProviderPoolingOffer,
        props: true,
        meta: {
          analytics: 'request-provider-pooling-offer-create',
          role: 'OFFER_CREATE_ALL',
          family: 'request',
        },
      },
      {
        path: ':requestId/details/provider-pooling-offer/:entityId',
        name: 'request-provider-pooling-offer-edit',
        component: RequestProviderPoolingOffer,
        props: true,
        meta: {
          analytics: 'request-provider-pooling-offer-edit',
          role: 'OFFER_UPDATE_ALL',
          family: 'request',
        },
      },
      {
        path: ':requestId/details/activities',
        name: 'request-activity-list',
        component: RequestActivityGrid,
        props: true,
        meta: {
          analytics: 'request-activity-list',
          role: { oneOf: ['QUOTE_READ_COMPANY', 'QUOTE_READ_OWN'] },
          family: 'request',
        },
      },
      {
        path: ':requestId/details/quote/activities/create',
        name: 'request-activity-creation',
        component: RequestActivityEdit,
        props: true,
        meta: {
          analytics: 'request-activity-creation',
          role: { oneOf: ['QUOTE_UPDATE_COMPANY', 'QUOTE_UPDATE_OWN'] },
          family: 'request',
        },
      },
      {
        path: ':requestId/details/quote/activities/:entityId/details',
        name: 'request-activity-edition',
        component: RequestActivityEdit,
        props: true,
        meta: {
          analytics: 'request-activity-creation',
          role: { oneOf: ['QUOTE_UPDATE_COMPANY', 'QUOTE_UPDATE_OWN'] },
          family: 'request',
        },
      },
      {
        path: 'create',
        name: 'create-request',
        component: RequestInlineEdit,
        props: true,
        meta: {
          analytics: 'request-create',
          role: 'REQUEST_UPDATE_OWN',
          family: 'request',
        },
      },
    ],
  },
  {
    path: '/provider-pooling-offers',
    components: {
      default: ProviderPoolingOfferDashboard,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'provider-pooling-offers',
        component: ProviderPoolingOfferGrid,
        meta: {
          analytics: 'provider-pooling-offers',
          role: 'OFFER_READ_ALL',
        },
      },
      {
        path: ':entityId/details',
        name: 'provider-pooling-offer-details',
        props: true,
        component: RequestProviderPoolingOffer,
        meta: {
          analytics: 'provider-pooling-offers-edit',
          role: 'OFFER_UPDATE_ALL',
        },
      },
    ],
  },
  {
    path: '/company-external-accounting-codes',
    components: {
      default: CompanyExternalAccountingCodes,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'list-company-external-accounting-codes',
        component: CompanyExternalAccountingCodesGrid,
        meta: {
          analytics: 'company-external-accounting-codes',
          role: 'EXTERNAL-ACCOUNTING-CODE_READ_ALL',
        },
      },
      {
        path: ':entityId/details',
        name: 'company-external-accounting-codes-edition',
        component: CompanyExternalAccountingCodesEdit,
        props: true,
        meta: {
          analytics: 'company-external-accounting-codes-edit',
          role: 'EXTERNAL-ACCOUNTING-CODE_UPDATE_ALL',
        },
      },
      {
        path: 'create',
        name: 'company-external-accounting-codes-creation',
        component: CompanyExternalAccountingCodesEdit,
        meta: {
          analytics: 'company-external-accounting-codes-create',
          role: 'EXTERNAL-ACCOUNTING-CODE_CREATE_ALL',
        },
      },
    ],
  },
  {
    path: '/vendor-dashboard',
    name: 'vendor-dashboard',
    components: {
      default: VendorDashboard,
      sidebar: SideBar,
      header: Header,
    },
    meta: {
      analytics: 'vendor-dashboard',
      role: {
        oneOf: ['VENDOR-DASHBOARD_READ_OWN', 'VENDOR-DASHBOARD-FILTER_READ_OWN'],
      },
    },
  },
  {
    path: '/contact-dashboard',
    name: 'contact-dashboard',
    components: {
      default: ContactDashboard,
      sidebar: SideBar,
      header: Header,
    },
    meta: {
      analytics: 'contact-dashboard',
      role: {
        oneOf: ['CONTACT-DASHBOARD_READ_OWN', 'CONTACT-DASHBOARD-FILTER_READ_OWN'],
      },
    },
  },
  {
    path: '/task-management',
    components: {
      default: TaskManagement,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: 'list',
        name: 'task-management',
        component: TaskManagementList,
        meta: {
          analytics: 'task-management',
          role: {
            oneOf: [
              'TASK_READ_ALL',
              'TASK_READ_OWN',
              'REQUEST_READ_ASSIGNED-TASK',
            ],
          },
        },
      },
      {
        path: ':requestId/details',
        name: 'task-edition',
        component: RequestInlineEdit,
        props: true,
        meta: {
          analytics: 'task-edit',
          role: { oneOf: ['TASK_UPDATE_OWN', 'TASK-FINAL-FILE_UPDATE_OWN'] },
        },
      },
      {
        path: ':requestId/details/statistics',
        name: 'task-management-request-files-statistics',
        component: RequestFilesStatistics,
        props: true,
        meta: {
          analytics: 'request-files-statistics',
          family: 'request',
          role: { oneOf: ['STATISTICS_READ_ALL', 'STATISTICS_READ_OWN', 'STATISTICS_READ_COMPANY'] },
        },
      },
      {
        path: ':requestId/portal-cat',
        name: 'task-portal-cat',
        components: {
          portalcat: PortalCat,
        },
        props: true,
        meta: {
          analytics: 'portal-cat',
        },
      },
      {
        path: ':requestId/:entityId/portal-cat/memory-editor',
        name: 'task-management-portal-cat-memory-editor',
        components: {
          'memory-editor': MemoryEditor,
        },
        props: true,
        meta: {
          analytics: 'memory-editor',
        },
      },
    ],
  },
  {
    path: '/tasks',
    components: {
      default: Task,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'task-grid',
        component: TaskGrid,
        meta: {
          analytics: 'task',
          role: {
            oneOf: [
              'TASK_READ_ALL',
              'TASK_READ_OWN',
              'REQUEST_READ_ASSIGNED-TASK',
            ],
          },
        },
      },
      {
        path: ':requestId/:taskId/details',
        name: 'task-detail',
        component: RequestInlineEdit,
        props: true,
        meta: {
          analytics: 'task-detail',
          role: { oneOf: ['TASK_UPDATE_OWN', 'TASK-FINAL-FILE_UPDATE_OWN'] },
        },
      },
      {
        path: ':requestId/:taskId/details/statistics',
        name: 'task-detail-request-files-statistics',
        component: RequestFilesStatistics,
        props: true,
        meta: {
          analytics: 'request-files-statistics',
          family: 'request',
          role: { oneOf: ['STATISTICS_READ_ALL', 'STATISTICS_READ_OWN', 'STATISTICS_READ_COMPANY'] },
        },
      },
      {
        path: ':requestId/:taskId/portal-cat',
        name: 'task-grid-portal-cat',
        components: {
          portalcat: PortalCat,
        },
        props: true,
        meta: {
          analytics: 'portal-cat',
        },
      },
      {
        path: ':requestId/:taskId/:entityId/portal-cat/memory-editor',
        name: 'task-grid-portal-cat-memory-editor',
        components: {
          'memory-editor': MemoryEditor,
        },
        props: true,
        meta: {
          analytics: 'memory-editor',
        },
      },
    ],
  },
  {
    path: '/audit',
    name: 'audit',
    components: {
      default: Audit,
      sidebar: SideBar,
      header: Header,
    },
    meta: { analytics: 'audit', role: 'AUDIT_READ_ALL' },
  },
  {
    path: '/notifications',
    components: {
      default: ListNotification,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'list-notification',
        component: ListNotificationGrid,
        meta: { analytics: 'home', role: 'NOTIFICATION_READ_ALL' },
      },
      {
        path: ':entityId/details',
        name: 'notification-detail',
        component: ListNotificationDetail,
        props: true,
        meta: {
          analytics: 'notification-detail',
          role: 'NOTIFICATION_READ_ALL',
        },
      },
      {
        path: 'advanced-settings',
        name: 'notification-advanced-settings',
        component: ListNotificationAdvancedSettings,
        props: true,
        meta: { analytics: 'notification-detail', role: 'RESTORE_UPDATE_ALL' },
      },
    ],
  },
  {
    path: '/users',
    components: {
      default: User,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'list-user',
        component: UserGrid,
        meta: { analytics: 'user', role: 'USER_READ_ALL', family: 'user' },
      },
      {
        path: ':entityId/details',
        name: 'user-edition',
        props: true,
        component: UserEdit,
        meta: {
          analytics: 'user-edition',
          role: 'USER_READ_ALL',
          family: 'user',
        },
      },
      {
        path: 'create',
        name: 'user-creation',
        component: UserEdit,
        meta: {
          analytics: 'user-creation',
          role: 'USER_READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/abilities/create',
        name: 'user-ability-creation',
        component: AbilityEdit,
        props: true,
        meta: {
          analytics: 'user-ability-edition',
          role: 'USER_READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/abilities/:entityId/details',
        name: 'user-ability-edition',
        component: AbilityEdit,
        props: true,
        meta: {
          analytics: 'user-ability-edition',
          role: 'USER_READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/abilities',
        name: 'user-ability-grid',
        component: AbilityGrid,
        props: true,
        meta: {
          analytics: 'user-ability-grid',
          role: 'USER_READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/lead-source/create',
        name: 'user-lead-source-creation',
        component: LeadSourceEdit,
        props: true,
        meta: {
          analytics: 'lead-source-creation',
          role: 'LEAD-SOURCE-CREATE_ALL',
          family: 'leadSource',
        },
      },
      {
        path: '*/lead-source/:entityId/details',
        name: 'user-lead-source-edition',
        component: LeadSourceEdit,
        props: true,
        meta: {
          analytics: 'lead-source-edition',
          role: 'LEAD-SOURCE_UPDATE_ALL',
          family: 'leadSource',
        },
      },
      {
        path: '*/lead-source',
        name: 'user-lead-source-grid',
        component: LeadSourceGrid,
        props: true,
        meta: {
          analytics: 'lead-source-grid',
          role: 'LEAD-SOURCE_READ_ALL',
          family: 'leadSource',
        },
      },
      {
        path: '*/languages/create',
        name: 'user-language-creation',
        component: LanguageEdit,
        props: true,
        meta: {
          analytics: 'user-language-creation',
          role: 'USER_READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/languages/:entityId/details',
        name: 'user-language-edition',
        component: LanguageEdit,
        props: true,
        meta: {
          analytics: 'user-language-edition',
          role: 'USER_READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/languages',
        name: 'user-language-grid',
        component: LanguageGrid,
        props: true,
        meta: {
          analytics: 'user-language-grid',
          role: 'USER_READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/cat-tools/create',
        name: 'user-catTool-creation',
        component: CatToolEdit,
        props: true,
        meta: {
          analytics: 'user-catTool-creation',
          role: { oneOf: ['USER_READ_ALL', 'CAT_CREATE_ALL'] },
          family: 'user',
        },
      },
      {
        path: '*/cat-tools/:entityId/details',
        name: 'user-catTool-edition',
        component: CatToolEdit,
        props: true,
        meta: {
          analytics: 'user-catTool-edition',
          role: { oneOf: ['USER_READ_ALL', 'CAT_READ_ALL'] },
          family: 'user',
        },
      },
      {
        path: '*/cat-tools',
        name: 'user-catTool-grid',
        component: CatToolGrid,
        props: true,
        meta: {
          analytics: 'user-catTool-grid',
          role: { oneOf: ['USER_READ_ALL', 'CAT_READ_ALL'] },
          family: 'user',
        },
      },
      {
        path: '*/breakdown/',
        name: 'user-breakdown-grid',
        component: BreakdownGrid,
        props: true,
        meta: {
          analytics: 'user-breakdown-grid',
          role: 'BREAKDOWN_READ_ALL',
          family: 'breakdown',
        },
      },
      {
        path: '*/breakdown/create',
        name: 'user-breakdown-creation',
        component: BreakdownEdit,
        props: true,
        meta: {
          analytics: 'user-breakdown-creation',
          role: 'BREAKDOWN_CREATE_ALL',
          family: 'breakdown',
        },
      },
      {
        path: '*/breakdown/:entityId/details',
        name: 'user-breakdown-edition',
        component: BreakdownEdit,
        props: true,
        meta: {
          analytics: 'user-breakdown-edition',
          role: 'BREAKDOWN_UPDATE_ALL',
          family: 'breakdown',
        },
      },
      {
        path: '*/currency/',
        name: 'user-currency-grid',
        component: CurrencyGrid,
        props: true,
        meta: {
          analytics: 'user-currency-grid',
          family: 'currency',
        },
      },
      {
        path: '*/currency/create',
        name: 'user-currency-creation',
        component: CurrencyEdit,
        props: true,
        meta: {
          analytics: 'user-currency-creation',
          role: 'CURRENCY_CREATE_ALL',
          family: 'currency',
        },
      },
      {
        path: '*/currency/:entityId/details',
        name: 'user-currency-edition',
        component: CurrencyEdit,
        props: true,
        meta: {
          analytics: 'user-currency-edition',
          role: 'CURRENCY_UPDATE_ALL',
          family: 'currency',
        },
      },
      {
        path: '*/translation-unit/create',
        name: 'user-translationUnit-creation',
        component: TranslationUnitEdit,
        props: true,
        meta: {
          analytics: 'user-translationUnit-creation',
          role: 'TRANSLATION-UNIT_CREATE_ALL',
          family: 'user',
        },
      },
      {
        path: '*/translation-unit/:entityId/details',
        name: 'user-translationUnit-edition',
        component: TranslationUnitEdit,
        props: true,
        meta: {
          analytics: 'user-translationUnit-edition',
          role: 'TRANSLATION-UNIT_UPDATE_ALL',
          family: 'user',
        },
      },
      {
        path: '*/translation-unit',
        name: 'user-translationUnit-grid',
        component: TranslationUnitGrid,
        props: true,
        meta: {
          analytics: 'user-translationUnit-grid',
          role: 'TRANSLATION-UNIT_READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/competence-levels/create',
        name: 'user-competenceLevel-creation',
        component: CompetenceLevelEdit,
        props: true,
        meta: {
          analytics: 'user-competenceLevel-creation',
          role: 'USER_READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/competence-levels/:entityId/details',
        name: 'user-competenceLevel-edition',
        component: CompetenceLevelEdit,
        props: true,
        meta: {
          analytics: 'user-competenceLevel-edition',
          role: 'USER_READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/competence-levels',
        name: 'user-competenceLevel-grid',
        component: CompetenceLevelGrid,
        props: true,
        meta: {
          analytics: 'user-competenceLevel-grid',
          role: 'USER_READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/activities',
        name: 'user-activity-grid',
        component: ActivityGrid,
        props: true,
        meta: {
          analytics: 'user-activity-grid',
          role: 'USER_READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/activities/create',
        name: 'user-activity-creation',
        component: ActivityEdit,
        props: true,
        meta: {
          analytics: 'user-activity-creation',
          role: 'USER_READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/activities/:entityId/details',
        name: 'user-activity-edition',
        component: ActivityEdit,
        props: true,
        meta: {
          analytics: 'user-activity-edition',
          role: 'USER_READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/activities/tags',
        name: 'user-activityTag-grid',
        component: ActivityTagGrid,
        props: true,
        meta: {
          analytics: 'user-activityTag-grid',
          role: 'USER_READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/activities/tags/create',
        name: 'user-activityTag-creation',
        component: ActivityTagEdit,
        props: true,
        meta: {
          analytics: 'user-activityTag-creation',
          role: 'USER_READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/activities/tags/:entityId/details',
        name: 'user-activityTag-edition',
        component: ActivityTagEdit,
        props: true,
        meta: {
          analytics: 'user-activityTag-edition',
          role: 'USER_READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/companies',
        name: 'user-company-grid',
        component: CompanyGrid,
        props: true,
        meta: {
          analytics: 'user-company-grid',
          role: 'USER_READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/companies/create',
        name: 'user-company-creation',
        component: CompanyEdit,
        props: true,
        meta: {
          analytics: 'user-company-creation',
          role: 'USER_READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/companies/:entityId/details',
        name: 'user-company-edition',
        component: CompanyEdit,
        props: true,
        meta: {
          analytics: 'user-company-edition',
          role: 'USER_READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/internal-department',
        name: 'user-internal-department-grid',
        component: InternalDepartmentGrid,
        props: true,
        meta: {
          analytics: 'user-internal-department-grid',
          role: 'INTERNAL-DEPARTMENT_READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/internal-department/create',
        name: 'user-internal-department-creation',
        component: InternalDepartmentEdit,
        props: true,
        meta: {
          analytics: 'user-internal-department-creation',
          role: 'INTERNAL-DEPARTMENT_CREATE_ALL',
          family: 'user',
        },
      },
      {
        path: '*/internal-department/:entityId/details',
        name: 'user-internal-department-edition',
        component: InternalDepartmentEdit,
        props: true,
        meta: {
          analytics: 'user-internal-department-edition',
          role: 'INTERNAL-DEPARTMENT_UPDATE_ALL',
          family: 'user',
        },
      },
      {
        path: '*/payment-method',
        name: 'user-paymentMethod-grid',
        component: PaymentMethodGrid,
        props: true,
        meta: {
          analytics: 'user-paymentMethod-grid',
          role: 'PAYMENT-METHOD_READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/payment-method/create',
        name: 'user-paymentMethod-creation',
        component: PaymentMethodEdit,
        props: true,
        meta: {
          analytics: 'user-paymentMethod-creation',
          role: 'PAYMENT-METHOD_CREATE_ALL',
          family: 'user',
        },
      },
      {
        path: '*/payment-method/:entityId/details',
        name: 'user-paymentMethod-edition',
        component: PaymentMethodEdit,
        props: true,
        meta: {
          analytics: 'user-paymentMethod-edition',
          role: 'PAYMENT-METHOD_UPDATE_ALL',
          family: 'user',
        },
      },
      {
        path: '*/billing-terms',
        name: 'user-billingTerm-grid',
        component: BillingTermGrid,
        props: true,
        meta: {
          analytics: 'user-billingTerm-grid',
          role: 'BILLING-TERM_READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/billing-terms/create',
        name: 'user-billingTerm-creation',
        component: BillingTermEdit,
        props: true,
        meta: {
          analytics: 'user-billingTerm-creation',
          role: 'BILLING-TERM_CREATE_ALL',
          family: 'user',
        },
      },
      {
        path: '*/billing-terms/:entityId/details',
        name: 'user-billingTerm-edition',
        component: BillingTermEdit,
        props: true,
        meta: {
          analytics: 'user-billingTerm-edition',
          role: 'BILLING-TERM_UPDATE_ALL',
          family: 'user',
        },
      },
      {
        path: '*/tax-forms',
        name: 'user-taxForm-grid',
        component: TaxFormGrid,
        props: true,
        meta: {
          analytics: 'user-taxForm-grid',
          role: 'USER_READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/tax-forms/create',
        name: 'user-taxForm-creation',
        component: TaxFormEdit,
        props: true,
        meta: {
          analytics: 'user-taxForm-creation',
          role: 'USER_READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/tax-forms/:entityId/details',
        name: 'user-taxForm-edition',
        component: TaxFormEdit,
        props: true,
        meta: {
          analytics: 'user-taxForm-edition',
          role: 'USER_READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/users/create',
        name: 'user-user-creation',
        component: UserEdit,
        props: true,
        meta: {
          analytics: 'user-user-creation',
          role: 'USER_READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/users/:entityId/details',
        name: 'user-user-edition',
        component: UserEdit,
        props: true,
        meta: {
          analytics: 'user-user-edition',
          role: 'USER_READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/users',
        name: 'user-user-grid',
        component: UserGrid,
        props: true,
        meta: {
          analytics: 'user-user-grid',
          role: 'USER_READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/requests',
        name: 'user-request-grid',
        component: RequestInlineGrid,
        props: true,
        meta: {
          analytics: 'user-request-grid',
          role: 'REQUEST_READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/requests/create',
        name: 'user-request-creation',
        component: RequestInlineEdit,
        props: true,
        meta: {
          analytics: 'user-request-create',
          role: 'REQUEST_CREATE_OWN',
          family: 'user',
        },
      },
      {
        path: '*/requests/:entityId/details',
        name: 'user-request-edition',
        component: RequestInlineEdit,
        props: true,
        meta: {
          analytics: 'user-request-edit',
          role: 'REQUEST_UPDATE_OWN',
          family: 'user',
        },
      },
      {
        path: '*/vendor-minimum-charge',
        name: 'user-vendor-minimum-charge-grid',
        component: VendorMinimumChargeGrid,
        props: true,
        meta: {
          analytics: 'vendor-minimum-charge',
          role: 'VENDOR-MIN-CHARGE_CREATE_ALL',
          family: 'user',
        },
      },
      {
        path: '*/vendor-minimum-charge/create',
        name: 'user-vendor-minimum-charge-creation',
        component: VendorMinimumChargeEdit,
        props: true,
        meta: {
          analytics: 'user-vendor-minimum-charge-create',
          role: 'VENDOR-MIN-CHARGE_CREATE_ALL',
          family: 'user',
        },
      },
      {
        path: '*/vendor-minimum-charge/:entityId/details',
        name: 'user-vendor-minimum-charge-edition',
        component: VendorMinimumChargeEdit,
        props: true,
        meta: {
          analytics: 'user-vendor-minimum-charge-edit',
          role: 'VENDOR-MIN-CHARGE_UPDATE_ALL',
          family: 'user',
        },
      },
    ],
  },
  {
    path: '/users/profile/image',
    name: 'user-profile-image',
    components: {
      default: UserProfileImage,
      sidebar: SideBar,
      header: Header,
    },
    meta: { analytics: 'user-profile-image' },
  },
  {
    path: '/groups',
    components: {
      default: Group,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'list-group',
        component: GroupGrid,
        meta: {
          analytics: 'list-group',
          role: 'GROUP_READ_ALL',
          family: 'group',
        },
      },
      {
        path: 'create',
        name: 'group-creation',
        component: GroupEdition,
        meta: {
          analytics: 'group-creation',
          role: 'GROUP_CREATE_ALL',
          family: 'group',
        },
      },
      {
        path: 'create/roles',
        name: 'group-creation-roles',
        component: GroupEdition,
        meta: {
          analytics: 'group-creation-roles',
          role: 'GROUP_CREATE_ALL',
          family: 'group',
        },
      },
      {
        path: ':entityId/details',
        name: 'group-edition',
        props: true,
        component: GroupEdition,
        meta: {
          analytics: 'group-edition',
          role: 'GROUP_EDIT_ALL',
          family: 'group',
        },
      },
      {
        path: ':entityId/details/roles',
        name: 'group-edition-roles',
        props: true,
        component: GroupEdition,
        meta: {
          analytics: 'group-edition-roles',
          role: 'GROUP_EDIT_ALL',
          family: 'group',
        },
      },
    ],
  },
  {
    path: '/scheduler',
    components: {
      default: Scheduler,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'list-scheduler',
        component: SchedulerGrid,
        meta: { analytics: 'scheduler', role: 'SCHEDULER_READ_ALL' },
      },
      {
        path: ':entityId/details',
        name: 'scheduler-edition',
        component: SchedulerEdit,
        props: true,
        meta: { analytics: 'scheduler-edit', role: 'SCHEDULER_READ_ALL' },
      },
      {
        path: 'create',
        name: 'scheduler-create',
        component: SchedulerEdit,
        meta: { analytics: 'scheduler-create', role: 'SCHEDULER_CREATE_ALL' },
      },
    ],
  },
  {
    path: '/companies',
    components: {
      default: Company,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'list-company',
        component: CompanyGrid,
        meta: {
          analytics: 'list-company',
          role: 'USER_READ_ALL',
          family: 'company',
        },
      },
      {
        path: 'create',
        name: 'company-creation',
        component: CompanyEdit,
        meta: {
          analytics: 'company-creation',
          role: 'USER_READ_ALL',
          family: 'company',
        },
      },
      {
        path: ':entityId/details',
        name: 'company-edition',
        component: CompanyEdit,
        props: true,
        meta: {
          analytics: 'company-edition',
          role: 'USER_READ_ALL',
          family: 'company',
        },
      },
      {
        path: ':entityId/memory-editor',
        name: 'company-memory-editor',
        components: {
          'memory-editor': MemoryEditor,
        },
        props: true,
        meta: {
          analytics: 'memory-editor',
        },
      },
      {
        path: '*/companies',
        name: 'company-company-grid',
        props: true,
        component: CompanyGrid,
        meta: {
          analytics: 'company-company-grid',
          role: 'USER_READ_ALL',
          family: 'company',
        },
      },
      {
        path: '*/companies/:entityId/details',
        name: 'company-company-edition',
        component: CompanyEdit,
        props: true,
        meta: {
          analytics: 'company-company-edition',
          role: 'USER_READ_ALL',
          family: 'company',
        },
      },
      {
        path: '*/companies/create',
        name: 'company-company-creation',
        props: true,
        component: CompanyEdit,
        meta: {
          analytics: 'company-company-creation',
          role: 'USER_READ_ALL',
          family: 'company',
        },
      },
      {
        path: '*/company-minimum-charge',
        name: 'company-company-minimum-charge-grid',
        props: true,
        component: CompanyMinimumChargeGrid,
        meta: {
          analytics: 'company-company-minimum-charge-grid',
          role: 'COMPANY-MIN-CHARGE_CREATE_ALL',
          family: 'company-minimum-charge',
        },
      },
      {
        path: '*/company-minimum-charge/:entityId/details',
        name: 'company-company-minimum-charge-edition',
        component: CompanyMinimumChargeEdit,
        props: true,
        meta: {
          analytics: 'company-company-minimum-charge-edition',
          role: 'COMPANY-MIN-CHARGE_CREATE_ALL',
          family: 'company-minimum-charge',
        },
      },
      {
        path: '*/company-minimum-charge/create',
        name: 'company-company-minimum-charge-creation',
        props: true,
        component: CompanyMinimumChargeEdit,
        meta: {
          analytics: 'company-company-minimum-charge-creation',
          role: 'COMPANY-MIN-CHARGE_CREATE_ALL',
          family: 'company-minimum-charge',
        },
      },
      {
        path: '*/users',
        name: 'company-user-grid',
        component: UserGrid,
        meta: {
          analytics: 'company-user-grid',
          role: 'USER_READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/users/:entityId/details',
        name: 'company-user-edition',
        props: true,
        component: UserEdit,
        meta: {
          analytics: 'company-user-edition',
          role: 'USER_UPDATE_ALL',
          family: 'user',
        },
      },
      {
        path: '*/users/create',
        name: 'company-user-creation',
        component: UserEdit,
        meta: {
          analytics: 'company-user-creation',
          role: 'USER_CREATE_ALL',
          family: 'user',
        },
      },
      {
        path: '*/abilities/create',
        name: 'company-ability-creation',
        component: AbilityEdit,
        props: true,
        meta: {
          analytics: 'company-ability-edition',
          role: 'USER_READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/abilities/:entityId/details',
        name: 'company-ability-edition',
        component: AbilityEdit,
        props: true,
        meta: {
          analytics: 'company-ability-edition',
          role: 'USER_READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/abilities',
        name: 'company-ability-grid',
        component: AbilityGrid,
        props: true,
        meta: {
          analytics: 'company-ability-grid',
          role: 'USER_READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/languages/create',
        name: 'company-language-creation',
        component: LanguageEdit,
        props: true,
        meta: {
          analytics: 'company-language-creation',
          role: 'USER_READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/languages/:entityId/details',
        name: 'company-language-edition',
        component: LanguageEdit,
        props: true,
        meta: {
          analytics: 'company-language-edition',
          role: 'USER_READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/languages',
        name: 'company-language-grid',
        component: LanguageGrid,
        props: true,
        meta: {
          analytics: 'company-language-grid',
          role: 'USER_READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/cat-tools/create',
        name: 'company-catTool-creation',
        component: CatToolEdit,
        props: true,
        meta: {
          analytics: 'company-catTool-creation',
          role: 'USER_READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/cat-tools/:entityId/details',
        name: 'company-catTool-edition',
        component: CatToolEdit,
        props: true,
        meta: {
          analytics: 'company-catTool-edition',
          role: 'USER_READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/cat-tools',
        name: 'company-catTool-grid',
        component: CatToolGrid,
        props: true,
        meta: {
          analytics: 'company-catTool-grid',
          role: 'USER_READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/competence-levels/create',
        name: 'company-competenceLevel-creation',
        component: CompetenceLevelEdit,
        props: true,
        meta: {
          analytics: 'company-competenceLevel-creation',
          role: 'USER_READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/competence-levels/:entityId/details',
        name: 'company-competenceLevel-edition',
        component: CompetenceLevelEdit,
        props: true,
        meta: {
          analytics: 'company-competenceLevel-edition',
          role: 'USER_READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/competence-levels',
        name: 'company-competenceLevel-grid',
        component: CompetenceLevelGrid,
        props: true,
        meta: {
          analytics: 'company-competenceLevel-grid',
          role: 'USER_READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/lead-source/create',
        name: 'company-lead-source-creation',
        component: LeadSourceEdit,
        props: true,
        meta: {
          analytics: 'company-lead-source-creation',
          role: 'LEAD-SOURCE-CREATE_ALL',
          family: 'user',
        },
      },
      {
        path: '*/lead-source/:entityId/details',
        name: 'company-lead-source-edition',
        component: LeadSourceEdit,
        props: true,
        meta: {
          analytics: 'company-lead-source-edition',
          role: 'LEAD-SOURCE-UPDATE_ALL',
          family: 'user',
        },
      },
      {
        path: '*/lead-source',
        name: 'company-lead-source-grid',
        component: LeadSourceGrid,
        props: true,
        meta: {
          analytics: 'company-lead-source-grid',
          role: 'LEAD-SOURCE-READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/activities',
        name: 'company-activity-grid',
        component: ActivityGrid,
        props: true,
        meta: {
          analytics: 'company-activity-grid',
          role: 'USER_READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/activities/create',
        name: 'company-activity-creation',
        component: ActivityEdit,
        props: true,
        meta: {
          analytics: 'company-activity-creation',
          role: 'USER_READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/activities/:entityId/details',
        name: 'company-activity-edition',
        component: ActivityEdit,
        props: true,
        meta: {
          analytics: 'company-activity-edition',
          role: 'USER_READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/activities/tags',
        name: 'company-activityTag-grid',
        component: ActivityTagGrid,
        props: true,
        meta: {
          analytics: 'company-activityTag-grid',
          role: 'USER_READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/activities/tags/create',
        name: 'company-activityTag-creation',
        component: ActivityTagEdit,
        props: true,
        meta: {
          analytics: 'company-activityTag-creation',
          role: 'USER_READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/activities/tags/:entityId/details',
        name: 'company-activityTag-edition',
        component: ActivityTagEdit,
        props: true,
        meta: {
          analytics: 'company-activityTag-edition',
          role: 'USER_READ_ALL',
          family: 'user',
        },
      },
      {
        path: '*/currency/',
        name: 'company-currency-grid',
        component: CurrencyGrid,
        props: true,
        meta: {
          analytics: 'company-currency-grid',
          family: 'currency',
        },
      },
      {
        path: '*/currency/create',
        name: 'company-currency-creation',
        component: CurrencyEdit,
        props: true,
        meta: {
          analytics: 'company-currency-creation',
          role: 'CURRENCY_CREATE_ALL',
          family: 'currency',
        },
      },
      {
        path: '*/currency/:entityId/details',
        name: 'company-currency-edition',
        component: CurrencyEdit,
        props: true,
        meta: {
          analytics: 'company-currency-edition',
          role: 'CURRENCY_UPDATE_ALL',
          family: 'currency',
        },
      },
      {
        path: '*/translation-unit/',
        name: 'company-translation-unit-grid',
        component: TranslationUnitGrid,
        props: true,
        meta: {
          analytics: 'company-translation-unit-grid',
          role: 'TRANSLATION-UNIT_READ_ALL',
          family: 'translationUnit',
        },
      },
      {
        path: '*/translation-unit/create',
        name: 'company-translation-unit-creation',
        component: TranslationUnitEdit,
        props: true,
        meta: {
          analytics: 'company-translation-unit-creation',
          role: 'TRANSLATION-UNIT_CREATE_ALL',
          family: 'translationUnit',
        },
      },
      {
        path: '*/translation-unit/:entityId/details',
        name: 'company-translation-unit-edition',
        component: TranslationUnitEdit,
        props: true,
        meta: {
          analytics: 'company-translation-unit-edition',
          role: 'TRANSLATION-UNIT_UPDATE_ALL',
          family: 'translationUnit',
        },
      },
      {
        path: '*/breakdown/',
        name: 'company-breakdown-grid',
        component: BreakdownGrid,
        props: true,
        meta: {
          analytics: 'company-breakdown-grid',
          role: 'FUZZY_MATCH_READ_ALL',
          family: 'breakdown',
        },
      },
      {
        path: '*/breakdown/create',
        name: 'company-breakdown-creation',
        component: BreakdownEdit,
        props: true,
        meta: {
          analytics: 'company-breakdown-creation',
          role: 'FUZZY_MATCH_CREATE_ALL',
          family: 'breakdown',
        },
      },
      {
        path: '*/breakdown/:entityId/details',
        name: 'company-breakdown-edition',
        component: BreakdownEdit,
        props: true,
        meta: {
          analytics: 'company-breakdown-edition',
          role: 'FUZZY_MATCH_UPDATE_ALL',
          family: 'breakdown',
        },
      },
      {
        path: '*/internal-department/',
        name: 'company-internal-department-grid',
        component: InternalDepartmentGrid,
        props: true,
        meta: {
          analytics: 'company-internal-department-grid',
          role: 'INTERNAL_DEPARTMENT_READ_ALL',
          family: 'internalDepartment',
        },
      },
      {
        path: '*/internal-department/create',
        name: 'company-internal-department-creation',
        component: InternalDepartmentEdit,
        props: true,
        meta: {
          analytics: 'company-internal-department-creation',
          role: 'INTERNAL_DEPARTMENT_CREATE_ALL',
          family: 'internalDepartment',
        },
      },
      {
        path: '*/internal-department/:entityId/details',
        name: 'company-internal-department-edition',
        component: InternalDepartmentEdit,
        props: true,
        meta: {
          analytics: 'company-internal-department-edition',
          role: 'INTERNAL_DEPARTMENT_UPDATE_ALL',
          family: 'internalDepartment',
        },
      },
      {
        path: '*/billing-term/',
        name: 'company-billing-term-grid',
        component: BillingTermGrid,
        props: true,
        meta: {
          analytics: 'company-billing-term-grid',
          role: 'BILLING_TERM_READ_ALL',
          family: 'billingTerm',
        },
      },
      {
        path: '*/billing-term/create',
        name: 'company-billing-term-creation',
        component: BillingTermEdit,
        props: true,
        meta: {
          analytics: 'company-billing-term-creation',
          role: 'BILLING_TERM_CREATE_ALL',
          family: 'billingTerm',
        },
      },
      {
        path: '*/billing-term/:entityId/details',
        name: 'company-billing-term-edition',
        component: BillingTermEdit,
        props: true,
        meta: {
          analytics: 'company-billing-term-edition',
          role: 'BILLING_TERM_UPDATE_ALL',
          family: 'billingTerm',
        },
      },
      {
        path: '*/payment-method/',
        name: 'company-payment-method-grid',
        component: PaymentMethodGrid,
        props: true,
        meta: {
          analytics: 'company-payment-method-grid',
          role: 'PAYMENT_METHOD_READ_ALL',
          family: 'paymentMethod',
        },
      },
      {
        path: '*/payment-method/create',
        name: 'company-payment-method-creation',
        component: PaymentMethodEdit,
        props: true,
        meta: {
          analytics: 'company-payment-method-creation',
          role: 'PAYMENT_METHOD_CREATE_ALL',
          family: 'paymentMethod',
        },
      },
      {
        path: '*/payment-method/:entityId/details',
        name: 'company-payment-method-edition',
        component: PaymentMethodEdit,
        props: true,
        meta: {
          analytics: 'company-payment-method-edition',
          role: 'PAYMENT_METHOD_UPDATE_ALL',
          family: 'paymentMethod',
        },
      },
      {
        path: '*/locations/',
        name: 'company-location-grid',
        component: LocationGrid,
        props: true,
        meta: {
          analytics: 'company-location-grid',
          role: 'LOCATION_READ_ALL',
          family: 'location',
        },
      },
      {
        path: '*/locations/create',
        name: 'company-location-creation',
        component: LocationEdit,
        props: true,
        meta: {
          analytics: 'company-location-creation',
          role: 'LOCATION_CREATE_ALL',
          family: 'location',
        },
      },
      {
        path: '*/locations/:entityId/details',
        name: 'company-location-edition',
        component: LocationEdit,
        props: true,
        meta: {
          analytics: 'company-location-edition',
          role: 'LOCATION_UPDATE_ALL',
          family: 'location',
        },
      },
    ],
  },
  {
    path: '/active-user-sessions',
    name: 'active-user-sessions',
    components: {
      default: ActiveUserSessions,
      sidebar: SideBar,
      header: Header,
    },
    meta: {
      analytics: 'active-user-sessions',
      role: 'ACTIVE-USER-SESSION_READ_ALL',
      family: 'user',
    },
  },
  {
    path: '/abilities',
    components: {
      default: Ability,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'list-ability',
        component: AbilityGrid,
        meta: { analytics: 'list-ability', role: 'USER_READ_ALL' },
      },
      {
        path: ':entityId/details',
        name: 'ability-edition',
        component: AbilityEdit,
        props: true,
        meta: { analytics: 'ability-edit', role: 'USER_READ_ALL' },
      },
      {
        path: 'create',
        name: 'ability-create',
        component: AbilityEdit,
        meta: { analytics: 'ability-create', role: 'USER_READ_ALL' },
      },
    ],
  },
  {
    path: '/cat-tools',
    components: {
      default: CatTool,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'list-cat-tools',
        component: CatToolGrid,
        meta: { analytics: 'list-cat-tools', role: 'USER_READ_ALL' },
      },
      {
        path: ':entityId/details',
        name: 'cat-tool-edition',
        component: CatToolEdit,
        props: true,
        meta: { analytics: 'cat-tool-edition', role: 'USER_READ_ALL' },
      },
      {
        path: 'create',
        name: 'cat-tool-creation',
        component: CatToolEdit,
        meta: { analytics: 'cat-tool-creation', role: 'USER_READ_ALL' },
      },
    ],
  },
  {
    path: '/competence-levels',
    components: {
      default: CompetenceLevel,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'list-competence-levels',
        component: CompetenceLevelGrid,
        meta: { analytics: 'list-competence-levels', role: 'USER_READ_ALL' },
      },
      {
        path: ':entityId/details',
        name: 'competence-level-edition',
        component: CompetenceLevelEdit,
        props: true,
        meta: { analytics: 'competence-level-edition', role: 'USER_READ_ALL' },
      },
      {
        path: 'create',
        name: 'competence-level-creation',
        component: CompetenceLevelEdit,
        meta: { analytics: 'competence-level-creation', role: 'USER_READ_ALL' },
      },
    ],
  },
  {
    path: '/activities',
    components: {
      default: Activity,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'list-activity',
        component: ActivityGrid,
        meta: {
          analytics: 'list-activity',
          role: 'USER_READ_ALL',
          family: 'activity',
        },
      },
      {
        path: ':entityId/details',
        name: 'activity-edition',
        component: ActivityEdit,
        props: true,
        meta: {
          analytics: 'activity-edition',
          role: 'USER_READ_ALL',
          family: 'activity',
        },
      },
      {
        path: 'create',
        name: 'activity-creation',
        component: ActivityEdit,
        meta: {
          analytics: 'activity-creation',
          role: 'USER_READ_ALL',
          family: 'activity',
        },
      },
      {
        path: '*/activity-tags',
        name: 'activity-activityTag-grid',
        props: true,
        component: ActivityTagGrid,
        meta: {
          analytics: 'activity-activityTag-grid',
          role: 'USER_READ_ALL',
          family: 'activity',
        },
      },
      {
        path: '*/activity-tags/:entityId/details',
        name: 'activity-activityTag-edition',
        props: true,
        component: ActivityTagEdit,
        meta: {
          analytics: 'activity-activityTag-edition',
          role: 'USER_READ_ALL',
          family: 'activity',
        },
      },
      {
        path: '*/activity-tags/create',
        name: 'activity-activityTag-creation',
        props: true,
        component: ActivityTagEdit,
        meta: {
          analytics: 'activity-activityTag-creation',
          role: 'USER_READ_ALL',
          family: 'activity',
        },
      },
      {
        path: '*/users/',
        name: 'activity-user-grid',
        component: UserGrid,
        meta: { analytics: 'activity-user-grid', role: 'USER_READ_ALL', family: 'user' },
      },
      {
        path: '*/users/create',
        name: 'activity-user-creation',
        component: UserEdit,
        meta: { analytics: 'activity-user-creation', role: 'USER_READ_ALL', family: 'user' },
      },
      {
        path: '*/users/:entityId/details',
        name: 'activity-user-edition',
        props: true,
        component: UserEdit,
        meta: { analytics: 'activity-user-edition', role: 'USER_READ_ALL', family: 'user' },
      },
    ],
  },
  {
    path: '/activities/tags',
    components: {
      default: ActivityTag,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'list-activity-tags',
        component: ActivityTagGrid,
        meta: { analytics: 'list-activity-tags', role: 'USER_READ_ALL' },
      },
      {
        path: ':entityId/details',
        name: 'activity-tag-edition',
        component: ActivityTagEdit,
        props: true,
        meta: { analytics: 'activity-tag-edit', role: 'USER_READ_ALL' },
      },
      {
        path: 'create',
        name: 'activity-tag-creation',
        component: ActivityTagEdit,
        meta: { analytics: 'activity-tag-create', role: 'USER_READ_ALL' },
      },
    ],
  },
  {
    path: '/header-notification',
    components: {
      default: Toast,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'list-toast',
        component: ToastGrid,
        meta: { analytics: 'list-toast', role: 'HEADER-NOTIFICATION_READ_ALL' },
      },
      {
        path: ':entityId/details',
        name: 'toast-edition',
        component: ToastEdit,
        props: true,
        meta: {
          analytics: 'toast-edition',
          role: 'HEADER-NOTIFICATION_EDIT_ALL',
        },
      },
      {
        path: 'create',
        name: 'toast-creation',
        component: ToastEdit,
        meta: {
          analytics: 'toast-creation',
          role: 'HEADER-NOTIFICATION_CREATE_ALL',
        },
      },
    ],
  },
  {
    path: '/languages',
    components: {
      default: Language,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'list-language',
        component: LanguageGrid,
        meta: {
          analytics: 'list-language',
          role: { oneOf: ['USER_READ_ALL', 'LANGUAGE_CREATE_ALL'] },
        },
      },
      {
        path: ':entityId/details',
        name: 'language-edition',
        component: LanguageEdit,
        props: true,
        meta: { analytics: 'language-edit', role: 'USER_READ_ALL' },
      },
      {
        path: 'create',
        name: 'language-create',
        component: LanguageEdit,
        meta: {
          analytics: 'language-create',
          role: { oneOf: ['USER_READ_ALL', 'LANGUAGE_CREATE_ALL'] },
        },
      },
    ],
  },
  {
    path: '/requests/:requestId/language/:language/basic-cat-tool',
    components: {
      default: BasicCatToolContainer,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        component: BasicCatTool,
        props: true,
        name: 'basic-cat-tool',
        meta: { analytics: 'basic-cat-tool', public: false, family: 'request' },
      },
    ],
  },
  {
    path: '/requests/:requestId/language/:language/file/:fileId/basic-cat-tool',
    components: {
      default: BasicCatToolContainer,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        component: BasicCatTool,
        props: true,
        name: 'basic-cat-tool-file',
        meta: { analytics: 'basic-cat-tool', public: false, family: 'request' },
      },
    ],
  },
  {
    path: '/payment-methods',
    components: {
      default: PaymentMethod,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'list-payment-method',
        component: PaymentMethodGrid,
        meta: {
          analytics: 'payment-method',
          role: { oneOf: ['COMPANY-READ-ALL', 'COMPANY-READ-OWN'] },
        },
      },
      {
        path: ':entityId/details',
        name: 'payment-method-edition',
        component: PaymentMethodEdit,
        props: true,
        meta: { analytics: 'payment-method-edit', role: 'USER_READ_ALL' },
      },
      {
        path: 'create',
        name: 'payment-method-creation',
        component: PaymentMethodEdit,
        meta: {
          analytics: 'payment-method-create',
          role: { oneOf: ['COMPANY-READ-ALL', 'COMPANY-READ-OWN'] },
        },
      },
    ],
  },
  {
    path: '/lead-source',
    components: {
      default: LeadSource,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'list-lead-source',
        component: LeadSourceGrid,
        meta: { analytics: 'lead-source', role: 'LEAD-SOURCE-READ_ALL' },
      },
      {
        path: ':entityId/details',
        name: 'lead-source-edition',
        component: LeadSourceEdit,
        props: true,
        meta: { analytics: 'lead-source-edit', role: 'LEAD-SOURCE-UPDATE_ALL' },
      },
      {
        path: 'create',
        name: 'lead-source-creation',
        component: LeadSourceEdit,
        meta: {
          analytics: 'lead-source-create',
          role: 'LEAD-SOURCE-CREATE_ALL',
        },
      },
    ],
  },
  {
    path: '/translation-unit',
    components: {
      default: TranslationUnit,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'list-translation-unit',
        component: TranslationUnitGrid,
        meta: {
          analytics: 'translationUnit',
          role: 'TRANSLATION-UNIT_READ_ALL',
        },
      },
      {
        path: ':entityId/details',
        name: 'translation-unit-edition',
        component: TranslationUnitEdit,
        props: true,
        meta: {
          analytics: 'translation-unit-edit',
          role: 'TRANSLATION-UNIT_UPDATE_ALL',
        },
      },
      {
        path: 'create',
        name: 'translation-unit-creation',
        component: TranslationUnitEdit,
        meta: {
          analytics: 'translation-unit-create',
          role: 'TRANSLATION-UNIT_CREATE_ALL',
        },
      },
    ],
  },
  {
    path: '/currency',
    components: {
      default: Currency,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'list-currency',
        component: CurrencyGrid,
        meta: { analytics: 'currency' },
      },
      {
        path: ':entityId/details',
        name: 'currency-edition',
        component: CurrencyEdit,
        props: true,
        meta: { analytics: 'currency-edit', role: 'CURRENCY_UPDATE_ALL' },
      },
      {
        path: 'create',
        name: 'currency-creation',
        component: CurrencyEdit,
        meta: { analytics: 'currency-create', role: 'CURRENCY_CREATE_ALL' },
      },
    ],
  },
  {
    path: '/breakdown',
    components: {
      default: Breakdown,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'list-breakdown',
        component: BreakdownGrid,
        meta: { analytics: 'breakdown', role: 'BREAKDOWN_CREATE_ALL' },
      },
      {
        path: ':entityId/details',
        name: 'breakdown-edition',
        component: BreakdownEdit,
        props: true,
        meta: { analytics: 'breakdown-edit', role: 'BREAKDOWN_UPDATE_ALL' },
      },
      {
        path: 'create',
        name: 'breakdown-creation',
        component: BreakdownEdit,
        meta: {
          analytics: 'breakdown-create',
          role: 'BREAKDOWN_CREATE_ALL',
        },
      },
    ],
  },
  {
    path: '/internal-departments',
    components: {
      default: InternalDepartment,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'list-internal-department',
        component: InternalDepartmentGrid,
        meta: {
          analytics: 'internal-department',
          role: 'INTERNAL-DEPARTMENT_READ_ALL',
        },
      },
      {
        path: ':entityId/details',
        name: 'internal-department-edition',
        component: InternalDepartmentEdit,
        props: true,
        meta: {
          analytics: 'internal-department-edit',
          role: 'INTERNAL-DEPARMENT_UPDATE_ALL',
        },
      },
      {
        path: 'create',
        name: 'internal-department-creation',
        component: InternalDepartmentEdit,
        meta: {
          analytics: 'internal-department-create',
          role: 'INTERNAL-DEPARTMENT_CREATE_ALL',
        },
      },
    ],
  },
  {
    path: '/tax-forms',
    components: {
      default: TaxForm,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'list-tax-form',
        component: TaxFormGrid,
        meta: { analytics: 'tax-form', role: 'USER_READ_ALL' },
      },
      {
        path: ':entityId/details',
        name: 'tax-form-edition',
        component: TaxFormEdit,
        props: true,
        meta: { analytics: 'tax-form-edit', role: 'USER_UPDATE_ALL' },
      },
      {
        path: 'create',
        name: 'tax-form-creation',
        component: TaxFormEdit,
        meta: { analytics: 'tax-form-create', role: 'USER_READ_ALL' },
      },
    ],
  },
  {
    path: '/external-resources',
    name: 'external-resource',
    components: {
      default: ExternalResource,
      sidebar: SideBar,
      header: Header,
    },
  },
  {
    path: '/billing-terms',
    components: {
      default: BillingTerm,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'list-billing-term',
        component: BillingTermGrid,
        meta: { analytics: 'billing-term', role: 'BILLING-TERM_READ_ALL' },
      },
      {
        path: ':entityId/details',
        name: 'billing-term-edition',
        component: BillingTermEdit,
        props: true,
        meta: {
          analytics: 'billing-term-edit',
          role: 'BILLING-TERM_UPDATE_ALL',
        },
      },
      {
        path: 'create',
        name: 'billing-term-creation',
        component: BillingTermEdit,
        meta: {
          analytics: 'billing-term-create',
          role: 'BILLING-TERM_CREATE_ALL',
        },
      },
    ],
  },
  {
    path: '/mt-engines',
    components: {
      default: MtEngines,
      sidebar: SideBar,
      header: Header,
    },
    children: [{
      path: '',
      name: 'list-mt-engine',
      component: MtEnginesGrid,
      meta: {
        analytics: 'mt-engines',
        role: 'MT-ENGINES_READ_ALL',
      },
    },
    {
      path: ':entityId/details',
      name: 'mt-engine-edition',
      component: MtEnginesEdit,
      props: true,
      meta: {
        analytics: 'mt-engines-edit',
        role: 'MT-ENGINES_UPDATE_ALL',
      },
    },
    {
      path: 'create',
      name: 'mt-engine-creation',
      component: MtEnginesEdit,
      meta: {
        analytics: 'mt-engine-create',
        role: 'MT-ENGINES_CREATE_ALL',
      },
    },
    ],
  },
  {
    path: '/opportunity',
    components: {
      default: Opportunity,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'list-opportunity',
        component: OpportunityGrid,
        meta: {
          analytics: 'opportunity',
          role: { oneOf: ['OPPORTUNITY_READ_ALL', 'OPPORTUNITY_READ_OWN'] },
        },
      },
      {
        path: ':entityId/details',
        name: 'opportunity-edition',
        component: OpportunityEdit,
        props: true,
        meta: {
          analytics: 'opportunity-edit',
          role: { oneOf: ['OPPORTUNITY_UPDATE_ALL', 'OPPORTUNITY_UPDATE_OWN'] },
        },
      },
      {
        path: 'create',
        name: 'opportunity-creation',
        component: OpportunityEdit,
        meta: {
          analytics: 'opportunity-create',
          role: { oneOf: ['OPPORTUNITY_CREATE_ALL', 'OPPORTUNITY_CREATE_OWN'] },
        },
      },
    ],
  },
  {
    path: '/request-types',
    components: {
      default: RequestType,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'list-request-type',
        component: RequestTypeGrid,
        meta: { analytics: 'list-request-type', role: 'REQUEST_CREATE_ALL' },
      },
      {
        path: ':entityId/details',
        name: 'request-type-edition',
        component: RequestTypeEdit,
        props: true,
        meta: { analytics: 'request-type-edition', role: 'REQUEST_CREATE_ALL' },
      },
      {
        path: 'create',
        name: 'request-type-creation',
        component: RequestTypeEdit,
        meta: { analytics: 'request-type-creation', role: 'REQUEST_CREATE_ALL' },
      },
    ],
  },
  {
    path: '/delivery-methods',
    components: {
      default: DeliveryMethod,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'list-delivery-method',
        component: DeliveryMethodGrid,
        meta: {
          analytics: 'list-delivery-method',
          role: 'DELIVERY-METHOD_READ_ALL',
        },
      },
      {
        path: ':entityId/details',
        name: 'delivery-method-edition',
        component: DeliveryMethodEdit,
        props: true,
        meta: {
          analytics: 'delivery-method-edition',
          role: 'DELIVERY-METHOD_UPDATE_ALL',
        },
      },
      {
        path: 'create',
        name: 'delivery-method-creation',
        component: DeliveryMethodEdit,
        meta: {
          analytics: 'delivery-method-creation',
          role: 'DELIVERY-METHOD_CREATE_ALL',
        },
      },
    ],
  },
  {
    path: '/scheduling-statuses',
    components: {
      default: SchedulingStatus,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'list-scheduling-status',
        component: SchedulingStatusGrid,
        meta: {
          analytics: 'list-scheduling-status',
          role: 'REQUEST_CREATE_ALL',
        },
      },
      {
        path: ':entityId/details',
        name: 'scheduling-status-edition',
        component: SchedulingStatusEdit,
        props: true,
        meta: {
          analytics: 'scheduling-status-edition',
          role: 'REQUEST_CREATE_ALL',
        },
      },
      {
        path: 'create',
        name: 'scheduling-status-creation',
        component: SchedulingStatusEdit,
        meta: {
          analytics: 'scheduling-status-creation',
          role: 'REQUEST_CREATE_ALL',
        },
      },
    ],
  },
  {
    path: '/lsp/settings',
    components: {
      default: Lsp,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'lsp-settings',
        component: LspSettings,
        meta: {
          analytics: 'lsp settings',
          role: { oneOf: ['LSP-SETTINGS_READ_OWN', 'LSP-SETTINGS_UPDATE_OWN'] },
        },
      },
    ],
  },
  {
    path: '/certifications',
    components: {
      default: Certification,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'list-certification',
        component: CertificationGrid,
        meta: { analytics: 'certification', role: 'USER_READ_ALL' },
      },
      {
        path: 'create',
        name: 'certification-creation',
        component: CertificationEdit,
        meta: { analytics: 'certification-create', role: 'USER_CREATE_ALL' },
      },
      {
        path: ':entityId/details',
        name: 'certification-edition',
        component: CertificationEdit,
        props: true,
        meta: { analytics: 'certification-edit', role: 'USER_UPDATE_ALL' },
      },
    ],
  },
  {
    path: '/locations',
    components: {
      default: Location,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'list-location',
        component: LocationGrid,
        meta: { analytics: 'location', role: 'LOCATION_READ_ALL' },
      },
      {
        path: 'create',
        name: 'location-creation',
        component: LocationEdit,
        meta: { analytics: 'location-create', role: 'LOCATION_CREATE_ALL' },
      },
      {
        path: ':entityId/details',
        name: 'location-edition',
        component: LocationEdit,
        props: true,
        meta: { analytics: 'location-edit', role: 'LOCATION_UPDATE_ALL' },
      },
    ],
  },
  {
    path: '/document-types',
    components: {
      default: DocumentType,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'list-document-type',
        component: DocumentTypeGrid,
        meta: {
          analytics: 'list-document-type',
          role: 'DOCUMENT-TYPE_READ_ALL',
        },
      },
      {
        path: ':entityId/details',
        name: 'document-type-edition',
        component: DocumentTypeEdit,
        props: true,
        meta: {
          analytics: 'document-type-edition',
          role: 'DOCUMENT-TYPE_UPDATE_ALL',
        },
      },
      {
        path: 'create',
        name: 'document-type-creation',
        component: DocumentTypeEdit,
        meta: {
          analytics: 'document-type-creation',
          role: 'DOCUMENT-TYPE_CREATE_ALL',
        },
      },
    ],
  },
  {
    path: '/software-requirements',
    components: {
      default: SoftwareRequirement,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'list-software-requirement',
        component: SoftwareRequirementGrid,
        meta: {
          analytics: 'list-software-requirement',
          role: 'SOFTWARE-REQUIREMENT_READ_ALL',
        },
      },
      {
        path: ':entityId/details',
        name: 'software-requirement-edition',
        component: SoftwareRequirementEdit,
        props: true,
        meta: {
          analytics: 'software-requirement-edition',
          role: 'SOFTWARE-REQUIREMENT_UPDATE_ALL',
        },
      },
      {
        path: 'create',
        name: 'software-requirement-creation',
        component: SoftwareRequirementEdit,
        meta: {
          analytics: 'software-requirement-creation',
          role: 'SOFTWARE-REQUIREMENT_CREATE_ALL',
        },
      },
    ],
  },
  {
    path: '/template',
    components: {
      default: Template,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'list-template',
        component: TemplateGrid,
        meta: {
          analytics: 'list-template',
          role: 'TEMPLATE_READ_ALL',
        },
      },
      {
        path: ':entityId/details',
        name: 'template-edition',
        component: TemplateEdit,
        props: true,
        meta: {
          analytics: 'template-edition',
          role: 'TEMPLATE_UPDATE_ALL',
        },
      },
      {
        path: 'create',
        name: 'template-creation',
        component: TemplateEdit,
        meta: {
          analytics: 'template-creation',
          role: 'TEMPLATE_CREATE_ALL',
        },
      },
    ],
  },
  {
    path: '/custom-queries',
    components: {
      default: CustomQuery,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'list-custom-query',
        component: CustomQueryGrid,
        meta: {
          analytics: 'list-custom-query',
          role: ['CUSTOM-QUERY_READ_OWN', 'CUSTOM-QUERY_READ_ALL'],
        },
      },
      {
        path: 'create',
        name: 'custom-query-creation',
        component: CustomQueryEdit,
        props: true,
        meta: {
          analytics: 'custom-query-creation',
          role: 'CUSTOM-QUERY_CREATE_OWN',
        },
      },
      {
        path: ':entityId/details',
        name: 'custom-query-edition',
        component: CustomQueryEdit,
        props: true,
        meta: {
          analytics: 'custom-query-edition',
          role: [
            'CUSTOM-QUERY_READ_OWN',
            'CUSTOM-QUERY_READ_ALL',
            'CUSTOM-QUERY_UPDATE_OWN',
            'CUSTOM-QUERY_UPDATE_ALL',
          ],
        },
      },
    ],
  },
  {
    path: '/expense-account',
    components: {
      default: ExpenseAccount,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'list-expense-account',
        component: ExpenseAccountGrid,
        meta: { analytics: 'expense-account', role: 'EXPENSE-ACCOUNT_CREATE_ALL' },
      },
      {
        path: ':entityId/details',
        name: 'expense-account-edition',
        component: ExpenseAccountEdit,
        props: true,
        meta: { analytics: 'expense-account-edit', role: 'EXPENSE-ACCOUNT_UPDATE_ALL' },
      },
      {
        path: 'create',
        name: 'expense-account-creation',
        component: ExpenseAccountEdit,
        meta: {
          analytics: 'expense-account-create',
          role: 'EXPENSE-ACCOUNT_CREATE_ALL',
        },
      },
    ],
  },
  {
    path: '/ability-expense-account',
    components: {
      default: AbilityExpenseAccount,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'list-ability-expense-account',
        component: AbilityExpenseAccountGrid,
        meta: { analytics: 'ability-expense-account', role: 'EXPENSE-ACCOUNT_CREATE_ALL' },
      },
      {
        path: ':entityId/details',
        name: 'ability-expense-account-edition',
        component: AbilityExpenseAccountEdit,
        props: true,
        meta: { analytics: 'ability-expense-account-edit', role: 'EXPENSE-ACCOUNT_UPDATE_ALL' },
      },
      {
        path: 'create',
        name: 'ability-expense-account-creation',
        component: AbilityExpenseAccountEdit,
        meta: {
          analytics: 'ability-expense-account-create',
          role: 'EXPENSE-ACCOUNT_CREATE_ALL',
        },
      },
    ],
  },
  {
    path: '/company-department-relationship',
    components: {
      default: CompanyDepartmentRelationship,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'list-company-department-relationship',
        component: CompanyDepartmentRelationshipGrid,
        meta: {
          analytics: 'company-department-relationship',
          role: 'COMPANY-DEPT-RELATIONSHIP_CREATE_ALL',
        },
      },
      {
        path: ':entityId/details',
        name: 'company-department-relationship-edition',
        component: CompanyDepartmentRelationshipEdit,
        props: true,
        meta: {
          analytics: 'company-department-relationship-edit',
          role: 'COMPANY-DEPT-RELATIONSHIP_UPDATE_ALL',
        },
      },
      {
        path: 'create',
        name: 'company-department-relationship-creation',
        component: CompanyDepartmentRelationshipEdit,
        meta: {
          analytics: 'company-department-relationship-create',
          role: 'COMPANY-DEPT-RELATIONSHIP_CREATE_ALL',
        },
      },
    ],
  },
  {
    path: '/bill',
    components: {
      default: Bill,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'list-bill',
        component: BillGrid,
        meta: {
          analytics: 'bill',
          role: ['BILL_READ_ALL', 'BILL_READ_OWN'],
        },
      },
      {
        path: ':entityId/details',
        name: 'bill-edition',
        component: BillEdit,
        props: true,
        meta: {
          analytics: 'bill-edit',
          role: 'BILL_UPDATE_ALL',
        },
      },
      {
        path: 'preview/:entityId',
        name: 'bill-preview',
        component: BillPreview,
        meta: {
          analytics: 'bill-preview',
          role: { $oneOf: ['BILL_READ_ALL', 'BILL_READ_OWN'] },
        },
      },
    ],
  },
  {
    path: '/accounts',
    components: {
      default: RevenueAccounts,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'revenue-accounts',
        component: RevenueAccountsGrid,
        meta: {
          analytics: 'revenue-accounts',
          role: ['REVENUE-ACCOUNT_READ_ALL'],
        },
      },
      {
        path: 'create',
        name: 'revenue-account-creation',
        component: RevenueAccountEdit,
        meta: {
          analytics: 'revenue-account-creation',
          role: ['REVENUE-ACCOUNT_CREATE_ALL'],
        },
      },
      {
        path: ':entityId/details',
        name: 'revenue-account-edition',
        component: RevenueAccountEdit,
        props: true,
        meta: {
          analytics: 'revenue-account-edition',
          role: ['REVENUE-ACCOUNT_UPDATE_ALL'],
        },
      },
    ],
  },
  {
    path: '/bank-accounts',
    components: {
      default: BankAccount,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'bank-accounts',
        component: BankAccountGrid,
        meta: {
          analytics: 'bank-accounts',
          role: ['BANK-ACCOUNT_READ_ALL'],
        },
      },
      {
        path: 'create',
        name: 'bank-account-creation',
        component: BankAccountEdit,
        meta: {
          analytics: 'account-creation',
          role: ['BANK-ACCOUNT_CREATE_ALL'],
        },
      },
      {
        path: ':entityId/details',
        name: 'bank-account-edition',
        component: BankAccountEdit,
        props: true,
        meta: {
          analytics: 'account-edition',
          role: ['BANK-ACCOUNT_UPDATE_ALL', 'BANK-ACCOUNT_CREATE_ALL'],
        },
      },
    ],
  },
  {
    path: '/ap-payment',
    components: {
      default: ApPayment,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'list-ap-payment',
        component: ApPaymentGrid,
        meta: {
          analytics: 'list-ap-payment',
          role: ['AP-PAYMENT_READ_ALL', 'AP-PAYMENT_READ_OWN'],
        },
      },
      {
        path: 'create',
        name: 'ap-payment-creation',
        component: ApPaymentEdit,
        meta: {
          analytics: 'ap-payment-creation',
          role: ['AP-PAYMENT_CREATE_ALL'],
        },
      },
      {
        path: ':entityId/details',
        name: 'ap-payment-details',
        component: ApPaymentDetails,
        props: true,
        meta: {
          analytics: 'ap-payment-details',
          role: ['AP-PAYMENT_READ_ALL', 'AP-PAYMENT_READ_OWN'],
        },
      },
    ],
  },
  {
    path: '/connectors',
    components: {
      default: Connector,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'list-connector',
        component: ConnectorGrid,
        meta: {
          analytics: 'list-connector',
          role: ['CONNECTOR_READ_ALL'],
        },
      },
      {
        path: ':entityId/details',
        name: 'connector-edition',
        component: ConnectorEdit,
        props: true,
        meta: {
          analytics: 'connector-edition',
          role: ['CONNECTOR_READ_ALL', 'CONNECTOR_UPDATE_ALL'],
        },
      },
    ],
  },
  {
    path: '/ap-print-checks',
    components: {
      default: ApPrintChecks,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'ap-print-checks',
        component: ApPrintChecksDetails,
        meta: {
          analytics: 'ap-print-checks',
          role: ['AP-PAYMENT_READ_ALL'],
        },
      },
    ],
  },
  {
    path: '/bill-adjustment',
    components: {
      default: BillAdjustment,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'list-bill-adjustment',
        component: BillAdjustmentGrid,
        meta: {
          analytics: 'bill-adjustment',
          role: ['BILL-ADJUSTMENT_READ_OWN', 'BILL-ADJUSTMENT_READ_ALL'],
        },
      },
      {
        path: 'create',
        name: 'bill-adjustment-creation',
        component: BillAdjustmentEdit,
        props: true,
        meta: {
          analytics: 'bill-adjustment-creation',
          role: 'BILL-ADJUSTMENT_CREATE_OWN',
        },
      },
      {
        path: ':entityId/details',
        name: 'bill-adjustment-details',
        component: BillAdjustmentDetails,
        props: true,
        meta: {
          analytics: 'bill-adjustment-details',
          role: ['BILL-ADJUSTMENT_READ_ALL', 'BILL-ADJUSTMENT_READ_OWN'],
        },
      },
    ],
  },
  {
    path: '/assignment-status',
    components: {
      default: AssignmentStatus,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'assignment-status-list',
        component: AssignmentStatusGrid,
        meta: {
          analytics: 'assignment-status-list',
          role: 'COMPANY-MIN-CHARGE_READ_ALL',
        },
      },
      {
        path: ':entityId/details',
        name: 'assignment-status-edition',
        component: AssignmentStatusEdit,
        props: true,
        meta: {
          analytics: 'assignment-status-edition',
          role: 'COMPANY-MIN-CHARGE_UPDATE_ALL',
        },
      },
      {
        path: 'create',
        name: 'assignment-status-creation',
        component: AssignmentStatusEdit,
        meta: {
          analytics: 'assignment-status-creation',
          role: 'COMPANY-MIN-CHARGE_CREATE_ALL',
        },
      },
    ],
  },
  {
    path: '/vendor-minimum-charge',
    components: {
      default: VendorMinimumCharge,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'list-vendor-minimum-charge',
        component: VendorMinimumChargeGrid,
        meta: {
          analytics: 'vendor-minimum-charge-edit',
          role: 'VENDOR-MIN-CHARGE_UPDATE_ALL',
        },
      },
      {
        path: ':entityId/details',
        name: 'vendor-minimum-charge-edition',
        component: VendorMinimumChargeEdit,
        props: true,
        meta: {
          analytics: 'vendor-minimum-charge-edit',
          role: 'VENDOR-MIN-CHARGE_UPDATE_ALL',
        },
      },
      {
        path: 'create',
        name: 'vendor-minimum-charge-creation',
        component: VendorMinimumChargeEdit,
        meta: {
          analytics: 'vendor-minimum-charge-create',
          role: 'VENDOR-MIN-CHARGE_CREATE_ALL',
        },
      },
    ],
  },
  {
    path: '/invoices',
    components: {
      default: Invoice,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'invoices',
        component: InvoiceGrid,
        meta: {
          analytics: 'invoice',
          role: { $oneOf: ['INVOICE_READ_ALL', 'INVOICE_READ_OWN', 'INVOICE_READ_COMPANY'] },
        },
      },
      {
        path: 'create',
        name: 'invoice-creation',
        component: InvoiceEdit,
        meta: {
          analytics: 'invoice-creation',
          role: ['INVOICE_CREATE_ALL', 'INVOICE-ACCT_READ_ALL'],
        },
      },
      {
        path: ':entityId/details',
        name: 'invoice-edition',
        component: InvoiceEdit,
        props: true,
        meta: {
          analytics: 'invoice-edition',
          role: { $oneOf: ['INVOICE_UPDATE_ALL', 'INVOICE_UPDATE_OWN'] },
        },
      },
      {
        path: 'preview/:entityId',
        name: 'invoice-preview',
        component: InvoicePreview,
        meta: {
          analytics: 'invoice-preview',
          role: { $oneOf: ['INVOICE_READ_ALL', 'INVOICE_READ_OWN', 'INVOICE_READ_COMPANY'] },
        },
      },
      {
        path: 'activities',
        name: 'invoice-activity-grid',
        component: ActivityGrid,
        meta: {
          analytics: 'invoice-activity-grid',
          role: 'USER_READ_ALL',
          family: 'user',
        },
      },
      {
        path: 'activities/create',
        name: 'invoice-activity-creation',
        component: ActivityEdit,
        meta: {
          analytics: 'invoice-activity-creation',
          role: 'USER_READ_ALL',
          family: 'user',
        },
      },
      {
        path: 'activities/:entityId/details',
        name: 'invoice-activity-edition',
        component: ActivityEdit,
        props: true,
        meta: {
          analytics: 'invoice-activity-edition',
          role: 'USER_READ_ALL',
          family: 'user',
        },
      },
    ],
  },
  {
    path: '/company-minimum-charge',
    components: {
      default: CompanyMinimumCharge,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'list-company-minimum-charge',
        component: CompanyMinimumChargeGrid,
        meta: {
          analytics: 'list-company-minimum-charge',
          role: 'COMPANY-MIN-CHARGE_READ_ALL',
        },
      },
      {
        path: ':entityId/details',
        name: 'company-minimum-charge-edition',
        component: CompanyMinimumChargeEdit,
        props: true,
        meta: {
          analytics: 'company-minimum-charge-edition',
          role: 'COMPANY-MIN-CHARGE_CREATE_ALL',
        },
      },
      {
        path: 'create',
        name: 'company-minimum-charge-creation',
        component: CompanyMinimumChargeEdit,
        meta: {
          analytics: 'company-minimum-charge-creation',
          role: 'COMPANY-MIN-CHARGE_CREATE_ALL',
        },
      },
    ],
  },
  {
    path: '/adjustments',
    components: {
      default: Adjustments,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'adjustments',
        component: AdjustmentsGrid,
        meta: {
          analytics: 'adjustments',
          role: {
            $oneOf: [
              'AR-ADJUSTMENT_READ_ALL',
              'AR-ADJUSTMENT_READ_OWN',
              'AR-ADJUSTMENT_READ_COMPANY',
            ],
          },
        },
      },
      {
        path: 'create',
        name: 'adjustment-creation',
        component: AdjustmentEdit,
        meta: {
          analytics: 'adjustment-creation',
          role: ['AR-ADJUSTMENT_CREATE_ALL', 'AR-ADJUSTMENT-ACCT_READ_ALL'],
        },
      },
      {
        path: ':entityId/details',
        name: 'adjustment-detail',
        props: true,
        component: AdjustmentEdit,
        meta: {
          analytics: 'adjustment-detail',
          role: {
            $oneOf: [
              'AR-ADJUSTMENT_READ_ALL',
              'AR-ADJUSTMENT_READ_OWN',
              'AR-ADJUSTMENT_READ_COMPANY',
            ],
          },
        },
      },
    ],
  },
  {
    path: '/advances',
    components: {
      default: Advances,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'advances',
        component: AdvancesGrid,
        meta: {
          analytics: 'advances',
          role: {
            $oneOf: [
              'AR-PAYMENT_READ_ALL',
              'AR-PAYMENT_READ_COMPANY',
              'AR-PAYMENT_READ_OWN',
            ],
          },
        },
      },
      {
        path: 'create',
        name: 'advance-creation',
        component: AdvanceEdit,
        meta: {
          analytics: 'advance-creation',
          role: ['AR-PAYMENT_CREATE_ALL', 'AR-PAYMENT-ACCT_READ_ALL'],
        },
      },
      {
        path: ':entityId/details',
        name: 'advance-edition',
        component: AdvanceEdit,
        props: true,
        meta: {
          analytics: 'advance-edition',
          role: {
            $oneOf: [
              'AR-PAYMENT_UPDATE_ALL',
              'AR-PAYMENT_UPDATE_OWN',
            ],
          },
        },
      },
    ],
  },
  {
    path: '/payments',
    components: {
      default: Payments,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'payments',
        component: PaymentsGrid,
        meta: {
          analytics: 'payments',
          role: {
            $oneOf: [
              'AR-PAYMENT_READ_ALL',
              'AR-PAYMENT_READ_COMPANY',
              'AR-PAYMENT_READ_OWN',
            ],
          },
        },
      },
      {
        path: 'create',
        name: 'payment-creation',
        component: PaymentEdit,
        meta: {
          analytics: 'payment-creation',
          role: ['AR-PAYMENT_CREATE_ALL', 'AR-PAYMENT-ACCT_READ_ALL'],
        },
      },
      {
        path: ':entityId/details',
        name: 'payment-detail',
        component: PaymentEdit,
        props: true,
        meta: {
          analytics: 'payment-detail',
          role: {
            $oneOf: [
              'AR-PAYMENT_UPDATE_ALL',
              'AR-PAYMENT_UPDATE_OWN',
            ],
          },
        },
      },
    ],
  },
  {
    path: '/cc-payments',
    components: {
      default: CcPayments,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'cc-payments',
        component: CcPaymentsGrid,
        meta: {
          analytics: 'payments',
          role: 'CC-PAYMENT_READ_ALL',
        },
      },
    ],
  },
  {
    path: '/mt-models',
    components: {
      default: MtModel,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'list-mt-model',
        component: MtModelGrid,
        meta: { analytics: 'list-mt-model', role: 'MT-MODEL_READ_ALL' },
      },
      {
        path: 'create',
        name: 'mt-model-creation',
        component: MtModelEdit,
        meta: { analytics: 'mt-model-creation', role: 'MT-MODEL_CREATE_ALL' },
      },
      {
        path: ':entityId/details',
        name: 'mt-model-edition',
        component: MtModelEdit,
        props: true,
        meta: { analytics: 'mt-model-edition', role: 'MT-MODEL_UPDATE_ALL' },

      },
    ],
  },
  {
    path: '/mt-translator',
    components: {
      default: MtTranslator,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'mt-translator',
        component: MtTranslator,
        meta: {
          analytics: 'mt-translator',
          role: { $oneOf: ['MT-TRANSLATOR_READ_ALL'] },
        },
      },
    ],
  },
  {
    path: '/ip-order',
    components: {
      default: IPOrder,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'ip-order-dashboard',
        component: IPOrderGrid,
        meta: {
          analytics: 'list-ip-order-create-options',
          role: 'IP-ORDER_CREATE_OWN',
        },
      },
      {
        path: '/ip-order/wipo-create',
        name: 'ip-order-wipo-create',
        component: IPOrderWipoCreate,
        props: true,
        meta: {
          analytics: 'ip-order-wipo-create',
        },
      },
      {
        path: '/ip-order/epo-create',
        name: 'ip-order-epo-create',
        component: IPOrderEpoCreate,
        props: true,
        meta: {
          analytics: 'ip-order-epo-create',
        },
      },
      {
        path: '/ip-order/create/no-db',
        name: 'ip-order-create-no-db',
        component: IPOrderCreateNoDB,
        props: true,
        meta: {
          analytics: 'ip-order-create-no-db',
          role: 'IP-QUOTE_CREATE_OWN',
        },
      },
      {
        path: '/ip-order/create/no-db-filing',
        name: 'ip-order-create-no-db-filing',
        component: IPOrderCreateNoDBFiling,
        props: true,
        meta: {
          analytics: 'ip-order-create-no-db-filing',
          role: 'IP-QUOTE_CREATE_OWN',
        },
      },
    ],
  },
  {
    path: '/ip-quote',
    components: {
      default: IPQuote,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '/ip-quote',
        name: 'ip-quote-dashboard',
        component: IPQuoteGrid,
        meta: {
          analytics: 'ip-quote-dashboard',
          role: 'IP-QUOTE_CREATE_OWN',
        },
      },
      {
        path: '/ip-quote/create',
        name: 'ip-quote-create',
        component: IPQuoteCreate,
        props: true,
        meta: {
          analytics: 'ip-quote-create',
          role: 'IP-QUOTE_CREATE_OWN',
        },
      },
      {
        path: '/ip-quote/:entityId/wipo',
        name: 'ip-quote-wipo-edit',
        component: IPQuoteCreate,
        props: true,
        meta: {
          analytics: 'ip-quote-wipo-edit',
          role: 'IP-QUOTE_UPDATE_OWN',
        },
      },
      {
        path: '/ip-quote/epo-create',
        name: 'ip-quote-epo-create',
        component: IPQuoteEpoCreate,
        props: true,
        meta: {
          analytics: 'ip-quote-epo-create',
        },
      },
      {
        path: '/ip-quote/:entityId/epo',
        name: 'ip-quote-epo-edit',
        component: IPQuoteEpoCreate,
        props: true,
        meta: {
          analytics: 'ip-quote-epo-edit',
          role: 'IP-QUOTE_UPDATE_OWN',
        },
      },
      {
        path: '/ip-quote/create/no-db',
        name: 'ip-quote-create-no-db',
        component: IPQuoteCreateNoDB,
        props: true,
        meta: {
          analytics: 'ip-quote-create-no-db',
          role: 'IP-QUOTE_CREATE_OWN',
        },
      },
      {
        path: '/ip-quote/:entityId/no-db',
        name: 'ip-quote-no-db-edit',
        component: IPQuoteCreateNoDB,
        props: true,
        meta: {
          analytics: 'ip-quote-no-db-edit',
          role: 'IP-QUOTE_UPDATE_OWN',
        },
      },
      {
        path: '/ip-quote/create/no-db-filing',
        name: 'ip-quote-create-no-db-filing',
        component: IPQuoteCreateNoDBFiling,
        props: true,
        meta: {
          analytics: 'ip-quote-create-no-db-filing',
          role: 'IP-QUOTE_CREATE_OWN',
        },
      },
      {
        path: '/ip-quote/:entityId/no-db-filing',
        name: 'ip-quote-no-db-filing-edit',
        component: IPQuoteCreateNoDBFiling,
        props: true,
        meta: {
          analytics: 'ip-quote-no-db-filing-edit',
          role: 'IP-QUOTE_UPDATE_OWN',
        },
      },
    ],
  },
  {
    path: '/import-entities',
    name: 'import-entities',
    components: {
      default: ImportEntities,
      sidebar: SideBar,
      header: Header,
    },
    meta: {
      analytics: 'import-entities',
      role: 'ENTITIES-IMPORT_CREATE_ALL',
    },
  },
  {
    path: '/compromised-password',
    name: 'compromised-password',
    components: {
      default: CompromisedPassword,
      sidebar: SideBar,
      header: Header,
    },
    children: [{
      path: '',
      name: 'list-compromised-password',
      component: CompromisedPasswordGrid,
      meta: {
        analytics: 'list-compromised-password',
        role: ['COMPROMISED-PASSWORD_READ_ALL'],
      },
    }],
    meta: {
      analytics: 'list-compromised-password',
    },
  },
  {
    path: '/provider-instructions',
    components: {
      default: ProviderInstructions,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'list-provider-instructions',
        component: ProviderInstructionsGrid,
        meta: {
          analytics: 'provider-instructions',
          role: 'PROVIDER-TASK-INSTRUCTIONS_READ_ALL',
        },
      },
      {
        path: ':entityId/details',
        name: 'provider-instructions-edition',
        component: ProviderInstructionsEdit,
        props: true,
        meta: {
          analytics: 'provider-instructions-edit',
          role: 'PROVIDER-TASK-INSTRUCTIONS_UPDATE_ALL',
        },
      },
      {
        path: 'create',
        name: 'provider-instructions-creation',
        component: ProviderInstructionsEdit,
        meta: {
          analytics: 'provider-instructions-create',
          role: 'PROVIDER-TASK-INSTRUCTIONS_CREATE_ALL',
        },
      },
    ],
  },
  {
    path: '/footer-templates',
    components: {
      default: FooterTemplate,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'list-footer-template',
        component: FooterTemplateGrid,
        meta: { analytics: 'footer-template', role: 'FOOTER-TEMPLATE_READ_ALL' },
      },
      {
        path: ':entityId',
        name: 'footer-template-edition',
        component: FooterTemplateEdit,
        props: true,
        meta: { analytics: 'footer-template-edit', role: 'FOOTER-TEMPLATE_UPDATE_ALL' },
      },
      {
        path: 'create',
        name: 'footer-template-creation',
        component: FooterTemplateEdit,
        meta: {
          analytics: 'footer-template-create',
          role: 'FOOTER-TEMPLATE_CREATE_ALL',
        },
      },
    ],
  },
  {
    path: '/service-types',
    components: {
      default: ServiceType,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'list-service-type',
        component: ServiceTypeGrid,
        meta: { analytics: 'service-type', role: 'SERVICE-TYPE_READ_ALL' },
      },
      {
        path: ':entityId',
        name: 'service-type-edition',
        component: ServiceTypeEdit,
        props: true,
        meta: { analytics: 'service-type-edit', role: 'SERVICE-TYPE_UPDATE_ALL' },
      },
      {
        path: 'create',
        name: 'service-type-creation',
        component: ServiceTypeEdit,
        meta: {
          analytics: 'service-type-create',
          role: 'SERVICE-TYPE_CREATE_ALL',
        },
      },
    ],
  },
  {
    path: '/delivery-types',
    components: {
      default: DeliveryType,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'list-delivery-type',
        component: DeliveryTypeGrid,
        meta: { analytics: 'delivery-type', role: 'DELIVERY-TYPE_READ_ALL' },
      },
      {
        path: ':entityId',
        name: 'delivery-type-edition',
        component: DeliveryTypeEdit,
        props: true,
        meta: { analytics: 'delivery-type-edit', role: 'DELIVERY-TYPE_UPDATE_ALL' },
      },
      {
        path: 'create',
        name: 'delivery-type-creation',
        component: DeliveryTypeEdit,
        meta: {
          analytics: 'delivery-type-create',
          role: 'DELIVERY-TYPE_CREATE_ALL',
        },
      },
    ],
  },
  {
    path: '/ip-instructions-deadlines',
    components: {
      default: IpInstructionsDeadline,
      sidebar: SideBar,
      header: Header,
    },
    children: [
      {
        path: '',
        name: 'list-ip-instructions-deadline',
        component: IpInstructionsDeadlineGrid,
        meta: {
          analytics: 'translationUnit',
          role: 'IP-INSTRUCTIONS-DEADLINE_READ_ALL',
        },
      },
      {
        path: ':entityId/details',
        name: 'ip-instructions-deadline-edition',
        component: IpInstructionsDeadlineEdit,
        props: true,
        meta: {
          analytics: 'ip-instructions-deadline-edit',
          role: 'IP-INSTRUCTIONS-DEADLINE_UPDATE_ALL',
        },
      },
      {
        path: 'create',
        name: 'ip-instructions-deadline-creation',
        component: IpInstructionsDeadlineEdit,
        meta: {
          analytics: 'ip-instructions-deadline-create',
          role: 'IP-INSTRUCTIONS-DEADLINE_CREATE_ALL',
        },
      },
    ],
  },
  {
    path: '/mock-saml-redirect/:lspId/:companyId',
    name: 'mock-saml-redirect',
    components: {
      login: MockSamlRedirect,
    },
    meta: { analytics: 'mock-saml-redirect', public: true },
  },
];
// catch all wildcard, redirect to home
// this should be the last one
routes.push({
  path: '*',
  redirect: '/home',
});
