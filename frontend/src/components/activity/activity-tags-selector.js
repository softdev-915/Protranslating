import { mapActions, mapGetters } from 'vuex';
import ActivityTagService from '../../services/activity-tag-service';
import { hasRole } from '../../utils/user';

const activityTagService = new ActivityTagService();
const buildInitialState = () => ({
  options: [],
  loading: false,
});

export default {
  props: {
    value: {
      type: Array,
    },
    tagsAvailable: {
      type: Array,
    },
    requiredTags: {
      type: Array,
      default: () => ([]),
    },
    placeholder: {
      type: String,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return buildInitialState();
  },
  created() {
    if (this.tagsAvailable) {
      this.options = this.tagsAvailable;
    } else {
      this._retrieveTags();
    }
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    selected() {
      if (this.value) {
        return this.value.map((v) => ({ text: v, value: v }));
      }
      return [];
    },
    tagsOptions() {
      return this.options.map((t) => ({
        text: t,
        value: t,
      }));
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onTagSelected(tags) {
      this.$emit('input', tags.map((t) => t.value));
    },
    removeTagHandler(option) {
      return !this.requiredTags.includes(option.value);
    },
    manageTags() {
      this.$emit('manage-tag');
    },
    _retrieveTags() {
      this.loading = true;
      if (!hasRole(this.userLogged, 'ACTIVITY-TAG_READ_ALL')) {
        return Promise.resolve([]);
      }
      return activityTagService.retrieve()
        .then((response) => {
          if (Array.isArray(response.data.list)) {
            this.options = response.data.list.map((at) => at.name);
          }
        })
        .catch((err) => {
          const notification = {
            title: 'Error',
            message: 'Activity Tags could not be retrieved',
            state: 'danger',
            response: err,
          };
          this.pushNotification(notification);
        })
        .finally(() => {
          this.loading = false;
        });
    },
  },
};
