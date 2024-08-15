import _ from 'lodash';
import { mapGetters } from 'vuex';
import TranslationUnitService from '../../../services/translation-unit-service';
import { entityEditMixin } from '../../../mixins/entity-edit';
import { hasRole } from '../../../utils/user';
import { findTranslationUnitValidationError } from './translation-unit-validator';

const translationUnitService = new TranslationUnitService();
const buildInitialState = () => ({
  translationUnit: {
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
      return 'translationUnit';
    },
    canCreate: function () {
      return hasRole(this.userLogged, 'TRANSLATION-UNIT_CREATE_ALL');
    },
    canCreateOrEdit: function () {
      return this.canEdit || (this.isNew && this.canCreate);
    },
    canEdit: function () {
      return hasRole(this.userLogged, 'TRANSLATION-UNIT_UPDATE_ALL');
    },
    cancelText: function () {
      return this.canCreateOrEdit ? 'Cancel' : 'Exit';
    },
    showBreadcrumb: function () {
      return this.navigationBreadcrumb.length > 1;
    },
    isNew() {
      if (this.translationUnit && typeof this.translationUnit === 'object') {
        return this.translationUnit._id === '';
      }
    },
    isValid: function () {
      return this.entityValidationErrors.length === 0;
    },
    entityValidationErrors() {
      return findTranslationUnitValidationError(this.translationUnit);
    },
  },
  methods: {
    _service() {
      return translationUnitService;
    },
    _handleRetrieve(response) {
      this.translationUnit = response.data.translationUnit;
    },
    _handleCreate(response) {
      this.translationUnit._id = response.data.translationUnit._id;
    },
    _handleEditResponse(response) {
      const newReadDate = _.get(response, 'data.translationUnit.readDate');
      if (newReadDate) {
        this.translationUnit.readDate = newReadDate;
      }
    },
    _refreshEntity(freshEntity) {
      this.$set(this, 'translationUnit', freshEntity);
    },
    save() {
      if (this.isValid) {
        this._save(this.translationUnit);
      }
    },
    cancel() {
      this.close();
    },
  },
};
