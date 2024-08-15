import MemoryEditor from './memory-editor.vue';
import TmStoreMixin from '../mixins/tm-store-mixin';
import UserRoleCheckMixin from '../../../../mixins/user-role-check';

export default {
  mixins: [
    TmStoreMixin,
    UserRoleCheckMixin,
  ],
  components: {
    MemoryEditor,
  },
  beforeRouteLeave(to, from, next) {
    this.resetState();
    next();
  },
  computed: {
    canEnter() {
      return this.hasRole({ oneOf: ['CAT-RESOURCES_READ_ALL', 'CAT-RESOURCES_UPDATE_ALL'] });
    },
  },
};
