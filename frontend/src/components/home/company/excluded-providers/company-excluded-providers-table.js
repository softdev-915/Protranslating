import _ from 'lodash';
import { mapActions } from 'vuex';
import userRoleCheckMixin from '../../../../mixins/user-role-check';
import CompanyExcludedProvidersService from '../../../../services/company-excluded-providers-service';
import CompanyExcludedProvidersRow from './company-excluded-providers-row.vue';

const newExcludedProvider = () => ({
  vueKey: _.uniqueId(new Date().getTime()),
  isNew: true,
  user: {
    userId: '',
    name: '',
    type: '',
    isLocked: false,
    notes: '',
  },
});
const buildInitialState = () => ({
  excludedProviders: [],
});

export default {
  name: 'CompanyExcludedProvidersTable',
  mixins: [userRoleCheckMixin],
  components: {
    CompanyExcludedProvidersRow,
  },
  props: {
    query: {
      type: Object,
    },
    companyId: {
      type: String,
      required: true,
    },
  },
  data() {
    return buildInitialState();
  },
  created() {
    this._retrieveExcludedProviders();
  },
  computed: {
    canReadAll() {
      return this.hasRole('COMPANY_READ_ALL');
    },
    canEdit() {
      return this.hasRole('COMPANY_UPDATE_ALL');
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    addRow(index) {
      this.excludedProviders.splice(++index, 0, newExcludedProvider());
    },
    lockExcludedProvider(excludedProviderData) {
      const { excludedProvider } = excludedProviderData;
      const { name, userId } = excludedProvider.user;
      const { isDuplicate } = excludedProviderData;
      if ((!isDuplicate) && (name && userId)) {
        excludedProvider.user.isLocked = true;
        this.$emit('add-excluded-provider', excludedProvider);
      }
    },
    removeRowFromTable(index, table) {
      if (index < table.length) {
        table.splice(index, 1);
        return;
      }
      table.splice(index -= table.length, 1);
    },
    checkIfProviderIsADuplicate(providerId) {
      const matches = _.filter(
        this.excludedProviders,
        (p) => p.user.userId === providerId,
      );
      return matches.length >= 2;
    },
    handleDuplicates(providerData) {
      const { providerId } = providerData;
      const { isDuplicate } = providerData;
      if (isDuplicate) {
        this.setIsLockedToFalseOnDuplicates(providerId);
        this.$emit('remove-excluded-provider', providerId);
      }
    },
    setIsLockedToFalseOnDuplicates(providerId) {
      _.forEach(this.excludedProviders, (provider) => {
        if (provider.user.userId === providerId) {
          provider.user.isLocked = false;
        }
      });
    },
    findProviderIndex(providerId) {
      return _.findIndex(this.excludedProviders, (p) => p.user.userId === providerId);
    },
    handleDuplicatesOnDelete(providerId) {
      const isDuplicate = this.isProviderStillADuplicate(providerId);
      if (isDuplicate) {
        return;
      }
      const providerIndex = this.findProviderIndex(providerId);
      const provider = this.excludedProviders[providerIndex];
      if (provider) {
        this.lockExcludedProvider({ excludedProvider: provider, isDuplicate: isDuplicate });
      }
    },
    isProviderStillADuplicate(providerId) {
      const matches = _.filter(
        this.excludedProviders,
        (p) => p.user.userId === providerId,
      );
      return matches.length >= 2;
    },
    cancelExcludedProvider(providerData) {
      const { index } = providerData;
      const { excludedProvider } = providerData;
      const { isDuplicate } = providerData;
      const excludedProviderId = excludedProvider.user.userId;
      if (excludedProvider) {
        this.$emit('remove-excluded-provider', excludedProviderId);
      }
      this.removeRowFromTable(index, this.excludedProviders);
      this.handleDuplicatesOnDelete(excludedProviderId, isDuplicate);
    },
    deleteExcludedProvider(providerData) {
      const { index } = providerData;
      const excludedProviderId = providerData.excludedProvider.user.userId;
      if (excludedProviderId) {
        this.$emit('remove-excluded-provider', excludedProviderId);
      }
      this.removeRowFromTable(index, this.excludedProviders);
    },
    updateExcludedProviderNote(excludedProviderData) {
      this.$emit('update-excluded-provider-note', excludedProviderData);
    },
    addIsLocked(listOfExcludedProviders) {
      return _.forEach(listOfExcludedProviders, (p) => { p.user.isLocked = true; });
    },
    _retrieveExcludedProviders() {
      new CompanyExcludedProvidersService().retrieve(this.query)
        .then((res) => {
          const dataList = _.get(res, 'data.list', []);
          this.excludedProviders = this.addIsLocked(dataList);
        })
        .catch((e) => this.pushNotification({
          title: 'Error',
          message: 'Excluded providers could not be retrieved',
          state: 'danger',
          response: e,
        }));
    },
  },
};
