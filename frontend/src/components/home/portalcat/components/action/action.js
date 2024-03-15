import _ from 'lodash';
import PCStoreMixin from '../../mixins/pc-store-mixin';
import ActionFilesMixin from '../../mixins/action-files-mixin';
import RoleCheckMixin from '../../../../../mixins/user-role-check';
import IframeDownload from '../../../../iframe-download/iframe-download.vue';

export default {
  mixins: [
    PCStoreMixin,
    ActionFilesMixin,
    RoleCheckMixin,
  ],
  components: {
    IframeDownload,
  },
  props: {
    action: {
      type: Object,
      required: true,
    },
    pipelineId: {
      type: String,
      required: true,
    },
    isInProgress: Boolean,
  },
  computed: {
    actionId() {
      return _.get(this.action, '_id', '');
    },
    name() {
      return _.get(this.action, 'name', '');
    },
    info() {
      return _.get(this.action, 'note', '');
    },
    downloads() {
      return _.get(this.action, 'downloads', []);
    },
    isDownloadsAvailable() {
      return !_.isEmpty(this.downloads);
    },
    isSingleDownload() {
      return this.downloads.length === 1;
    },
    actionFileUrl() {
      const file = this.downloads[0];
      return this.getActionFileUrl(file);
    },
    isConfigurable() {
      return _.get(this, 'action.attributes.configurable', false);
    },
    canReadActionConfig() {
      return this.hasRole('ACTION-CONFIG_READ_ALL');
    },
    canApplyActionConfig() {
      return this.hasRole('ACTION-CONFIG_UPDATE_ALL');
    },
  },
  methods: {
    downloadFiles() {
      if (this.isSingleDownload) {
        const fileId = _.get(this, 'downloads[0].fileId', '');
        this.downloadFile(fileId);
        return;
      }

      this.setActiveDownloads({
        action: this.action,
        pipelineId: this.pipelineId,
        downloads: this.downloads,
      });
      this.setActionFilesModalOpened(true);
    },
  },
};
