import { mapActions, mapGetters } from 'vuex';
import HelpSearch from './help-search/help-search.vue';
import RichTextEditor from '../rich-text-editor/rich-text-editor.vue';
import viewsUtils from '../../utils/views';
import sessionObserver from '../../utils/observers/session';
import { updateFailedNotification } from '../../utils/notifications';
import DocumentationService from '../../services/documentation-service';
import { hasRole } from '../../utils/user';

const documentationService = new DocumentationService();
const ESC_KEY = 27;

export default {
  components: {
    HelpSearch,
    RichTextEditor,
  },
  created: function () {
    sessionObserver.addObserver(this);
    this.documentationService = documentationService;
  },
  mounted: function () {
    document.addEventListener('keyup', this._onKeyUp);
    if (this.selected) {
      this.load(this.selected);
    }
  },
  data() {
    return {
      selected: {},
      selectedIndex: -1,
      topicFromSearch: null,
      loading: false,
      editing: false,
      search: '',
      keywords: '',
      helpHtml: '',
    };
  },
  watch: {
    help: function (h) {
      if (h && this.views) {
        const routeName = this.$route.name;
        const len = this.views.length;
        for (let i = 0; i < len; i++) {
          if (this.views[i].route.name === routeName) {
            this.selectIndex(i);
            break;
          }
        }
      }
    },
    topicFromSearch: function (newTopicFromSearch) {
      if (newTopicFromSearch) {
        const viewsLen = this.views.length;
        for (let i = 0; i < viewsLen; i++) {
          if (this.views[i].id === newTopicFromSearch.name) {
            this.selectedIndex = i;
            break;
          }
        }
      }
    },
    selectedIndex: function (newSelectedIndex) {
      if (newSelectedIndex === -1) {
        this.selected = null;
      } else {
        this.selected = this.views[this.selectedIndex];
      }
    },
    selected: function (newSelected, oldSelected) {
      if (newSelected && (oldSelected === null || newSelected.id !== oldSelected.id)) {
        this.editing = false;
        this.load(newSelected);
      }
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged', 'help']),
    canEdit: function () {
      return hasRole(this.userLogged, 'DOCUMENTATION_UPDATE_ALL');
    },
    views: function () {
      // TODO add current url to the filter
      let id;
      if (this.topicFromSearch) {
        id = this.topicFromSearch.name;
      }
      const views = viewsUtils.filterDocumentationViewsByKeyword(this.search, this.userLogged, id);
      return views.sort((a, b) => {
        if (a.name > b.name) {
          return 1;
        }
        if (a.name < b.name) {
          return -1;
        }
        return 0;
      });
    },
    selectedName: function () {
      if (this.selected && this.selected.route) {
        return this.selected.route.name;
      }
      return null;
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    ...mapActions('app', ['setHelp']),
    onLogin: function () {
      // nothing to do
    },
    onLogout: function () {
      // Ensure that the help component is hidden when logout is triggered.
      this.editing = false;
      this.helpHtml = '';
      this.search = '';
      this.selectedIndex = -1;
      this.setHelp(false);
    },
    load: function (selected) {
      if (hasRole(this.userLogged, 'DOCUMENTATION_READ_ALL')) {
        this.loading = true;
        const { id } = selected;
        this.documentationService.get(id).then((response) => {
          this.loading = false;
          if (response.data.documentation) {
            this.helpHtml = response.data.documentation.help;
          } else {
            this.helpHtml = '';
          }
        }).catch(() => {
          this.helpHtml = '';
        }).finally(() => {
          this.loading = false;
        });
      }
    },
    update: function () {
      const newDoc = {
        name: this.selected.id,
        title: this.selected.name,
        help: this.helpHtml,
        roles: ['DOCUMENTATION_READ_ALL'],
        lang: 'en',
      };
      this.documentationService.update(this.selected.id, newDoc).then(() => {
        this.editing = false;
      }).catch((err) => {
        const notification = updateFailedNotification('scheduler');
        notification.response = err;
        this.pushNotification(notification);
      });
    },
    closeOnClick: function (event) {
      // close only if clicked on the overlay
      if (event.target.id === 'app-help-overlay') {
        this.close();
      }
    },
    close: function () {
      this.editing = false;
      this.helpHtml = '';
      this.search = '';
      this.selectedIndex = -1;
      this.setHelp(false);
    },
    onKeywordSearch: function () {
      this.search = '';
      this.selectedIndex = -1;
      this.helpHtml = '';
    },
    selectedFromSearch: function (selectedTopic) {
      this.search = '';
      this.selectedIndex = -1;
      this.topicFromSearch = selectedTopic;
    },
    selectIndex: function (index) {
      this.selectedIndex = index;
      this.$refs.helpSearch.clear();
    },
    _onKeyUp: function (e) {
      const keyCodePressed = e.which || e.keyCode;
      if (keyCodePressed === ESC_KEY && !this.editing) {
        this.close();
      }
    },
  },
};
