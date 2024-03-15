import _ from 'lodash';
import { mapGetters } from 'vuex';
import { hasRole } from '../../../../utils/user';
import { entityEditMixin } from '../../../../mixins/entity-edit';
import ActivityTagsSelector from '../../../activity/activity-tags-selector.vue';
import RichTextEditor from '../../../rich-text-editor/rich-text-editor.vue';
import { defaultActivity } from '../../../activity/activity-helpers';

const buildInitialState = () => ({
  activity: defaultActivity(),
});
const createRoles = ['ACTIVITY-USER-NOTE_CREATE_ALL'];
const updateRoles = ['ACTIVITY-USER-NOTE_UPDATE_ALL'];

export default {
  mixins: [entityEditMixin],
  components: {
    ActivityTagsSelector,
    RichTextEditor,
  },
  props: {
    value: {
      type: Object,
    },
    readOnly: {
      type: Boolean,
    },
  },
  data() {
    return buildInitialState();
  },
  created() {
    this.activity = _.isEmpty(this.value)
      ? buildInitialState().activity
      : this.value;
  },
  watch: {
    value: {
      immediate: true,
      handler: function (newValue) {
        this.activity = _.isEmpty(newValue) ? buildInitialState().activity : newValue;
        this.$emit('validate-activity-user-note', this.isValid);
      },
    },
    activity: {
      handler: function (newActivity) {
        this.$emit('input', newActivity);
      },
      deep: true,
    },
    isValid: {
      handler: function () {
        this.$emit('validate-activity-user-note', this.isValid);
      },
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canCreate: function () {
      return createRoles.some((r) => hasRole(this.userLogged, r));
    },
    isNew: function () {
      return !this.activity._id;
    },
    isCreator() {
      return !this.isNew && this.activity.createdBy === this.userLogged.email;
    },
    canEditOwn: function () {
      return updateRoles.some((r) => hasRole(this.userLogged, r));
    },
    canCreateOrEdit: function () {
      return this.canEdit || (this.isNew && this.canCreate);
    },
    canOnlyEdit: function () {
      return !this.isNew && this.canEdit;
    },
    canEdit: function () {
      return updateRoles.some((r) => hasRole(this.userLogged, r))
        || (this.isCreator && this.canEditOwn);
    },
    areValidComments: function () {
      return _.get(this.activity, 'comments.length', 0);
    },
    isValidSubject: function () {
      return _.get(this.activity, 'subject.length', 0);
    },
    isValidTags: function () {
      return _.get(this.activity, 'tags.length', 0);
    },
    isValid: function () {
      return this.isValidTags
        && this.areValidComments
        && this.isValidSubject;
    },
  },
  methods: {
    manageTags() {
      this.$emit('manage-activity-tag');
    },
  },
};
