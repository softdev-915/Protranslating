import _ from 'lodash';
import { mapGetters, mapActions } from 'vuex';
import { selectMixin } from '../../../mixins/select-mixin';
import { MultiSelect } from '../../search-select';
import { hasRole, toUserName } from '../../../utils/user';
import UserService from '../../../services/user-service';

const CUSTOM_PROPS = ['options', 'selected-options', 'selectedOptions'];
const CUSTOM_LISTENERS = ['select'];
// Add non inherited props from mixins
const MixinProps = MultiSelect.mixins.filter((m) => m.props).reduce((acc, cur) => ({ ...acc, ...cur.props }), {});
const VueSearchSelectInheritedProps = { ...MultiSelect.props, ...MixinProps };
const userService = new UserService();
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
    selected() {
      return this.value.map((v) => {
        const _id = _.get(v, 'value', _.get(v, '_id', v));
        let projectManager = v;
        if (!_.get(v, 'firstName')) {
          projectManager = this.options.find((o) => o._id === _id);
        }
        return { text: toUserName(projectManager), value: _id };
      });
    },
    projectManagerOptions() {
      return this.options.map((pm) => ({
        value: pm._id,
        text: toUserName(pm),
      }));
    },
    wrappedProps() {
      return _.omit(this.$props, CUSTOM_PROPS);
    },
    wrappedListeners() {
      return _.omit(this.$listeners, CUSTOM_LISTENERS);
    },
    canRetrieve() {
      return hasRole(this.userLogged, 'USER_READ_ALL')
        || hasRole(this.userLogged, 'REQUEST_READ_ALL')
        || hasRole(this.userLogged, 'REQUEST_READ_OWN');
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onProjectManagerSelect(projectManagers) {
      this.$emit('input', projectManagers.map((p) => p.value));
    },
    _retrieve() {
      if (this.canRetrieve) {
        this.loading = true;
        return userService.retrieveProjectManagers()
          .then((response) => {
            this.options = _.get(response, 'data.list', []);
          })
          .catch((err) => {
            const notification = {
              title: 'Error',
              message: 'Project managers could not be retrieved',
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
