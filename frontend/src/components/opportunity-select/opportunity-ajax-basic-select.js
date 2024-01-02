import _ from 'lodash';
import { mapActions, mapGetters } from 'vuex';
import { AjaxBasicSelect } from '../search-select';
import { escapeRegexp } from '../../utils/strings';
import OpportunityService from '../../services/opportunity-service';
import { hasRole } from '../../utils/user';

const CUSTOM_PROPS = ['filter', 'options', 'http-client', 'httpClient'];
const CUSTOM_LISTENERS = ['searchchange'];
const opportunityService = new OpportunityService();
const OPPORTUNITY_LIMIT = 10;
const RETRIEVE_ROLES = ['OPPORTUNITY_READ_ALL', 'OPPORTUNITY_READ_OWN'];
// Add non inherited props from mixins
const MixinProps = AjaxBasicSelect.mixins.filter((m) => m.props).reduce((acc, cur) => ({ ...acc, ...cur.props }), {});
const VueSearchSelectInheritedProps = Object.assign(AjaxBasicSelect.props, MixinProps);

export default {
  data() {
    return {
      timeoutId: null,
      loading: false,
    };
  },
  props: {
    value: {
      type: String,
    },
    filter: {
      type: Object,
      default: () => ({
        limit: OPPORTUNITY_LIMIT,
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
    wrappedProps() {
      return _.omit(this.$props, CUSTOM_PROPS);
    },
    wrappedListeners() {
      return _.omit(this.$listeners, CUSTOM_LISTENERS);
    },
    canRetrieve() {
      return RETRIEVE_ROLES.some((role) => hasRole(this.userLogged, role));
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onSearchChange(text) {
      this.triggerDelayedSearch(text);
    },
    httpClient(term, page) {
      return this._requestOpportunities(term, page);
    },
    triggerDelayedSearch(term) {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }
      this.timeoutId = setTimeout(() => {
        this._requestOpportunities(term);
      }, this.timeoutMillis);
    },
    _requestOpportunities(term, page = 0) {
      const params = { limit: OPPORTUNITY_LIMIT, skip: OPPORTUNITY_LIMIT * page };
      const filter = {};
      if (term) {
        Object.assign(filter, this.filter, { no: escapeRegexp(term) });
      } else {
        Object.assign(filter, this.filter);
      }
      params.filter = filter;

      if (this.canRetrieve) {
        this.loading = true;
        return opportunityService.retrieve(params)
          .then((response) => {
            const responseList = _.get(response, 'data.list', []);
            if (!_.isEmpty(responseList)) {
              const opportunities = responseList.map((o) => ({
                value: o._id,
                text: o.no,
              }));
              return opportunities;
            }
            return Promise.resolve([]);
          }).catch((err) => {
            this.pushNotification({
              title: 'Error',
              message: 'Could not retrieve opportunities',
              state: 'danger',
              response: err,
            });
          })
          .finally(() => {
            this.loading = false;
          });
      }
      return Promise.resolve([]);
    },
  },
};
