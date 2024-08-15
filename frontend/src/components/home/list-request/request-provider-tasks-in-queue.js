/* global window, global*/

export default {
  props: {
    item: { type: Object, required: true },
    col: { type: Object, required: true },
  },
  computed: {
    value() {
      return this.item[this.col.prop];
    },
  },
  methods: {
    openTasksView() {
      const routeData = this.$router.resolve({ name: 'task-management', query: { providerId: this.item._id, providerName: this.item.name } });
      window.open(routeData.href, '_blank');
    },
  },
};
