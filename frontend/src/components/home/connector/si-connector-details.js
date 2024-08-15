import _ from 'lodash';
import { mapGetters } from 'vuex';
import UtcFlatpickr from '../../form/utc-flatpickr.vue';

const DEFAULT_FORMAT = 'YYYY-MM-DD HH:mm';
const MOCK_FORMAT = 'YYYY-MM-DD HH:mm:ss';
const FLATPICKR_CONFIG = { enableTime: true, allowInput: false, clickOpens: false };
const FLATPICKR_MOCK_CONFIG = {
  enableTime: true,
  allowInput: false,
  clickOpens: false,
  enableSeconds: true,
};

export default {
  components: {
    UtcFlatpickr,
  },

  props: {
    value: Object,
  },

  watch: {
    value: {
      handler() {
        this.siConnector = this.value;
      },
      immediate: true,
    },
  },

  created() {
    this.format = this.mock ? MOCK_FORMAT : DEFAULT_FORMAT;
  },

  data() {
    return {
      siConnector: {
        connectorEndedAt: null,
        isSynced: false,
        error: '',
      },
    };
  },

  computed: {
    ...mapGetters('features', ['mock']),
    flatPickrConfig() {
      return this.mock ? FLATPICKR_MOCK_CONFIG : FLATPICKR_CONFIG;
    },
    wasSyncAttempted() {
      return !_.isNil(this.siConnector.connectorEndedAt);
    },
    hasError() {
      return !_.isNil(this.siConnector.error);
    },
    errorMessage() {
      if (this.wasSyncAttempted) {
        return this.hasError ? `Error: ${this.siConnector.error}` : 'No Errors Found';
      }
      return 'No SI sync information available';
    },
  },
};
