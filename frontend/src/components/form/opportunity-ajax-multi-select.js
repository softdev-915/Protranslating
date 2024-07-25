import _ from 'lodash';
import { mapActions, mapGetters } from 'vuex';
import { AjaxMultiSelect } from '../search-select';
import { escapeRegexp } from '../../utils/strings';
import OpportunityService from '../../services/opportunity-service';
import { hasRole } from '../../utils/user';

const CUSTOM_PROPS = ['filter', 'options', 'http-client', 'httpClient'];
const CUSTOM_LISTENERS = ['searchchange'];
const opportunityService = new OpportunityService();
const OPPORTUNITY_LIMIT = 10;
const RETRIEVE_ROLES = ['OPPORTUNITY_READ_ALL', 'OPPORTUNITY_READ_OWN'];
// Add non inherited props from mixins
const MixinProps = AjaxMultiSelect.mixins.filter((m) => m.props).reduce((acc, cur) => ({ ...acc, ...cur.props }), {});
const VueSearchSelectInheritedProps = Object.assign(AjaxMultiSelect.props, MixinProps);

export default {
  data() {
    return {
      timeoutId: null,
      loading: false,
    };
  },
  props: {
    filter: {
      type: Object,
      default: () => ({
        companyText: null,
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
    disabled: {
      type: Boolean,
      default: false,
    },
    defaultOption: {
      type: Object,
      default: () => ({}),
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
  computed: {
    ...mapGetters('app', ['userLogged']),
    wrappedProps() {
      return _.omit(this.$props, CUSTOM_PROPS);
    },
    wrappedListeners() {
      return _.omit(this.$listeners, CUSTOM_LISTENERS);
    },
    isDefaultOptionSelected() {
      const selected = _.get(this, 'selectedOptions[0]', null);
      return !_.isEmpty(this.defaultOption) && _.isEqual(selected, this.defaultOption);
    },
    isDefaultOptionVisible() {
      return !_.isEmpty(this.defaultOption) && this.selectedOptions.length === 0;
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

      if (!this.isDefaultOptionSelected && this.canRetrieve) {
        this.loading = true;
        return opportunityService.retrieve(params)
          .then((response) => {
            const responseList = response.data.list;
            const opportunities = responseList.map((o) => ({
              value: o._id,
              text: o.no,
              companyId: o.companyId,
            }));
            if (this.isDefaultOptionVisible) {
              opportunities.push(this.defaultOption);
            }
            return opportunities;
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
