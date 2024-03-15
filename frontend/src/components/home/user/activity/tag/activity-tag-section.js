import { sectionRouterMixin } from '../../../../../mixins/section-router';
import SectionContainer from '../../../../section-container/section-container.vue';
import UrlBasedBreadcrumb from '../../../url-based-breadcrumb/url-based-breadcrumb.vue';

export default {
  mixins: [sectionRouterMixin],
  components: {
    UrlBasedBreadcrumb,
    SectionContainer,
  },
  data() {
    return {
      routerItems: [],
    };
  },
  methods: {
    buildBreadcrumbItems(to) {
      const items = [];
      if (to.path === '/activities/tags' || to.path === '/activities/tags/') {
        items.push({
          text: 'Tag Grid', route: { name: 'list-activity-tags' }, ts: Date.now(), active: true,
        });
      } else {
        items.push({
          text: 'Tag Grid', route: { name: 'list-activity-tags' }, ts: Date.now(), active: false,
        });
        if (to.path === '/activities/tags/create') {
          items.push({
            text: 'Tag Create', link: '#', ts: Date.now(), active: true,
          });
        } else if (to.path.indexOf('/details') !== -1) {
          items.push({
            text: 'Tag Edit', link: '#', ts: Date.now(), active: true,
          });
        }
      }
      this.routerItems = items;
      return items;
    },
    onEdit(eventData) {
      this.$router.push({
        name: 'activity-tag-edition',
        params: { entityId: eventData.item._id },
      }).catch((err) => { console.log(err); });
    },
    onCreate() {
      this.$router.push({ name: 'activity-tag-creation' }).catch((err) => { console.log(err); });
    },
  },
};
