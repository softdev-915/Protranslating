import _ from 'lodash';
import moment from 'moment';
import { mapActions, mapGetters } from 'vuex';
import ResponsiveGrid from '../components/responsive-grid/responsive-grid.vue';
import GridQueryManager from '../components/responsive-grid/grid-query-manager/grid-query-manager.vue';
import { iframeDownloadError, infoNotification } from '../utils/notifications';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const EXPORT_MAX_LIMIT = 9000000;
const NEW_TIMEZONE_GRID_WHITELIST = ['requestInlineGrid', 'quoteGrid'];

export const gridMixin = {
  components: {
    GridQueryManager,
    ResponsiveGrid,
  },
  props: {
    selectedRows: {
      type: Array, // array of selected rows check properties, FOR EXAMPLE array of  _ids
      default: () => [],
    },
    activeRows: {
      type: Array, // array of rows that have been been toggle-checked
      default: () => [],
    },
    selectedRowCheckProperty: {
      type: String,
      default: '',
    },
    rowHrefBuilder: {
      type: Function,
    },
    retrieveStrategy: {
      type: Function,
    },
    canCreate: {
      type: Boolean,
      required: true,
      default: false,
    },
    canExport: {
      type: Boolean,
      default: true,
    },
    canSort: {
      type: Boolean,
      default: true,
    },
    canSortBySelect: {
      type: Boolean,
      default: false,
    },
    isPaginationEnabled: {
      type: Boolean,
      default: true,
    },
    isScrollPaginationEnabled: {
      type: Boolean,
      default: false,
    },
    shouldRetrieveColumns: {
      type: Boolean,
      default: false,
    },
    canSetup: {
      type: Boolean,
      default: false,
    },
    canToggle: {
      type: Boolean,
      default: false,
    },
    cache: {
      type: Boolean,
      default: false,
    },
    cacheExpireMinutes: {
      type: Number,
      default: 5,
    },
    gridName: {
      type: String,
      required: true,
    },
    query: {
      type: Object,
    },
    forceQueryParams: {
      type: Boolean,
      default: false,
    },
    keyProp: {
      type: [String, Function],
      required: true,
    },
    service: {
      type: Object,
      required: true,
    },
    title: {
      type: String,
    },
    components: {
      type: Object,
      default: () => ({}),
    },
    rowSelection: {
      type: Boolean,
      default: false,
    },
    rowSelectionDisabled: {
      type: Boolean,
      default: false,
    },
    rowSelectionTitle: {
      type: String,
    },
    gridQueryResetCallback: {
      type: Function,
      default: (currentQuery) => {
        delete currentQuery.q;
        delete currentQuery.filter;
        return { ...currentQuery, page: 1 };
      },
    },
    tableClass: {
      type: String,
    },
    cssRowClass: {
      type: Function,
    },
    customPaginationEntries: {
      type: Array,
    },
    showSelectAllButton: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      exportQuery: {},
      exportParams: '',
      csvFileUrl: '',
      currentConfig: null,
      editingIndex: -1,
      editingItem: {},
      listData: {
        list: [],
        total: 0,
        totalRecords: 0,
      },
      currentQuery: {},
      loading: false,
      retrievedData: false,
      userEmailKey: function (listItem) {
        return listItem.email;
      },
      exportingData: false,
    };
  },
  created() {
    if (this.query) {
      this.currentQuery = this.query;
    }
    if (!_.isFunction(this.retrieveStrategy)) {
      return;
    }
    this.retrieveStrategy().then((response) => {
      if (this.isScrollPaginationEnabled && _.has(this.listData, 'list')) {
        const list = this.listData.list.concat(this.listData.list);
        Object.assign(this.listData, {
          list: list,
          total: list.length,
        });
      } else {
        this.listData = response.data;
      }
    }).catch((err) => {
      this.retrievedData = false;
      const notification = {
        title: 'Error retrieving list',
        message: _.get(err, 'message'),
        state: 'danger',
        response: err,
      };
      this.pushNotification(notification);
    }).finally(setTimeout(this.gridDataLoaded, 1));
  },
  watch: {
    query: function (newQuery) {
      this.currentQuery = newQuery;
    },
    currentQuery: function (newQuery) {
      this.fetchData(newQuery);
    },
  },
  computed: {
    ...mapGetters('cache', ['cachedData']),
    ...mapGetters('features', ['mockTz', 'mockTimezone']),
    ...mapGetters('app', ['userLogged']),
    gridCachedData: function () {
      let cache = null;
      if (this.cache && this.cachedData && this.cachedData[this.gridName]) {
        cache = this.cachedData[this.gridName];
      }
      return cache;
    },
    activeConfig: function () {
      if (this.currentConfig) {
        return this.currentConfig;
      }
      return this.service.columns;
    },
    activeColumns: function () {
      return this.activeConfig.filter((c) => c.visible);
    },
    timezone() {
      if (NEW_TIMEZONE_GRID_WHITELIST.includes(this.gridName)) {
        return !_.isEmpty(this.mockTimezone)
          ? this.mockTimezone
          : _.get(this.userLogged, 'timeZone.value');
      }
      return this.mockTz !== '00' ? this.mockTz : moment().utcOffset();
    },
  },
  methods: {
    ...mapActions('cache', ['invalidateCache', 'setCache']),
    ...mapActions('notifications', ['pushNotification']),
    requestData(params) {
      const self = this;
      self.loading = true;
      self.service.retrieve(params).then((response) => {
        self.listData = response.data;
        if (this.cache) {
          this.setCache({
            name: this.gridName,
            data: response.data,
          });
        }
      }).catch((err) => {
        self.retrievedData = false;
        const notification = {
          title: 'Error',
          message: `could not retrieve ${this.entityName || 'entity'}`,
          state: 'danger',
          response: err,
        };
        this.pushNotification(notification);
      }).finally(() => setTimeout(self.gridDataLoaded, 500));
    },
    getItem(index) {
      return this.listData.list[index];
    },
    changeItem(index, item) {
      this.$set(this.listData.list, index, item);
    },
    prependItem(item) {
      const newList = this.listData.list.slice(0);
      newList.unshift(item);
      this.$set(this.listData, 'list', newList);
      return 0;
    },
    addItem(item) {
      const newList = this.listData.list.slice(0);
      const newIndex = newList.length;
      newList.push(item);
      this.$set(this.listData, 'list', newList);
      return newIndex;
    },
    removeItem(itemOrIndex, prop) {
      let index = parseInt(itemOrIndex, 10);
      if (Number.isNaN(index)) {
        const len = this.listData.list.length;
        for (let i = 0; i < len; i++) {
          if (this.listData.list[i][prop] === itemOrIndex[prop]) {
            index = i;
            break;
          }
        }
      }
      const newList = this.listData.list.slice(0);
      newList.splice(index, 1);
      this.$set(this.listData, 'list', newList);
    },
    keyForItemBuilder() {
      if (typeof this.keyProp === 'function') {
        return this.keyProp;
      }
      const { keyProp } = this;
      return (item) => item[keyProp];
    },
    onConfiguredColumns(newConfig) {
      this.currentConfig = newConfig;
    },
    onSort(data) {
      this.currentQuery = { ...this.currentQuery, sort: data };
    },
    onFilter(data) {
      let filterConfig;
      try {
        filterConfig = JSON.parse(this.currentQuery.filter);
      } catch (e) {
        filterConfig = {};
      }
      if (typeof data.filterValue === 'string' && data.filterValue.replace(/ /g, '') === '') {
        if (typeof filterConfig[data.filterKey] !== 'undefined') {
          // remove this prop
          delete filterConfig[data.filterKey];
        }
      } else {
        filterConfig[data.filterKey] = data.filterValue;
      }
      if (data && typeof data.filtersOverride === 'object') {
        filterConfig = { ...filterConfig, ...data.filtersOverride };
      }
      filterConfig.__tz = this.timezone;
      // when forceQueryParams (default is false) is true and an original query filter
      // has been provided, then always use the parameters in the query.
      if (this.forceQueryParams && this.query && this.query.filter) {
        let toAssign = {};
        try {
          toAssign = JSON.parse(this.query.filter);
        } catch (e) {
          // nothing to do
        }
        Object.assign(filterConfig, toAssign);
      }
      if (this.currentQuery.page) {
        this.currentQuery.page = 1;
      }
      this.currentQuery = {
        ...this.currentQuery,
        filter: JSON.stringify(filterConfig),
      };
    },
    onEntryChange(data) {
      this.currentQuery = { ...this.currentQuery, limit: data };
    },
    onIframeDownloadError(err) {
      this.exportingData = false;
      const notification = iframeDownloadError(err);
      this.pushNotification(notification);
    },
    onPageChange(page) {
      this.$set(this.currentQuery, 'page', page);
      this.fetchData(this.currentQuery);
    },
    onGridQueryReset() {
      this.currentQuery = this.gridQueryResetCallback(this.currentQuery);
    },
    onRowSelected(_id, selected) {
      this.$emit('row-selected', _id, selected);
    },
    onSelectAll(selected) {
      this.$emit('all-rows-selected', selected);
    },
    onSearch(data) {
      this.currentQuery.page = 1;
      this.currentQuery = { ...this.currentQuery, q: data };
    },
    onEdit(eventData) {
      this.$emit('grid-edit', eventData);
    },
    itemAction(eventData) {
      this.$emit('item-action', eventData);
    },
    onCreateNew(eventData) {
      this.$emit('grid-create-new', eventData);
    },
    onSetupAction(eventData) {
      this.$emit('grid-setup-action', eventData);
    },
    onGridRowToggle(item) {
      this.$emit('grid-row-toggle', item);
    },
    gridDataLoaded() {
      this.loading = false;
      this.$emit('grid-data-loaded', this.listData);
    },
    onCsvFileDownloadFinished() {
      const SECONDS_BEFORE_CLOSING_POPUP = 5;
      this.pushNotification(infoNotification('Your file will start downloading soon', SECONDS_BEFORE_CLOSING_POPUP));
      setTimeout(() => {
        this.exportingData = false;
      }, SECONDS_BEFORE_CLOSING_POPUP * 1000);
    },
    onGridDataExport() {
      if (!this.exportingData) {
        this.exportingData = true;
        const exportQuery = {
          page: 1,
          limit: EXPORT_MAX_LIMIT,
          csvHeaders: this.currentConfig.filter(({ visible }) => visible).map(({ name }) => name),
        };
        const params = { ...exportQuery, ...this.currentQuery };
        const mainEndpoint = this.service.retrieveCsv();
        const { pathname, searchParams } = new URL(`${window.location.origin}${mainEndpoint}`);
        Object.keys(params).forEach((k) => searchParams.append(k, params[k]));
        const url = `${pathname}?${searchParams.toString()}`;
        this.$refs.csvFileIframeDownload.download(url);
        setTimeout(() => {
          this.exportingData = false;
        }, 10000);
      }
    },
    _ensureNoInactiveColumns(query) {
      const filterObj = JSON.parse(query.filter);
      const inactiveColumns = this.currentConfig.filter((c) => !c.visible).map((c) => c.prop);
      const filter = _.omit(filterObj, inactiveColumns);
      query.filter = JSON.stringify(filter);
    },
    onListError(err) {
      this.retrievedData = false;
      const notification = {
        title: 'Error retrieving list',
        message: _.get(err, 'message'),
        state: 'danger',
        response: err,
      };
      this.pushNotification(notification);
    },
    onListDone() {
      setTimeout(this.gridDataLoaded, 1);
    },
    transformQuery(query) {
      query.page = Number.isNaN(Number(query.page)) ? DEFAULT_PAGE : query.page;
      query.limit = Number.isNaN(Number(query.limit)) ? DEFAULT_PAGE_SIZE : query.limit;
      const filterObj = JSON.parse(_.get(query, 'filter', null)) || {};
      query.filter = JSON.stringify({ ...filterObj, ...{ __tz: this.timezone } });
      return query;
    },
    fetchData(originalQuery) {
      let query = { ...originalQuery };
      if (!_.isNil(this.retrieveStrategy)) {
        return;
      }
      const self = this;
      if (!this.loading) {
        let columns;
        this.loading = true;
        query = this.transformQuery(query);
        if (this.shouldRetrieveColumns) {
          columns = this.activeConfig.map((c) => c.prop).join(' ');
        }
        if (!_.isEmpty(this.currentConfig)) {
          this._ensureNoInactiveColumns(query);
        }
        this.service.retrieve(query, columns).then((response) => {
          let list = [];
          list = response.data.list;
          Object.assign(self.listData, {
            list,
            total: list.length,
            totalRecords: _.get(response, 'data.totalRecords', 0),
          });
        })
          .catch(this.onListError)
          .finally(this.onListDone);
      }
    },
  },
};
