import _ from 'lodash';
import moment from 'moment';
import { mapGetters, mapActions } from 'vuex';
import { entityEditMixin } from '../../../mixins/entity-edit';
import NotificationService from '../../../services/notification-service';
import SimpleBasicSelect from '../../form/simple-basic-select.vue';

const notificationService = new NotificationService();

export default {
  components: { SimpleBasicSelect },
  mixins: [entityEditMixin],
  created() {
    this.loading = true;
    notificationService.retrieveAvailableBackups()
      .then((res) => {
        this.availableBackups = _.get(res, 'data', []);
        this.loading = false;
      })
      .catch((err) => {
        this.pushNotification({
          title: 'Error',
          message: 'Could not retrieve backups',
          state: 'danger',
          response: err,
        });
      })
      .finally(() => {
        this.loading = false;
      });
    this.selectEmptyOption = { text: '', value: null };
  },
  data() {
    return {
      loading: false,
      restoring: false,
      availableBackups: {},
      fromYear: null,
      fromMonth: null,
      restoreExecuted: false,
      restoreExecutedSuccess: '',
      restoreExecutedDetail: '',
    };
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    ...mapGetters('features', ['mock']),
    backupsAvailable() {
      return !_.isEmpty(this.availableBackups);
    },
    years() {
      return Object.keys(this.availableBackups).map(_.toInteger);
    },
    months() {
      if (!this.fromYear) return [];
      const selectedYearMonths = this.availableBackups[this.fromYear];
      return selectedYearMonths.map(month => ({
        value: month - 1,
        text: moment().month(month - 1).format('MMMM'),
      }));
    },
    isYearSelected() {
      return !_.isNil(this.fromYear);
    },
    isMonthSelected() {
      return !_.isNil(this.fromMonth);
    },
    areYearMonthSet() {
      return this.isYearSelected && this.isMonthSelected;
    },
    dateFrom() {
      return `${this.fromMonth}/${this.fromYear}`;
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    runRestore() {
      this.loading = true;
      this.restoring = true;
      const period = {
        fromYear: this.fromYear,
        fromMonth: this.fromMonth,
      };
      notificationService.restore(period)
        .then((res) => {
          this.restoreExecutedSuccess = 'success';
          this.restoreExecutedDetail = _.get(res, 'data.summary', []);
          this.pushNotification({
            title: 'Success',
            message: 'Backups restored successfully',
            state: 'success',
          });
          this.restoreExecuted = true;
        })
        .catch((e) => {
          this.restoreExecutedSuccess = 'errored';
          this.pushNotification({
            title: 'Unable to run restore process',
            message: 'Please try again later',
            state: 'danger',
            response: e,
          });
        })
        .finally(() => {
          this.restoring = false;
          this.loading = false;
        });
    },
  },
};
