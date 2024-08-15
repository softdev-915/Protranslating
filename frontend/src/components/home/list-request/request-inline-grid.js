import _ from 'lodash';
import { mapGetters, mapActions } from 'vuex';
import { hasRole } from '../../../utils/user';
import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import RequestService from '../../../services/request-service';

const READ_OWN_FIELDS = [
  'Quote required ?',
  'PO',
  'ID',
  'Final Documents',
  'Quote Target Date & Time',
  'Turnaround time notes',
  'Source Documents',
  'Instructions and Comments',
  'Completed at',
  'Request Invoice Status',
  'PO',
  'PO required',
  'Also Deliver To',
  'Other CC',
  'Created at',
  'Created by',
  'Deleted at',
  'Deleted by',
  'Restored at',
  'Restored by',
  'Updated at',
  'Updated by',
];

export default {
  components: {
    ServerPaginationGrid,
  },
  data() {
    return {
      requestService: new RequestService(),
      requestFilterId: null,
      redirectUrl: null,
    };
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
    service() {
      let { columns } = this.requestService;
      columns = columns.map((c) => { c.visible = false; return c; });
      let defaultColumns;
      if (this.canReadAll) {
        defaultColumns = RequestService.defaultColumnsForReadAllRole();
      } else {
        defaultColumns = RequestService.defaultColumnsForReadOwnRole();
      }
      columns.forEach((c) => {
        const isDefaultColumn = defaultColumns.find((dc) => dc.name === c.name);
        c.visible = !_.isNil(isDefaultColumn);
      });
      if (!this.canReadAll) {
        const allOwnFields = defaultColumns.concat(READ_OWN_FIELDS);
        columns = columns.filter((c) => !_.isNil(allOwnFields.find((owf) => _.get(owf, 'name', owf) === c.name)));
      }
      this.requestService.columns = columns;
      const supportsIpQuoting = _.get(this, 'userLogged.lsp.supportsIpQuoting', false);
      if (supportsIpQuoting) {
        const bigIpColumns = this.requestService
          .buildIpColumns(this.requestService.columns, 'contactEmail');
        this.requestService.columns = bigIpColumns;
      }
      return this.requestService;
    },
    queryParams() {
      return this.$route.query;
    },
    routePath() {
      return this.$route.path;
    },
    canReadAll() {
      return hasRole(this.userLogged, 'REQUEST_READ_ALL');
    },
    canCreateAll() {
      return ['INTERNAL-DEPARTMENT_READ_ALL', 'REQUEST_CREATE_ALL']
        .every((r) => hasRole(this.userLogged, r));
    },
    canCreate() {
      return this.canCreateAll
        || ['REQUEST_CREATE_COMPANY', 'REQUEST_CREATE_OWN'].some((role) => hasRole(this.userLogged, role));
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    requestRowHrefBuilder(item) {
      if (_.get(item, '_id')) {
        return `${item._id}/details`;
      }
    },
    onGridDataLoaded(gridData) {
      const requestId = this.$route.query._id;
      if (requestId && gridData.total > 0) {
        this.$set(this, 'requestFilterId', requestId);
      }
    },
    getNotificationErrorData(httpResponse) {
      return {
        title: 'Request update failed',
        message: httpResponse.status.message,
        state: 'warning',
      };
    },
    onCreateInline() {
      this.$emit('request-creation');
    },
    onEditInline(event) {
      this.$emit('request-edition', event);
    },
    onRefresh() {
      this.requestService.retrieve().then((res) => {
        const data = _.get(res, 'data.list', []);
        this.$refs.requestInlineGrid.listData.list = data;
        this.$refs.requestInlineGrid.listData.total = data.length;
      });
    },
  },
};
