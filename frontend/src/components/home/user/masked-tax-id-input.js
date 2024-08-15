import maskedInputMixin from '../../../mixins/masked-input-mixin';

export default {
  mixins: [maskedInputMixin],
  props: {
    value: {
      type: String,
      required: true,
    },
    taxForm: {
      type: Array,
      required: true,
    },
    className: {
      type: String,
    },
    readOnly: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      collection: 'user',
      path: 'vendorDetails.billingInformation.taxId',
    };
  },
  watch: {
    taxForm(newValue) {
      if (!newValue.length || !newValue.filter(tf => tf.taxIdRequired).length) {
        this.$emit('input', '');
      }
    },
  },
};
