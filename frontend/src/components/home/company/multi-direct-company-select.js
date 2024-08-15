import _ from 'lodash';
import Promise from 'bluebird';
import { mapActions, mapGetters } from 'vuex';
import { AjaxMultiSelect } from '../../search-select';
import CompanyService from '../../../services/company-service';
import { hasRole } from '../../../utils/user';

const CUSTOM_PROPS = ['filter', 'options', 'http-client', 'httpClient'];
const CUSTOM_LISTENERS = ['searchchange'];
const COMPANY_LIMIT = 10;
const toOptionFormat = (c) => ({ value: c._id, text: c.name, deleted: c.deleted });
// Add non inherited props from mixins
const MixinProps = AjaxMultiSelect.mixins.filter((m) => m.props).reduce((acc, cur) => ({ ...acc, ...cur.props }), {});
const VueSearchSelectInheritedProps = Object.assign(AjaxMultiSelect.props, MixinProps);
const companyService = new CompanyService();
const buildInitialState = () => ({
  options: [],
  loading: false,
});

export default {
  components: {
    AjaxMultiSelect,
  },
  props: {
    filter: {
      type: Object,
      default: () => ({
        companyText: null,
        limit: COMPANY_LIMIT,
      }),
    },
    timeoutMillis: {
      type: Number,
      default: 2000,
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
      handler() {
        if (this.$refs.abs) {
          // if the ajax multi select exist and the filter changes
          // reset the initial data to force the component
          // reset the first 10 values upon filter changes.
          if (this.$refs.abs.resetData) {
            this.$refs.abs.resetData();
          // ajax-multi-select does not have resetData method
          } else if (this.$refs.abs._requestAsyncData) {
            this.$refs.abs._requestAsyncData({ term: '', delayMillis: 0, toggleShow: false });
          }
        }
      },
    },
  },
  data() {
    return buildInitialState();
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    wrappedProps() {
      return _.omit(this.$props, CUSTOM_PROPS);
    },
    wrappedListeners() {
      return _.omit(this.$listeners, CUSTOM_LISTENERS);
    },
    canRetrieveAll() {
      return hasRole(this.userLogged, 'COMPANY_READ_ALL');
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onSearchChange(text) {
      this.triggerDelayedSearch(text);
    },
    httpClient(term, page) {
      return this._requestCompanies(term, page);
    },
    triggerDelayedSearch(term) {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }
      this.timeoutId = setTimeout(() => {
        this._requestCompanies(term);
      }, this.timeoutMillis);
    },
    _requestCompanies(term, page) {
      if (!this.canRetrieveAll || this.readOnly) {
        return Promise.resolve();
      }
      const filter = {
        limit: COMPANY_LIMIT,
        select: '_id name deleted',
        skip: COMPANY_LIMIT * page,
        sort: 'name',
        filter: JSON.stringify({ name: term }),
      };
      const customFilter = _.get(this, 'customFilter', {});
      const query = { ...customFilter };
      if (!_.isEmpty(query)) {
        filter.query = JSON.stringify(query);
      }
      this.loading = true;
      return companyService.search(filter)
        .then((response) => {
          const companies = _.get(response, 'data.list', []);
          return companies.map((c) => toOptionFormat(c));
        }).catch((err) => {
          this.pushNotification({
            title: 'Error',
            message: 'Could not retrieve companies',
            state: 'danger',
            response: err,
          });
        }).finally(() => { this.loading = false; });
    },
  },
};
