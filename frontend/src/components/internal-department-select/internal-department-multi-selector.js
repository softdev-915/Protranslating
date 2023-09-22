import Promise from 'bluebird';
import _ from 'lodash';
import { mapActions, mapGetters } from 'vuex';
import { MultiSelect } from '../search-select';
import InternalDepartmentService from '../../services/internal-department-service';
import { hasRole } from '../../utils/user';

const CUSTOM_PROPS = ['options', 'selected-options', 'selectedOptions'];
const CUSTOM_LISTENERS = ['select'];
const RETRIEVE_ROLES = ['INTERNAL-DEPARTMENT_READ_ALL', 'INTERNAL-DEPARTMENT_READ_OWN'];
// Add non inherited props from mixins
const MixinProps = MultiSelect.mixins.filter((m) => m.props).reduce((acc, cur) => ({ ...acc, ...cur.props }), {});
const VueSearchSelectInheritedProps = { ...MultiSelect.props, ...MixinProps };
const service = new InternalDepartmentService();
const buildInitialState = () => ({
  options: [],
  loading: false,
});

export default {
  props: {
    value: {
      type: Array,
    },
    internalDepartmentsAvailable: {
      type: Array,
    },
    ..._.omit(VueSearchSelectInheritedProps, CUSTOM_PROPS),
  },
  data() {
    return buildInitialState();
  },
  created() {
    this.init().then(() => this.onInternalDepartmentSelected(this.selected));
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    selected() {
      if (this.options.length) {
        return this.value.map((v) => {
          if (typeof v === 'string') {
            v = this.options.find((o) => o._id === v);
          }
          const text = _.get(v, 'name', '');
          const value = _.get(v, '_id', '');
          return { text, value };
        });
      }
      return [];
    },
    internalDepartmentsOptions() {
      if (Array.isArray(this.options)) {
        return this.options.map((d) => ({
          text: d.name,
          value: d._id,
        }));
      }
      return [];
    },
    canRetrieve() {
      return RETRIEVE_ROLES.some((role) => hasRole(this.userLogged, role));
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
    onInternalDepartmentSelected(internalDepartments) {
      this.$emit('input', internalDepartments.map((d) => ({ _id: d.value, name: d.text })));
    },
    _retrieveInternalDepartments() {
      if (this.canRetrieve) {
        this.loading = true;
        return service.retrieve()
          .then((response) => {
            this.options = response.data.list;
          })
          .catch((err) => {
            const notification = {
              title: 'Error',
              message: 'Internal Departments could not be retrieved',
              state: 'danger',
              response: err,
            };
            this.pushNotification(notification);
          })
          .finally(() => {
            this.loading = false;
          });
      }
      return Promise.resolve([]);
    },
    init() {
      if (this.internalDepartmentsAvailable) {
        this.options = this.internalDepartmentsAvailable;
        return Promise.resolve();
      }
      return this._retrieveInternalDepartments();
    },
  },
};
