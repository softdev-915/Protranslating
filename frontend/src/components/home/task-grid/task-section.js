import _ from 'lodash';
import { mapActions, mapGetters } from 'vuex';
import SectionContainer from '../../section-container/section-container.vue';

export default {
  components: {
    SectionContainer,
  },
  watch: {
    $route({ name, query }) {
      if (this.isPortalCatRoute(name)) {
        this.setPortalCatQueryParams(query);
      }
    },
  },
  methods: {
    ...mapActions('breadcrumb', ['setPortalCatQueryParams']),
    taskNavigateRequest(event) {
      const params = {
        requestId: _.get(event, 'requestId'),
        taskId: _.get(event, 'taskId'),
      };
      this.$router.push({ name: 'task-detail', params }).catch((err) => { console.log(err); });
    },
    nav(item) {
      const { link } = item;
      if (_.isEmpty(link)) { return; }
      const index = this.items.indexOf(item);
      if (index !== -1) {
        this.items.splice(index + 1);
      }
      const route = { name: link };
      if (this.isPortalCatRoute(link)) {
        route.query = _.pickBy(this.portalCatQueryParams, _.identity);
      }
      this.$router.push(route);
    },
    onTaskDetails(taskElement) {
      const requestId = _.get(taskElement, 'item._id');
      const taskId = _.get(taskElement, 'item.taskId');
      this.$router.push({
        name: 'task-detail',
        params: {
          requestId: requestId,
          taskId: taskId,
        },
      }).catch((err) => { console.log(err); });
    },
    isPortalCatRoute(name) {
      return name === 'task-grid-portal-cat';
    },
    isPortalCatRoute(name) {
      return name === 'task-grid-portal-cat';
    },
    isPortalCatRoute(name) {
      return name === 'task-grid-portal-cat';
    },
  },
  computed: {
    ...mapGetters('breadcrumb', ['portalCatQueryParams']),
    items() {
      const items = [{
        text: 'Tasks',
        link: 'task-grid',
        active: true,
      }];
      if (/(task-detail|portal-cat)/.test(this.$route.name)) {
        _.last(items).active = false;
        items.push({
          text: 'Task Detail',
          link: 'task-detail',
          active: true,
        });
      }
      if (/request-files-statistics/.test(this.$route.name)) {
        _.last(items).active = false;
        items.push({
          text: 'Statistics',
          link: 'task-grid-request-files-statistics',
          active: true,
        });
      }
      if (/portal-cat/.test(this.$route.name)) {
        items[1].active = false;
        items.push({
          link: 'task-grid-portal-cat',
          text: 'Portal Cat',
          active: true,
        });
      }
      if (/task-grid-portal-cat-memory-editor/.test(this.$route.name)) {
        items[2].active = false;
        items.push({
          text: 'Memory Editor',
          active: true,
        });
      }
      return items;
    },
  },
};
