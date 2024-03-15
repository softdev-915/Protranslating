import _ from 'lodash';
import { mapGetters } from 'vuex';
import { hasRole } from '../../../utils/user';
import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import QuoteLmsService from '../../../services/quote-lms-service';

export default {
  components: {
    ServerPaginationGrid,
  },
  data() {
    return {
      redirectUrl: null,
    };
  },
  created() {
    this.quoteLmsService = new QuoteLmsService();
    if (_.get(this, 'userLogged.lsp.supportsIpQuoting', false)) {
      const ipColumns = this.quoteLmsService.buildIpColumns(this.quoteLmsService.columns, 'contactName');
      this.quoteLmsService.columns = ipColumns;
    }
  },
  watch: {
    queryParams(newQuery) {
      if (newQuery) {
        if (newQuery._id) {
          this.requestFilterId = this.$route.query._id;
        } else {
          this.requestFilterId = null;
        }
      }
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    queryParams() {
      return this.$route.query;
    },
    routePath() {
      return this.$route.path;
    },
    canCreate() {
      return [
        'QUOTE_CREATE_COMPANY',
        'QUOTE_CREATE_ALL',
        'QUOTE_CREATE_OWN',
      ].some((role) => hasRole(this.userLogged, role));
    },
  },
  methods: {
    onCreateInline() {
      this.$emit('quote-creation');
    },
    onEditInline(event) {
      this.$emit('quote-edition', event);
    },
    onRefresh() {
      this.quoteLmsService.retrieve().then((res) => {
        const data = _.get(res, 'data.list', []);
        this.$refs.quoteGrid.listData.list = data;
        this.$refs.quoteGrid.listData.total = data.length;
      });
    },
  },
};
