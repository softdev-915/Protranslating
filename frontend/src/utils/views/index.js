import _ from 'lodash';
import { hasRole } from '../user';
import BrowserStorage from '../browser-storage';

const INVALID_INVOICES_VIEW_USERS = ['Staff', 'Vendor'];
const INVALID_QUOTES_VIEW_USERS = ['Staff', 'Vendor'];
const INVALID_DASHBOARD_VIEW_USERS = ['Staff', 'Vendor'];
const views = [
  {
    id: 'user-management',
    name: 'Users',
    description: 'Add, edit or deactivate users and their roles and groups',
    route: { name: 'list-user' },
    keywords: ['users', 'roles', 'groups'],
    role: 'USER_READ_ALL',
  },
  {
    id: 'active-user-sessions',
    name: 'Active User Sessions',
    description: 'Inspect the current sessions for any logged in users',
    route: { name: 'active-user-sessions' },
    keywords: ['active', 'user', 'session'],
    role: ['ACTIVE-USER-SESSION_READ_ALL'],
  },
  {
    id: 'group-management',
    name: 'Groups',
    description: 'Add and edit groups',
    route: { name: 'list-group' },
    keywords: ['roles', 'groups'],
    role: 'GROUP_READ_ALL',
    hiddenForRole: 'SITE-MAP_READ_OWN',
  },
  {
    id: 'schedule-management',
    name: 'Scheduler',
    description: 'View and edit the application\'s scheduled jobs',
    route: { name: 'list-scheduler' },
    keywords: ['scheduler', 'emails', 'jobs'],
    role: 'SCHEDULER_READ_ALL',
    hiddenForRole: 'SITE-MAP_READ_OWN',
  },
  {
    id: 'company-management',
    name: 'Companies',
    description: 'Add and edit companies',
    route: { name: 'list-company' },
    keywords: ['companies'],
    role: ['COMPANY_READ_ALL', 'COMPANY_READ_OWN'],
    hiddenForRole: 'SITE-MAP_READ_OWN',
  },
  {
    id: 'audit-management',
    name: 'Audit',
    description: 'Audit management',
    route: { name: 'audit' },
    keywords: ['audit'],
    role: 'AUDIT_READ_ALL',
    hiddenForRole: 'SITE-MAP_READ_OWN',
  },
  {
    id: 'notification-management',
    name: 'Notifications',
    description: 'View system notification\'s list',
    route: { name: 'list-notification' },
    keywords: ['notification'],
    role: 'NOTIFICATION_READ_ALL',
    hiddenForRole: 'SITE-MAP_READ_OWN',
  },
  {
    id: 'ability-management',
    name: 'Abilities',
    description: 'View user abilities list',
    route: { name: 'list-ability' },
    keywords: ['ability'],
    role: ['USER_READ_ALL', 'ABILITY_READ_ALL'],
    hiddenForRole: 'SITE-MAP_READ_OWN',
  },
  {
    id: 'cat-tool-management',
    name: 'Translation Tools',
    description: 'View system Translation Tools list',
    route: { name: 'list-cat-tools' },
    keywords: ['cat tool', 'cat', 'tool'],
    role: ['USER_READ_ALL', 'CAT_READ_ALL'],
    hiddenForRole: 'SITE-MAP_READ_OWN',
  },
  {
    id: 'language-management',
    name: 'Languages',
    description: 'View system languages list',
    route: { name: 'list-language' },
    keywords: ['language'],
    role: ['LANGUAGE_CREATE_ALL', 'LANGUAGE_UPDATE_ALL'],
    hiddenForRole: 'SITE-MAP_READ_OWN',
  },
  {
    id: 'competence-level-management',
    name: 'Competence Levels',
    description: 'View system competence levels list',
    route: { name: 'list-competence-levels' },
    keywords: ['competence level', 'competence', 'level'],
    role: 'USER_READ_ALL',
    hiddenForRole: 'SITE-MAP_READ_OWN',
  },
  {
    id: 'activity-management',
    name: 'Activities',
    description: 'View activity list',
    route: { name: 'list-activity' },
    keywords: ['activity'],
    role: [
      'ACTIVITY-NC-CC_CREATE_ALL',
      'ACTIVITY-NC-CC_READ_ALL',
      'ACTIVITY-NC-CC_UPDATE_ALL',
      'ACTIVITY-NC-CC_CREATE_OWN',
      'ACTIVITY-NC-CC_READ_OWN',
      'ACTIVITY-NC-CC_UPDATE_OWN',
      'ACTIVITY-VES1_READ_ALL',
      'ACTIVITY-VES1_CREATE_ALL',
      'ACTIVITY-VES1_UPDATE_ALL',
      'ACTIVITY-VES2_READ_ALL',
      'ACTIVITY-VES2_CREATE_ALL',
      'ACTIVITY-VES2_UPDATE_ALL',
      'ACTIVITY-VES-T_READ_ALL',
      'ACTIVITY-VES-T_CREATE_ALL',
      'ACTIVITY-VES-T_UPDATE_ALL',
      'ACTIVITY-VES-B_READ_ALL',
      'ACTIVITY-VES-B_CREATE_ALL',
      'ACTIVITY-VES-B_UPDATE_ALL',
      'ACTIVITY-CA_READ_ALL',
      'ACTIVITY-CA_CREATE_ALL',
      'ACTIVITY-CA_UPDATE_ALL',
      'ACTIVITY-FR_READ_ALL',
      'ACTIVITY-FR_CREATE_ALL',
      'ACTIVITY-FR_UPDATE_ALL',
      'ACTIVITY-NC-CC_READ_DEPARTMENT',
      'ACTIVITY-NC-CC_CREATE_DEPARTMENT',
      'ACTIVITY-NC-CC_UPDATE_DEPARTMENT',
      'ACTIVITY-EMAIL_READ_ALL',
      'ACTIVITY-EMAIL_READ_OWN',
    ],
    hiddenForRole: 'SITE-MAP_READ_OWN',
  },
  {
    id: 'activity-tag-management',
    name: 'Activity Tags',
    description: 'View activity tag list',
    route: { name: 'list-activity-tags' },
    keywords: ['tag'],
    role: [
      'ACTIVITY-TAG_CREATE_ALL',
      'ACTIVITY-TAG_READ_ALL',
      'ACTIVITY-TAG_UPDATE_ALL',
    ],
    hiddenForRole: 'SITE-MAP_READ_OWN',
  },
  {
    id: 'list-request',
    name: 'Requests',
    description: 'View the translation request\'s list',
    route: { name: 'list-request' },
    keywords: ['translation', 'request'],
    role: ['REQUEST_READ_OWN', 'REQUEST_READ_ALL'],
    hiddenForRole: 'SITE-MAP_READ_OWN',
  },
  {
    id: 'task-grid',
    name: 'Tasks',
    description: 'Task',
    route: { name: 'task-grid' },
    keywords: ['task', 'grid'],
    role: ['TASK_READ_ALL', 'TASK_READ_OWN'],
  },
  {
    id: 'create-request',
    name: 'Create Request',
    description: 'Create a new translation request',
    route: { name: 'create-request' },
    keywords: ['create', 'translation', 'request'],
    role: ['REQUEST_CREATE_OWN', 'REQUEST_CREATE_ALL'],
    hiddenForRole: 'SITE-MAP_READ_OWN',
  },
  {
    id: 'list-template',
    name: 'Templates',
    description: 'View the quote templates list',
    route: { name: 'list-template' },
    keywords: ['templates'],
    role: 'TEMPLATE_READ_ALL',
    hiddenForRole: 'SITE-MAP_READ_OWN',
  },
  {
    id: 'toast',
    name: 'Header Notifications',
    description: 'Create or edit header notifications',
    route: { name: 'list-toast' },
    keywords: ['header', 'notification', 'toast'],
    role: ['HEADER-NOTIFICATION_READ_ALL'],
    hiddenForRole: 'SITE-MAP_READ_OWN',
  },
  {
    id: 'request-type',
    name: 'Request\'s type ',
    description: 'Create or edit request\'s types',
    route: { name: 'list-request-type' },
    keywords: ['request', 'type'],
    role: ['REQUEST_CREATE_ALL'],
    hiddenForRole: 'SITE-MAP_READ_OWN',
  },
  {
    id: 'scheduling-status',
    name: 'Request\'s scheduling status ',
    description: 'Create or edit request\'s scheduling status',
    route: { name: 'list-scheduling-status' },
    keywords: ['request', 'scheduling', 'status'],
    role: ['REQUEST_CREATE_ALL'],
    hiddenForRole: 'SITE-MAP_READ_OWN',
  },
  {
    id: 'list-payment-method',
    name: 'Payment methods',
    description: 'Form of payments',
    route: { name: 'list-payment-method' },
    keywords: ['payment', 'method'],
    role: 'PAYMENT-METHOD_READ_ALL',
    hiddenForRole: 'SITE-MAP_READ_OWN',
  },
  {
    id: 'list-billing-term',
    name: 'Billing terms',
    description: 'Billing terms',
    route: { name: 'list-billing-term' },
    keywords: ['billing', 'terms'],
    role: 'BILLING-TERM_READ_ALL',
    hiddenForRole: 'SITE-MAP_READ_OWN',
  },
  {
    id: 'list-translation-unit',
    name: 'Units',
    description: 'Units',
    route: { name: 'list-translation-unit' },
    keywords: ['translation', 'units'],
    role: 'TRANSLATION-UNIT_READ_ALL',
    hiddenForRole: 'SITE-MAP_READ_OWN',
  },
  {
    id: 'list-currency',
    name: 'Currency',
    description: 'Currencies',
    route: { name: 'list-currency' },
    keywords: ['currencies'],
    hiddenForRole: 'SITE-MAP_READ_OWN',
  },
  {
    id: 'list-internal-department',
    name: 'LSP Internal Department',
    description: 'Internal Department',
    route: { name: 'list-internal-department' },
    keywords: ['internal', 'department'],
    role: 'INTERNAL-DEPARTMENT_READ_ALL',
    hiddenForRole: 'SITE-MAP_READ_OWN',
  },
  {
    id: 'list-breakdown',
    name: 'Breakdown',
    description: 'Breakdown list',
    route: { name: 'list-breakdown' },
    keywords: ['breakdown'],
    role: 'BREAKDOWN_READ_ALL',
    hiddenForRole: 'SITE-MAP_READ_OWN',
  },
  {
    id: 'external-resource',
    name: 'External Resources',
    description: 'View all external resources',
    route: { name: 'external-resource' },
    keywords: ['external', 'resources'],
    role: ['EXTERNAL-RESOURCES_READ_ALL', 'EXTERNAL-RESOURCES_UPDATE_ALL'],
    hiddenForRole: 'SITE-MAP_READ_OWN',
  },
  {
    id: 'list-lead-source',
    name: 'Lead source',
    description: 'Lead source',
    route: { name: 'list-lead-source' },
    keywords: ['lead', 'source'],
    role: 'LEAD-SOURCE_READ_ALL',
    hiddenForRole: 'SITE-MAP_READ_OWN',
  },
  {
    id: 'list-tax-form',
    name: 'Tax Form',
    description: 'View all tax forms',
    route: { name: 'list-tax-form' },
    keywords: ['tax', 'form'],
    role: 'USER_READ_ALL',
    hiddenForRole: 'SITE-MAP_READ_OWN',
  }, {
    id: 'list-opportunity',
    name: 'Opportunities',
    description: 'Opportunities',
    route: { name: 'list-opportunity' },
    keywords: ['opportunity', 'opportunities'],
    role: ['OPPORTUNITY_READ_ALL', 'OPPORTUNITY_READ_OWN'],
    hiddenForRole: 'SITE-MAP_READ_OWN',
  }, {
    id: 'lsp-settings',
    name: 'LSP settings',
    description: 'LSP settings',
    route: { name: 'lsp-settings' },
    keywords: ['lsp', 'settings'],
    role: ['LSP-SETTINGS_READ_OWN', 'LSP-SETTINGS_UPDATE_OWN'],
    hiddenForRole: 'SITE-MAP_READ_OWN',
  }, {
    id: 'list-certification',
    name: 'Certifications',
    description: 'Certifications',
    route: { name: 'list-certification' },
    keywords: ['certifications'],
    roles: ['USER_READ_ALL'],
    hiddenForRole: 'SITE-MAP_READ_OWN',
  }, {
    id: 'list-location',
    name: 'Locations',
    description: 'Locations',
    route: { name: 'list-location' },
    keywords: ['locations'],
    roles: ['LOCATION_READ_ALL'],
    hiddenForRole: 'SITE-MAP_READ_OWN',
  },
  {
    id: 'list-document-type',
    name: 'Document Type',
    description: 'View all document types',
    route: { name: 'list-document-type' },
    keywords: ['document', 'type'],
    role: 'DOCUMENT-TYPE_READ_ALL',
    hiddenForRole: 'SITE-MAP_READ_OWN',
  },
  {
    id: 'list-delivery-method',
    name: 'Delivery Method',
    description: 'View all delivery methods',
    route: { name: 'list-delivery-method' },
    keywords: ['delivery', 'method'],
    role: 'DELIVERY-METHOD_READ_ALL',
    hiddenForRole: 'SITE-MAP_READ_OWN',
  },
  {
    id: 'list-assignment-status',
    name: 'Assignment Status',
    description: 'View assignment status list',
    route: { name: 'assignment-status-list' },
    keywords: ['assignment', 'status'],
    role: 'ASSIGNMENT-STATUS_READ_ALL',
    hiddenForRole: 'SITE-MAP_READ_OWN',
  },
  {
    id: 'list-software-requirement',
    name: 'Software Requirement',
    description: 'View all software requirements',
    route: { name: 'list-software-requirement' },
    keywords: ['software', 'requirement'],
    role: 'SOFTWARE-REQUIREMENT_READ_ALL',
    hiddenForRole: 'SITE-MAP_READ_OWN',
  },
  {
    id: 'list-company-minimum-charge',
    name: 'Company minimum charge',
    description: 'View company minimum charge list',
    route: { name: 'list-company-minimum-charge' },
    keywords: ['company min', 'company rates', 'company minimum charge', 'charge'],
    role: 'COMPANY-MIN-CHARGE_READ_ALL',
    hiddenForRole: 'SITE-MAP_READ_OWN',
  },
  {
    id: 'mt-engines',
    name: 'MT engines',
    description: 'View MT engines',
    route: { name: 'list-mt-engine' },
    keywords: ['mt engines', 'mt', 'engines'],
    role: ['MT-ENGINES_READ_ALL'],
    hiddenForRole: 'SITE-MAP_READ_OWN',
  },
  {
    id: 'list-custom-query',
    name: 'Custom Query',
    description: 'Custom Queries for reports generation',
    route: { name: 'list-custom-query' },
    keywords: ['custom', 'query'],
    role: ['CUSTOM-QUERY_READ_OWN', 'CUSTOM-QUERY_READ_ALL'],
    hiddenForRole: 'SITE-MAP_READ_OWN',
  },
  {
    id: 'invoices',
    name: 'Accounts Receivable (AR) Invoices',
    description: 'View and edit AR invoices',
    route: { name: 'invoices' },
    keywords: ['accounts receivable', 'accounts', 'receivable', 'ar', 'invoices'],
    role: ['INVOICE_READ_OWN', 'INVOICE_READ_ALL', 'INVOICE_READ_COMPANY'],
    hiddenForRole: 'SITE-MAP_READ_OWN',
  },
  {
    id: 'adjustments',
    name: 'Accounts Receivable (AR) Adjustments',
    description: 'View and edit AR adjustments',
    route: { name: 'adjustments' },
    keywords: ['accounts receivable', 'accounts', 'receivable', 'ar', 'adjustments'],
    role: ['AR-ADJUSTMENT_READ_ALL', 'AR-ADJUSTMENT_READ_OWN', 'AR-ADJUSTMENT_READ_COMPANY'],
    hiddenForRole: 'SITE-MAP_READ_OWN',
  },
  {
    id: 'advances',
    name: 'Accounts Receivable (AR) Advances',
    description: 'View and edit AR advances',
    route: { name: 'advances' },
    keywords: ['accounts receivable', 'accounts', 'receivable', 'ar', 'advances'],
    role: ['AR-PAYMENT_READ_ALL', 'AR-PAYMENT_READ_OWN', 'AR-PAYMENT_READ_COMPANY'],
  },
  {
    id: 'payments',
    name: 'Accounts Receivable (AR) Payments',
    description: 'View and edit AR payments',
    route: { name: 'payments' },
    keywords: ['accounts receivable', 'accounts', 'receivable', 'ar', 'payments'],
    role: ['AR-PAYMENT_READ_ALL', 'AR-PAYMENT_READ_OWN', 'AR-PAYMENT_READ_COMPANY'],
  },
  {
    id: 'list-connector',
    name: 'Connectors',
    description: 'Accounting connectors',
    route: { name: 'list-connector' },
    keywords: ['connector'],
    role: ['CONNECTOR_READ_ALL'],
    hiddenForRole: 'SITE-MAP_READ_OWN',
  },
  {
    id: 'expense-account',
    name: 'Expense accounts',
    description: 'View all expense accounts',
    route: { name: 'list-expense-account' },
    keywords: ['expense', 'account'],
    role: 'EXPENSE-ACCOUNT_READ_ALL',
    hiddenForRole: 'SITE-MAP_READ_OWN',
  },
  {
    id: 'ability-expense-account',
    name: 'Ability expense accounts',
    description: 'View all ability expense accounts',
    route: { name: 'list-ability-expense-account' },
    keywords: ['ability', 'expense', 'account'],
    role: 'EXPENSE-ACCOUNT_READ_ALL',
    hiddenForRole: 'SITE-MAP_READ_OWN',
  },
  {
    id: 'company-department-relationship',
    name: 'Company department relationship',
    description: 'View all company department relationships',
    route: { name: 'list-company-department-relationship' },
    keywords: ['company', 'department', 'relationship'],
    role: 'COMPANY-DEPT-RELATIONSHIP_READ_ALL',
    hiddenForRole: 'SITE-MAP_READ_OWN',
  },
  {
    id: 'vendor-minimum-charge',
    name: 'Vendor minimum charge rates',
    description: 'View all vendor minimum charge rates',
    route: { name: 'list-vendor-minimum-charge' },
    keywords: ['vendor', 'minimum', 'charge', 'rate', 'rates'],
    role: 'VENDOR-MIN-CHARGE_READ_ALL',
    hiddenForRole: 'SITE-MAP_READ_OWN',
  },
  {
    id: 'bill',
    name: 'Bills',
    description: 'Bills',
    route: { name: 'list-bill' },
    keywords: ['bill', 'bills'],
    role: ['BILL_READ_ALL', 'BILL_READ_OWN'],
  },
  {
    id: 'list-billing-adjustment',
    name: 'Accounts Payable (AP) Adjustments',
    description: 'Add and Edit adjustments',
    route: { name: 'list-bill-adjustment' },
    keywords: ['accounts payable', 'accounts', 'payable', 'ap', 'adjustments'],
    role: ['BILL-ADJUSTMENT_READ_ALL', 'BILL-ADJUSTMENT_READ_OWN'],
  },
  {
    id: 'revenue-accounts',
    name: 'Revenue Accounts',
    description: 'Revenue accounts creation and editting',
    route: { name: 'revenue-accounts' },
    keywords: ['accounts', 'revenue'],
    role: ['REVENUE-ACCOUNT_CREATE_ALL', 'REVENUE-ACCOUNT_READ_ALL', 'REVENUE-ACCOUNT_UPDATE_ALL'],
    hiddenForRole: 'SITE-MAP_READ_OWN',
  },
  {
    id: 'cc-payments',
    name: 'Credit Card Payments',
    description: 'View Credit Card payments',
    route: { name: 'cc-payments' },
    keywords: ['credit card', 'payments'],
    role: ['CC-PAYMENT_READ_ALL'],
    hiddenForRole: 'SITE-MAP_READ_OWN',
  },
  {
    id: 'bank-accounts',
    name: 'Bank Accounts',
    description: 'Bank accounts creation and editing',
    route: { name: 'bank-accounts' },
    keywords: ['bank accounts'],
    role: ['BANK-ACCOUNT_CREATE_ALL', 'BANK-ACCOUNT_READ_ALL', 'BANK-ACCOUNT_UPDATE_ALL'],
    hiddenForRole: 'SITE-MAP_READ_OWN',
  },
  {
    id: 'list-ap-payment',
    name: 'Accounts Payable (AP) payments',
    description: 'View and edit AP payments',
    route: { name: 'list-ap-payment' },
    keywords: ['ap bills', 'ap', 'payments', 'ap payments'],
    role: ['AP-PAYMENT_READ_ALL', 'AP-PAYMENT_READ_OWN'],
  },
  {
    id: 'ap-print-checks',
    name: 'Accounts Payable (AP) Print Checks',
    description: 'Print and reprint checks',
    route: { name: 'ap-print-checks' },
    keywords: ['accounts payable', 'accounts', 'payable', 'ap', 'print', 'reprint', 'checks'],
    role: ['AP-PAYMENT_READ_ALL'],
    hiddenForRole: 'SITE-MAP_READ_OWN',
  },
  {
    id: 'mt-models',
    name: 'MT Models',
    description: 'View mt models list',
    route: { name: 'list-mt-model' },
    keywords: ['portal mt', 'mt model', 'portal translator'],
    role: ['MT-MODEL_READ_ALL'],
  },
  {
    id: 'mt-translator',
    name: 'Portal Translator',
    description: 'Portal Translator',
    route: { name: 'mt-translator' },
    keywords: ['portalmt', 'translator', 'portal translator'],
    role: ['MT-TRANSLATOR_READ_COMPANY', 'MT-TRANSLATOR_READ_ALL'],
  },
  {
    id: 'import-entities',
    name: 'Import Entities',
    description: 'Import or export all entities in xlsx format',
    route: { name: 'import-entities' },
    keywords: ['import', 'entities', 'module', 'xlsx'],
    role: ['ENTITIES-IMPORT_CREATE_ALL'],
  },
  {
    id: 'list-compromised-password',
    name: 'Compromised Passwords',
    description: 'List of compromised password',
    route: { name: 'list-compromised-password' },
    keywords: ['compromised', 'password'],
    role: ['COMPROMISED-PASSWORD_READ_ALL'],
  },
  {
    id: 'provider-pooling-offers',
    name: 'Provider Pooling Offers',
    description: 'List of Provider Pooling Offer',
    route: { name: 'provider-pooling-offers' },
    keywords: ['provider', 'pooling', 'offer'],
    roles: ['USER_READ_ALL'],
  },
  {
    id: 'list-provider-instructions',
    name: 'Provider Instructions',
    description: 'View and edit all provider instructions',
    route: { name: 'list-provider-instructions' },
    keywords: ['provider', 'instructions'],
    role: ['PROVIDER-TASK-INSTRUCTIONS_READ_ALL'],
  },
  {
    id: 'list-footer-template',
    name: 'Footer Templates',
    description: 'List of Footer Templates',
    route: { name: 'list-footer-template' },
    keywords: ['footer', 'template'],
    role: 'FOOTER-TEMPLATE_READ_ALL',
  },
  {
    id: 'company-external-accounting-codes',
    name: 'Company External Accounting Codes',
    description: 'Company External Accounting Codes',
    route: { name: 'list-company-external-accounting-codes' },
    keywords: ['company', 'external', 'accounting', 'codes', 'grid'],
    role: ['EXTERNAL-ACCOUNTING-CODE_READ_ALL'],
  },
  {
    id: 'list-service-type',
    name: 'Service Types',
    description: 'List of Service Types',
    route: { name: 'list-service-type' },
    keywords: ['service', 'type'],
    role: 'SERVICE-TYPE_READ_ALL',
  },
  {
    id: 'list-delivery-type',
    name: 'Delivery Types',
    description: 'List of Delivery Types',
    route: { name: 'list-delivery-type' },
    keywords: ['delivery', 'type'],
    role: 'DELIVERY-TYPE_READ_ALL',
  },
  {
    id: 'list-ip-instructions-deadline',
    name: 'IP Instructions Deadlines',
    description: 'Deadlines for contacts to send IP instructions',
    route: { name: 'list-ip-instructions-deadline' },
    keywords: ['ip', 'instructions', 'deadline'],
    role: 'IP-INSTRUCTIONS-DEADLINE_READ_ALL',
  },
];
const matchesKeywords = (text, keywords) => {
  const keywordsLen = keywords.length;
  for (let i = 0; i < keywordsLen; i++) {
    if (text.indexOf(keywords[i]) >= 0) {
      return true;
    }
  }
  return false;
};

