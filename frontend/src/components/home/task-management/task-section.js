import _ from 'lodash';
import { mapActions, mapGetters } from 'vuex';
import SectionContainer from '../../section-container/section-container.vue';

const breadcrumbTitles = {
  'task-edition': 'Task Detail',
  'task-portal-cat': 'Portal CAT',
  'task-management-portal-cat-memory-editor': 'Memory Editor',
  'task-management-request-files-statistics': 'Statistics',
};

export default {
  components: {
    SectionContainer,
  },
  created() {
    this.buildBreadcrumb(this.$route);
  },
  data() {
    return {
      items: [{
        text: 'Task Management',
        link: 'task-management',
        active: true,
      }],
    };
  },
  watch: {
    $route(to) {
      this.buildBreadcrumb(to);
    },
  },
  computed: {
    ...mapGetters('breadcrumb', ['portalCatQueryParams']),
  },
  methods: {
    ...mapActions('breadcrumb', ['setPortalCatQueryParams']),
    onEntitySave(entity) {
      // the first ref will always be the grid
      this.$refs[0][0].onEntitySave(entity);
    },
    buildBreadcrumb({ fullPath, name, query }) {
      if (this.isPortalCatRoute(name)) {
        this.setPortalCatQueryParams(query);
      }
      this.items = [{
        text: 'Tasks ',
        name: 'task-management',
        active: false,
      }];
      if (/portal-cat|statistics/.test(fullPath)) {
        this.items.push({
          name: 'task-edition',
          text: 'Task Detail',
        });
      }
      if (fullPath.match('memory-editor')) {
        this.items.push({
          name: 'task-portal-cat',
          text: 'Portal Cat',
        });
      }
      if (breadcrumbTitles[name]) {
        const item = {
          link: fullPath,
          text: breadcrumbTitles[name],
          active: true,
        };
        if (this.items.filter((i) => i.text === item.text).length === 0) {
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
      const routeName = item.link || item.name;
      if (_.isEmpty(routeName)) { return; }
      const index = this.items.indexOf(item);
      if (index !== -1) {
        this.items.splice(index + 1);
        this.deactivateAll();
      }
      const route = { name: routeName };
      if (this.isPortalCatRoute(routeName)) {
        route.query = _.pickBy(this.portalCatQueryParams, _.identity);
      }
      this.$router.push(route);
    },
    isPortalCatRoute(name) {
      return name === 'task-portal-cat';
    },
  },
};
