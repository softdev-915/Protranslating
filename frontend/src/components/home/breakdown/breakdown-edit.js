import _ from 'lodash';
import { mapGetters } from 'vuex';
import BreakdownService from '../../../services/breakdown-service';
import { entityEditMixin } from '../../../mixins/entity-edit';
import { hasRole } from '../../../utils/user';
import { findBreakdownValidationError } from './breakdown-validator';

const breakdownService = new BreakdownService();
const buildInitialState = () => ({
  breakdown: {
    _id: '',
    name: '',
    deleted: false,
    readDate: null,
  },
});

export default {
  mixins: [entityEditMixin],
  data() {
    return buildInitialState();
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    entityName() {
      return 'breakdown';
    },
    canCreate: function () {
      return hasRole(this.userLogged, 'BREAKDOWN_CREATE_ALL');
    },
    canCreateOrEdit: function () {
      return this.canEdit || (this.isNew && this.canCreate);
    },
    canEdit: function () {
      return hasRole(this.userLogged, 'BREAKDOWN_UPDATE_ALL');
    },
    cancelText: function () {
      return this.canCreateOrEdit ? 'Cancel' : 'Exit';
    },
    showBreadcrumb: function () {
      return this.navigationBreadcrumb.length > 1;
    },
    isNew() {
      if (this.breakdown && typeof this.breakdown === 'object') {
        return this.breakdown._id === '';
      }
    },
    isValid: function () {
      return this.entityValidationErrors.length === 0;
    },
    entityValidationErrors() {
      return findBreakdownValidationError(this.breakdown);
    },
  },
  methods: {
    _service() {
      return breakdownService;
    },
    _handleRetrieve(response) {
      this.breakdown = response.data.breakdown;
    },
    _handleCreate(response) {
      this.breakdown._id = response.data.breakdown._id;
    },
    _handleEditResponse(response) {
      const newReadDate = _.get(response, 'data.breakdown.readDate');
      if (newReadDate) {
        this.breakdown.readDate = newReadDate;
      }
    },
    _refreshEntity(freshEntity) {
      this.$set(this, 'breakdown', freshEntity);
    },
    save() {
      if (this.isValid) {
        this._save(this.breakdown);
      }
    },
    cancel() {
      this.close();
    },
  },
};
