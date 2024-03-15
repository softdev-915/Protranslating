import _ from 'lodash';
import { mapActions } from 'vuex';
import { AjaxBasicSelect } from '../search-select';
import CompanyExternalAccountingCodeService from '../../services/company-external-accounting-code-service';
import { selectMixin } from '../../mixins/select-mixin';

const CUSTOM_PROPS = ['filter', 'options', 'mandatory', 'http-client', 'httpClient'];
const CUSTOM_LISTENERS = ['searchchange'];
const companyExternalAccountingCodeService = new CompanyExternalAccountingCodeService();
const PAGE_LIMIT = 20;
const MixinProps = AjaxBasicSelect.mixins.filter(m =>
  m.props).reduce((acc, cur) => Object.assign({}, acc, cur.props), {});
const VueSearchSelectInheritedProps = Object.assign(AjaxBasicSelect.props, MixinProps);

export default {
  mixins: [selectMixin],
  data() {
    return {
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
      default: 1000,
    },
    loadingIconClass: {
      type: String,
      default: 'fas fa-spin fa-circle-o-notch',
    },
    ..._.omit(VueSearchSelectInheritedProps, CUSTOM_PROPS),
  },
  watch: {
    filter: {
      deep: true,
      handler(newValue, oldValue) {
        if (_.isEqual(newValue, oldValue)) return;
        if (this.$refs.abs && this.$refs.abs.resetData) {
          this.$refs.abs.resetData();
        }
      },
    },
  },
  computed: {
    divClass() {
      if (this.loading) {
        return 'blur-loading-row';
      }
      return this.containerClass;
    },
    wrappedProps() {
      return _.omit(this.$props, CUSTOM_PROPS);
    },
    wrappedListeners() {
      return _.omit(this.$listeners, CUSTOM_LISTENERS);
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    httpClient(term, page) {
      return this.loadCompanyExternalAccountingCodes(term, page);
    },
    loadCompanyExternalAccountingCodes(term, page = 0) {
      if (_.isNil(this.filter)) {
        return Promise.resolve([]);
      }
      const filter = _.pickBy({ ...this.filter }, field => !_.isNil(field));
      const filters = {
        limit: PAGE_LIMIT,
        page: page + 1,
      };
      filter.deletedText = 'false';
      if (term) {
        filter.companyExternalAccountingCode = term;
      }
      if (!_.isEmpty(filter)) {
        filters.filter = JSON.stringify(filter);
      }
      this.loading = true;
      return companyExternalAccountingCodeService.retrieve(filters).then((response) => {
        const companyExternalAccountingCodeList = _.get(response, 'data.list', []);
        return companyExternalAccountingCodeList.map(
          ({ _id, companyExternalAccountingCode, company }) => ({
            _id,
            companyExternalAccountingCode,
            company,
            value: _id,
            text: companyExternalAccountingCode,
          }));
      }).catch((err) => {
        const notification = {
          title: 'Error',
          message: 'Error retrieving external accounting codes',
          state: 'danger',
          response: err,
        };
        this.pushNotification(notification);
      }).finally(() => {
        this.loading = false;
      });
    },
    _retrieve() {
      return [];
    },
  },
};
