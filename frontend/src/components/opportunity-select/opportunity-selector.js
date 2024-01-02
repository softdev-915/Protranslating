import _ from 'lodash';
import { mapGetters, mapActions } from 'vuex';
import OpportunityService from '../../services/opportunity-service';
import { hasRole } from '../../utils/user';

const opportunityService = new OpportunityService();
const buildInitialState = () => ({
  options: [],
  loading: false,
});

export default {
  props: {
    value: {
      type: Array,
      required: true,
    },
    opportunitiesAvailable: Array,
    filter: Object,
  },
  data() {
    return buildInitialState();
  },
  watch: {
    value(newVal) {
      let companyId = null;

      if (newVal.length > 0) {
        const opportunities = newVal.map((v) => this.options.find((o) => o._id === v));
        const opportunitiesBelongToSameCompany = opportunities
          .every((o) => opportunities[0].companyId === o.companyId);
        if (opportunitiesBelongToSameCompany) {
          companyId = opportunities[0].companyId;
        }
      }
      this.$emit('opportunities-changed', companyId);
    },
    opportunitiesAvailable: {
      handler: function (newVal) {
        if (newVal) {
          this.options = newVal;
        } else {
          this._retrieveOpportunities();
        }
      },
      immediate: true,
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),

    onOpportunitySelected(opportunities) {
      this.$emit('input', opportunities.map((o) => o.value));
    },

    _retrieveOpportunities() {
      if (this.canRetrieve) {
        this.loading = true;
        return opportunityService.retrieve()
          .then((response) => {
            if (Array.isArray(response.data.list)) {
              this.options = response.data.list.map((o) => ({
                no: o.no,
                _id: o._id,
                companyId: o.companyId,
              }));
            }
          })
          .catch((err) => {
            const notification = {
              title: 'Error',
              message: 'Opportunities could not be retrieved',
              state: 'danger',
              response: err,
            };
            this.pushNotification(notification);
          })
          .finally(() => {
            this.loading = false;
          });
      }
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    selected() {
      return this.opportunitiesOptions.filter((o) => this.value.includes(o.value));
    },

    opportunitiesOptions() {
      let { options } = this;
      const companyFilter = _.get(this.filter, 'company', '');
      if (companyFilter.length) {
        options = this.options.filter((o) => o.companyId === companyFilter);
      }
      return options.map((o) => ({ text: o.no, value: o._id }));
    },

    canRetrieve() {
      return ['OPPORTUNITY_READ_ALL', 'OPPORTUNITY_READ_OWN'].some((role) => hasRole(this.userLogged, role));
    },
  },
};
