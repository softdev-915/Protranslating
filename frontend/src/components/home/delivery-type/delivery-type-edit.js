import _ from 'lodash';
import { mapGetters } from 'vuex';
import DeliveryTypeService from '../../../services/delivery-type-service';
import { entityEditMixin } from '../../../mixins/entity-edit';
import { hasRole } from '../../../utils/user';
import ServiceTypeAjaxBasicSelect from '../service-type/service-type-ajax-basic-select.vue';

const deliveryTypeService = new DeliveryTypeService();
const buildInitialState = () => ({
  deliveryType: {
    _id: '',
    name: '',
    description: '',
    deleted: false,
    readDate: null,
    serviceTypeId: null,
  },
});

export default {
  mixins: [entityEditMixin],
  components: { ServiceTypeAjaxBasicSelect },
  data() {
    return buildInitialState();
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    entityName() {
      return 'delivery type';
    },
    canCreate() {
      return hasRole(this.userLogged, 'DELIVERY-TYPE_CREATE_ALL');
    },
    canCreateOrEdit() {
      return this.canEdit || (this.isNew && this.canCreate);
    },
    canEdit() {
      return hasRole(this.userLogged, 'DELIVERY-TYPE_UPDATE_ALL');
    },
    cancelText() {
      return this.canCreateOrEdit ? 'Cancel' : 'Exit';
    },
    showBreadcrumb() {
      return this.navigationBreadcrumb.length > 1;
    },
    isNew() {
      return _.get(this, 'deliveryType._id') === '';
    },
    isValidName() {
      return !_.isEmpty(this.deliveryType.name);
    },
    isValidDescription() {
      return !_.isEmpty(this.deliveryType.description);
    },
    isValidServiceTypeId() {
      return !_.isEmpty(this.deliveryType.serviceTypeId);
    },
    isValid() {
      return this.isValidName && this.isValidDescription && this.isValidServiceTypeId;
    },
  },
  methods: {
    _service() {
      return deliveryTypeService;
    },
    _handleRetrieve(response) {
      this.deliveryType = response.data.deliveryType;
    },
    _handleCreate(response) {
      this.deliveryType._id = response.data.deliveryType._id;
    },
    _handleEditResponse(response) {
      const newReadDate = _.get(response, 'data.deliveryType.readDate');
      if (newReadDate) {
        this.deliveryType.readDate = newReadDate;
      }
    },
    _refreshEntity(freshEntity) {
      Object.assign(this.deliveryType, freshEntity);
    },
    save() {
      if (this.isValid) {
        this._save(this.deliveryType);
      }
    },
    cancel() {
      this.close();
    },
  },
};
