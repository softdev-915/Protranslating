import _ from 'lodash';
import { mapGetters } from 'vuex';
import { hasRole } from '../../../utils/user';
import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import UserService from '../../../services/user-service';

export default {
  components: {
    ServerPaginationGrid,
  },
  data() {
    return {
      userService: new UserService(),
    };
  },
  props: {
    query: {
      type: Object,
    },
    forceQueryParams: {
      type: Boolean,
      default: false,
    },
    gridName: {
      type: String,
      default: 'userInlineGrid',
    },
  },
  watch: {
    query: function (newQuery) {
      this.onRefresh(newQuery);
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canCreate: function () {
      return hasRole(this.userLogged, 'USER_CREATE_ALL')
        || hasRole(this.userLogged, 'CONTACT_CREATE_ALL')
        || hasRole(this.userLogged, 'STAFF_CREATE_ALL');
    },
  },
  methods: {
    onRefresh(query) {
      this.userService.retrieve(query).then((res) => {
        const data = _.get(res, 'data.list', []);
        this.$refs.userInlineGrid.listData.list = data;
        this.$refs.userInlineGrid.listData.total = data.length;
      });
    },
    onEditInline(eventData) {
      this.$emit('user-edition', eventData);
    },
    onCreateInline() {
      this.$emit('user-creation');
    },
  },
};
