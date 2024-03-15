import isEmpty from 'lodash/isEmpty';

export default {
  props: {
    isCollapsed: {
      type: Boolean,
      default: false,
    },
    workflowIndex: {
      type: Number,
      required: true,
    },
    srcLang: {
      type: String,
      required: true,
    },
    tgtLang: {
      type: String,
      required: true,
    },
  },
  computed: {
    workflowTitle() {
      if (isEmpty(this.srcLang) || isEmpty(this.tgtLang)) {
        return '';
      }
      return `: ${this.srcLang} to ${this.tgtLang}`;
    },
    toggleIconClass() {
      return this.isCollapsed ? 'fa-expand' : 'fa-compress';
    },
  },
  methods: {
    toggleCollapse() {
      this.$emit('on-toggle-collapsed', this.isCollapsed);
    },
  },
};
