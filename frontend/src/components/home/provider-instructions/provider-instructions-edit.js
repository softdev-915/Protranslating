import _ from 'lodash';
import ProviderInstructionsService from '../../../services/provider-instructions-service';
import { entityEditMixin } from '../../../mixins/entity-edit';
import userRoleCheckMixin from '../../../mixins/user-role-check';

const providerInstructionsService = new ProviderInstructionsService();
const BODY_MAX_LENGTH = 5000;
const buildInitialState = () => ({
  providerInstructions: {
    _id: '',
    name: '',
    body: '',
    deleted: false,
    readDate: null,
  },
});

export default {
  mixins: [entityEditMixin, userRoleCheckMixin],
  data() {
    return buildInitialState();
  },
  computed: {
    entityName() {
      return 'providerInstructions';
    },
    canCreate() {
      return this.hasRole('PROVIDER-TASK-INSTRUCTIONS_CREATE_ALL');
    },
    canCreateOrEdit() {
      return this.canEdit || (this.isNew && this.canCreate);
    },
    canEdit() {
      return this.hasRole('PROVIDER-TASK-INSTRUCTIONS_UPDATE_ALL');
    },
    cancelText() {
      return this.canCreateOrEdit ? 'Cancel' : 'Exit';
    },
    showBreadcrumb() {
      return this.navigationBreadcrumb.length > 1;
    },
    isNew() {
      return _.get(this, 'providerInstructions._id') === '';
    },
    isNameValid() {
      return !_.isEmpty(this.providerInstructions.name);
    },
    isBodyValid() {
      return !_.isEmpty(this.providerInstructions.body);
    },
    isValid() {
      return this.isNameValid && this.isBodyValid;
    },
  },
  methods: {
    _service() {
      return providerInstructionsService;
    },
    _handleRetrieve(response) {
      this.providerInstructions = response.data.providerInstructions;
    },
    _handleCreate(response) {
      this.providerInstructions._id = response.data.providerInstructions._id;
    },
    _handleEditResponse(response) {
      const newReadDate = _.get(response, 'data.providerInstructions.readDate');
      if (newReadDate) {
        this.providerInstructions.readDate = newReadDate;
      }
    },
    _refreshEntity(freshEntity) {
      this.providerInstructions = freshEntity;
    },
    save() {
      if (this.isValid) {
        this._save(this.providerInstructions);
      }
    },
    onBodyChange(event) {
      const value = event.target.value;
      if (_.get(value, 'length', 0) > BODY_MAX_LENGTH) {
        this.providerInstructions.body = value.substring(0, BODY_MAX_LENGTH);
        return;
      }
    },
    cancel() {
      this.close();
    },
  },
};
