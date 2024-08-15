import _ from 'lodash';
import { mapGetters } from 'vuex';
import AssignmentStatus from '../../../services/assignment-status-service';
import { entityEditMixin } from '../../../mixins/entity-edit';
import { hasRole } from '../../../utils/user';

const assignmentStatusService = new AssignmentStatus();

export default {
  mixins: [entityEditMixin],
  data() {
    return {
      assignmentStatus: {
        _id: '',
        name: '',
        deleted: false,
        readDate: null,
      },
    };
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    entityName() {
      return 'assignmentStatus';
    },
    canCreate: function () {
      return hasRole(this.userLogged, 'ASSIGNMENT-STATUS_CREATE_ALL');
    },
    canCreateOrEdit: function () {
      return this.canEdit || (this.isNew && this.canCreate);
    },
    canEdit: function () {
      return hasRole(this.userLogged, 'ASSIGNMENT-STATUS_UPDATE_ALL');
    },
    isNew() {
      return _.isEmpty(_.get(this.assignmentStatus, '_id', ''));
    },
    isValid() {
      return !_.isEmpty(this.assignmentStatus.name);
    },
  },
  methods: {
    _service() {
      return assignmentStatusService;
    },
    _handleRetrieve(response) {
      this.assignmentStatus = response.data.assignmentStatus;
    },
    _handleCreate(response) {
      this.assignmentStatus._id = response.data.assignmentStatus._id;
    },
    _handleEditResponse(response) {
      const newReadDate = _.get(response, 'data.assignmentStatus.readDate');
      if (newReadDate) {
        this.assignmentStatus.readDate = newReadDate;
      }
    },
    _refreshEntity(freshEntity) {
      this.$set(this, 'assignmentStatus', freshEntity);
    },
    save() {
      if (this.isValid) {
        this._save(this.assignmentStatus);
      }
    },
    cancel() {
      this.close();
    },
  },
};
