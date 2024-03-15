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
  'companies',
  'users',
  'abilities',
  'languages',
  'cat-tools',
  'competence-levels',
  'lead-source',
  'activities',
  'memory-editor',
];
const isReservedWord = (str) => reservedPathWords.indexOf(str) !== -1;
const _commonItem = (pathParts, len, i, callbacks) => {
  let prefix = prefixParam(pathParts, i);
  if (prefix) {
    // remove "/companies/" from the prefix
    prefix = prefix.replace('/companies/', '');
  }
  callbacks.list(prefix);
  i++;
  const next = indexIfExist(pathParts, len, i);
  if (next) {
    if (next === 'create') {
      callbacks.create(prefix);
    } else if (!isReservedWord(next)) {
      // if it's not a reserved word and is not 'create' it must be an id.
      callbacks.edit(prefix, next);
      i++;
    }
  }
  return i;
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
      case 'company-minimum-charge':
        breadcrumbIndex = _commonItem(pathParts, len, breadcrumbIndex, createCallbacks(items, {
          list: {
            text: 'Company minimum charge Grid',
            route: (prefix) => {
              if (prefix) {
                return 'company-company-minimum-charge-grid';
              }
              return 'list-company';
            },
          },
          creation: {
            text: 'Company minimum charge Creation',
            route: () => 'company-company-minimum-charge-creation',
          },
          edition: {
            text: 'Company minimum charge Edition',
            route: () => 'company-company-minimum-charge-edition',
          },
        }));
        break;
      case 'companies':
        breadcrumbIndex = _commonItem(pathParts, len, breadcrumbIndex, createCallbacks(items, {
          list: {
            text: 'Company Grid',
            route: (prefix) => {
              if (prefix) {
                return 'company-company-grid';
              }
              return 'list-company';
            },
          },
          creation: {
            text: 'Company Creation',
            route: (prefix) => {
              if (prefix) {
                return 'company-company-creation';
              }
              return 'company-creation';
            },
          },
          edition: {
            text: 'Company Edition',
            route: (prefix) => {
              if (prefix) {
                return 'company-company-edition';
              }
              return 'company-edition';
            },
          },
        }));
        break;
      case 'users':
        breadcrumbIndex = _commonItem(pathParts, len, breadcrumbIndex, createCallbacks(items, {
          list: {
            text: 'User Grid',
            route: 'company-user-grid',
          },
          creation: {
            text: 'User Creation',
            route: 'company-user-creation',
          },
          edition: {
            text: 'User Edition',
            route: 'company-user-edition',
          },
        }));
        break;
      case 'abilities':
        breadcrumbIndex = _commonItem(pathParts, len, breadcrumbIndex, createCallbacks(items, {
          list: {
            text: 'Ability Grid',
            route: 'company-ability-grid',
          },
          creation: {
            text: 'Ability Creation',
            route: 'company-ability-creation',
          },
          edition: {
            text: 'Ability Edition',
            route: 'company-ability-edition',
          },
        }));
        break;
      case 'languages':
        breadcrumbIndex = _commonItem(pathParts, len, breadcrumbIndex, createCallbacks(items, {
          list: {
            text: 'Language Grid',
            route: 'company-language-grid',
          },
          creation: {
            text: 'Language Creation',
            route: 'company-language-creation',
          },
          edition: {
            text: 'Language Edition',
            route: 'company-language-edition',
          },
        }));
        break;
      case 'cat-tools':
        breadcrumbIndex = _commonItem(pathParts, len, breadcrumbIndex, createCallbacks(items, {
          list: {
            text: 'Tools Grid',
            route: 'company-catTool-grid',
          },
          creation: {
            text: 'Tools Creation',
            route: 'company-catTool-creation',
          },
          edition: {
            text: 'Tools Edition',
            route: 'company-catTool-edition',
          },
        }));
        break;
      case 'competence-levels':
        breadcrumbIndex = _commonItem(pathParts, len, breadcrumbIndex, createCallbacks(items, {
          list: {
            text: 'Competence Levels Grid',
            route: 'company-competenceLevel-grid',
          },
          creation: {
            text: 'Competence Levels Creation',
            route: 'company-competenceLevel-creation',
          },
          edition: {
            text: 'Competence Levels Edition',
            route: 'company-competenceLevel-edition',
          },
        }));
        break;
      case 'activities':
        breadcrumbIndex = _commonItem(pathParts, len, breadcrumbIndex, createCallbacks(items, {
          list: {
            text: 'Activity Grid',
            route: 'company-activity-grid',
          },
          creation: {
            text: 'Activity Creation',
            route: 'company-activity-creation',
          },
          edition: {
            text: 'Activity Edition',
            route: 'company-activity-edition',
          },
        }));
        break;
      case 'activity-tags':
        breadcrumbIndex = _commonItem(pathParts, len, breadcrumbIndex, createCallbacks(items, {
          list: {
            text: 'Activity Tags Grid',
            route: 'company-activityTag-grid',
          },
          creation: {
            text: 'Activity Tags Creation',
            route: 'company-activityTag-creation',
          },
          edition: {
            text: 'Activity Tags Edition',
            route: 'company-activityTag-edition',
          },
        }));
        break;
      case 'currency':
        breadcrumbIndex = _commonItem(pathParts, len, breadcrumbIndex, createCallbacks(items, {
          list: {
            text: 'Currency Grid',
            route: 'company-currency-grid',
          },
          creation: {
            text: 'Currency Creation',
            route: 'company-currency-creation',
          },
          edition: {
            text: 'Currency Edition',
            route: 'company-currency-edition',
          },
        }));
        break;
      case 'breakdown':
        breadcrumbIndex = _commonItem(pathParts, len, breadcrumbIndex, createCallbacks(items, {
          list: {
            text: 'Breakdown Grid',
            route: 'company-breakdown-grid',
          },
          creation: {
            text: 'Breakdown Creation',
            route: 'company-breakdown-creation',
          },
          edition: {
            text: 'Breakdown Edition',
            route: 'company-breakdown-edition',
          },
        }));
        break;
      case 'internal-department':
        breadcrumbIndex = _commonItem(pathParts, len, breadcrumbIndex, createCallbacks(items, {
          list: {
            text: 'Internal Department Grid',
            route: 'company-internal-department-grid',
          },
          creation: {
            text: 'Internal Department Creation',
            route: 'company-internal-department-creation',
          },
          edition: {
            text: 'Internal Department Edition',
            route: 'company-internal-department-edition',
          },
        }));
        break;
      case 'translation-unit':
        breadcrumbIndex = _commonItem(pathParts, len, breadcrumbIndex, createCallbacks(items, {
          list: {
            text: 'Unit Grid',
            route: 'company-translation-unit-grid',
          },
          creation: {
            text: 'Unit Creation',
            route: 'company-translation-unit-creation',
          },
          edition: {
            text: 'Unit Edition',
            route: 'company-translation-unit-edition',
          },
        }));
        break;
      case 'billing-term':
        breadcrumbIndex = _commonItem(pathParts, len, breadcrumbIndex, createCallbacks(items, {
          list: {
            text: 'Billing Term Grid',
            route: 'company-billing-term-grid',
          },
          creation: {
            text: 'Billing Term Creation',
            route: 'company-billing-term-creation',
          },
          edition: {
            text: 'Billing Term Edition',
            route: 'company-billing-term-edition',
          },
        }));
        break;
      case 'payment-method':
        breadcrumbIndex = _commonItem(pathParts, len, breadcrumbIndex, createCallbacks(items, {
          list: {
            text: 'Payment Method Grid',
            route: 'company-payment-method-grid',
          },
          creation: {
            text: 'Payment Method Creation',
            route: 'company-payment-method-creation',
          },
          edition: {
            text: 'Payment Method Edition',
            route: 'company-payment-method-edition',
          },
        }));
        break;
      case 'lead-source':
        breadcrumbIndex = _commonItem(pathParts, len, breadcrumbIndex, createCallbacks(items, {
          list: {
            text: 'Lead Source Grid',
            route: 'company-lead-source-grid',
          },
          creation: {
            text: 'Lead Source Creation',
            route: 'company-lead-source-creation',
          },
          edition: {
            text: 'Lead Source Edition',
            route: 'company-lead-source-edition',
          },
        }));
        break;
      case 'locations':
        breadcrumbIndex = _commonItem(pathParts, len, breadcrumbIndex, createCallbacks(items, {
          list: {
            text: 'Location Grid',
            route: 'company-location-grid',
          },
          creation: {
            text: 'Location Creation',
            route: 'company-location-creation',
          },
          edition: {
            text: 'Location Edition',
            route: 'company-location-edition',
          },
        }));
        break;
      case 'memory-editor':
        breadcrumbIndex = _commonItem(pathParts, len, breadcrumbIndex, createCallbacks(items, {
          list: {
            text: 'Memory Editor',
            route: 'company-memory-editor',
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
    this.replacePart = '/companies/';
  },
  methods: {
    buildBreadcrumbItems(to) {
      const items = [];
      if (to.name === 'list-company') {
        items.push({ text: 'Company Grid', route: { name: 'list-company' }, active: true });
      } else {
        _parsePath(items, to);
      }
      this.routerItems = items;
      return items;
    },
    onCatToolManage() {
      this._navigate('company-catTool-grid');
    },
    onCatToolEdit(eventData) {
      const entityId = eventData.item._id;
      this._navigateEdition('company-catTool-edition', entityId);
    },
    onCatToolCreate() {
      this._navigate('company-catTool-creation');
    },
    onLanguageManage() {
      this._navigate('company-language-grid');
    },
    onLanguageEdit(eventData) {
      const entityId = eventData.item._id;
      this._navigateEdition('company-language-edition', entityId);
    },
    onLanguageCreate() {
      this._navigate('company-language-creation');
    },
    onCurrencyManage() {
      this._navigate('company-currency-grid');
    },
    onCurrencyEdit(eventData) {
      const entityId = eventData.item._id;
      this._navigateEdition('company-currency-edition', entityId);
    },
    onCurrencyCreate() {
      this._navigate('company-currency-creation');
    },
    onBillingTermManage() {
      this._navigate('company-billing-term-grid');
    },
    onBillingTermEdit(eventData) {
      const entityId = eventData.item._id;
      this._navigateEdition('company-billing-term-edition', entityId);
    },
    onBillingTermCreate() {
      this._navigate('company-billing-term-creation');
    },
    onTranslationUnitManage() {
      this._navigate('company-translation-unit-grid');
    },
    onTranslationUnitEdit(eventData) {
      const entityId = eventData.item._id;
      this._navigateEdition('company-translation-unit-edition', entityId);
    },
    onTranslationUnitCreate() {
      this._navigate('company-translation-unit-creation');
    },
    onPaymentMethodManage() {
      this._navigate('company-payment-method-grid');
    },
    onPaymentMethodEdit(eventData) {
      const entityId = eventData.item._id;
      this._navigateEdition('company-payment-method-edition', entityId);
    },
    onPaymentMethodCreate() {
      this._navigate('company-payment-method-creation');
    },
    onInternalDepartmentManage() {
      this._navigate('company-internal-department-grid');
    },
    onInternalDepartmentEdit(eventData) {
      const entityId = eventData.item._id;
      this._navigateEdition('company-internal-department-edition', entityId);
    },
    onInternalDepartmentCreate() {
      this._navigate('company-internal-department-creation');
    },
    onLocationManage() {
      this._navigate('company-location-grid');
    },
    onLocationEdit(eventData) {
      const entityId = eventData.item._id;
      this._navigateEdition('company-location-edition', entityId);
    },
    onLocationCreate() {
      this._navigate('company-location-creation');
    },
    onBreakdownManage() {
      this._navigate('company-breakdown-grid');
    },
    onBreakdownEdit(eventData) {
      const entityId = eventData.item._id;
      this._navigateEdition('company-breakdown-edition', entityId);
    },
    onBreakdownCreate() {
      this._navigate('company-breakdown-creation');
    },
    onAbilityManage() {
      this._navigate('company-ability-grid');
    },
    onAbilityEdit(eventData) {
      const entityId = eventData.item._id;
      this._navigateEdition('company-ability-edition', entityId);
    },
    onAbilityCreate() {
      this._navigate('company-ability-creation');
    },
    onLeadSourceManage() {
      this._navigate('company-lead-source-grid');
    },
    onLeadSourceCreate() {
      this._navigate('company-lead-source-creation');
    },
    onLeadSourceEdit(eventData) {
      const entityId = eventData.item._id;
      this._navigateEdition('company-lead-source-edition', entityId);
    },
    onCompetenceLevelManage() {
      this._navigate('company-competenceLevel-grid');
    },
    onCompetenceLevelEdit(eventData) {
      const entityId = eventData.item._id;
      this._navigateEdition('company-competenceLevel-edition', entityId);
    },
    onCompetenceLevelCreate() {
      this._navigate('company-competenceLevel-creation');
    },
    onActivityManage(filter) {
      this._navigate('company-activity-grid', filter);
    },
    onActivityEdit(eventData) {
      const entityId = eventData.item._id;
      this._navigateEdition('company-activity-edition', entityId);
    },
    onActivityCreate() {
      this._navigate('company-activity-creation');
    },
    onActivityTagManage() {
      this._navigate('company-activityTag-grid');
    },
    onActivityTagEdit(eventData) {
      const entityId = eventData.item._id;
      this._navigateEdition('company-activityTag-edition', entityId);
    },
    onActivityTagCreate() {
      this._navigate('company-activityTag-creation');
    },
    onUserManage() {
      this._navigate('company-user-grid');
    },
    onUserEdit(eventData) {
      const entityId = eventData.item._id;
      // Avoid companies/companies issue
      this.$route.params[0] = '';
      this._navigateEdition('company-user-edition', entityId);
    },
    onUserCreate() {
      this._navigate('company-user-creation');
    },
    onCompanyManage() {
      this._navigate('company-company-grid');
    },
    onCompanyMinChargeManage(query) {
      this._navigate('company-company-minimum-charge-grid', query);
    },
    onCompanyMinChargeCreate() {
      this._navigate('company-company-minimum-charge-creation');
    },
    onCompanyMinChargeCreateClone() {
      const path = this.$route.path.replace('/details', '');
      const finalPath = path.replace(/company-minimum-charge.*/, 'company-minimum-charge/create');
      this.$router.push(finalPath).catch((err) => { console.log(err); });
    },
    onCompanyMinChargeEdit(eventData) {
      this._navigateEdition('company-company-minimum-charge-edition', eventData.item._id);
    },
    onCompanyEdit(eventData) {
      const entityId = eventData.item._id;
      if (this.$route.name === 'list-company') {
        this._navigateEdition('company-edition', entityId);
      } else {
        this._navigateEdition('company-company-edition', entityId);
      }
    },
    onCompanyCreate() {
      if (this.$route.name === 'list-company') {
        this._navigate('company-creation');
      } else {
        this._navigate('company-company-creation');
      }
    },
  },
};
