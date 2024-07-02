import _ from 'lodash';
import { mapActions, mapGetters } from 'vuex';
import { AjaxBasicSelect } from '../search-select';
import TranslationUnitService from '../../services/translation-unit-service';
import { hasRole } from '../../utils/user';
import { selectMixin } from '../../mixins/select-mixin';

const CUSTOM_PROPS = ['filter', 'options', 'mandatory', 'http-client', 'httpClient'];
const CUSTOM_LISTENERS = ['searchchange'];
const PAGE_LIMIT = 20;
const translationUnitService = new TranslationUnitService();
const MixinProps = AjaxBasicSelect.mixins.filter(m =>
  m.props).reduce((acc, cur) => Object.assign({}, acc, cur.props), {});
const VueSearchSelectInheritedProps = Object.assign(AjaxBasicSelect.props, MixinProps);

export default {
  mixins: [selectMixin],
  data() {
    return {
      timeoutId: null,
      loading: false,
      units: [],
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
    ...mapGetters('app', ['userLogged']),
    divClass() {
      if (this.loading) {
        return 'blur-loading-row';
      }
      return this.containerClass;
    },
    canReadTranslationUnit() {
      return hasRole(this.userLogged, 'TRANSLATION-UNIT_READ_ALL');
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
      return this.loadUnits(term, page);
    },
    triggerDelayedSearch(term) {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }
      this.timeoutId = setTimeout(() => {
        this.loadUnits(term);
      }, this.timeoutMillis);
    },
    loadUnits(term, page = 0) {
      if (!_.isNil(this.filter) && this.canReadTranslationUnit) {
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
        this.loading = true;
        return translationUnitService.retrieve(filters)
          .then((response) => {
            const responseList = _.get(response, 'data.list', []);
            this.units = responseList.map(o => ({
              value: o._id,
              text: o.name,
            }));
            return this.units;
          })
          .catch((err) => {
            const notification = {
              title: 'Error',
              message: 'Unit list could not be retrieved',
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
