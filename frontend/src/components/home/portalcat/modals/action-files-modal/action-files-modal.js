import _ from 'lodash';
import PCStoreMixin from '../../mixins/pc-store-mixin';
import ActionFiles from '../../components/action-files/action-files.vue';

const MODAL_ID = 'pc-action-files-modal';
const buildInitialData = () => ({
  modalId: MODAL_ID,
});

export default {
  mixins: [
    PCStoreMixin,
  ],
  components: {
    ActionFiles,
  },
  data() {
    return buildInitialData();
  },
  mounted() {
    this.$root.$on('hidden::modal', this.closeModal);
  },
  destroyed() {
    this.$root.$off('hidden::modal', this.closeModal);
  },
  watch: {
    isActionFilesModalOpened(value) {
      if (value) {
        this.$refs.bModal.show();
      } else {
        this.$refs.bModal.hide();
      }
    },
  },
  computed: {
    actionName() {
      return _.get(this.activeDownloads, 'action.name', '');
    },
    actionId() {
      return _.get(this.activeDownloads, 'action._id', '');
    },
    pipelineId() {
      return _.get(this.activeDownloads, 'pipelineId', '');
    },
    downloads() {
      return _.get(this.activeDownloads, 'downloads', []);
    },
  },
  methods: {
    closeModal(modalId) {
      if (modalId === MODAL_ID && this.isActionFilesModalOpened) {
        this.setActionFilesModalOpened(false);
      }
    },
  },
};
