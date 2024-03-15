import _ from 'lodash';
import { sectionRouterMixin } from '../../../mixins/section-router';
import UrlBasedBreadcrumb from '../url-based-breadcrumb/url-based-breadcrumb.vue';

const prefixParam = (pathParts, i) => {
  if (i > 0) {
    return pathParts.slice(0, i).join('/');
  }
  return '';
};

const indexIfExist = (arr, len, i) => {
  if (i < len) {
    return arr[i];
  }
};

const reservedPathWords = [
  'users',
  'abilities',
  'languages',
  'cat-tools',
  'competence-levels',
  'activities',
  'companies',
  'users',
  'lead-source',
  'activity-tags',
  'companies',
  'internal-departments',
  'payment-method',
  'billing-terms',
  'tax-forms',
  'translation-unit',
  'breakdown',
  'currency',
];
const isReservedWord = (str) => reservedPathWords.indexOf(str) !== -1;
const _commonItem = (pathParts, len, breadcrumbIndex, callbacks) => {
  let prefix = prefixParam(pathParts, breadcrumbIndex);
  if (prefix) {
    // remove "/users/" from the prefix
    prefix = prefix.substring(7);
  }
  callbacks.list(prefix);
  breadcrumbIndex++;
  const next = indexIfExist(pathParts, len, breadcrumbIndex);
  if (next) {
    if (next === 'create') {
      callbacks.create(prefix);
    } else if (!isReservedWord(next)) {
      // if it's not a reserved word and is not 'create' it must be an id.
      callbacks.edit(prefix, next);
      breadcrumbIndex++;
    }
  }
  return breadcrumbIndex;
};

const resolveRoute = (r, prefix) => {
  if (typeof r === 'function') {
    return r(prefix);
  }
  return r;
};

const createCallbacks = (items, routes) => ({
  list(prefix) {
    items.push({
      text: routes.list.text,
      route: {
        name: resolveRoute(routes.list.route, prefix),
        params: {
          0: prefix,
        },
        query: _.get(routes.list, 'query'),
      },
      active: false,
    });
  },
  create(prefix) {
    items.push({
      text: routes.creation.text,
      route: {
        name: resolveRoute(routes.creation.route, prefix),
        params: {
          0: prefix,
        },
      },
      active: false,
    });
  },
  edit(prefix, entityId) {
    items.push({
      text: routes.edition.text,
      route: {
        name: resolveRoute(routes.edition.route, prefix),
        params: {
          0: prefix,
          entityId,
        },
      },
      active: false,
    });
  },
});

