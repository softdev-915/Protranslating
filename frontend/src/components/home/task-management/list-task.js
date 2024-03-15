import _ from 'lodash';
import { mapGetters, mapActions } from 'vuex';
import RequestTaskTable from './request-task-table.vue';
import TaskService from '../../../services/task-service';
import ProviderOffersService from '../../../services/provider-offers-service';
import { hasRole } from '../../../utils/user';
import { toOptionFormat } from '../../../utils/select2';
import UserAjaxBasicSelect from '../../form/user-ajax-basic-select.vue';
import OffersNotification from './offers-notification.vue';
import DeclineSelect from './decline-select.vue';

const taskService = new TaskService();
const providerOffersService = new ProviderOffersService();
const CURRENT_TASK_STATUS = 'current';
const PENDING_TASK_STATUS = 'pending';
const FUTURE_TASK_STATUS = 'future';
const EXCEED_CAPACITY = { text: 'Exceeds capacity', value: 'exceedsCapacity' };
const ANNUAL_LEAVE = { text: 'Annual leave', value: 'annualLeave' };
const PROVIDER_TASK_INSTRUCTIONS_UNCLEAR = { text: 'Provider Task Instructions Unclear', value: 'providerTaskInstructionsUnclear' };
const OUTSIDE_AREA_OF_EXPERTISE = { text: 'Outside Area of Expertise', value: 'outsideAreaOfExpertise' };
const OTHER = { text: 'Other', value: 'other' };

