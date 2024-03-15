import _ from 'lodash';
import { mapActions } from 'vuex';
import { AjaxBasicSelect } from '../search-select';
import ProviderInstructionsService from '../../services/provider-instructions-service';
import { selectMixin } from '../../mixins/select-mixin';
import UserRoleCheckMixin from '../../mixins/user-role-check';

const CUSTOM_PROPS = ['filter', 'options', 'mandatory', 'http-client', 'httpClient'];
const CUSTOM_LISTENERS = ['searchchange'];
const PAGE_LIMIT = 20;
const providerInstructionsService = new ProviderInstructionsService();
const MixinProps = AjaxBasicSelect.mixins.filter(m =>
  m.props).reduce((acc, cur) => Object.assign({}, acc, cur.props), {});
const VueSearchSelectInheritedProps = Object.assign(AjaxBasicSelect.props, MixinProps);

export default {
  mixins: [selectMixin, UserRoleCheckMixin],
  data() {
    return {
      timeoutId: null,
      loading: false,
      providerInstructions: [],
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
    canReadProviderInstruction() {
      return this.hasRole('PROVIDER-TASK-INSTRUCTIONS_READ_ALL');
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
      return this.loadProviderInstructions(term, page);
    },
    triggerDelayedSearch(term) {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }
      this.timeoutId = setTimeout(() => {
        this.loadProviderInstructions(term);
      }, this.timeoutMillis);
    },
    loadProviderInstructions(term, page = 0) {
      if (!_.isNil(this.filter) && this.canReadProviderInstruction) {
        const filter = _.pickBy({ ...this.filter }, field => !_.isNil(field));
        const filters = {
          limit: PAGE_LIMIT,
          page: page + 1,
        };
        if (term) {
          filter.name = term;
        }
        filter.deletedText = 'false';
        if (!_.isEmpty(filter)) {
          filters.filter = JSON.stringify(filter);
        }
        filters.sort = 'name';
        this.loading = true;
        return providerInstructionsService.retrieve(filters)
          .then((response) => {
            const responseList = _.get(response, 'data.list', []);
            this.providerInstructions = responseList.map(o => ({
              value: o._id,
              text: o.name,
              body: o.body,
            }));
            return this.providerInstructions;
          })
          .catch((err) => {
            const notification = {
              title: 'Error',
              message: 'Provider instructions list could not be retrieved',
              state: 'danger',
              response: err,
            };
            this.pushNotification(notification);
          }).finally(() => {
            this.loading = false;
          });
      }
      return Promise.resolve([]);
    },
    _retrieve() {
      return [];
    },
  },
};
