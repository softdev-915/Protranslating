import IframeDownload from '../../../../iframe-download/iframe-download.vue';
import ActionFilesMixin from '../../mixins/action-files-mixin';

export default {
  mixins: [
    ActionFilesMixin,
  ],
  components: {
    IframeDownload,
  },
  props: {
    files: {
      type: Array,
      default: [],
    },
    pipelineId: {
      type: String,
      required: true,
    },
    actionId: {
      type: String,
      required: true,
    },
  },
  computed: {
    actionFileUrls() {
      return this.files.map((file) => this.getActionFileUrl(file));
    },
  },
};