export default {
  components: {
    RequestTaskTable,
    UserAjaxBasicSelect,
    DeclineSelect,
    OffersNotification,
  },
  created() {
    const { providerId, providerName } = this.$route.query;
    if (providerId && providerName) {
      this.provider = { value: providerId, text: providerName };
    } else {
      this.provider = { value: this.userLogged._id, text: this.loggedInUserName };
    }
    this.decliningReasonOptions = [
      EXCEED_CAPACITY,
      ANNUAL_LEAVE,
      PROVIDER_TASK_INSTRUCTIONS_UNCLEAR,
      OUTSIDE_AREA_OF_EXPERTISE,
      OTHER,
    ];
  },
  data() {
    return {
      tasks: [],
      completedTasks: [],
      areTasksLoading: false,
      areOffersLoading: false,
      providerSelected: { value: '', text: '' },
      providers: [],
      provider: {},
      offers: [],
      showOffersTable: false,
      selectedOffers: [],
      cachedOffers: [],
    };
  },
  computed: {
    ...mapGetters('app', [
      'userLogged',
    ]),
    loggedInUserName() {
      return `${this.userLogged.firstName} ${this.userLogged.lastName}`;
    },
    canReadAll() {
      return hasRole(this.userLogged, 'TASK_READ_ALL');
    },
    providerOptions: function () {
      if (!this.providers) {
        return [];
      }
      return this.providers.map(toOptionFormat);
    },
    pendingTasks() {
      return this.tasks.filter((t) => t.priorityStatus === PENDING_TASK_STATUS);
    },
    currentTasks() {
      return this.tasks.filter((t) => t.priorityStatus === CURRENT_TASK_STATUS);
    },
    futureTasks() {
      return this.tasks.filter((t) => t.priorityStatus === FUTURE_TASK_STATUS);
    },
    noOffersSelected() {
      return this.selectedOffers.length === 0;
    },
    providerId() {
      return _.get(this, 'provider.value', '');
    },
    noOffersSelected() {
      return this.selectedOffers.length === 0;
    },
    providerId() {
      return _.get(this, 'provider.value', '');
    },
    noOffersSelected() {
      return this.selectedOffers.length === 0;
    },
    providerId() {
      return _.get(this, 'provider.value', '');
    },
    noOffersSelected() {
      return this.selectedOffers.length === 0;
    },
    providerId() {
      return _.get(this, 'provider.value', '');
    },
    isLoading() {
      return this.areOffersLoading || this.areTasksLoading;
    },
  },
  watch: {
    provider: async function (newProvider) {
      this.$set(this, 'providerSelected', newProvider);
      const providerId = _.get(newProvider, 'value');
      // We don't want to retrieve completed tasks upfront
      if (providerId) {
        this.fetchTasksAndOffers(providerId);
      }
    },
  },
  methods: {
    ...mapActions('tasks', ['updateTasks']),
    ...mapActions('notifications', ['pushNotification']),
    async fetchTasksAndOffers(providerId) {
      await Promise.all([
        this.fetchTasks(providerId),
        this.fetchOffers(providerId),
      ]);
    },
    async fetchTasks(providerId) {
      this.areTasksLoading = true;
      const tasksResponse = await taskService.retrieveUserTasks(providerId);
      this.tasks = _.get(tasksResponse, 'data', []);
      this.areTasksLoading = false;
    },
    async fetchOffers(providerId) {
      this.areOffersLoading = true;
      const offersResponse = await providerOffersService.retrieve(providerId);
      this.offers = _.get(offersResponse, 'data.providerOffers', []);
      this.showOffersTable = _.get(offersResponse, 'data.showOffersTable', false);
      this.areOffersLoading = false;
    },
    async refreshTasks(accepted) {
      if (_.isEmpty(this.providerId)) {
        return;
      }
      if (accepted) {
        return await this.fetchTasksAndOffers(this.providerId);
      }
      await this.fetchOffers(this.providerId);
    },
    onProviderSelected(providerSelected) {
      this.$set(this.provider, providerSelected.value);
      this.provider = providerSelected;
    },
    close() {
      this.$refs.modal.hide();
    },
    onTaskEdit(task) {
      this.$router.push({
        name: 'task-edition',
        params: {
          requestId: task.requestId,
        },
      }).catch((err) => { console.log(err); });
    },
    onTaskLoading(loading) {
      this.areTasksLoading = loading;
    },
    onCompletedTasks() {
      this.$router.push({
        name: 'task-grid',
        query: {
          filter: JSON.stringify({
            providerTaskStatus: ['Approved', 'Completed'], provider: this.provider.text,
          }),
        },
      }).catch((err) => { console.log(err); });
    },
    onRowSelected(rowId) {
      if (this.selectedOffers.includes(rowId)) {
        this.selectedOffers = this.selectedOffers.filter(id => id !== rowId);
      } else {
        this.selectedOffers.push(rowId);
      }
    },
    selectAllOffers(checked) {
      if (checked) {
        this.selectedOffers = this.offers.map(offer => offer._id);
      } else {
        this.selectedOffers = [];
      }
    },
    async acceptSelectedOffers() {
      const offersPayload = this.offers
        .filter(offer => this.selectedOffers.includes(offer._id))
        .map(({ _id, updatedAt }) => ({ _id, updatedAt }));
      await providerOffersService.acceptOffers(offersPayload, this.providerId);
      await this.fetchTasksAndOffers(this.providerId);
      this.selectedOffers = [];
    },
    async declineSelectedOffers() {
      const offersPayload = this.offers
        .filter(offer => this.selectedOffers.includes(offer._id))
        .map(({ _id, updatedAt }) => ({ _id, updatedAt }));
      await providerOffersService
        .declineOffers(offersPayload, this.providerId, this.offerDecliningReason);
      await this.fetchTasksAndOffers(this.providerId);
      this.selectedOffers = [];
      this.offerDecliningReason = '';
    },
    onRowSelected(rowId) {
      if (this.selectedOffers.includes(rowId)) {
        this.selectedOffers = this.selectedOffers.filter(id => id !== rowId);
      } else {
        this.selectedOffers.push(rowId);
      }
    },
    selectAllOffers(checked) {
      if (checked) {
        this.selectedOffers = this.offers.map(offer => offer._id);
      } else {
        this.selectedOffers = [];
      }
    },
    async acceptSelectedOffers() {
      const offersPayload = this.offers
        .filter(offer => this.selectedOffers.includes(offer._id))
        .map(({ _id, updatedAt }) => ({ _id, updatedAt }));
      await providerOffersService.acceptOffers(offersPayload, this.providerId);
      await this.fetchTasksAndOffers(this.providerId);
      this.selectedOffers = [];
    },
    async declineSelectedOffers() {
      const offersPayload = this.offers
        .filter(offer => this.selectedOffers.includes(offer._id))
        .map(({ _id, updatedAt }) => ({ _id, updatedAt }));
      await providerOffersService
        .declineOffers(offersPayload, this.providerId, this.offerDecliningReason);
      await this.fetchTasksAndOffers(this.providerId);
      this.selectedOffers = [];
      this.offerDecliningReason = '';
    },
    onRowSelected(rowId) {
      if (this.selectedOffers.includes(rowId)) {
        this.selectedOffers = this.selectedOffers.filter(id => id !== rowId);
      } else {
        this.selectedOffers.push(rowId);
      }
    },
    selectAllOffers(checked) {
      if (checked) {
        this.selectedOffers = this.offers.map(offer => offer._id);
      } else {
        this.selectedOffers = [];
      }
    },
    async acceptSelectedOffers() {
      const offersPayload = this.offers
        .filter(offer => this.selectedOffers.includes(offer._id))
        .map(({ _id, updatedAt }) => ({ _id, updatedAt }));
      await providerOffersService.acceptOffers(offersPayload, this.providerId);
      await this.fetchTasksAndOffers(this.providerId);
      this.selectedOffers = [];
    },
    async declineSelectedOffers() {
      const offersPayload = this.offers
        .filter(offer => this.selectedOffers.includes(offer._id))
        .map(({ _id, updatedAt }) => ({ _id, updatedAt }));
      await providerOffersService
        .declineOffers(offersPayload, this.providerId, this.offerDecliningReason);
      await this.fetchTasksAndOffers(this.providerId);
      this.selectedOffers = [];
      this.offerDecliningReason = '';
    },
    onRowSelected(rowId) {
      if (this.selectedOffers.includes(rowId)) {
        this.selectedOffers = this.selectedOffers.filter(id => id !== rowId);
      } else {
        this.selectedOffers.push(rowId);
      }
    },
    selectAllOffers(checked) {
      if (checked) {
        this.selectedOffers = this.offers.map(offer => offer._id);
      } else {
        this.selectedOffers = [];
      }
    },
    async acceptSelectedOffers() {
      try {
        const offersPayload = this.offers
          .filter(offer => this.selectedOffers.includes(offer._id))
          .map(({ _id, updatedAt }) => ({ _id, updatedAt }));
        await providerOffersService.acceptOffers(offersPayload, this.providerId);
        await this.fetchTasksAndOffers(this.providerId);
        this.cachedOffers = [
          { offers: offersPayload, accepted: true },
          ...this.cachedOffers];
        this.selectedOffers = [];
      } catch (err) {
        const notification = {
          title: 'Error',
          message: 'Offer accept failed',
          state: 'danger',
        };
        this.pushNotification(notification);
      }
    },
    async declineSelectedOffers(option) {
      const offerDecliningReason = _.get(option, 'value');
      if (_.isEmpty(offerDecliningReason)) {
        return;
      }
      try {
        const offersPayload = this.offers
          .filter(offer => this.selectedOffers.includes(offer._id))
          .map(({ _id, updatedAt }) => ({ _id, updatedAt }));
        await providerOffersService
          .declineOffers(offersPayload, this.providerId, offerDecliningReason);
        await this.fetchTasksAndOffers(this.providerId);
        this.cachedOffers = [
          { offers: offersPayload, accepted: false },
          ...this.cachedOffers];
        this.selectedOffers = [];
      } catch (err) {
        const notification = {
          title: 'Error',
          message: 'Offer decline failed',
          state: 'danger',
        };
        this.pushNotification(notification);
      }
    },
  },
};
