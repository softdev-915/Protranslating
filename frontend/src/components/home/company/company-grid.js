import _ from 'lodash';
import { mapGetters } from 'vuex';
import { hasRole } from '../../../utils/user';
import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import CompanyService from '../../../services/company-service';

export default {
  components: {
    ServerPaginationGrid,
  },
  props: {
    gridColumns: {
      type: Array,
    },
    retrieveStrategy: {
      type: Function,
    },
    query: {
      type: Object,
    },
    forceQueryParams: {
      type: Boolean,
      default: false,
    },
    gridName: {
      type: String,
      default: 'companyInlineGrid',
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
      return hasRole(this.userLogged, 'COMPANY_CREATE_ALL');
    },
  },
  created() {
    this.companyService = new CompanyService();
    if (!_.isNil(this.gridColumns)) {
      this.companyService.columns = this.companyService.columns.filter((c) => this.gridColumns.includes(c.name));
    }
  },
  methods: {
    onRefresh(query) {
      this.companyService.retrieve(query).then((res) => {
        const data = _.get(res, 'data.list', []);
        this.$refs.companiesInlineGrid.listData.list = data;
        this.$refs.companiesInlineGrid.listData.total = data.length;
      });
    },
    onEdit(eventData) {
      this.$emit('company-edition', eventData);
    },
    onCreate() {
      this.$emit('company-creation');
    },
  },
};
