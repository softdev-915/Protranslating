import _ from 'lodash';
import { mapGetters } from 'vuex';
import ServiceTypeService from '../../../services/service-type-service';
import { entityEditMixin } from '../../../mixins/entity-edit';
import { hasRole } from '../../../utils/user';

const serviceTypeService = new ServiceTypeService();
const buildInitialState = () => ({
  serviceType: {
    _id: '',
    name: '',
    description: '',
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
      return 'service type';
    },
    canCreate() {
      return hasRole(this.userLogged, 'SERVICE-TYPE_CREATE_ALL');
    },
    canCreateOrEdit() {
      return this.canEdit || (this.isNew && this.canCreate);
    },
    canEdit() {
      return hasRole(this.userLogged, 'SERVICE-TYPE_UPDATE_ALL');
    },
    cancelText() {
      return this.canCreateOrEdit ? 'Cancel' : 'Exit';
    },
    showBreadcrumb() {
      return this.navigationBreadcrumb.length > 1;
    },
    isNew() {
      return _.get(this, 'serviceType._id') === '';
    },
    isValidName() {
      return !_.isEmpty(this.serviceType.name);
    },
    isValidDescription() {
      return !_.isEmpty(this.serviceType.description);
    },
    isValid() {
      return this.isValidName && this.isValidDescription;
    },
  },
  methods: {
    _service() {
      return serviceTypeService;
    },
    _handleRetrieve(response) {
      this.serviceType = response.data.serviceType;
    },
    _handleCreate(response) {
      this.serviceType._id = response.data.serviceType._id;
    },
    _handleEditResponse(response) {
      const newReadDate = _.get(response, 'data.serviceType.readDate');
      if (newReadDate) {
        this.serviceType.readDate = newReadDate;
      }
    },
    _refreshEntity(freshEntity) {
      Object.assign(this.serviceType, freshEntity);
    },
    save() {
      if (this.isValid) {
        this._save(this.serviceType);
      }
    },
    cancel() {
      this.close();
    },
  },
};
