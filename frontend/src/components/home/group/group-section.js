import { sectionRouterMixin } from '../../../mixins/section-router';
import UrlBasedBreadcrumb from '../url-based-breadcrumb/url-based-breadcrumb.vue';

export default {
  mixins: [sectionRouterMixin],
  components: {
    UrlBasedBreadcrumb,
  },
  data() {
    return {
      routerItems: [],
    };
  },
  methods: {
    buildBreadcrumbItems(to) {
      const items = [];
      if (to.path === '/groups' || to.path === '/groups/') {
        items.push({ text: 'Group Grid', route: { name: 'list-group' }, active: true });
      } else {
        items.push({ text: 'Group Grid', route: { name: 'list-group' }, active: false });
        if (to.name.indexOf('roles') >= 0) {
          if (to.name.indexOf('creation') >= 0) {
            items.push({ text: 'Group Creation', route: { name: 'group-creation' }, active: false });
          } else {
            items.push({
              text: 'Group Edition',
              route: {
                name: 'group-edition',
                params: to.params,
              },
              active: false,
            });
          }
          items.push({ text: 'Group\'s Roles', route: { name: 'group-creation-roles' }, active: true });
        } else if (to.name === 'group-edition') {
          items.push({ text: 'Group Edition', route: { name: 'group-edition' }, active: true });
        } else {
          items.push({ text: 'Group Creation', route: { name: 'group-creation' }, active: true });
        }
      }
      return items;
    },
    onCreate() {
      this.$router.push({ name: 'group-creation' }).catch((err) => { console.log(err); });
    },
    onEdit(eventData) {
      this.$router.push({
        name: 'group-edition',
        params: {
          entityId: eventData.item._id,
        },
      }).catch((err) => { console.log(err); });
    },
  },
};
