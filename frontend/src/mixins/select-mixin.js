import _ from 'lodash';

export const selectMixin = {
  props: {
    returnFullOption: {
      type: Boolean,
      default: false,
    },
    mandatory: {
      type: Boolean,
      default: false,
    },
    nonRemovableValues: {
      type: Set,
      default: () => new Set(),
    },
  },
  data() {
    return {
      optionsRetrieved: this.fetchOnCreated,
    };
  },
  computed: {
    containerClass() {
      if (this.$attrs.mandatory || this.mandatory) {
        if (_.isEmpty(_.get(this, 'selectedOption.value', ''))) {
          return 'has-danger';
        }
        return '';
      }
    },
  },
  created() {
    if (this.fetchOnCreated) {
      this._retrieve();
    }
  },
  methods: {
    retrieveOptions() {
      if (!this.optionsRetrieved) {
        this.optionsRetrieved = true;
        if (typeof this._retrieve !== 'function') {
          throw new Error('Component must implement _retrieve function');
        }
        this._retrieve();
      }
    },
  },
};
