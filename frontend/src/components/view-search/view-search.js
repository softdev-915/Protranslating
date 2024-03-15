import { mapActions, mapGetters } from 'vuex';
import _ from 'lodash';
import sessionObserver from '../../utils/observers/session';
import viewsUtils from '../../utils/views';
import { commandKeyCodes } from '../../utils/browser';

const SPACE_KEY = 32;
const UP_KEY = 38;
const DOWN_KEY = 40;
const ENTER_KEY = 13;
const ESC_KEY = 27;

export default {
  created: function () {
    sessionObserver.addObserver(this);
    this.commandKeyCodes = commandKeyCodes();
  },
  data() {
    return {
      commandKeyCodes: [],
      commandPressed: {},
      selectedIndex: 0,
      helpSelected: false,
      search: '',
    };
  },
  computed: {
    ...mapGetters('app', ['userLogged', 'sitemap']),
    views: function () {
      const viewsList = viewsUtils.filterViewsByKeyword(this.search, this.userLogged);
      // Hide views for users who are prohibited from
      return _.orderBy(viewsList.filter((view) => {
        if (view.hiddenFor) {
          return view.hiddenFor.every((userType) => userType !== this.userLogged.type);
        }
        if (this.search.length) {
          view.matchCount = viewsUtils.countKeywordMatches(this.search.split(' '), view.keywords);
        }
        return view;
      }), (view) => (this.search.length ? view.matchCount : view.name), this.search.length && 'desc');
    },
    viewsLen: function () {
      return this.views.length;
    },
  },
  watch: {
    views: function () {
      this.selectedIndex = 0;
    },
    sitemap: function (newSitemap) {
      if (newSitemap) {
        setTimeout(() => {
          this.$refs.searchInput.focus();
        }, 0);
      }
    },
  },
  methods: {
    ...mapActions('app', ['setHelp', 'setSitemap']),
    showHelp: function () {
      this.setHelp(true);
    },
    show: function () {
      this.setSitemap(true);
    },
    secondaryKeyPressed: function (e) {
      if (this.commandKeyCodes.length === 0) {
        return e.ctrlKey;
      }
      return this.commandPressed;
    },
    close: function () {
      this.search = '';
      this.setSitemap(false);
    },
    onLogin: function () {
      document.addEventListener('keyup', this._onKeyUp);
      document.addEventListener('keydown', this._onKeyDown);
    },
    onLogout: function () {
      document.removeEventListener('keyup', this._onKeyUp);
      document.removeEventListener('keydown', this._onKeyUp);
    },
    _onKeyUp: function (e) {
      this.commandPressed = false;
      const keyCodePressed = e.which || e.keyCode;
      if (keyCodePressed === UP_KEY) {
        if (this.helpSelected) {
          this.helpSelected = false;
        } else if (this.selectedIndex > 0) {
          this.selectedIndex--;
        }
      } else if (keyCodePressed === DOWN_KEY) {
        if (this.selectedIndex < this.viewsLen - 1) {
          this.selectedIndex++;
        } else {
          this.helpSelected = true;
        }
      } else if (keyCodePressed === ENTER_KEY && this.sitemap) {
        if (this.helpSelected) {
          this.showHelp();
        } else if (this.views.length >= this.selectedIndex) {
          this.$router.push(this.views[this.selectedIndex].route).catch((err) => { console.log(err); });
        }
        this.close();
      }
    },
    _onKeyDown: function (e) {
      const keyCodePressed = e.which || e.keyCode;
      if (this.commandKeyCodes.indexOf(keyCodePressed) >= 0) {
        this.commandPressed = true;
      }
      if (keyCodePressed === SPACE_KEY
        && this.secondaryKeyPressed(e) && e.shiftKey) {
        this.show();
      } else if ((e.which === ESC_KEY || e.keyCode === ESC_KEY) && this.sitemap) {
        this.close();
      }
    },
  },
};
