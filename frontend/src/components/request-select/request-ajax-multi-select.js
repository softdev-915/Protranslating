import _ from 'lodash';
import { mapActions, mapGetters } from 'vuex';
import { AjaxMultiSelect } from '../search-select';
import RequestService from '../../services/request-service';
import { escapeRegexp } from '../../utils/strings';
import { hasRole } from '../../utils/user';

const CUSTOM_PROPS = ['filter', 'options', 'http-client', 'httpClient'];
const CUSTOM_LISTENERS = ['searchchange'];
const requestService = new RequestService();
const REQUEST_LIMIT = 10;
const EMPTY_PLACEHOLDER = 'No requests are available';
// Add non inherited props from mixins
const MixinProps = AjaxMultiSelect.mixins.filter((m) => m.props).reduce((acc, cur) => ({ ...acc, ...cur.props }), {});
const VueSearchSelectInheritedProps = Object.assign(AjaxMultiSelect.props, MixinProps);

export default {
  data() {
    return {
      timeoutId: null,
      optionsLength: 0,
      loading: true,
    };
  },
  props: {
    filter: {
      type: Object,
      default: () => ({
        companyName: null,
        opportunityNo: null,
        no: null,
        limit: REQUEST_LIMIT,
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
    allowEmpty: {
      type: Boolean,
      default: true,
    },
    ..._.omit(VueSearchSelectInheritedProps, CUSTOM_PROPS),
  },
  watch: {
    filter: {
      deep: true,
      handler(newVal, oldVal) {
        if (this.$refs.abs && this.$refs.abs.resetData) {
          // if the ajax multi select exist and the filter changes
          // reset the initial data to force the component
          // reset the first 10 values upon filter changes.
          this.$refs.abs.resetData();
        } else if (!_.isEqual(newVal, oldVal) && this.$refs.abs._requestAsyncData) {
          this.$refs.abs._requestAsyncData({ term: '', delayMillis: 0, toggleShow: false });
        }
      },
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    wrappedProps() {
      return _.omit(this.$props, CUSTOM_PROPS);
    },
    wrappedListeners() {
      return _.omit(this.$listeners, CUSTOM_LISTENERS);
    },
    isSelectDisabled() {
      return this.isDisabled || (!this.allowEmpty && this.optionsLength === 0);
    },
    placeholderMessage() {
      return this.optionsLength === 0 ? EMPTY_PLACEHOLDER : this.placeholder;
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onSearchChange(text) {
      this.triggerDelayedSearch(text);
    },
    httpClient(term, page) {
      return this._requestRequests(term, page);
    },
    triggerDelayedSearch(term) {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }
      this.timeoutId = setTimeout(() => {
        this._requestRequests(term);
      }, this.timeoutMillis);
    },
    _requestRequests(term, page = 0) {
      if (this.filters !== null && hasRole(this.userLogged, 'REQUEST_READ_ALL')) {
        const params = { limit: REQUEST_LIMIT, page: page + 1 };
        const filter = {};
        if (term) {
          Object.assign(filter, this.filter, { no: escapeRegexp(term) });
        } else {
          Object.assign(filter, this.filter);
        }

        // remove all null fields
        params.filter = _.pickBy(filter, _.identity);

        this.loading = true;
        return requestService.retrieve(params)
          .then((response) => {
            const requests = response.data.list;
            if (!term) {
              this.optionsLength = requests.length;
            }
            return requests.map((r) => ({
              value: r._id,
              text: r.no,
              companyName: r.companyName,
            }));
          }).catch((err) => {
            this.pushNotification({
              title: 'Error',
              message: 'Could not retrieve requests',
              state: 'danger',
              response: err,
            });
          })
          .finally(() => {
            this.loading = false;
          });
      }
      // if no filter, not even an empty object request
      // always return empty array
      return Promise.resolve([]);
    },
  },
};
