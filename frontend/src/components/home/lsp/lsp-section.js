import { sectionRouterMixin } from '../../../mixins/section-router';
import SectionContainer from '../../section-container/section-container.vue';
import UrlBasedBreadcrumb from '../url-based-breadcrumb/url-based-breadcrumb.vue';

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
    buildBreadcrumbItems() {
      const items = [];
      items.push({
        text: 'LSP settings', link: '#', ts: Date.now(), active: true,
      });
      this.routerItems = items;
      return items;
    },
    onEntitySave(entity) {
      // the first ref will always be the grid
      this.$refs[0][0].onEntitySave(entity);
    },
    push(route) {
      this.items = [{ text: 'LSP settings ', link: 'lsp-settings', active: true }];
      if (this.breadcrumbTitles[route.name]) {
        const item = {
          link: route.fullPath,
          text: this.breadcrumbTitles[route.name],
          active: true,
        };
        if (this.items.filter((i) => i.text === item.text).length === 0) {
          this.deactivateAll();
          this.items.push(item);
        }
      }
    },
    deactivateAll() {
      this.items = this.items.map((v) => {
        v.active = false;
        return v;
      });
    },
    nav(item) {
      if (item.link) {
        const index = this.items.indexOf(item);
        if (index !== -1) {
          this.items.splice(index + 1);
          this.deactivateAll();
        }
        this.$router.push({ name: item.link }).catch((err) => { console.log(err); });
      }
    },
  },
};
