/* global window */
import _ from 'lodash';

export default {
  props: {
    tags: {
      type: Array,
      default: (() => []),
    },
    formatFn: Function,
  },
  data() {
    return {
      activeTag: null,
    };
  },
  created() {
    window.addEventListener('keydown', this.onKeydown);
  },
  destroyed() {
    window.removeEventListener('keydown', this.onKeydown);
  },
  methods: {
    formatTag(tag) {
      if (!_.isNil(this.formatFn)) {
        return this.formatFn(tag);
      }
      return tag;
    },
    onKeydown(event) {
      if (event.keyCode === 38) {
        event.preventDefault();
        if (_.isNil(this.activeTag)) {
          this.activeTag = 0;
        }
        if (this.activeTag === 0) {
          this.activeTag = this.tags.length - 1;
        } else {
          this.activeTag--;
        }
      } else if (event.keyCode === 40) {
        event.preventDefault();
        if (_.isNil(this.activeTag)) {
          this.activeTag = -1;
        }
        if (this.activeTag >= this.tags.length - 1) {
          this.activeTag = 0;
        } else {
          this.activeTag++;
        }
      } else if (event.keyCode === 13) {
        event.preventDefault();
        event.stopPropagation();
        this.emitTagPicked(this.activeTag);
      }
    },
    emitTagPicked(index) {
      const pickedTag = this.tags[index];
      if (_.isNil(pickedTag)) {
        return;
      }
      this.$emit('tag-picked', pickedTag);
    },
  },
};
