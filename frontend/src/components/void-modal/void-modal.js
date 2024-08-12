import _ from 'lodash';
import moment from 'moment';
import { mapGetters } from 'vuex';
import UtcFlatpickr from '../form/utc-flatpickr.vue';

export default {
  props: {
    details: Object,
    title: { type: String, default: 'Transaction Reversal Date' },
    flatpickrConfig: Object,
  },
  components: {
    UtcFlatpickr,
  },
  data() {
    return {
      memo: '',
      date: null,
      isConfirming: false,
      datepickerOptions: {
        enableTime: true,
        disableMobile: 'true',
        onChange: function (selectedDates, dateStr, instance) {
          instance.close();
        },
      },
    };
  },
  computed: {
    ...mapGetters('features', ['mock']),
    isValid() {
      return this.isValidDate;
    },
    isValidDate() {
      const paymentDate = moment(this.details.Date).format('YYYY-MM-DD');
      const datePickerValue = moment(this.date).format('YYYY-MM-DD');
      return !_.isNil(this.date) && moment(datePickerValue).isSameOrAfter(paymentDate);
    },
    submitBtnTitle() {
      return this.isConfirming ? 'Yes' : 'Submit';
    },
    cancelBtnTitle() {
      return this.isConfirming ? 'No' : 'Cancel';
    },
  },
  methods: {
    show() {
      this.date = null;
      this.memo = '';
      this.isConfirming = false;
      this.$refs.modal.show();
    },
    cancel() {
      if (this.isConfirming) {
        this.isConfirming = false;
        return;
      }
      this.$refs.modal.hide();
    },
    submit() {
      if (!this.isConfirming) {
        this.isConfirming = true;
        return;
      }
      this.confirm();
    },
    confirm() {
      const { date, memo } = this;
      this.$emit('submit', { date, memo });
    },
  },
};
