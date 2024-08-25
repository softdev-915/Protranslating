import _ from 'lodash';

export default {
  props: {
    url: {
      type: String,
      required: false,
    },
    downloadOnCreate: {
      type: Boolean,
      default: false,
    },
  },
  mounted() {
    if (this.downloadOnCreate) {
      this.download();
    }
  },
  methods: {
    download: function (url) {
      this.$emit('download-started');
      const { hiddenDiv } = this.$refs;
      hiddenDiv.innerHTML = '';
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.onload = this.onload;
      // FIXME delete the param and use only the component's URL
      iframe.src = url || this.url;
      hiddenDiv.appendChild(iframe);
      this.$emit('download-finished');
    },
    onload(e) {
      const iframe = e.target;
      if (!iframe.contentDocument) {
        this.$emit('download-error', 'File does not exist');
        return;
      }
      const body = _.get(iframe, 'contentDocument.body');
      try {
        if (body) {
          const elements = body.getElementsByTagName('pre');
          if (elements.length) {
            const errJSON = elements[0].innerText;
            const err = JSON.parse(errJSON);
            this.$emit('download-error', err);
          }
        }
      } catch (err) {
        this.$emit('download-error', err);
      }
    },
  },
};
