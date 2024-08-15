
import _ from 'lodash';
import { sectionRouterMixin } from '../../../mixins/section-router';
import UrlBasedBreadcrumb from '../url-based-breadcrumb/url-based-breadcrumb.vue';
import userRoleCheckMixin from '../../../mixins/user-role-check';

const CREATE_ROLES = ['INVOICE_CREATE_ALL', 'INVOICE-ACCT_READ_ALL'];
const breadcrumbTitles = {
  invoices: 'invoices',
  edition: 'invoice-edition',
  creation: 'invoice-creation',
  preview: 'invoice-preview',
  activityGrid: 'invoice-activity-grid',
  activityCreation: 'invoice-activity-creation',
  activityEdition: 'invoice-activity-edition',
};

export default {
  mixins: [sectionRouterMixin, userRoleCheckMixin],
  components: {
    UrlBasedBreadcrumb,
  },
  created() {
    this.canCreate = this.hasRole(CREATE_ROLES);
  },
  computed: {
    sectionClass() {
      return { 'mt-0': this.$route.name === breadcrumbTitles.preview };
    },
  },
  methods: {
    buildBreadcrumbItems(to) {
      if (!_.isEmpty(this.routerItems)
        && to.name === this.routerItems[this.routerItems.length - 1].route.name) {
        return this.routerItems;
      }
      const items = [];
      if (to.path.match(/^\/invoices\/?$/)) {
        items.push({ text: 'Invoices Grid', route: { name: breadcrumbTitles.invoices }, active: true });
        return items;
      }
      items.push({ text: 'Invoices Grid', route: { name: breadcrumbTitles.invoices }, active: false });
      const entityId = _.get(this.$route, 'params.entityId', '');
      const invoiceDetailDependantRoutes = [
        breadcrumbTitles.activityGrid,
        breadcrumbTitles.preview,
        breadcrumbTitles.activityCreation,
        breadcrumbTitles.activityEdition,
      ];
      if (invoiceDetailDependantRoutes.some((r) => to.name === r) && this.canCreate) {
        items.push({ text: 'Invoice Detail', route: { name: breadcrumbTitles.edition, params: { entityId } }, active: false });
      }
      switch (to.name) {
        case breadcrumbTitles.edition:
          items.push({ text: 'Invoice Detail', route: { name: breadcrumbTitles.edition }, active: true });
          break;
        case breadcrumbTitles.creation:
          items.push({ text: 'New Invoice', route: { name: breadcrumbTitles.creation }, active: true });
          break;
        case breadcrumbTitles.preview:
          items.push({ text: 'Preview Invoice', route: { name: breadcrumbTitles.preview }, active: true });
          break;
        case breadcrumbTitles.activityCreation:
          items.push({ text: 'Activity Grid', route: { name: breadcrumbTitles.activityGrid, params: { entityId } }, active: false });
          items.push({ text: 'Activity Creation', route: { name: breadcrumbTitles.activityCreation }, active: true });
          break;
        case breadcrumbTitles.activityEdition:
          items.push({ text: 'Activity Grid', route: { name: breadcrumbTitles.activityGrid, params: { entityId } }, active: false });
          items.push({ text: 'Activity Edition', route: { name: breadcrumbTitles.activityEdition }, active: true });
          break;
        case breadcrumbTitles.activityGrid:
          items.push({ text: 'Activity Grid', route: { name: breadcrumbTitles.activityGrid }, active: true });
          break;
        default:
          break;
      }
      return items;
    },
    onCreate() {
      this.$router.push({ name: 'invoice-creation' }).catch((err) => { console.log(err); });
    },
    onEdit(eventData) {
      this.$router.push({
        name: 'invoice-edition',
        params: {
          entityId: eventData.item._id,
        },
      }).catch((err) => { console.log(err); });
    },
    onPreview(entityId) {
      this.$router.push({
        name: 'invoice-preview',
        params: { entityId },
      }).catch((err) => { console.log(err); });
    },
    onActivityGrid(filter, entityId) {
      this.$router.push({
        name: 'invoice-activity-grid',
        params: { entityId },
        query: { filter },
      }).catch((err) => { console.log(err); });
    },
    onActivityEdition(eventData) {
      this.$router.push({
        name: 'invoice-activity-edition',
        params: { entityId: eventData.item._id },
      }).catch((err) => { console.log(err); });
    },
    onActivityCreation(activityTemplate, entityId) {
      this.$router.push({
        name: 'invoice-activity-creation',
        params: {
          activityTemplate,
          entityId,
        },
      }).catch((err) => { console.log(err); });
    },
  },
};
