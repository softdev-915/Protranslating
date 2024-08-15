import maskedInputMixin from '../../../mixins/masked-input-mixin';

export default {
  mixins: [maskedInputMixin],
  props: {
    value: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      collection: 'lsp',
      path: 'paymentGateway.secret',
    };
  },
};
