import Promise from 'bluebird';
import _ from 'lodash';
import { mapActions, mapGetters } from 'vuex';
import TaxFormService from '../../../services/tax-form-service';
import { hasRole } from '../../../utils/user';

const service = new TaxFormService();
const buildInitialState = () => ({
  options: [],
  loading: false,
});

export default {
  props: {
    value: {
      type: Array,
      required: true,
    },
    isDisabled: {
      type: Boolean,
      default: true,
    },
    dataE2EType: {
      type: String,
      required: false,
      default: 'tax-form-multi-select',
    },
    taxFormsAvailable: {
      type: Array,
    },
    placeholder: {
      type: String,
    },
  },
  data() {
    return buildInitialState();
  },
  created() {
    if (this.taxFormsAvailable) {
      this.options = this.taxFormsAvailable;
    } else {
      this._retrieveTaxForms();
    }
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    selected() {
      return this.value.filter((v) => _.has(v, '_id'))
        .map((v) => ({ text: v.name, value: v._id, taxIdRequired: v.taxIdRequired }));
    },
    taxFormOptions() {
      if (Array.isArray(this.options)) {
        return this.options.map((o) => ({
          text: o.name,
          value: o._id,
          taxIdRequired: o.taxIdRequired,
        }));
      }
      return [];
    },
    canRetrieve() {
      return hasRole(this.userLogged, 'VENDOR_CREATE_ALL') || hasRole(this.userLogged, 'VENDOR_UPDATE_ALL');
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onTaxFormSelected(taxForms) {
      this.$emit('input', taxForms.map((tf) => ({ name: tf.text, _id: tf.value, taxIdRequired: tf.taxIdRequired })));
    },
    _retrieveTaxForms() {
      if (this.canRetrieve) {
        this.loading = true;
        return service.retrieve()
          .then((response) => {
            this.options = response.data.list;
            return this.options;
          })
          .catch((err) => {
            const notification = {
              title: 'Error',
              message: 'Tax Forms could not be retrieved',
              state: 'danger',
              response: err,
            };
            this.pushNotification(notification);
          })
          .finally(() => {
            this.loading = false;
          });
      }
      return Promise.resolve([]);
    },
  },
};
