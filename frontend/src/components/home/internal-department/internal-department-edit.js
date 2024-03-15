import _ from 'lodash';
import { mapGetters } from 'vuex';
import InternalDepartmentService from '../../../services/internal-department-service';
import { entityEditMixin } from '../../../mixins/entity-edit';
import { hasRole } from '../../../utils/user';
import { findInternalDepartmentValidationError } from './internal-department-validator';

const internalDepartmentService = new InternalDepartmentService();
const buildInitialState = () => ({
  internalDepartment: {
    _id: '',
    name: '',
    deleted: false,
    readDate: null,
    accountingDepartmentId: '',
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
      return 'internalDepartment';
    },
    canCreate: function () {
      return hasRole(this.userLogged, 'INTERNAL-DEPARTMENT_CREATE_ALL');
    },
    canCreateOrEdit: function () {
      return this.canEdit || (this.isNew && this.canCreate);
    },
    canEdit: function () {
      return hasRole(this.userLogged, 'INTERNAL-DEPARTMENT_UPDATE_ALL');
    },
    cancelText: function () {
      return this.canCreateOrEdit ? 'Cancel' : 'Exit';
    },
    showBreadcrumb: function () {
      return this.navigationBreadcrumb.length > 1;
    },
    isNew() {
      if (this.internalDepartment && typeof this.internalDepartment === 'object') {
        return this.internalDepartment._id === '';
      }
    },
    isValid: function () {
      return this.entityValidationErrors.length === 0;
    },
    entityValidationErrors() {
      return findInternalDepartmentValidationError(this.internalDepartment);
    },
  },
  methods: {
    _service() {
      return internalDepartmentService;
    },
    _handleRetrieve(response) {
      this.internalDepartment = _.assign(
        {},
        this.internalDepartment,
        _.get(response, 'data.internalDepartment'),
      );
    },
    _handleCreate(response) {
      this.internalDepartment._id = response.data.internalDepartment._id;
    },
    _handleEditResponse(response) {
      const newReadDate = _.get(response, 'data.internalDepartment.readDate');
      if (newReadDate) {
        this.internalDepartment.readDate = newReadDate;
      }
    },
    _refreshEntity(freshEntity) {
      this.$set(this, 'internalDepartment', freshEntity);
    },
    save() {
      if (this.isValid) {
        this._save(this.internalDepartment);
      }
    },
    cancel() {
      this.close();
    },
    IsValidField(fieldName) {
      const error = _.find(
        this.entityValidationErrors,
        (validationError) => _.has(validationError.props, fieldName),
      );
      return _.isNil(error);
    },
  },
};
