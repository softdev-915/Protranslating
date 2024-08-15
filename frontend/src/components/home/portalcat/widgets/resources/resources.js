import _ from 'lodash';
import { mapActions } from 'vuex';
import Widget from '../widget.vue';
import SearchResult from '../../components/resources-search-result/resources-search-result.vue';
import TbSearchResult from '../../components/resources-tb-search-result/resources-tb-search-result.vue';
import WidgetMixin from '../widget-mixin';
import PcStoreMixin from '../../mixins/pc-store-mixin';
import PortalCatService from '../../../../../services/portalcat-service';
import { errorNotification } from '../../../../../utils/notifications';

const portalCatService = new PortalCatService();

export default {
  mixins: [
    WidgetMixin,
    PcStoreMixin,
  ],
  components: {
    Widget,
    SearchResult,
    TbSearchResult,
  },
  data() {
    return {
      isSuggestionsExpanded: true,
      isSearchLoading: false,
      isSearchExpanded: true,
      isResultsExpanded: true,
      activeTab: 'tm',
      searchParams: {
        searchIn: 'source',
        text: '',
      },
      tmHistoryResults: null,
      tbHistoryResults: null,
    };
  },
  watch: {
    resourcesSearchParams(params) {
      if (!_.isNil(params)) {
        this.searchParams = params;
        this.onSearchSubmit();
      }
    },
  },
  computed: {
    isSearchTextValid() {
      return !_.isEmpty(this.searchParams.text);
    },
    areTmHistoryResultsAvailable() {
      return !_.isNil(this.tmHistoryResults);
    },
    areTbHistoryResultsAvailable() {
      return !_.isNil(this.tbHistoryResults);
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    toggleSearchExpanded() {
      this.isSearchExpanded = !this.isSearchExpanded;
    },
    toggleResultsExpanded() {
      this.isResultsExpanded = !this.isResultsExpanded;
    },
    toggleSuggestionsExpanded() {
      this.isSuggestionsExpanded = !this.isSuggestionsExpanded;
    },
    activateTab(tabName) {
      this.activeTab = tabName;
    },
    async onSearchSubmit() {
      if (this.isSearchLoading) {
        return;
      }
      this.isSearchLoading = true;
      const { requestId } = this.$route.params;
      const { workflowId } = this.$route.query;
      const params = {
        ...this.searchParams,
        workflowId,
        threshold: 50,
        isConcordanceSearch: true,
      };
      try {
        const tmResponse = await portalCatService.searchTm(requestId, params);
        this.tmHistoryResults = _.get(tmResponse, 'data.tmSegments', []);
      } catch (err) {
        const message = _.get(err, 'status.message', err.message);
        this.pushNotification(errorNotification(message));
      }
      try {
        const tbResponse = await portalCatService.searchTb(requestId, params);
        this.tbHistoryResults = _.get(tbResponse, 'data.tbEntries', []);
      } catch (err) {
        const message = _.get(err, 'status.message', err.message);
        this.pushNotification(errorNotification(message));
      }
      this.isSearchLoading = false;
    },
    onResourceApply(index, resourcesList) {
      const resource = resourcesList[index];
      if (!_.isNil(resource)) {
        this.setPickedResource(resource);
      }
    },
  },
};
