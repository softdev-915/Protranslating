import _ from 'lodash';
import { mapGetters } from 'vuex';
import LeadSourceService from '../../../services/lead-source-service';
import { entityEditMixin } from '../../../mixins/entity-edit';
import { hasRole } from '../../../utils/user';
import { findLeadSourceValidationError } from './lead-source-validator';

const leadSourceService = new LeadSourceService();
const buildInitialState = () => ({
  leadSource: {
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
      return 'leadSource';
    },
    canCreate: function () {
      return hasRole(this.userLogged, 'LEAD-SOURCE_CREATE_ALL');
    },
    canCreateOrEdit: function () {
      return this.canEdit || (this.isNew && this.canCreate);
    },
    canEdit: function () {
      return hasRole(this.userLogged, 'LEAD-SOURCE_UPDATE_ALL');
    },
    canDelete: function () {
      return hasRole(this.userLogged, 'LEAD-SOURCE_DELETE_ALL');
    },
    showBreadcrumb() {
      return this.navigationBreadcrumb.length > 1;
    },
    isNew() {
      if (this.leadSource) {
        return this.leadSource._id === '';
      }
    },
    isValid: function () {
      return this.entityValidationErrors.length === 0;
    },
    entityValidationErrors() {
      return findLeadSourceValidationError(this.leadSource);
    },
  },
  methods: {
    _service() {
      return leadSourceService;
    },
    _handleRetrieve(response) {
      this.leadSource = response.data.leadSource;
    },
    _handleCreate(response) {
      this.leadSource._id = response.data.leadSource._id;
    },
    _handleEditResponse(response) {
      const newReadDate = _.get(response, 'data.leadSource.readDate');
      if (newReadDate) {
        this.leadSource.readDate = newReadDate;
      }
    },
    _refreshEntity(freshEntity) {
      this.$set(this, 'leadSource', freshEntity);
    },
    save() {
      if (this.isValid) {
        this._save(this.leadSource);
      }
    },
    cancel() {
      this.close();
    },
  },
};
