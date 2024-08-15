import _ from 'lodash';
import { mapGetters, mapActions } from 'vuex';
import GroupService from '../../../services/group-service';
import { entityEditMixin } from '../../../mixins/entity-edit';
import { hasRole } from '../../../utils/user';

const groupService = new GroupService();
const buildInitialState = () => ({
  group: {
    _id: null,
    name: '',
    roles: [],
    readDate: null,
  },
  originalRoles: [],
});

export default {
  mixins: [entityEditMixin],
  data() {
    return buildInitialState();
  },
  created() {
    // in this component we do not want to reload all data on route change
    // if the component is the same.
    this.onRouteChangeTrigger = false;
    this.retrieveRoles();
  },
  computed: {
    ...mapGetters('authorization', ['roles', 'groups']),
    ...mapGetters('app', ['userLogged']),
    entityName() {
      return 'group';
    },
    isValidName: function () {
      if (this.group && this.group.name) {
        return this.group.name.length > 0
          && this.groups.filter((g) => g.name === this.group.name
            && g._id !== this.group._id).length === 0;
      }
      return false;
    },
    managingRoles: function () {
      return this.$route.name.indexOf('roles') >= 0;
    },
    canEdit: function () {
      return hasRole(this.userLogged, 'GROUP_UPDATE_ALL');
    },
    cancelText: function () {
      return this.canEdit ? 'Cancel' : 'Exit';
    },
    showBreadcrumb: function () {
      return this.navigationBreadcrumb.length > 1;
    },
    isNew: function () {
      return this.index === -1;
    },
    isValid: function () {
      if (this.managingRoles) {
        return true;
      }
      return this.isValidName && this.group.roles.length;
    },
    loadingRoles: function () {
      return this.roles.length === 0;
    },
  },
  methods: {
    ...mapActions('authorization', ['retrieveRoles']),
    _service() {
      return groupService;
    },
    _handleRetrieve(response) {
      this.group = response.data.group;
      // upon setting the group, save the original roles value.
      this.originalRoles = this.group.roles.slice(0);
    },
    _handleCreate(response) {
      this.group._id = response.data.group._id;
    },
    _handleEditResponse(response) {
      const newReadDate = _.get(response, 'data.group.readDate');
      if (newReadDate) {
        this.group.readDate = newReadDate;
      }
    },
    _refreshEntity(freshEntity) {
      this.$set(this, 'group', freshEntity);
      this.originalRoles = this.group.roles.slice(0);
    },
    manageRole() {
      // stores a copy of the group's roles in case the user hits cancel on role selection
      this.originalRoles = this.group.roles.slice(0);
      this.$router.push({
        name: `${this.$route.name}-roles`,
      }).catch((err) => console.log(err));
    },
    save() {
      if (this.managingRoles) {
        this.originalRoles = [];
        this.close();
      } else if (this.isValid) {
        const clone = { ...this.group };
        if (clone._id === null) {
          delete clone._id;
        }
        this._save(clone);
      }
    },
    cancel() {
      if (this.managingRoles) {
        // on cancel on role selection, it reset the group's role array to the original value.
        this.$set(this.group, 'roles', this.originalRoles);
        this.originalRoles = [];
      }
      this.close();
    },
  },
};
