import _ from 'lodash';
import { mapGetters } from 'vuex';
import { hasRole } from '../../../../utils/user';
import { entityEditMixin } from '../../../../mixins/entity-edit';
import SchedulingStatusService from '../../../../services/scheduling-status-service';

const schedulingStatusService = new SchedulingStatusService();
const buildInitialState = () => ({
  schedulingStatus: {
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
      return 'schedulingStatus';
    },
    canCreate() {
      return hasRole(this.userLogged, 'REQUEST_CREATE_ALL');
    },
    canEdit() {
      return hasRole(this.userLogged, 'REQUEST_CREATE_ALL');
    },
    isValidName() {
      return this.schedulingStatus.name.length !== 0;
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
      return !this.schedulingStatus._id;
    },
  },
  methods: {
    save() {
      this.$validator.validateAll().then((isValid) => {
        if (isValid) {
          this._save(this.schedulingStatus);
        }
      });
    },
    _service() {
      return schedulingStatusService;
    },
    _handleEditResponse(response) {
      const newReadDate = _.get(response, 'data.schedulingStatus.readDate');
      if (newReadDate) {
        this.schedulingStatus.readDate = newReadDate;
      }
    },
    _handleRetrieve(response) {
      this.schedulingStatus = response.data.schedulingStatus;
    },
    _refreshEntity(freshEntity) {
      this.$set(this, 'schedulingStatus', freshEntity);
    },
    _handleCreate(response) {
      this.schedulingStatus._id = response.data.schedulingStatus._id;
    },
  },
};
