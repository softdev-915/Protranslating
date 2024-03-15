import _ from 'lodash';
import { mapGetters } from 'vuex';
import Diff from 'text-diff';
import { wrapTagsAndFormatText } from '../../../components/editor-segment/editor-segment-helpers';
import StatusIcon from '../../../components/status-icon/status-icon.vue';

// eslint-disable-next-line no-useless-escape
const HTML_ATTRIBUTES_REGEXP = /(\s+|[^\s]*="[a-zA-Z0-9:;\.\s\(\)\-\,#]*")/gi;
const textWithDiff = (prevText, text) => {
  const diff = new Diff();
  return _.unescape(diff.prettyHtml(diff.main(prevText, text)));
};

export default {
  components: {
    StatusIcon,
  },
  props: {
    segment: {
      type: Object,
      required: true,
    },
    segments: {
      type: Array,
      default: () => ([]),
    },
    segmentIndex: Number,
  },
  data() {
    return {
      isExpanded: false,
    };
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    targetTextDisplayed() {
      const formattedTargetText = wrapTagsAndFormatText(
        this.targetText,
        this.targetInlineTags,
        this.inlineUserTagColor,
        this.formatTag,
      );
      const prevSegment = this.segments[this.segmentIndex - 1];
      if (_.isNil(prevSegment)) {
        return formattedTargetText;
      }
      const formattedPrevTargetText = wrapTagsAndFormatText(
        _.get(prevSegment, 'target.text'),
        _.get(prevSegment, 'target.inlineTags', []),
        this.inlineUserTagColor,
        this.formatTag,
      );
      return textWithDiff(
        formattedPrevTargetText,
        formattedTargetText,
      );
    },
    targetText() {
      return _.get(this, 'segment.target.text', '');
    },
    targetInlineTags() {
      return _.get(this, 'segment.target.inlineTags', []);
    },
    inlineUserTagColor() {
      return _.get(this, 'userLogged.uiSettings.catUiSettings.inlineUserTags.color', 'red');
    },
    createdAt() {
      return _.get(this, 'segment.createdAt');
    },
    createdBy() {
      return _.get(this, 'segment.createdBy');
    },
    status() {
      return _.get(this, 'segment.status');
    },
    type() {
      return _.get(this, 'segment.origin', '');
    },
    isMT() {
      return !_.isEmpty(this.type) && this.type.toLowerCase() === 'mt';
    },
    isHT() {
      return !_.isEmpty(this.type) && this.type.toLowerCase() === 'ht';
    },
  },
  methods: {
    toggleExpanded() {
      this.isExpanded = !this.isExpanded;
    },
    formatTag(tag) {
      return tag.data.replace(HTML_ATTRIBUTES_REGEXP, '');
    },
  },
};
