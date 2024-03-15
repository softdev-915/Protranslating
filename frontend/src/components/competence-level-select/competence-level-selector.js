import _ from 'lodash';
import { mapGetters, mapActions } from 'vuex';
import { selectMixin } from '../../mixins/select-mixin';
import MultiSelect from '../search-select/MultiSelect.vue';
import CompetenceLevelService from '../../services/competence-level-service';
import { hasRole } from '../../utils/user';

const CUSTOM_PROPS = ['options', 'selected-options', 'selectedOptions'];
const CUSTOM_LISTENERS = ['select'];
// Add non inherited props from mixins
const MixinProps = MultiSelect.mixins.filter((m) => m.props).reduce((acc, cur) => ({ ...acc, ...cur.props }), {});
const VueSearchSelectInheritedProps = { ...MultiSelect.props, ...MixinProps };
const service = new CompetenceLevelService();
const buildInitialState = () => ({
  options: [],
  loading: false,
});

export default {
  mixins: [selectMixin],
  props: {
    value: {
      type: Array,
      default: () => [],
    },
    ..._.omit(VueSearchSelectInheritedProps, CUSTOM_PROPS),
  },
  data() {
    return buildInitialState();
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    selectedOption() {
      return this.value.map((v) => {
        const _id = _.get(v, '_id', v);
        const found = this.options.find((o) => o._id === _id);
        const name = _.get(found, 'name', _.get(v, 'name', ''));
        return { text: name, value: _id };
      });
    },
    competenceLevelOptions() {
      if (Array.isArray(this.options)) {
        return this.options.map((d) => ({
          text: d.name,
          value: d._id,
        }));
      }
      return [];
    },
    wrappedProps() {
      return _.omit(this.$props, CUSTOM_PROPS);
    },
    wrappedListeners() {
      return _.omit(this.$listeners, CUSTOM_LISTENERS);
    },
    canRetrieve() {
      return hasRole(this.userLogged, 'COMPETENCE-LEVEL_READ_ALL');
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onCompetenceLevelSelected(competenceLevels) {
      this.$emit('input', competenceLevels.map((competenceLevel) => {
        const _id = _.get(competenceLevel, 'value', '');
        const name = _.get(competenceLevel, 'text', '');
        return this.returnFullOption ? { _id, name } : _id;
      }));
    },
    _retrieve() {
      if (this.canRetrieve) {
        this.loading = true;
        return service.retrieve()
          .then((response) => {
            this.options = response.data.list;
          })
          .catch((err) => {
            const notification = {
              title: 'Error',
              message: 'Competence level list could not be retrieved',
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
};
