import _ from 'lodash';
import Vue from 'vue';
import IframeDownload from '../iframe-download/iframe-download.vue';

export default {
  components: { IframeDownload },
  data() {
    return {
      noIframe: false,
      error: null,
      message: '',
    };
  },

  computed: {
    fileUrl() {
      return _.get(this.$route, 'query.url', '');
    },
    hasError() {
      return !_.isNil(this.error);
    },
  },
  created() {
    this.noIframe = _.get(this, '$route.query.noIframe', false);
    if (this.noIframe) {
      this.message = 'Your download should start shortly. If it doesn\'t please try clicking';
    } else {
      this.message = 'The file is being downloaded';
    }
    if (this.noIframe) {
      Vue.http.get(this.fileUrl)
        .then((response) => {
          const cloudUrl = _.get(response, 'body.data');
          if (_.isEmpty(cloudUrl)) {
            this.onDownloadError('File could not be downloaded');
          } else {
            this.$refs.downloadLink.href = cloudUrl;
            this.$refs.downloadLink.click();
          }
        });
    }
  },
  methods: {
    onDownloadError(error) {
      this.error = _.get(error, 'status.message', error);
      this.message = 'Download failed';
    },
    onDownloadFinished() {
      if (!this.hasError) {
        this.message = 'Download finished';
      }
    },
  },
};
