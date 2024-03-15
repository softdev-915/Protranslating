import _ from 'lodash';

const FROM_HISTORY_SIZE = 2;

export default {
  props: {
    breadcrumbItemsFactory: {
      type: Function,
      required: true,
    },
  },
  data() {
    return {
      items: [],
      from: [],
    };
  },
  mounted() {
    const newItems = this.breadcrumbItemsFactory(this.$route, this.items.slice(0));
    this.$set(this, 'items', this.addItemsLink(newItems));
  },
  watch: {
    $route: function (to, from) {
      if (this.from.length === FROM_HISTORY_SIZE) {
        this.from.shift();
      }
      this.from.push(from);
      try {
        if (this.breadcrumbItemsFactory) {
          const newItems = this.breadcrumbItemsFactory(to, this.items.slice(0));
          this.$set(this, 'items', this.addItemsLink(newItems));
        }
      } catch (e) {
        // nothing to do
        // eslint-disable-next-line no-console
        console.log('Error processing breadcrum.', e);
      }
    },
  },
  methods: {
    nav(event, item) {
      event.preventDefault();
      const from = this.from.findLast(({ name }) => name === _.get(item, 'route.name'));
      if (!_.isEmpty(from)) {
        Object.assign(item.route, { query: from.query });
      }
      this.$emit('breadcrumb-click', item);
      if (_.isEmpty(this.$listeners)) {
        this.$router.push(item.route);
      }
    },
    addItemsLink(newItems) {
      let pathParts = this.$route.fullPath.split('/');
      // Remove empty paths
      pathParts = pathParts.filter((path) => path !== '');
      // Build href for items
      return newItems.map((item, index) => {
        if (item.active) {
          return item;
        }
        item.href = window.location.origin;
        if (_.has(item, 'route.name')) {
          const routeLocation = this.$router.resolve(item.route);
          if (_.get(routeLocation, 'href', '/') !== '/') {
            item.href += routeLocation.href;
            return item;
          }
        }
        item.href += '/';
        if (index === 0) {
          item.href += `${pathParts[0]}/`;
        } else {
          let href = pathParts.slice(0, index + 1).join('/');
          // If item points to an Id, we need to add /details otherwise it won't open
          const editRegex = new RegExp('edition', 'i');
          if (item.text.match(editRegex)) {
            href += '/details';
          }
          item.href += `${href}/`;
        }
        return item;
      });
    },
  },
};
