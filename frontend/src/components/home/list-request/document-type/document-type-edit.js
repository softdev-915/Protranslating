import _ from 'lodash';
import { mapGetters } from 'vuex';
import DocumentTypeService from '../../../../services/document-type-service';
import { entityEditMixin } from '../../../../mixins/entity-edit';
import { hasRole } from '../../../../utils/user';

const documentTypeService = new DocumentTypeService();
const buildInitialState = () => ({
  documentType: {
    _id: '',
    name: '',
    extensions: '',
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
      return 'documentType';
    },
    canCreate: function () {
      return hasRole(this.userLogged, 'DOCUMENT-TYPE_CREATE_ALL');
    },
    canEdit: function () {
      return hasRole(this.userLogged, 'DOCUMENT-TYPE_UPDATE_ALL');
    },
    canCreateOrEdit: function () {
      return this.canEdit || (this.isNew && this.canCreate);
    },
    showBreadcrumb() {
      return this.navigationBreadcrumb.length > 1;
    },
    isNew() {
      return _.get(this, 'documentType._id', '') === '';
    },
    isValid: function () {
      return _.get(this, 'documentType.name', '') !== '';
    },
  },
  methods: {
    _service() {
      return documentTypeService;
    },
    _handleRetrieve(response) {
      this.documentType = _.get(response, 'data.documentType');
    },
    _handleCreate(response) {
      this.documentType._id = _.get(response, 'data.documentType._id');
    },
    _handleEditResponse(response) {
      const newReadDate = _.get(response, 'data.documentType.readDate');
      if (newReadDate) {
        this.documentType.readDate = newReadDate;
      }
    },
    _refreshEntity(freshEntity) {
      this.$set(this, 'documentType', freshEntity);
    },
    save() {
      if (this.isValid) {
        this._save(this.documentType);
      }
    },
    cancel() {
      this.close();
    },
  },
};