const _parsePath = (items, to) => {
  const pathParts = to.path.split('/');
  const len = pathParts.length;
  let breadcrumbIndex = 0;
  while (breadcrumbIndex < len) {
    switch (pathParts[breadcrumbIndex]) {
      case 'users':
        breadcrumbIndex = _commonItem(pathParts, len, breadcrumbIndex, createCallbacks(items, {
          list: {
            text: 'User Grid',
            route: (prefix) => {
              if (prefix) {
                return 'user-user-grid';
              }
              return 'list-user';
            },
          },
          creation: {
            text: 'User creation',
            route: (prefix) => {
              if (prefix) {
                return 'user-user-creation';
              }
              return 'user-creation';
            },
          },
          edition: {
            text: 'User Edition',
            route: (prefix) => {
              if (prefix) {
                return 'user-user-edition';
              }
              return 'user-edition';
            },
          },
        }));
        break;
      case 'abilities':
        breadcrumbIndex = _commonItem(pathParts, len, breadcrumbIndex, createCallbacks(items, {
          list: {
            text: 'Ability Grid',
            route: 'user-ability-grid',
          },
          creation: {
            text: 'Ability Creation',
            route: 'user-ability-creation',
          },
          edition: {
            text: 'Ability Edition',
            route: 'user-ability-edition',
          },
        }));
        break;
      case 'languages':
        breadcrumbIndex = _commonItem(pathParts, len, breadcrumbIndex, createCallbacks(items, {
          list: {
            text: 'Language Grid',
            route: 'user-language-grid',
          },
          creation: {
            text: 'Language Creation',
            route: 'user-language-creation',
          },
          edition: {
            text: 'Language Edition',
            route: 'user-language-edition',
          },
        }));
        break;
      case 'cat-tools':
        breadcrumbIndex = _commonItem(pathParts, len, breadcrumbIndex, createCallbacks(items, {
          list: {
            text: 'Tools Grid',
            route: 'user-catTool-grid',
          },
          creation: {
            text: 'Tools Creation',
            route: 'user-catTool-creation',
          },
          edition: {
            text: 'Tools Edition',
            route: 'user-catTool-edition',
          },
        }));
        break;
      case 'competence-levels':
        breadcrumbIndex = _commonItem(pathParts, len, breadcrumbIndex, createCallbacks(items, {
          list: {
            text: 'Competence Levels Grid',
            route: 'user-competenceLevel-grid',
          },
          creation: {
            text: 'Competence Levels Creation',
            route: 'user-competenceLevel-creation',
          },
          edition: {
            text: 'Competence Levels Edition',
            route: 'user-competenceLevel-edition',
          },
        }));
        break;
      case 'internal-departments':
        breadcrumbIndex = _commonItem(pathParts, len, breadcrumbIndex, createCallbacks(items, {
          list: {
            text: 'LSP Internal Departments Grid',
            route: 'user-internalDepartment-grid',
          },
          creation: {
            text: 'Internal Departments Creation',
            route: 'user-internalDepartment-creation',
          },
          edition: {
            text: 'Internal Departments Edition',
            route: 'user-internalDepartment-edition',
          },
        }));
        break;
      case 'lead-source':
        breadcrumbIndex = _commonItem(pathParts, len, breadcrumbIndex, createCallbacks(items, {
          list: {
            text: 'Lead Source Grid',
            route: 'user-lead-source-grid',
          },
          creation: {
            text: 'Lead Source Creation',
            route: 'user-lead-source-creation',
          },
          edition: {
            text: 'Lead Source Edition',
            route: 'user-lead-source-edition',
          },
        }));
        break;
      case 'activities':
        breadcrumbIndex = _commonItem(pathParts, len, breadcrumbIndex, createCallbacks(items, {
          list: {
            text: 'Activity Grid',
            route: 'user-activity-grid',
          },
          creation: {
            text: 'Activity Creation',
            route: 'user-activity-creation',
          },
          edition: {
            text: 'Activity Edition',
            route: 'user-activity-edition',
          },
        }));
        break;
      case 'activity-tags':
        breadcrumbIndex = _commonItem(pathParts, len, breadcrumbIndex, createCallbacks(items, {
          list: {
            text: 'Activity Tags Grid',
            route: 'user-activityTag-grid',
          },
          creation: {
            text: 'Activity Tags Creation',
            route: 'user-activityTag-creation',
          },
          edition: {
            text: 'Activity Tags Edition',
            route: 'user-activityTag-edition',
          },
        }));
        break;
      case 'companies':
        breadcrumbIndex = _commonItem(pathParts, len, breadcrumbIndex, createCallbacks(items, {
          list: {
            text: 'Company Grid',
            route: 'user-company-grid',
          },
          creation: {
            text: 'Company Creation',
            route: 'user-company-creation',
          },
          edition: {
            text: 'Company Edition',
            route: 'user-company-edition',
          },
        }));
        break;
      case 'internal-department':
        breadcrumbIndex = _commonItem(pathParts, len, breadcrumbIndex, createCallbacks(items, {
          list: {
            text: 'Internal Department Grid',
            route: 'user-internal-department-grid',
          },
          creation: {
            text: 'Internal Department Creation',
            route: 'user-internal-department-creation',
          },
          edition: {
            text: 'Internal Department Edition',
            route: 'user-internal-department-edition',
          },
        }));
        break;
      case 'payment-method':
        breadcrumbIndex = _commonItem(pathParts, len, breadcrumbIndex, createCallbacks(items, {
          list: {
            text: 'Payment Methods Grid',
            route: 'user-paymentMethod-grid',
          },
          creation: {
            text: 'Payment Methods Creation',
            route: 'user-paymentMethod-creation',
          },
          edition: {
            text: 'Payment Methods Edition',
            route: 'user-paymentMethod-edition',
          },
        }));
        break;
      case 'billing-terms':
        breadcrumbIndex = _commonItem(pathParts, len, breadcrumbIndex, createCallbacks(items, {
          list: {
            text: 'Billing Term Grid',
            route: 'user-billingTerm-grid',
          },
          creation: {
            text: 'Billing Term Creation',
            route: 'user-billingTerm-creation',
          },
          edition: {
            text: 'Billing Term Edition',
            route: 'user-billingTerm-edition',
          },
        }));
        break;
      case 'tax-forms':
        breadcrumbIndex = _commonItem(pathParts, len, breadcrumbIndex, createCallbacks(items, {
          list: {
            text: 'Tax Form Grid',
            route: 'user-taxForm-grid',
          },
          creation: {
            text: 'Tax Form Creation',
            route: 'user-taxForm-creation',
          },
          edition: {
            text: 'Tax Form Edition',
            route: 'user-taxForm-edition',
          },
        }));
        break;
      case 'currency':
        breadcrumbIndex = _commonItem(pathParts, len, breadcrumbIndex, createCallbacks(items, {
          list: {
            text: 'Currency Grid',
            route: 'user-currency-grid',
          },
          creation: {
            text: 'Currency Creation',
            route: 'user-currency-creation',
          },
          edition: {
            text: 'Currency Edition',
            route: 'user-currency-edition',
          },
        }));
        break;
      case 'breakdown':
        breadcrumbIndex = _commonItem(pathParts, len, breadcrumbIndex, createCallbacks(items, {
          list: {
            text: 'Breakdown Grid',
            route: 'user-breakdown-grid',
          },
          creation: {
            text: 'Breakdown Creation',
            route: 'user-breakdown-creation',
          },
          edition: {
            text: 'Breakdown Edition',
            route: 'user-breakdown-edition',
          },
        }));
        break;
      case 'translation-unit':
        breadcrumbIndex = _commonItem(pathParts, len, breadcrumbIndex, createCallbacks(items, {
          list: {
            text: 'Unit Grid',
            route: 'user-translationUnit-grid',
          },
          creation: {
            text: 'Unit Creation',
            route: 'user-translationUnit-creation',
          },
          edition: {
            text: 'Unit Edition',
            route: 'user-translationUnit-edition',
          },
        }));
        break;
      case 'billing-term':
        breadcrumbIndex = _commonItem(pathParts, len, breadcrumbIndex, createCallbacks(items, {
          list: {
            text: 'Billing Term Grid',
            route: 'user-billing-term-grid',
          },
          creation: {
            text: 'Billing Term Creation',
            route: 'user-billing-term-creation',
          },
          edition: {
            text: 'Billing Term Edition',
            route: 'user-billing-term-edition',
          },
        }));
        break;
      case 'requests':
        breadcrumbIndex = _commonItem(pathParts, len, breadcrumbIndex, createCallbacks(items, {
          list: {
            text: 'Request Grid',
            route: 'user-request-grid',
          },
          creation: {
            text: 'New Request',
            route: 'user-request-creation',
          },
          edition: {
            text: 'Request Detail',
            route: 'user-request-edition',
          },
        }));
        break;
      case 'vendor-minimum-charge':
        breadcrumbIndex = _commonItem(pathParts, len, breadcrumbIndex, createCallbacks(items, {
          list: {
            text: 'Vendor minimum charge rates',
            route: 'user-vendor-minimum-charge-grid',
            query: _.get(to, 'query'),
          },
          creation: {
            text: 'New Vendor minimum charge',
            route: 'user-vendor-minimum-charge-creation',
          },
          edition: {
            text: 'Vendor minimum charge Detail',
            route: 'user-vendor-minimum-charge-edition',
          },
        }));
        break;
      default:
        breadcrumbIndex += 1;
        break;
    }
  }
  // last items is active
  items[items.length - 1].active = true;
};

