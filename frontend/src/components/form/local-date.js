import moment from 'moment';

const now = moment();
const offsetHours = now.diff(now.utc(), 'hours');

export default {
  props: {
    value: [Date, String],
    format: {
      type: String,
      default: undefined,
    },
  },
  computed: {
    localDate() {
      if (this.value) {
        const date = moment(this.value);
        const isValid = date.isValid();
        const { format } = this;
        if (isValid && (!this.clientDate || this.clientDate.utc().diff(date, 'minutes')) !== 0) {
          // only refresh if the date is valid and it is the same
          return date.add(offsetHours, 'hours').format(format);
        } if (!isValid) {
          return '';
        }
      }
    },
  },
};
