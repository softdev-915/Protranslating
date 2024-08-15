import { mapActions, mapGetters } from 'vuex';

export default {
  data() {
    return {
      showTimer: false,
      appVersion: null,
    };
  },
  computed: {
    ...mapGetters('app', ['userLogged', 'version']),
    ...mapGetters('features', ['mock']),
    utcYear() {
      return new Date().getUTCFullYear();
    },
    appName() {
      return '';
    },
  },
  created() {
    this.appVersion = this.version;
  },
  methods: {
    ...mapActions('app', ['logout']),
    switchOffMock: function () {
      if (this.mock) {
        document.location = `${document.location.href}?mock=false`;
      }
    },
  },
  watch: {
    version: function (newVersion) {
      if (!this.appVersion && newVersion) {
        // if version is setted do not update it until full page refresh
        this.appVersion = newVersion;
      }
    },
  },
};
