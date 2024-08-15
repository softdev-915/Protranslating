/* global window */
import _ from 'lodash';
import { mapGetters, mapActions } from 'vuex';
import { errorNotification } from '../../../../utils/notifications';
import PortalCatService from '../../../../services/portalcat-service';
import lspAwareUrl from '../../../../resources/lsp-aware-url';
import { CancellablePoller } from '../../../../services/cancellable-poller';

const REFLOW_MODAL_ID = 'workflowReflowModal';
const REFLOW_MODAL_COLUMNS = [
  'Filename',
];
const PC_PIPELINE_RUNNING = 'running';
const portalCatService = new PortalCatService();

export default {
  props: {
    modalData: {
      type: Object,
      default: () => null,
    },
  },
  data() {
    return {
      loading: false,
      isPolling: false,
      files: [],
    };
  },
  destroyed() {
    this.cancelPcPoller();
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    workflowReflowModalId() {
      return REFLOW_MODAL_ID;
    },
    activeColumns() {
      return REFLOW_MODAL_COLUMNS;
    },
    downloadFinalFilesUrl() {
      const requestId = _.get(this, 'modalData.requestId');
      const srcLang = _.get(this, 'modalData.workflow.srcLang.isoCode');
      const tgtLang = _.get(this, 'modalData.workflow.tgtLang.isoCode');
      return lspAwareUrl(`portalcat/${requestId}/sl/${srcLang}/tl/${tgtLang}/final/download`);
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onKeydown(event) {
      if (event.code === 'Escape') {
        this.$emit('close-modal');
      }
    },
    async openReflowModal() {
      if (!this.$refs.reflowFilesModal) {
        return;
      }
      this.$refs.reflowFilesModal.show();
    },
    closeReflowModal() {
      this.cancelPcPoller();
      if (this.$refs.reflowFilesModal) {
        this.$refs.reflowFilesModal.hide();
        this.files = [];
      }
    },
    cancelPcPoller() {
      if (!_.isNil(this.pcPoller)) {
        this.pcPoller.cancel();
      }
    },
    startPcPolling() {
      this.isPolling = true;
      const types = ['export'];
      const fileIds = _.get(this, 'modalData.workflowLanguageCombination.documents', [])
        .map(document => document._id);
      const requestId = _.get(this, 'modalData.requestId');
      const srcLangs = [_.get(this, 'modalData.workflow.srcLang.isoCode')];
      const tgtLangs = [_.get(this, 'modalData.workflow.tgtLang.isoCode')];
      const params = { requestId, types, fileIds, srcLangs, tgtLangs };
      this.pcPoller = new CancellablePoller(
        portalCatService.getPipelineStatus.bind(portalCatService, params),
        3000
      );
      this.pcPoller.start(this.handlePcPollResponse.bind(this));
    },
    handlePcPollResponse(response, err, poller) {
      if (!_.isNil(err)) {
        const message = _.get(err, 'message', err);
        this.pushNotification(errorNotification(message));
        poller.cancel();
        return;
      }
      const statuses = _.get(response, 'data.statuses', []);
      const areAllFinished = statuses.every(({ status }) => status !== PC_PIPELINE_RUNNING);
      if (!areAllFinished) {
        return;
      }
      poller.cancel();
      this.fetchFiles();
      this.isPolling = false;
    },
    async fetchFiles() {
      try {
        this.loading = true;
        const requestId = _.get(this, 'modalData.requestId');
        const srcLang = _.get(this, 'modalData.workflow.srcLang.isoCode');
        const tgtLang = _.get(this, 'modalData.workflow.tgtLang.isoCode');
        const { data } = await portalCatService
          .getFinalFilesListByRequestLanguageCombination({
            requestId,
            srcLang,
            tgtLang,
          });
        this.files = data;
      } catch (e) {
        const notification = {
          title: 'Error',
          message: 'Could not get final files',
          state: 'danger',
          response: e,
        };
        this.pushNotification(notification);
      } finally {
        this.loading = false;
      }
    },
  },
  watch: {
    modalData(modalData) {
      this.cancelPcPoller();
      if (modalData) {
        this.openReflowModal();
        this.startPcPolling();
        window.addEventListener('keydown', this.onKeydown);
      } else {
        window.removeEventListener('keydown', this.onKeydown);
        this.closeReflowModal();
      }
    },
  },
};
