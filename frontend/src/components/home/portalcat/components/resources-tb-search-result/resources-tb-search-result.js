import _ from 'lodash';

const preventDefault = (event) => {
  event.preventDefault();
};

export default {
  props: {
    resource: {
      type: Object,
      required: true,
    },
  },
  created() {
    this.clicks = 0;
  },
  mounted() {
    if (!_.isNil(this.$refs.searchResult)) {
      this.$refs.searchResult.addEventListener('mousedown', preventDefault);
    }
  },
  destroyed() {
    if (!_.isNil(this.$refs.searchResult)) {
      this.$refs.searchResult.removeEventListener('mousedown', preventDefault);
    }
  },
  computed: {
    sourceText() {
      return _.get(this, 'resource.source', '');
    },
    targetText() {
      return _.get(this, 'resource.target', '');
    },
  },
  methods: {
    onClick() {
      this.clicks++;
      if (this.clicks === 1) {
        this.timer = setTimeout(() => {
          this.clicks = 0;
        }, 200);
      } else {
        clearTimeout(this.timer);
        this.clicks = 0;
        this.handleDblClick();
      }
    },
    handleDblClick() {
      this.$emit('resource-apply');
    },
  },
};
