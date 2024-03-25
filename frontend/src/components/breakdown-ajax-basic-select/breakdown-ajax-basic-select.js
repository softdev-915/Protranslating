import _ from 'lodash';
import { mapActions, mapGetters } from 'vuex';
import { AjaxBasicSelect } from '../search-select';
import BreakdownService from '../../services/breakdown-service';
import { hasRole } from '../../utils/user';
import { selectMixin } from '../../mixins/select-mixin';

const CUSTOM_PROPS = ['filter', 'options', 'mandatory', 'http-client', 'httpClient'];
const CUSTOM_LISTENERS = ['searchchange'];
const breakdownService = new BreakdownService();
const PAGE_LIMIT = 20;
const MixinProps = AjaxBasicSelect.mixins.filter(m =>
  m.props).reduce((acc, cur) => Object.assign({}, acc, cur.props), {});
const VueSearchSelectInheritedProps = Object.assign(AjaxBasicSelect.props, MixinProps);

export default {
  mixins: [selectMixin],
  data() {
    return {
      timeoutId: null,
      loading: false,
      breakdowns: [],
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
    ...mapGetters('app', ['userLogged']),
    divClass() {
      if (this.loading) {
        return 'blur-loading-row';
      }
      return this.containerClass;
    },
    canReadBreakdown() {
      return hasRole(this.userLogged, 'BREAKDOWN_READ_ALL');
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
    onSearchChange(text) {
      this.triggerDelayedSearch(text);
    },
    httpClient(term, page) {
      return this.loadBreakdowns(term, page);
    },
    triggerDelayedSearch(term) {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }
      this.timeoutId = setTimeout(() => {
        this.loadBreakdowns(term);
      }, this.timeoutMillis);
    },
    loadBreakdowns(term, page = 0) {
      if (_.isNil(this.filter) || !this.canReadBreakdown) {
        return Promise.resolve([]);
      }
      const filter = _.pickBy({ ...this.filter }, field => !_.isNil(field));
      const filters = {
        limit: PAGE_LIMIT,
        page: page + 1,
      };
      filter.deletedText = 'false';
      if (term) {
        filter.name = term;
      }
      if (!_.isEmpty(filter)) {
        filters.filter = JSON.stringify(filter);
      }
      this.loading = true;
      return breakdownService.retrieve(filters)
        .then((response) => {
          const responseList = _.get(response, 'data.list', []);
          this.breakdowns = responseList.map(b => ({
            value: b._id,
            text: b.name,
          }));
          return this.breakdowns;
        })
        .catch((err) => {
          const notification = {
            title: 'Error',
            message: 'Breakdown list could not be retrieved',
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
