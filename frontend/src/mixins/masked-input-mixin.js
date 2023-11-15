import _ from 'lodash';
import { mapActions } from 'vuex';
import PIIService from '../services/pii-service';

const MASK_CHARACTER = '*';
const maskPattern = /^\**[a-zA-Z\d$&+,:;=?@#|'<>.^()%!-]{4}$/;
const maskValue = (value) => value.split('')
  .map((v, i) => (value.length - i > 4 ? MASK_CHARACTER : v)).join('');
const service = new PIIService();

export default {
  props: {
    entityId: {
      type: String,
    },
  },
  data() {
    return {
      shouldMask: false,
    };
  },
  computed: {
    isMasked() {
      return maskPattern.test(this.maskedValue);
    },
    isNewEntity() {
      return _.isNil(this.entityId);
    },
    maskedValue() {
      if (this.shouldMask) {
        return maskValue(this.value);
      }
      return this.value;
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    setValue: function (event) {
      this.$emit('input', event.target.value);
    },
    resetMaskedValue() {
      this.shouldMask = true;
    },
    retrievePlainValue() {
      this.shouldMask = false;
      if (this.isMasked && !this.isNewEntity) {
        service.retrievePIIValue(this.collection, this.entityId, this.path).then((res) => {
          this.$emit('input', res.data.value);
        }).catch((err) => {
          const field = this.path.split('.').pop();
          const notification = {
            title: 'Error',
            message: _.get(err, 'status.message', `could not retrieve value for ${field}`),
            state: 'danger',
            response: err,
          };
          this.pushNotification(notification);
        });
      }
    },
  },
};
