import _ from 'lodash';
import UserAjaxBasicSelect from '../../../form/user-ajax-basic-select.vue';

export default {
  name: 'CompanyExcludedProvidersRow',
  components: {
    UserAjaxBasicSelect,
  },
  props: {
    value: {
      type: Object,
      required: true,
    },
    excludedProviders: {
      type: Array,
      required: true,
    },
    index: {
      type: Number,
      required: true,
    },
    canReadAll: {
      type: Boolean,
      required: true,
    },
    canEdit: {
      type: Boolean,
      required: true,
    },
    companyId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      filterForRetrieve: {
        excludedProvidersAreExcluded: true,
        company: this.companyId,
      },
      isEditingNotes: false,
      originalNote: this.value.user.notes,
    };
  },
  computed: {
    isDuplicate() {
      const matches = _.filter(
        this.excludedProviders,
        p => p.user.userId === this.value.user.userId
      );
      return matches.length >= 2;
    },
    isValid() {
      const excludedProvider = this.value;
      return excludedProvider.user.name &&
      excludedProvider.user.userId &&
      !excludedProvider.user.isLocked &&
      !this.isDuplicate;
    },
    providerNameSelectedOption() {
      return {
        text: `${this.value.user.name}`,
        value: this.value.userId,
      };
    },
    providerIdSelectedOption() {
      return {
        text: this.value.user.userId,
        value: this.value.user.userId,
      };
    },
    noteWasEdited() {
      return this.originalNote !== this.value.user.notes;
    },
  },
  methods: {
    cancelExcludedProvider(index, excludedProvider) {
      this.$emit('cancel-excluded-provider', { index, excludedProvider, isDuplicate: this.isDuplicate });
    },
    deleteExcludedProvider(index, excludedProvider) {
      this.$emit('delete-excluded-provider', { index, excludedProvider });
    },
    addRow(index) {
      this.$emit('add-row', index);
    },
    lockExcludedProvider(excludedProvider) {
      this.$emit('lock-excluded-provider', { excludedProvider, isDuplicate: this.isDuplicate });
    },
    formatOption(user) {
      return user._id;
    },
    toggleIsEditingNotes() {
      this.isEditingNotes = !this.isEditingNotes;
    },
    updateExcludedProviderNote() {
      this.$emit('update-excluded-provider-note', { index: this.index, excludedProvider: this.value });
    },
    handleSaveNote() {
      this.toggleIsEditingNotes();
      if (!this.value.isNew) {
        this.updateExcludedProviderNote();
      }
    },
    updateExcludedProvider(provider) {
      const user = this.value.user;
      Object.assign(user, {
        userId: provider.value,
        name: `${provider.firstName} ${provider.lastName}`,
        type: provider.type,
        isLocked: false,
      });
    },
    handleDropdownSelection(provider) {
      this.updateExcludedProvider(provider);
      this.$emit('handle-duplicates', { providerId: provider.value, index: this.index, isDuplicate: this.isDuplicate });
    },
    extraFilter(term) {
      return { _id: term };
    },
  },
};