export default {
  mixins: [sectionRouterMixin],
  components: {
    UrlBasedBreadcrumb,
  },
  created() {
    this.replacePart = '/users/';
  },
  methods: {
    buildBreadcrumbItems(to) {
      const items = [];
      if (to.name === 'list-user') {
        items.push({ text: 'User Grid', route: { name: 'list-user' }, active: true });
      } else {
        _parsePath(items, to);
      }
      this.routerItems = items;
      return items;
    },
    onBreakdownManage() {
      this._navigate('user-breakdown-grid');
    },
    onBreakdownEdit(eventData) {
      const entityId = eventData.item._id;
      this._navigateEdition('user-breakdown-edition', entityId);
    },
    onBreakdownCreate() {
      this._navigate('user-breakdown-creation');
    },
    onAbilityManage() {
      this._navigate('user-ability-grid');
    },
    onAbilityEdit(eventData) {
      const entityId = eventData.item._id;
      this._navigateEdition('user-ability-edition', entityId);
    },
    onAbilityCreate() {
      this._navigate('user-ability-creation');
    },
    onLanguageManage() {
      this._navigate('user-language-grid');
    },
    onLanguageEdit(eventData) {
      const entityId = eventData.item._id;
      this._navigateEdition('user-language-edition', entityId);
    },
    onLanguageCreate() {
      this._navigate('user-language-creation');
    },
    onCurrencyManage() {
      this._navigate('user-currency-grid');
    },
    onCurrencyEdit(eventData) {
      const entityId = eventData.item._id;
      this._navigateEdition('user-currency-edition', entityId);
    },
    onCurrencyCreate() {
      this._navigate('user-currency-creation');
    },
    onTranslationUnitManage() {
      this._navigate('user-translationUnit-grid');
    },
    onTranslationUnitEdit(eventData) {
      const entityId = eventData.item._id;
      this._navigateEdition('user-translationUnit-edition', entityId);
    },
    onTranslationUnitCreate() {
      this._navigate('user-translationUnit-creation');
    },
    onCatToolManage() {
      this._navigate('user-catTool-grid');
    },
    onCatToolEdit(eventData) {
      const entityId = eventData.item._id;
      this._navigateEdition('user-catTool-edition', entityId);
    },
    onCatToolCreate() {
      this._navigate('user-catTool-creation');
    },
    onLeadSourceManage() {
      this._navigate('user-lead-source-grid');
    },
    onLeadSourceEdit(eventData) {
      const entityId = eventData.item._id;
      this._navigateEdition('user-lead-source-edition', entityId);
    },
    onLeadSourceCreate() {
      this._navigate('user-lead-source-creation');
    },
    onCompetenceLevelManage() {
      this._navigate('user-competenceLevel-grid');
    },
    onCompetenceLevelEdit(eventData) {
      const entityId = eventData.item._id;
      this._navigateEdition('user-competenceLevel-edition', entityId);
    },
    onCompetenceLevelCreate() {
      this._navigate('user-competenceLevel-creation');
    },
    onActivityManage(filter) {
      this._navigate('user-activity-grid', filter);
    },
    onActivityEdit(eventData) {
      const entityId = eventData.item._id;
      this._navigateEdition('user-activity-edition', entityId);
    },
    onActivityCreate() {
      this._navigate('user-activity-creation');
    },
    onRequestManage(query) {
      this._navigate('user-request-grid', query);
    },
    onRequestCreate() {
      this._navigate('user-request-creation');
    },
    onRequestEdit(event) {
      const requestId = event.item._id;
      this._navigateEdition('user-request-edition', requestId);
    },
    onActivityTagManage() {
      this._navigate('user-activityTag-grid');
    },
    onActivityTagEdit(eventData) {
      const entityId = eventData.item._id;
      this._navigateEdition('user-activityTag-edition', entityId);
    },
    onActivityTagCreate() {
      this._navigate('user-activityTag-creation');
    },
    onCompanyManage() {
      this._navigate('user-company-grid');
    },
    onCompanyEdit(eventData) {
      const entityId = eventData.item._id;
      this._navigateEdition('user-company-edition', entityId);
    },
    onCompanyCreate() {
      this._navigate('user-company-creation');
    },
    onInternalDepartmentManage() {
      this._navigate('user-internal-department-grid');
    },
    onInternalDepartmentEdit(eventData) {
      const entityId = eventData.item._id;
      this._navigateEdition('user-internal-department-edition', entityId);
    },
    onInternalDepartmentCreate() {
      this._navigate('user-internal-department-creation');
    },
    onPaymentMethodManage() {
      this._navigate('user-paymentMethod-grid');
    },
    onPaymentMethodEdit(eventData) {
      const entityId = eventData.item._id;
      this._navigateEdition('user-paymentMethod-edition', entityId);
    },
    onPaymentMethodCreate() {
      this._navigate('user-paymentMethod-creation');
    },
    onBillingTermManage() {
      this._navigate('user-billingTerm-grid');
    },
    onBillingTermEdit(eventData) {
      const entityId = eventData.item._id;
      this._navigateEdition('user-billingTerm-edition', entityId);
    },
    onBillingTermCreate() {
      this._navigate('user-billingTerm-creation');
    },
    onTaxFormManage() {
      this._navigate('user-taxForm-grid');
    },
    onTaxFormEdit(eventData) {
      const entityId = eventData.item._id;
      this._navigateEdition('user-taxForm-edition', entityId);
    },
    onTaxFormCreate() {
      this._navigate('user-taxForm-creation');
    },
    onUserManage() {
      this._navigate('user-user-grid');
    },
    onVendorMinimumChargeManage(query) {
      this._navigate('user-vendor-minimum-charge-grid', query);
    },
    onVendorMinimumChargeCreate() {
      this._navigate('user-vendor-minimum-charge-creation');
    },
    onVendorMinimumChargeEdit(eventData) {
      const entityId = eventData.item._id;
      this._navigateEdition('user-vendor-minimum-charge-edition', entityId);
    },
    onUserEdit(eventData) {
      const entityId = eventData.item._id;
      if (this.$route.name === 'list-user') {
        this._navigateEdition('user-edition', entityId);
      } else {
        this._navigateEdition('user-user-edition', entityId);
      }
    },
    onUserCreate() {
      if (this.$route.name === 'list-user') {
        this._navigate('user-creation');
      } else {
        this._navigate('user-user-creation');
      }
    },
  },
};
