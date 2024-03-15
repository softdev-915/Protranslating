import _ from 'lodash';
import { mapActions, mapGetters } from 'vuex';
import { AjaxBasicSelect } from '../../search-select';
import CompanyService from '../../../services/company-service';
import { hasRole } from '../../../utils/user';
import { selectMixin } from '../../../mixins/select-mixin';

const ACCESS_ROLES = ['COMPANY_READ_ALL', 'COMPANY_READ_OWN'];
const CUSTOM_PROPS = ['filter', 'options', 'mandatory', 'http-client', 'httpClient'];
const CUSTOM_LISTENERS = ['searchchange'];
const companyService = new CompanyService();
const COMPANY_LIMIT = 10;
// Add non inherited props from mixins
const MixinProps = AjaxBasicSelect.mixins.filter((m) => m.props).reduce((acc, cur) => ({ ...acc, ...cur.props }), {});
const VueSearchSelectInheritedProps = Object.assign(AjaxBasicSelect.props, MixinProps);

export default {
  mixins: [selectMixin],
  data() {
    return {
      company: {},
      timeoutId: null,
      loading: false,
    };
  },
  props: {
    filter: {
      type: Object,
      default: () => ({}),
    },
    timeoutMillis: {
      type: Number,
      default: 2000,
    },
    loadingIconClass: {
      type: String,
      default: 'fas fa-spin fa-circle-o-notch',
    },
    loadPreSelectedOption: {
      type: Boolean,
      default: false,
    },
    ..._.omit(VueSearchSelectInheritedProps, CUSTOM_PROPS),
  },
  watch: {
    filter: {
      deep: true,
      handler(newValue, oldValue) {
        if (_.isEqual(newValue, oldValue)) return;
        if (this.$refs.abs && this.$refs.abs.resetData) {
          // if the ajax basic select exist and the filter changes
          // reset the initial data to force the component
          // reset the first 10 values upon filter changes.
          this.$refs.abs.resetData();
        }
      },
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    divClass() {
      if (this.loading) {
        return 'blur-loading-row';
      }
      return this.containerClass;
    },
    hasAccess() {
      return ACCESS_ROLES.some((r) => hasRole(this.userLogged, r));
    },
    wrappedProps() {
      return _.omit(this.$props, CUSTOM_PROPS);
    },
    wrappedListeners() {
      return _.omit(this.$listeners, CUSTOM_LISTENERS);
    },
  },
  created() {
    if (this.loadPreSelectedOption) {
      this.requestCompaniesAtPage(this.selectedOption.text, 0).then((companies) => {
        if (!_.isEmpty(companies) && !_.isEmpty(this.selectedOption.value)) {
          const companyFound = companies.find((c) => c._id === this.selectedOption.value);
          this.$emit('select', companyFound);
        }
      });
    }
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onSearchChange(text) {
      this.triggerDelayedSearch(text);
    },
    httpClient(term, page) {
      return this.requestCompaniesAtPage(term, page);
    },
    triggerDelayedSearch(term) {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }
      this.timeoutId = setTimeout(() => {
        this.requestCompaniesAtPage(term);
      }, this.timeoutMillis);
    },
    requestCompaniesAtPage(term, page = 0) {
      if (this.filter !== null && this.hasAccess) {
        const filter = _.pickBy({ ...this.filter }, (field) => !_.isNil(field));
        const filters = {
          limit: COMPANY_LIMIT,
          page: page + 1,
          sort: 'hierarchy',
          select: '_id name hierarchy billingInformation.quoteCurrency billingInformation.billingTerm mandatoryRequestContact status securityPolicy ssoSettings areSsoSettingsOverwritten dataClassification availableTimeToDeliver allowCopyPasteInPortalCat isMandatoryExternalAccountingCode',
        };
        if (term) {
          filter.hierarchy = term;
        }

        if (!_.isEmpty(filter)) {
          filters.filter = JSON.stringify(filter);
        }

        this.$emit('companies-loading', true);
        this.loading = true;
        return companyService.nameList(filters)
          .then((response) => {
            const companies = _.get(response, 'data.list', []);
            return companies.map(({
              _id, name, hierarchy, billingInformation,
              mandatoryRequestContact, status, securityPolicy,
              ssoSettings, dataClassification, availableTimeToDeliver,
              isMandatoryExternalAccountingCode,
            }) => ({
              _id,
              hierarchy: _.isEmpty(hierarchy) ? name : hierarchy,
              name,
              status,
              mandatoryRequestContact,
              ssoSettings,
              quoteCurrency: _.get(billingInformation, 'quoteCurrency'),
              securityPolicy,
              billingTerm: _.get(billingInformation, 'billingTerm'),
              value: _id,
              text: _.isEmpty(hierarchy) ? name : hierarchy,
              dataClassification,
              availableTimeToDeliver,
              isMandatoryExternalAccountingCode,
            }));
          }).catch((err) => {
            this.pushNotification({
              title: 'Error',
              message: 'Could not retrieve companies',
              state: 'danger',
              response: err,
            });
          }).finally(() => {
            this.$emit('companies-loading', false);
            this.loading = false;
          });
      }
      // if no filter, not even an empty object provider
      // always return empty array
      return Promise.resolve([]);
    },
    _retrieve() {
      return [];
    },
  },
};
