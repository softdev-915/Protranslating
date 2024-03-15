import _ from 'lodash';
import SectionContainer from '../../section-container/section-container.vue';
import ActiveUserSessionsGrid from './active-user-sessions-grid.vue';

export default {
  components: {
    SectionContainer,
    ActiveUserSessionsGrid,
  },
  data() {
    return {
      currentComponent: null,
      currentValue: null,
      items: [],
    };
  },
  methods: {
    push(obj) {
      const newItem = {
        text: obj.text,
        type: obj.type,
        entity: obj.entity || {},
        query: obj.query || {},
        link: obj.link || '#',
        ts: `${this.items.length}`,
        active: true,
        load: false,
      };
      this.deactivateAll();
      this.items.push(newItem);
    },

    nav(item) {
      const index = this.items.indexOf(item);
      if (index !== -1) {
        this.items.splice(index + 1);
        this.deactivateAll();
        if (!item.load) {
          this.loadItem(this.items[index], index);
        }
        this.items[index].active = true;
        if (!_.isUndefined(this.$refs[item.ts][0])
          && _.isFunction(this.$refs[item.ts][0].onRefresh)) {
          this.$refs[item.ts][0].onRefresh();
        }
        if (_.isFunction(this.items[index].cb)) {
          this.items[index].cb();
        }
      }
    },

    navPrevious() {
      if (this.items.length > 1) {
        const item = this.items[this.items.length - 2];
        this.nav(item);
      }
    },

    deactivateAll() {
      this.items = this.items.map((v) => {
        v.active = false;
        return v;
      });
    },

    loadItem(item, index) {
      this.items[index].load = true;
    },

    onEntitySave(entity) {
      // the first ref will always be the grid
      this.$refs[0][0].onEntitySave(entity);
    },
  },
};
