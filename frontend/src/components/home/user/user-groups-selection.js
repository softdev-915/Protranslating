import { mapActions, mapGetters } from 'vuex';

export default {
  data() {
    return {
      groupsSelected: [],
    };
  },
  props: {
    value: {
      type: Array,
      default: () => [],
    },
  },
  watch: {
    value(newValue) {
      this.groupsSelected = newValue;
    },
    groupsSelected(newGroups) {
      this.$emit('input', newGroups);
    },
  },
  mounted: function () {
    this.retrieveGroups();
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    ...mapGetters('authorization', ['groups']),
  },
  methods: {
    ...mapActions('authorization', ['retrieveGroups']),
    onGroupClick(event, groupId) {
      const added = event.target.checked;
      if (added) {
        const group = this.groups.filter((g) => g._id === groupId)[0];
        this.groupsSelected.push(group);
      } else {
        const len = this.groupsSelected.length;
        for (let i = 0; i < len; i++) {
          if (this.groupsSelected[i]._id === groupId) {
            this.groupsSelected.splice(i, 1);
            break;
          }
        }
      }
    },
    isChecked(group) {
      return this.groupsSelected.filter((g) => g._id === group._id).length > 0;
    },
  },
};