const viewMatchesAnyKeyword = (view, keywords) => {
  const viewKeywords = view.keywords;
  const viewKeywordsLen = viewKeywords.length;
  for (let i = 0; i < viewKeywordsLen; i++) {
    if (matchesKeywords(viewKeywords[i], keywords)) {
      return true;
    }
  }
  return false;
};

const filterViewsByKeyword = (keywords, account, id) => {
  let filteredViews = views.filter((v) => {
    let validRole = true;
    let validType = true;

    // Check for views restriction based on roles
    if (v.role) {
      const oneOf = _.get(v, 'role.oneOf');
      if (Array.isArray(v.role)) {
        validRole = _.some(v.role, (r) => hasRole(account, r));
      } else if (oneOf && Array.isArray(oneOf)) {
        validRole = _.some(oneOf, (r) => hasRole(account, r));
      } else {
        validRole = hasRole(account, v.role);
      }
    }
    // Check for views restriction based on user type
    if (v.hiddenFor) {
      validType = v.hiddenFor.every((userType) => userType !== _.get(account, 'type'));
    }
    if (v.hiddenForRole && hasRole(account, v.hiddenForRole)) {
      return false;
    }
    return validRole && validType && !_.get(v, 'hidden', false);
  });
  if (keywords.length > 0) {
    const keywordsArr = keywords.toLowerCase().split(' ');
    filteredViews = filteredViews.filter((v) => v.id === id || viewMatchesAnyKeyword(v, keywordsArr));
  }
  return filteredViews;
};

const filterDocumentationViewsByKeyword = (keywords, account, id) => {
  let filteredViews = [];
  if (hasRole(account, 'DOCUMENTATION_READ_ALL')) {
    filteredViews = views;
    if (keywords.length > 0) {
      const keywordsArr = keywords.split(' ');
      filteredViews = filteredViews
        .filter((v) => v.id === id || viewMatchesAnyKeyword(v, keywordsArr));
    }
  }
  return filteredViews;
};

const countKeywordMatches = (searchTerms, keywordsArr) => {
  const matches = searchTerms.filter(term => keywordsArr.includes(term.toLowerCase()));
  return matches.length;
};

export default {
  filterViewsByKeyword,
  countKeywordMatches,
  filterDocumentationViewsByKeyword,
};
