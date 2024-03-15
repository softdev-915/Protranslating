import _ from 'lodash';
import { mapActions } from 'vuex';
import { AjaxBasicSelect } from '../search-select';
import AbilityService from '../../services/ability-service';
import { selectMixin } from '../../mixins/select-mixin';

const CUSTOM_PROPS = ['filter', 'options', 'mandatory', 'http-client', 'httpClient'];
const CUSTOM_LISTENERS = ['searchchange'];
const abilityService = new AbilityService();
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
      abilities: [],
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
    onSearchChange(text) {
      this.triggerDelayedSearch(text);
    },
    httpClient(term, page) {
      return this.loadAbilities(term, page);
    },
    triggerDelayedSearch(term) {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }
      this.timeoutId = setTimeout(() => {
        this.loadAbilities(term);
      }, this.timeoutMillis);
    },
    loadAbilities(term, page = 0) {
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
        filter.name = term;
      }
      if (!_.isEmpty(filter)) {
        filters.filter = JSON.stringify(filter);
      }
      this.loading = true;
      return abilityService.retrieve(filters).then((response) => {
        const abilityList = _.get(response, 'data.list', []);
        this.abilities = abilityList.map(a => ({
          value: a.name,
          text: a.name,
          description: _.get(a, 'description', ''),
          languageCombination: _.get(a, 'languageCombination', false),
          internalDepartmentRequired: _.get(a, 'internalDepartmentRequired', false),
          competenceLevelRequired: _.get(a, 'competenceLevelRequired', false),
          catTool: _.get(a, 'catTool', false),
        }));
        return this.abilities;
      }).catch((err) => {
        const notification = {
          title: 'Error',
          message: 'Error retrieving abilities',
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
