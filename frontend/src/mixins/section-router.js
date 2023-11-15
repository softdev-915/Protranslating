import _ from 'lodash';

export const sectionRouterMixin = {
  data() {
    return {
      routerItems: [],
    };
  },
  methods: {
    statefulbuildBreadcrumbItems(to) {
      const items = this.buildBreadcrumbItems(to);
      this.routerItems = items;
      return items;
    },
    navigatePrevious() {
      const len = this.routerItems.length;
      if (len > 1) {
        const { route } = this.routerItems[len - 2];
        this.$router.push(route).catch((err) => { console.log(err); });
      }
    },
    navigateRoot() {
      if (this.routerItems.length === 0) {
        return;
      }
      const route = this.routerItems[0].route;
      this.$router.push(route);
    },
    _navigate(name, query) {
      const path = this.$route.path.replace('/details', '');
      const zero = path.replace(this.replacePart, '');
      this.$router.push({
        name,
        params: {
          0: zero.split('/')[0],
        },
        query: query,
      });
    },
    _navigateEdition(name, entityId) {
      const path = this.$route.path.replace('/details', '');
      let zero = _.get(this.$route, 'params.0');
      if (!zero) {
        zero = path.replace(this.replacePart, '');
      }
      this.$router.push({
        name,
        params: {
          0: zero.split('/')[0],
          entityId,
        },
      });
    },
  },
};
