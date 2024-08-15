import _lang from 'lodash/lang';
import { mapActions, mapGetters } from 'vuex';
import { hasRole } from '../../../utils/user';
import NotificationService from '../../../services/notification-service';

const CONTACT_CREATE_ALL = 'CONTACT_CREATE_ALL';
const USER_CREATE_ALL = 'USER_CREATE_ALL';
const INVALID_PM_ROLES = [
  'USER', 'WORKFLOW', 'TASK', 'STAFF', 'VENDOR', 'ABILITY', 'AUDIT', 'GROUP',
  'ROLE', 'NOTIFICATION', 'SCHEDULER', 'TASK-FINAL-FILE',
];

const buildInitialState = () => ({
  notificationService: new NotificationService(),
});

export default {
  data() {
    return buildInitialState();
  },
  props: {
    item: {
      type: Object,
    },
    parentTs: {
      type: String,
    },
  },
  created: function () {
    this.user = _lang.cloneDeep(this.item);
  },
  mounted: function () {
    this.show();
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    ...mapGetters('authorization', ['roles', 'groups']),
    filteredGroups: function () {
      if (hasRole(this.userLogged, CONTACT_CREATE_ALL)
      && !hasRole(this.userLogged, USER_CREATE_ALL)) {
        return this.groups.map((g) => {
          if (g.roles.some((r) => INVALID_PM_ROLES.includes(r.replace(/_.*/, '')))) {
            g.disabled = true;
          }
          return g;
        });
      }
      return this.groups;
    },
    canEdit: function () {
      return hasRole(this.userLogged, 'GROUP_UPDATE_ALL');
    },
    cancelText: function () {
      return this.canEdit ? 'Cancel' : 'Exit';
    },
  },
  methods: {
    ...mapActions('authorization', ['retrieveGroups']),
    onGroupClick(event, groupId) {
      const added = event.target.checked;
      if (added) {
        const group = this.groups.filter((g) => g._id === groupId)[0];
        this.user.groups.push(group);
      } else {
        const len = this.user.groups.length;
        for (let i = 0; i < len; i++) {
          if (this.user.groups[i]._id === groupId) {
            this.$delete(this.user.groups, i);
            break;
          }
        }
      }
    },
    isChecked(group) {
      return this.user && this.user.groups
        && this.user.groups.filter((g) => g._id === group._id).length > 0;
    },
    show() {
      this.retrieveGroups();
    },
    save() {
      this.$parent.$refs[this.parentTs][0].updateGroupsInformation(this.user.groups);
      this.close();
    },
    close() {
      this.$parent.navPrevious();
    },
  },
};
