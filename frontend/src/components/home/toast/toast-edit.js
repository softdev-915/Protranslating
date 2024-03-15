import _ from 'lodash';
import moment from 'moment';
import { mapActions, mapGetters } from 'vuex';
import { entityEditMixin } from '../../../mixins/entity-edit';
import LocalDate from '../../form/local-date.vue';
import { hasRole } from '../../../utils/user';
import UtcFlatpickr from '../../form/utc-flatpickr.vue';
import UserSelect from '../user/user-select.vue';
import VariableReference from '../../template-editor/variables-reference/variables-reference.vue';
import ToastService from '../../../services/toast-service';
import SimpleBasicSelect from '../../form/simple-basic-select.vue';

const toastService = new ToastService();
const TOAST_CONTEXT = {
  user: {
    firstName: 'Current',
    middleName: 'Logged',
    lastName: 'User',
    email: 'current-user@biglanguage.com',
    account: {
      lsp: {
        name: 'Big Language Solutions',
      },
      type: 'Contact',
    },
  },
};
const TOAST_CLASSES_LIST = ['success', 'danger', 'warning', 'info'];
const datepickerOptions = (minDate) => {
  let properMinDate = new Date();
  if (minDate) {
    if (typeof minDate === 'string') {
      properMinDate = moment.utc(minDate).toDate();
    } else if (moment.isMoment(minDate)) {
      properMinDate = minDate.toDate();
    } else {
      // assume date
      properMinDate = minDate;
    }
  }
  return {
    onValueUpdate: null,
    disableMobile: 'true',
    enableTime: true,
    allowInput: false,
    minDate: properMinDate,
  };
};

export default {
  mixins: [entityEditMixin],
  components: {
    LocalDate,
    UserSelect,
    UtcFlatpickr,
    VariableReference,
    SimpleBasicSelect,
  },
  data() {
    return {
      fromDatepickerOptions: datepickerOptions(),
      toastClassesList: [],
      toast: {
        _id: null,
        title: '',
        users: ['*'],
        usersCache: [],
        message: '',
        context: {},
        state: 'info',
        from: null,
        to: null,
        requireDismiss: false,
        deleted: false,
        readDate: null,
      },
      users: ['*'],
    };
  },
  created() {
    this.toastClassesList = TOAST_CLASSES_LIST;
  },
  watch: {
    users(newUsers) {
      this.toast.users = newUsers;
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    entityName() {
      return 'toast';
    },
    toastUsersName() {
      this.toast.usersCache.map((uc) => `${uc.firstName} ${uc.lastName}`).join(',');
    },
    canCreate() {
      return hasRole(this.userLogged, 'HEADER-NOTIFICATION_CREATE_ALL');
    },
    toastContext() {
      return TOAST_CONTEXT;
    },
    cancelText() {
      return 'Cancel';
    },
    stateClass() {
      return `text-${this.toast.state}`;
    },
    toDatepickerOptions() {
      return datepickerOptions(this.toast.from);
    },
    isValid() {
      return this.toast.title && this.toast.message;
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    _service() {
      return toastService;
    },
    _handleEditResponse(response) {
      const newToast = _.get(response, 'data.toast');
      const newReadDate = _.get(newToast, 'readDate');
      if (newReadDate) {
        this.toast.readDate = newReadDate;
      }
    },
    _handleRetrieve(response) {
      const toast = { from: '', to: '', ..._.get(response, 'data.toast') };
      this.$set(this, 'toast', toast);
      if (toast.users.length) {
        this.users = toast.usersCache.map((u) => u._id);
      } else {
        this.users = ['*'];
      }
    },
    onToastChange(newTo) {
      this.$set(this.toast, 'to', newTo);
    },
    _handleCreate(response) {
      this.toast._id = response.data.toast._id;
    },
    _refreshEntity(freshEntity) {
      this.$set(this, 'toast', freshEntity);
      if (freshEntity.users.length) {
        this.users = freshEntity.usersCache.map((u) => u._id);
      } else {
        this.users = ['*'];
      }
    },
    validateAndSimulate() {
      this.pushNotification({
        title: this.toast.title,
        message: this.toast.message,
        state: this.toast.state,
      });
    },
    save() {
      const cleanToast = this._preprocessToast();
      this._save(cleanToast);
    },
    _preprocessToast() {
      const cleanToast = { ...this.toast };
      if (!cleanToast.from) {
        delete cleanToast.from;
      }
      if (!cleanToast.to) {
        delete cleanToast.to;
      }
      return cleanToast;
    },
  },
};

