import _ from 'lodash';
import { mapActions } from 'vuex';
import { gridMixin } from '../../../mixins/grid';
import IframeDownload from '../../iframe-download/iframe-download.vue';

export default {
  props: {
    isPaginationEnabled: {
      type: Boolean,
      default: false,
    },
    isScrollPaginationEnabled: {
      type: Boolean,
      default: true,
    },
    mainQuery: {
      type: Object,
    },
  },
  components: {
    IframeDownload,
  },
  mixins: [gridMixin],
  data() {
    return {
      oldQuery: {
        filter: '',
      },
    };
  },
  watch: {
    mainQuery: {
      handler: function () {
        this.page = 1;
      },
      inmediate: true,
      deep: true,
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onGridScroll() {
      this.currentQuery.page = _.defaultTo(this.currentQuery.page, 1);
      this.currentQuery.page += 1;
      this.currentQuery.limit = 50;
      this.fetchData(this.currentQuery);
    },
    shouldReloadGrid(query) {
      const newQueryFilter = _.omit(JSON.parse(_.get(query, 'filter', '')), '__tz');
      let oldQueryFilter;
      try {
        oldQueryFilter = _.omit(JSON.parse(_.get(this.oldQuery, 'filter', '')), '__tz');
      // eslint-disable-next-line no-empty
      } catch (error) {
      }
      if (_.isEmpty(newQueryFilter) && _.isEmpty(oldQueryFilter)) {
        return query.page === this.oldQuery.page;
      }
      return !_.isEqual(newQueryFilter, oldQueryFilter);
    },
    fetchData(originalQuery) {
      const query = { ...originalQuery };
      if (!_.isNil(this.retrieveStrategy)) {
        return;
      }
      const self = this;
      if (!this.loading) {
        let columns;
        this.loading = true;
        this.transformQuery(query);
        if (this.shouldRetrieveColumns) {
          columns = this.activeConfig.map((c) => c.prop).join(' ');
        }
        if (!_.isEmpty(this.currentConfig)) {
          this._ensureNoInactiveColumns(query);
        }
        this.service.retrieve(query, columns).then((response) => {
          let list = [];
          if (this.shouldReloadGrid(query)) {
            list = response.data.list;
          } else {
            const existingItems = _.clone(_.get(self, 'listData.list', []));
            list = _.uniqBy(existingItems.concat(response.data.list));
          }
          Object.assign(self.listData, {
            list,
            total: list.length,
          });
          this.$set(this, 'oldQuery', query);
        })
          .catch(this.onListError)
          .finally(this.onListDone);
      }
    },
  },
};

