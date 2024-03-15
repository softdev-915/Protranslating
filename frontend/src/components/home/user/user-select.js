import { mapActions } from 'vuex';
import _ from 'lodash';
import UserService from '../../../services/user-service';
import SimpleBasicSelect from '../../form/simple-basic-select.vue';

const userService = new UserService();
const ALL_VALUE = { _id: '*', firstName: 'All', lastName: '' };

export default {
  components: { SimpleBasicSelect },
  props: {
    multi: {
      type: Boolean,
      default: false,
    },
    value: {
      type: [String, Array],
    },
    allowAll: {
      type: Boolean,
      default: false,
    },
    usersAvailable: Array,
    emitRetrieveError: {
      type: Boolean,
      default: false,
    },
    placeholder: String,
    formatOption: {
      type: Function,
      default: ({ firstName = '', lastName = '', _id = '' }) => ({ text: `${firstName} ${lastName}`, value: _id }),
    },
  },
  created() {
    if (!this.usersAvailable) {
      this.loading = true;
      userService.query({ attributes: ['email', 'firstName', 'lastName'].join(' '), aggregate: false }).then((response) => {
        this.users = response.data.list;
        if (this.multi && this.allowAll) {
          this.users.push(ALL_VALUE);
        }
        if (this.value) {
          let comparison = (val) => val === this.value;
          if (Array.isArray(this.value)) {
            comparison = (val) => this.value.indexOf(val) !== -1;
          }
          const userSelected = this.users.find((u) => comparison(u._id));
          if (userSelected) {
            this.selected = [{ value: userSelected._id, text: `${userSelected.firstName} ${userSelected.lastName}` }];
          }
        }
      }).catch((err) => {
        if (this.emitRetrieveError) {
          this.$emit('user-retrieve-error', err);
        } else {
          const notification = {
            title: 'Error',
            message: 'Could not retrieve users',
            state: 'danger',
            response: err,
          };
          this.pushNotification(notification);
        }
      }).finally(() => {
        this.loading = false;
      });
    }
  },
  data() {
    return {
      users: [],
      selected: [],
      loading: false,
    };
  },
  computed: {
    usersOptions() {
      return this.users.map((u) => ({
        text: `${u.firstName} ${u.lastName}`,
        value: u._id,
      }));
    },
  },
  watch: {
    value: {
      handler(newValue) {
        if (!_.get(this, 'multi', false)) {
          this.selected = newValue;
        }
      },
      immediate: true,
    },
    selected(newValue) {
      if (!_.get(this, 'multi', false)) {
        this.$emit('input', newValue);
      }
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onUserSelected(usersSelected) {
      this.selected = usersSelected;
      if (usersSelected.length > 1) {
        const allIndex = usersSelected.findIndex((u) => u.value === '*');
        if (allIndex === usersSelected.length - 1) {
          // if all is the last index, remove all other options
          this.selected = [{ value: ALL_VALUE._id, text: ALL_VALUE.firstName }];
          usersSelected = this.selected;
        } else if (allIndex !== -1) {
          // remove the ALL options if other user was selected after it.
          usersSelected.splice(allIndex, 1);
          this.selected = usersSelected;
        }
      }
      this.$emit('input', usersSelected.map((s) => s.value));
    },
  },
};
