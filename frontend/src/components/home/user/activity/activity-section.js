import _ from 'lodash';
import { sectionRouterMixin } from '../../../../mixins/section-router';
import SectionContainer from '../../../section-container/section-container.vue';
import UrlBasedBreadcrumb from '../../url-based-breadcrumb/url-based-breadcrumb.vue';

const prefixParam = (pathParts, i) => {
  if (i > 0) {
    return pathParts.slice(0, i).join('/');
  }
  return '';
};

const indexIfExist = (arr, len, i) => {
  if (i < len) {
    return arr[i];
  }
};
const reservedPathWords = ['activities', 'activity-tags'];
const isReservedWord = (str) => reservedPathWords.indexOf(str) !== -1;
const _commonItem = (pathParts, len, i, callbacks) => {
  let prefix = prefixParam(pathParts, i);
  if (prefix) {
    // remove "/activities/" from the prefix
    prefix = prefix.substring(12);
  }
  callbacks.list(prefix);
  i++;
  const next = indexIfExist(pathParts, len, i);
  if (next) {
    if (next === 'create') {
      callbacks.create(prefix);
    } else if (!isReservedWord(next)) {
      // if it's not a reserved word and is not 'create' it must be an id.
      callbacks.edit(prefix, next);
      i++;
    }
  }
  return i;
};

const resolveRoute = (r, prefix) => {
  if (typeof r === 'function') {
    return r(prefix);
  }
  return r;
};

const createCallbacks = (items, routes) => ({
  list(prefix) {
    items.push({
      text: routes.list.text,
      route: {
        name: resolveRoute(routes.list.route, prefix),
        params: {
          0: prefix,
        },
      },
      active: false,
    });
  },
  create(prefix) {
    items.push({
      text: routes.creation.text,
      route: {
        name: resolveRoute(routes.creation.route, prefix),
        params: {
          0: prefix,
        },
      },
      active: false,
    });
  },
  edit(prefix, entityId) {
    items.push({
      text: routes.edition.text,
      route: {
        name: resolveRoute(routes.edition.route, prefix),
        params: {
          0: prefix,
          entityId,
        },
      },
      active: false,
    });
  },
});

const _parsePath = (items, to) => {
  const pathParts = to.path.split('/');
  const len = pathParts.length;
  let i = 0;
  while (i < len) {
    switch (pathParts[i]) {
      case 'activities':
        i = _commonItem(pathParts, len, i, createCallbacks(items, {
          list: {
            text: 'Activity Grid',
            route: 'list-activity',
          },
          creation: {
            text: 'Activity Creation',
            route: 'activity-creation',
          },
          edition: {
            text: 'Activity Edition',
            route: 'activity-edition',
          },
        }));
        break;
      case 'activity-tags':
        i = _commonItem(pathParts, len, i, createCallbacks(items, {
          list: {
            text: 'Activity Tags Grid',
            route: 'activity-activityTag-grid',
          },
          creation: {
            text: 'Activity Tag Creation',
            route: 'activity-activityTag-creation',
          },
          edition: {
            text: 'Activity Tag Edition',
            route: 'activity-activityTag-edition',
          },
        }));
        break;
      case 'users':
        i = _commonItem(pathParts, len, i, createCallbacks(items, {
          list: {
            text: 'User Grid',
            route: 'activity-user-grid',
          },
          creation: {
            text: 'User Creation',
            route: 'activity-user-creation',
          },
          edition: {
            text: 'User Edition',
            route: 'activity-user-edition',
          },
        }));
        break;
      default:
        i += 1;
        break;
    }
  }
  // last items is active
  items[items.length - 1].active = true;
};

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
      if (to.name === 'list-activity') {
        items.push({ text: 'Activity Grid', route: { name: 'list-activity' }, active: true });
      } else {
        _parsePath(items, to);
      }
      this.routerItems = items;
      return items;
    },
    onEdit(eventData) {
      this.$router.push({
        name: 'activity-edition',
        params: { entityId: eventData.item._id },
      }).catch((err) => { console.log(err); });
    },
    onCreate() {
      this.$router.push({ name: 'activity-creation' }).catch((err) => { console.log(err); });
    },
    onActivityTagManage() {
      this._navigate('activity-activityTag-grid');
    },
    onActivityTagCreate() {
      this._navigate('activity-activityTag-creation');
    },
    onActivityTagEdit(eventData) {
      const entityId = eventData.item._id;
      this._navigateEdition('activity-activityTag-edition', entityId);
    },
    onUserManage(query) {
      this._navigate('activity-user-grid', query);
    },
    onUserEdit(eventData) {
      const entityId = eventData.item._id;
      this._navigateEdition('activity-user-edition', entityId);
    },
    onUserCreate() {
      this._navigate('activity-user-creation');
    },
    _navigate(name, query) {
      const path = this.$route.path.replace('/details', '');
      // removes the "/activities/" from the beggining of the path
      const routeNames = this.$route.name.split('-');
      const nextRouteNames = name.split('-');
      let zero = path.substring(12);
      const routeMiddleName = _.get(routeNames, '1');
      const nextMiddleName = _.get(nextRouteNames, '1');
      const isGrid = _.get(routeNames, '2') === 'grid';
      if (routeMiddleName === nextMiddleName && isGrid) {
        // if the middle of next route matches the middle of the current route,
        // for instance activity-activityTag-grid matches activity-activityTag-create,
        // then do not override the zero param.
        zero = _.get(this.$route, 'params.0', '');
      }
      this.$router.push({
        name,
        params: {
          0: zero,
        },
        query,
      }).catch((err) => { console.log(err); });
    },
    _navigateEdition(name, entityId) {
      const path = this.$route.path.replace('/details', '');
      let zero = _.get(this.$route, 'params.0');
      if (!zero) {
        // removes the "/activities/" from the beggining of the path
        zero = path.substring(12);
      }
      this.$router.push({
        name,
        params: {
          0: zero,
          entityId,
        },
      }).catch((err) => { console.log(err); });
    },
  },
};
