import _ from 'lodash';
import { mapGetters } from 'vuex';
import DeliveryMethodService from '../../../../services/delivery-method-service';
import { entityEditMixin } from '../../../../mixins/entity-edit';
import { hasRole } from '../../../../utils/user';

const deliveryMethodService = new DeliveryMethodService();
const buildInitialState = () => ({
  deliveryMethod: {
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
      return 'deliveryMethod';
    },
    canCreate: function () {
      return hasRole(this.userLogged, 'DELIVERY-METHOD_CREATE_ALL');
    },
    canEdit: function () {
      return hasRole(this.userLogged, 'DELIVERY-METHOD_UPDATE_ALL');
    },
    canCreateOrEdit: function () {
      return this.canEdit || (this.isNew && this.canCreate);
    },
    showBreadcrumb() {
      return this.navigationBreadcrumb.length > 1;
    },
    isNew() {
      return _.get(this, 'deliveryMethod._id', '') === '';
    },
    isValid: function () {
      return _.get(this, 'deliveryMethod.name', '') !== '';
    },
  },
  methods: {
    _service() {
      return deliveryMethodService;
    },
    _handleRetrieve(response) {
      this.deliveryMethod = _.get(response, 'data.deliveryMethod');
    },
    _handleCreate(response) {
      this.deliveryMethod._id = _.get(response, 'data.deliveryMethod._id');
    },
    _handleEditResponse(response) {
      const newReadDate = _.get(response, 'data.deliveryMethod.readDate');
      if (newReadDate) {
        this.deliveryMethod.readDate = newReadDate;
      }
    },
    _refreshEntity(freshEntity) {
      this.$set(this, 'deliveryMethod', freshEntity);
    },
    save() {
      if (this.isValid) {
        this._save(this.deliveryMethod);
      }
    },
    cancel() {
      this.close();
    },
  },
};
