import _ from 'lodash';
import { mapGetters, mapActions } from 'vuex';
import IpInstructionsDeadlineService from '../../../services/ip-instructions-deadline-service';
import { entityEditMixin } from '../../../mixins/entity-edit';
import userRoleCheckMixin from '../../../mixins/user-role-check';
import { findEmptyFieldsValidationError, findFieldFormattingError } from './ip-instructions-deadline-validator';

const ipInstructionsDeadlineService = new IpInstructionsDeadlineService();

export default {
  mixins: [entityEditMixin, userRoleCheckMixin],
  data() {
    return {
      ipInstructionsDeadline: {
        _id: '',
        totalOrClaimsWordCount: '',
        noticePeriod: '',
        deleted: false,
        readDate: null,
      },
    };
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    entityName() {
      return 'ipInstructionsDeadline';
    },
    canCreate() {
      return this.hasRole('IP-INSTRUCTIONS-DEADLINE_CREATE_ALL');
    },
    canCreateOrEdit() {
      return this.canEdit || (this.isNew && this.canCreate);
    },
    canEdit() {
      return this.hasRole('IP-INSTRUCTIONS-DEADLINE_UPDATE_ALL');
    },
    cancelText() {
      return this.canCreateOrEdit ? 'Cancel' : 'Exit';
    },
    showBreadcrumb() {
      return this.navigationBreadcrumb.length > 1;
    },
    isNew() {
      return _.get(this.ipInstructionsDeadline, '_id', '') === '';
    },
    isValid() {
      return this.entityValidationErrors.length === 0;
    },
    entityValidationErrors() {
      return findEmptyFieldsValidationError(this.ipInstructionsDeadline);
    },
    inputFieldFormattingError() {
      return findFieldFormattingError(this.ipInstructionsDeadline);
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    _service() {
      return ipInstructionsDeadlineService;
    },
    _handleRetrieve(response) {
      this.ipInstructionsDeadline = response.data.ipInstructionsDeadline;
    },
    _handleCreate(response) {
      this.ipInstructionsDeadline._id = response.data.ipInstructionsDeadline._id;
    },
    _handleEditResponse(response) {
      const newReadDate = _.get(response, 'data.ipInstructionsDeadline.readDate');
      if (newReadDate) {
        this.ipInstructionsDeadline.readDate = newReadDate;
      }
    },
    _refreshEntity(freshEntity) {
      Object.assign(this.ipInstructionsDeadline, freshEntity);
    },
    save() {
      if (this.isValid) {
        if (_.isEmpty(this.inputFieldFormattingError)) {
          this._save(this.ipInstructionsDeadline);
        } else {
          const notification = {
            title: 'Error',
            message: _.get(this.inputFieldFormattingError, 'message'),
            state: 'danger',
          };
          this.pushNotification(notification);
        }
      }
    },
    cancel() {
      this.close();
    },
  },
};
