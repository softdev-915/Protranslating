import _ from 'lodash';
import { mapGetters } from 'vuex';
import { hasRole } from '../../../../utils/user';
import { entityEditMixin } from '../../../../mixins/entity-edit';
import RequestTypeService from '../../../../services/request-type-service';

const requestTypeService = new RequestTypeService();
const buildInitialState = () => ({
  requestType: {
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
      return 'Request type';
    },
    canCreate() {
      return hasRole(this.userLogged, 'REQUEST_CREATE_ALL');
    },
    canEdit() {
      return hasRole(this.userLogged, 'REQUEST_CREATE_ALL');
    },
    isValidName() {
      return _.get(this.requestType, 'name', '').length !== 0;
    },
    isValid() {
      return this.isValidName;
    },
    canCreateOrEdit() {
      return this.canEdit || (this.isNew && this.canCreate);
    },
    canOnlyEdit() {
      return !this.isNew && this.canEdit;
    },
    isNew() {
      // check for document._id db existence
      return !_.get(this.requestType, '_id');
    },
  },
  methods: {
    save() {
      this.$validator.validateAll().then((isValid) => {
        if (isValid) {
          this._save(this.requestType);
        }
      });
    },
    _service() {
      return requestTypeService;
    },
    _handleEditResponse(response) {
      const newReadDate = _.get(response, 'data.requestType.readDate');
      if (newReadDate) {
        this.requestType.readDate = newReadDate;
      }
    },
    _handleRetrieve(response) {
      this.requestType = response.data.requestType;
    },
    _refreshEntity(freshEntity) {
      this.$set(this, 'requestType', freshEntity);
    },
    _handleCreate(response) {
      this.requestType._id = response.data.requestType._id;
    },
  },
};
