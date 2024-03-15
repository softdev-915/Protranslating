import _ from 'lodash';
import { mapActions } from 'vuex';
import SimpleBasicSelect from '../../form/simple-basic-select.vue';
import PaymentGatewayService from '../../../services/payment-gateway-service';
import { selectMixin } from '../../../mixins/select-mixin';

export default {
  name: 'PaymentGatewaySelect',
  mixins: [selectMixin],
  components: {
    SimpleBasicSelect,
  },
  props: {
    fetchOnCreated: {
      type: Boolean,
      default: false,
    },
    value: {
      type: String,
      required: true,
    },
  },
  data: () => ({
    formatOption: ({ name }) => ({ text: name, value: name }),
    options: [],
    isLoading: false,
  }),
  computed: {
    selectedGateway: {
      get() {
        if (_.isEmpty(this.options) && !_.isEmpty(this.value)) {
          this.options.push({ name: this.value });
        }
        return this.value;
      },
      set(value) {
        this.$emit('input', value);
      },
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    _retrieve() {
      this.isLoading = true;
      new PaymentGatewayService().retrieve()
        .then((res) => (this.options = res.data))
        .catch((e) => this.pushNotification({
          title: 'Error',
          message: 'GL Accounts could not be retrieved',
          state: 'danger',
          response: e,
        }))
        .finally(() => (this.isLoading = false));
    },
  },
};
