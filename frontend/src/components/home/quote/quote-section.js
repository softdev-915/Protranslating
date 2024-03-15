import _ from 'lodash';
import UrlBasedBreadcrumb from '../url-based-breadcrumb/url-based-breadcrumb.vue';
import SectionContainer from '../../section-container/section-container.vue';
import QuoteGrid from './quote-grid.vue';
import { sectionRouterMixin } from '../../../mixins/section-router';

const QUOTES_BREADCRUMB = [{
  text: 'Quotes',
  name: 'quote-list',
  link: 'quote-list',
  active: false,
  route: { name: 'quote-list' },
}];
const WAITING_FOR_APPROVAL_STATUS = 'Waiting for approval';

export default {
  components: {
    QuoteGrid,
    SectionContainer,
    UrlBasedBreadcrumb,
  },
  mixins: [sectionRouterMixin],
  data() {
    return {
      currentComponent: null,
      currentValue: null,
      items: QUOTES_BREADCRUMB,
      breadcrumbTitles: {
        'quote-list': 'Quotes',
        'quote-edition': 'Quote Edition',
        'quote-quote-detail': 'Quote Detail',
        'request-activity-list': 'Activities',
        'request-activity-edition': 'Activitiy edition',
        'request-activity-creation': 'Activity creation',
        'request-edition': 'Request Detail',
        'create-request': 'New Request',
        'create-quote': 'New Quote',
        portalcat: 'Portal CAT',
        'request-files-statistics': 'Statistics',
      },
      routeSubsequence: {
        'quote-edition': 'quote-list',
        'quote-quote-detail': 'quote-edition',
        'create-quote': 'quote-list',
      },
    };
  },
  watch: {
    route: {
      handler: function (route) {
        this.deactivateAll();
        const removeItemsStartingFrom = this.getBreadcrumbIndexToClearFrom(route.name);
        const itemsToAdd = [
          ...this.getBreadcrumbsToPrepend(route.name),
          ...[{
            name: route.name,
            link: route.fullPath,
            text: this.breadcrumbTitles[route.name],
            active: true,
            route: { name: route.name },
          }],
        ];
        if (removeItemsStartingFrom === -1) {
          this.items = [...this.items, ...itemsToAdd];
        } else {
          this.items = [...this.items.slice(0, removeItemsStartingFrom), ...itemsToAdd];
        }
      },
      immediate: true,
    },
  },
  computed: {
    route() {
      return this.$route;
    },
    sectionClass() {
      return { 'mt-0': this.$route.name === 'quote-quote-detail' };
    },
  },
  methods: {
    buildBreadcrumbItems() {
      return this.items;
    },
    onEntitySave(entity) {
      // the first ref will always be the grid
      this.$refs[0][0].onEntitySave(entity);
    },
    deactivateAll() {
      this.items = this.items.map((v) => {
        v.active = false;
        return v;
      });
    },
    getBreadcrumbIndexToClearFrom(currentRouteName) {
      let result = this.items.findIndex(({ name }) => name === currentRouteName);
      const prevRouteName = this.routeSubsequence[currentRouteName];
      if (result === -1 && !_.isEmpty(prevRouteName)) {
        result = this.items.findIndex(({ name }) => name === prevRouteName);
        if (result !== -1) {
          ++result;
        }
      }
      return result;
    },
    getBreadcrumbsToPrepend(currentRouteName) {
      const result = [];
      let prevRouteName = this.routeSubsequence[currentRouteName];
      while (
        !_.isEmpty(prevRouteName)
        // eslint-disable-next-line no-loop-func
        && _.isNil(this.items.find(({ name }) => name === prevRouteName))
      ) {
        result.unshift({
          name: prevRouteName,
          text: this.breadcrumbTitles[prevRouteName],
          route: { name: prevRouteName },
        });
        prevRouteName = this.routeSubsequence[prevRouteName];
      }
      return result;
    },
    nav(item) {
      if (item.name) {
        const index = this.items.indexOf(item);
        if (index !== -1) {
          this.items.splice(index + 1);
          this.deactivateAll();
        }
        this.$router.push({ name: item.name }).catch((err) => { console.log(err); });
      }
    },
    onCreate() {
      this.$router.push({
        name: 'quote-request',
      }).catch((err) => { console.log(err); });
    },
    onEdit({ item }) {
      this.$router.push({
        name: item.status === WAITING_FOR_APPROVAL_STATUS && !_.isEmpty(item.quoteTemplateId)
          ? 'quote-quote-detail'
          : 'quote-edition',
        params: { requestId: item._id },
      });
    },
  },
};
