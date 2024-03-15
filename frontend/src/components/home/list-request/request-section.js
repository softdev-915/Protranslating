import _ from 'lodash';
import { mapActions, mapGetters } from 'vuex';
import UrlBasedBreadcrumb from '../url-based-breadcrumb/url-based-breadcrumb.vue';
import SectionContainer from '../../section-container/section-container.vue';
import RequestInlineGrid from './request-inline-grid.vue';
import RequestInlineEdit from './request-inline-edit.vue';
import userRoleCheckMixin from '../../../mixins/user-role-check';
import { sectionRouterMixin } from '../../../mixins/section-router';

const VALID_REQUEST_READ_ROLES = ['REQUEST_READ_OWN', 'REQUEST_READ_ALL', 'REQUEST_READ_COMPANY'];
const baseBreadcrumb = () => ([{
  text: 'Requests',
  name: 'list-request',
  link: 'list-request',
  active: false,
  route: { name: 'list-request' },
}]);
const ipBaseBreadcrumb = (canReadAllRequests) => ([{
  text: canReadAllRequests ? 'Quotes & Orders' : 'Orders',
  name: 'list-request',
  link: 'list-request',
  active: false,
  route: { name: 'list-request' },
}]);

export default {
  mixins: [userRoleCheckMixin, sectionRouterMixin],
  components: {
    RequestInlineEdit,
    SectionContainer,
    RequestInlineGrid,
    UrlBasedBreadcrumb,
  },
  data() {
    return {
      currentComponent: null,
      currentValue: null,
      items: [],
      breadcrumbTitles: {
        'request-quote-detail': 'Quote Detail',
        'request-activity-list': 'Activities',
        'request-activity-edition': 'Activitiy edition',
        'request-activity-creation': 'Activity creation',
        'request-edition': 'Request Detail',
        'create-request': 'New Request',
        'portal-cat': 'Portal CAT',
        'request-files-statistics': 'Statistics',
        'request-provider-pooling-offer-create': 'Create Provider Pooling Offer',
        'request-provider-pooling-offer-edit': 'Edit Provider Pooling Offer',
      },
    };
  },
  watch: {
    route: {
      handler: function (route) {
        this.buildBreadcrumb(route);
      },
      immediate: true,
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged', 'lsp']),
    ...mapGetters('breadcrumb', ['portalCatQueryParams']),
    canReadRequests() {
      return VALID_REQUEST_READ_ROLES.some((r) => this.hasRole(r));
    },
    canReadAllRequests() {
      return this.hasRole('REQUEST_READ_ALL');
    },
    route() {
      return this.$route;
    },
    supportsIpQuoting() {
      return _.get(this.lsp, 'supportsIpQuoting', false);
    },
    sectionClass() {
      return { 'mt-0': this.$route.name === 'request-quote-detail' };
    },
  },
  created() {
    this.buildBreadcrumb(this.$route);
  },
  methods: {
    ...mapActions('breadcrumb', ['setPortalCatQueryParams']),
    buildBreadcrumb(route) {
      if (this.isPortalCatRoute(route.name)) {
        this.setPortalCatQueryParams(route.query);
      }
      if (!this.canReadRequests) {
        this.items = [];
      } else {
        this.items = this.supportsIpQuoting
          ? ipBaseBreadcrumb(this.canReadAllRequests) : baseBreadcrumb();
      }
      this.deactivateAll();
      const hasEditView = route.fullPath.match(/details|portal-cat/);
      const hasCreateView = route.fullPath.match('requests/create');
      const hasQuoteDetailView = route.fullPath.match('quote');
      const hasActivityCreateView = route.fullPath.match('activities/create');
      const hasActivityEditView = _.defaultTo(route.fullPath.match(/details/g), []).length > 1;
      if (hasEditView && this.canReadRequests) {
        if (_.isNil(this.items.find((i) => i.name === 'request-edition'))) {
          this.items.push({
            name: 'request-edition',
            text: this.supportsIpQuoting
              ? 'Order Edition'
              : 'Request edition',
            route: { name: 'request-edition' },
          });
        }
      }
      if (hasCreateView && this.canReadRequests) {
        if (_.isNil(this.items.find((i) => i.name === 'create-request'))) {
          this.items.push({
            name: 'create-request',
            text: this.supportsIpQuoting
              ? 'New Order'
              : 'New Request',
            route: { name: 'request-edition' },
          });
        }
      }
      if (hasQuoteDetailView && (hasActivityCreateView || hasActivityEditView)) {
        if (_.isNil(this.items.find((i) => i.name === 'request-activity-list'))) {
          this.items.push({
            name: 'request-activity-list',
            text: 'Activities',
            route: { name: 'request-activity-list' },
          });
        }
      }
      const item = {
        name: route.name,
        link: route.fullPath,
        text: this.breadcrumbTitles[route.name],
        active: true,
        route: { name: route.name },
      };
      if (_.isNil(this.items.find((i) => i.name === item.name))) {
        this.items.push(item);
      }
    },
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
    nav(item) {
      const { name } = item;
      if (_.isEmpty(name)) { return; }
      const index = this.items.indexOf(item);
      if (index !== -1) {
        this.items.splice(index + 1);
        this.deactivateAll();
      }
      const route = { name };
      if (this.isPortalCatRoute(name)) {
        route.query = _.pickBy(this.portalCatQueryParams, _.identity);
      }
      this.$router.push(route);
    },
    onCreate() {
      this.$router.push({
        name: 'create-request',
      }).catch((err) => { console.log(err); });
    },
    onEdit(event) {
      this.$router.push({
        name: 'request-edition',
        params: { requestId: event.item._id },
      }).catch((err) => { console.log(err); });
    },
    onActivityEdition(eventData) {
      const entityId = eventData.item._id;
      this.$router.push({
        name: 'request-activity-edition',
        params: { entityId },
      }).catch((err) => { console.log(err); });
    },
    onActivityCreation(activityTemplate) {
      this.$router.push({
        name: 'request-activity-creation',
        params: { activityTemplate },
      }).catch((err) => { console.log(err); });
    },
    onActivityList(query) {
      this.$router.push({
        name: 'request-activity-list',
        query,
      }).catch((err) => { console.log(err); });
    },
    isPortalCatRoute(name) {
      return name === 'portal-cat';
    },
  },
};
