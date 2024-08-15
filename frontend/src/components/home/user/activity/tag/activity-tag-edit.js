import _ from 'lodash';
import { mapGetters } from 'vuex';
import { hasRole } from '../../../../../utils/user';
import { entityEditMixin } from '../../../../../mixins/entity-edit';
import ActivityTagService from '../../../../../services/activity-tag-service';

const activityTagService = new ActivityTagService();
const buildInitialState = () => ({
  activityTag: {
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
      return 'activity tag';
    },
    canCreate() {
      return hasRole(this.userLogged, 'ACTIVITY-TAG_CREATE_ALL');
    },
    canEdit() {
      return hasRole(this.userLogged, 'ACTIVITY-TAG_UPDATE_ALL');
    },
    isNew() {
      return this.activityTag._id;
    },
    isValidName() {
      return this.activityTag.name && this.activityTag.name.length !== 0;
    },
    isValid() {
      return this.isValidName;
    },
    canCreateOrEdit() {
      return this.canEdit || (this.isNew && this.canCreate);
    },
    canOnlyEdit() {
      return this.isNew !== '' && this.canEdit;
    },
  },
  methods: {
    _service() {
      return activityTagService;
    },
    _handleRetrieve(response) {
      this.activityTag = response.data.activityTag;
    },
    _handleEditResponse(response) {
      const newReadDate = _.get(response, 'data.activityTag.readDate');
      if (newReadDate) {
        this.activityTag.readDate = newReadDate;
      }
    },
    _refreshEntity(freshEntity) {
      this.$set(this, 'activityTag', freshEntity);
    },
    _handleCreate(response) {
      this.activityTag._id = response.data.activityTag._id;
    },
    save() {
      this.$validator.validateAll().then((isValid) => {
        if (isValid) {
          this._save(this.activityTag);
        }
      });
    },
  },
};
