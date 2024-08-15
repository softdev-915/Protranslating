import _ from 'lodash';
import moment from 'moment';
import { mapActions, mapGetters } from 'vuex';
import LocalDate from '../../form/local-date.vue';
import { hasRole } from '../../../utils/user';
import { isEmail } from '../../../utils/form';
import UtcFlatpickr from '../../form/utc-flatpickr.vue';
import ScheduleEmail from './schedule-email/schedule-email.vue';
import { entityEditMixin } from '../../../mixins/entity-edit';
import DynamicFields from '../../form/dynamic-fields.vue';
import SchedulerService from '../../../services/scheduler-service';
import BillService from '../../../services/bill-service';
import ConnectorService from '../../../services/connector-service';
import SessionFlags from '../../../utils/session/session-flags';
import SimpleBasicSelect from '../../form/simple-basic-select.vue';
import UserAjaxBasicSelect from '../../form/user-ajax-basic-select.vue';
import AutoTranslateService from '../../../services/auto-translate-service';
import NotificationService from '../../../services/notification-service';
import SchedulerEntityModal from './scheduler-entity-modal.vue';

const isGreaterThanZero = function (val) {
  return _.isNull(val) || _.isUndefined(val) || (_.isNumber(val) && val > 0);
};
const EVERY_PATTERN = /[0-9.]+\s(seconds|minutes|hours|days|weeks|months|years)/i;
const EVERY_CRONJOB_PATTERN = /.+ .+ .+ .+ .+.*/;
const PRIORITIES_LIST = ['Lowest', 'Low', 'Normal', 'High', 'Highest'];
const buildInitialState = () => ({
  loading: false,
  sanitizingTemplate: false,
  isModalVisible: false,
  scheduler: {
    _id: '',
    every: '',
    schedule: null,
    options: {
      lockLifetime: null,
      lockLimit: null,
      concurrency: null,
      additionalValues: {},
      additionalSchema: {},
      notificationDelay: 0,
    },
    email: {
      from: '',
      template: '',
      variables: {},
    },
    readDate: null,
    sendRunRequest: false,
  },
  showModal: false,
  templateError: null,
  selectedPriority: {},
  datepickerOptions: {
    onValueUpdate: null,
    enableTime: true,
    disableMobile: 'true',
    allowInput: true,
  },
  showExecutionHistory: false,
  mockedEntitySIPayload: [],
});
const schedulerService = new SchedulerService();
const billService = new BillService();
const connectorService = new ConnectorService();
const autoTranslateService = new AutoTranslateService();
const notificationService = new NotificationService();
billService.runNow = billService.createBills;
connectorService.runNow = connectorService.runScheduler;
autoTranslateService.runNow = autoTranslateService.runScheduler;
notificationService.runNow = notificationService.runScheduler;

