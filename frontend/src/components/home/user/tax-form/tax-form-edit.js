import _ from 'lodash';
import { mapGetters } from 'vuex';
import TaxFormService from '../../../../services/tax-form-service';
import { entityEditMixin } from '../../../../mixins/entity-edit';
import { hasRole } from '../../../../utils/user';
import { findTaxFormValidationError } from './tax-form-validator';

const taxFormService = new TaxFormService();
const buildInitialState = () => ({
  taxForm: {
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
      return 'taxForm';
    },
    canCreate: function () {
      return hasRole(this.userLogged, 'USER_CREATE_ALL');
    },
    canCreateOrEdit: function () {
      return this.canEdit || (this.isNew && this.canCreate);
    },
    canEdit: function () {
      return hasRole(this.userLogged, 'USER_UPDATE_ALL');
    },
    canDelete: function () {
      return hasRole(this.userLogged, 'USER_DELETE_ALL');
    },
    showBreadcrumb() {
      return this.navigationBreadcrumb.length > 1;
    },
    isNew() {
      if (this.taxForm) {
        return this.taxForm._id === '';
      }
    },
    isValid: function () {
      return this.entityValidationErrors.length === 0;
    },
    entityValidationErrors() {
      return findTaxFormValidationError(this.taxForm);
    },
  },
  methods: {
    _service() {
      return taxFormService;
    },
    _handleRetrieve(response) {
      this.taxForm = response.data.taxForm;
    },
    _handleCreate(response) {
      this.taxForm._id = response.data.taxForm._id;
    },
    _handleEditResponse(response) {
      const newReadDate = _.get(response, 'data.taxForm.readDate');
      if (newReadDate) {
        this.taxForm.readDate = newReadDate;
      }
    },
    _refreshEntity(freshEntity) {
      this.$set(this, 'taxForm', freshEntity);
    },
    save() {
      if (this.isValid) {
        this._save(this.taxForm);
      }
    },
    cancel() {
      this.close();
    },
  },
};