export default {
  mixins: [entityEditMixin],
  components: {
    LocalDate,
    ScheduleEmail,
    DynamicFields,
    UtcFlatpickr,
    SimpleBasicSelect,
    UserAjaxBasicSelect,
    SchedulerEntityModal,
  },
  data() {
    return buildInitialState();
  },
  created() {
    this.prioritiesList = PRIORITIES_LIST;
    const flags = SessionFlags.getCurrentFlags();
    this.mock = _.get(flags, 'mock', false);
  },
  watch: {
    showModal(isVisible) {
      this.isModalVisible = isVisible;
    },
    selectedPriority: function (newPrioritySelected) {
      if (newPrioritySelected) {
        this.$set(this.scheduler.options, 'priority', newPrioritySelected.value);
      } else {
        this.$set(this.scheduler.options, 'priority', null);
      }
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    ...mapGetters('features', ['mockSiConnectorRunNow']),
    schedulerServiceMap() {
      return {
        'bill-invoice-per-period': billService,
        'bill-flat-rate': billService,
        'bill-variable-rate': billService,
        'bill-monthly-vendor': billService,
        'si-connector': this.mockSiConnectorRunNow ? schedulerService : connectorService,
        'auto-pdf-to-mt-text-recognition': autoTranslateService,
        'auto-pdf-to-mt-text-translation': autoTranslateService,
        'auto-pdf-to-mt-text-deleting': autoTranslateService,
        'backup-notifications-monthly': notificationService,
      };
    },
    shouldSelectEntityToSync() {
      if (this.scheduler.name === 'si-connector') {
        return !this.mockSiConnectorRunNow;
      }
      return [
        'document-retention-policy',
        'bill-invoice-per-period',
        'bill-flat-rate',
        'bill-variable-rate',
        'auto-pdf-to-mt-text-recognition',
        'auto-pdf-to-mt-text-translation',
        'bill-monthly-vendor',
      ].includes(this.scheduler.name);
    },
    entityName() {
      return 'scheduler';
    },
    hasAdditionalProperties() {
      const additionalValues = _.get(this.scheduler, 'options.additionalValues', {});
      return Object.keys(additionalValues).length > 0;
    },
    isValidEvery: function () {
      if (this.scheduler.every) {
        return EVERY_PATTERN.test(this.scheduler.every)
         || EVERY_CRONJOB_PATTERN.test(this.scheduler.every);
      }
      return true;
    },
    isValidSchedule: function () {
      if (this.scheduler.schedule) {
        const newMoment = moment(this.scheduler.schedule, moment.ISO_8601, true);
        const isValid = newMoment.isValid();
        return isValid;
      }
      return true;
    },
    isValidNotificationDelay() {
      return _.isInteger(_.toNumber(this.scheduler.options.notificationDelay));
    },
    isValidEmail: function () {
      return this.scheduler.email && isEmail(this.scheduler.email.from);
    },
    isValidSubject: function () {
      return this.scheduler.email && this.scheduler.email.subject !== '';
    },
    isValidTemplate: function () {
      return this.scheduler.email && this.scheduler.email.template !== '' && !this.templateError;
    },
    isValidLockLifetime() {
      return isGreaterThanZero(this.scheduler.options.lockLifetime);
    },
    isValidLockLimit() {
      return isGreaterThanZero(this.scheduler.options.lockLimit);
    },
    isValidConcurrency() {
      return isGreaterThanZero(this.scheduler.options.concurrency);
    },
    canEdit: function () {
      return hasRole(this.userLogged, 'SCHEDULER_UPDATE_ALL');
    },
    cancelText: function () {
      return this.canEdit ? 'Cancel' : 'Exit';
    },
    isValidEmailConfig: function () {
      if (typeof this.scheduler.email === 'undefined' || this.scheduler.email === null) {
        // Not email related job
        return true;
      }
      return this.scheduler.email && this.isValidEmail
        && this.isValidSubject && this.isValidTemplate;
    },
    isValid: function () {
      return (this.scheduler.every || this.scheduler.schedule)
        && this.isValidEvery
        && this.isValidSchedule
        && this.isValidEmailConfig
        && this.isValidNotificationDelay;
    },
    showDelayField() {
      return _.isEqual(this.scheduler.name, 'request-modified-pm-email');
    },
    canShowMockedEntityPayload() {
      return this.mock
        && this.scheduler.name === 'si-connector'
        && !_.isEmpty(this.mockedEntitySIPayload);
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    _service() {
      return schedulerService;
    },
    _handleEditResponse(response) {
      const newReadDate = _.get(response, 'data.scheduler.readDate');
      if (newReadDate) {
        this.scheduler.readDate = newReadDate;
      }
    },
    _handleRetrieve(response) {
      const properScheduler = _.merge({
        options: {
          additionalValues: {},
          additionalSchema: {},
          notificationDelay: 0,
        },
      }, response.data.scheduler);
      this.scheduler = properScheduler;
    },
    _refreshEntity(freshEntity) {
      this.$set(this, 'scheduler', freshEntity);
    },
    _handleCreate(response) {
      this.scheduler._id = response.data.ability._id;
    },
    onTemplateError(templateError) {
      this.templateError = templateError;
    },
    onEveryChange() {
      this.$set(this.scheduler, 'schedule', null);
    },
    onScheduleChange(newDate) {
      if (newDate) {
        this.$set(this.scheduler, 'schedule', newDate);
        this.$set(this.scheduler, 'every', '');
      }
    },
    onEmailChange(newEmailConfig) {
      this.$set(this.scheduler, 'email', newEmailConfig);
    },
    onSanitizingTemplate(sanitizing) {
      this.sanitizingTemplate = sanitizing;
    },
    onEntitySelect(entity, entityId) {
      this.selectedModalOption = { entity, entityId };
    },
    runNow(entity) {
      const serviceToRun = _.get(this.schedulerServiceMap, this.scheduler.name, schedulerService);
      let schedulerParams = null;
      if (this.shouldSelectEntityToSync) {
        const selectedEntityId = _.get(this, 'selectedModalOption.entityId', '');
        if (!this.isModalVisible) {
          this.showModal = true;
          return;
        }
        if (_.isEmpty(selectedEntityId)) {
          schedulerParams = { entity };
        } else {
          schedulerParams = this.selectedModalOption;
        }
      }
      this.loading = true;
      serviceToRun
        .runNow(this.scheduler, schedulerParams).then((res) => {
          const notification = {
            title: 'Success',
            message: _.get(res, 'data', 'Scheduler is running'),
            state: 'success',
          };
          this.pushNotification(notification);
          this.getMockedEntitySIPayload(entity);
        }).catch((err) => {
          const notification = {
            title: 'Error',
            message: _.get(err, 'status.message', 'Error running scheduler'),
            state: 'danger',
            response: err,
          };
          this.pushNotification(notification);
        })
        .finally(() => {
          this.showModal = false;
          this.selectedModalOption = { text: '', value: '' };
          this.loading = false;
        });
    },
    async getMockedEntitySIPayload(entityName) {
      const selectedEntityId = _.get(this, 'selectedModalOption.entityId', '');
      if (
        this.mock
        && this.scheduler.name === 'si-connector'
        && !_.isEmpty(selectedEntityId)
        && !_.isEmpty(entityName)
      ) {
        try {
          const { data } = await connectorService.getEntityPayload(entityName, selectedEntityId);
          this.mockedEntitySIPayload = data;
        } catch (err) {
          this.pushNotification({
            title: 'Error',
            message: _.get(err, 'status.message', 'Error getting compiled payload for entity'),
            state: 'danger',
            response: err,
          });
        }
      }
    },
    save() {
      const schedulerToSend = {
        ...this.scheduler,
        options: { ...this.scheduler.options, notificationDelay: _.toNumber(_.get(this.scheduler, 'options.notificationDelay', 0)) },
      };
      this._save(schedulerToSend);
    },
    onModalHide() {
      this.showModal = false;
    },
    onModalShow() {
      this.showModal = true;
    },
  },
};
