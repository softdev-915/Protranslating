import _ from 'lodash';
import moment from 'moment-timezone';
import { mapGetters } from 'vuex';

export default {
  computed: {
    ...mapGetters('features', ['mockTimezone']),
    ...mapGetters('app', ['userLogged']),
    timezone() {
      const userTimezone = _.get(this.userLogged, 'timeZone.value');
      return this.mockTimezone ? this.mockTimezone : userTimezone;
    },
    isTimezoneNameValid() {
      const isTzNameValid = moment.tz.zone(this.timezone);
      return !_.isNil(isTzNameValid);
    },
  },
  methods: {
    localDate(date, format = '') {
      if (this.isTimezoneNameValid) {
        return moment(date).tz(this.timezone).format(format);
      }
      let minutesToAdd = 0;
      const daylightSavingTimeDiff = moment().utcOffset() - date.utcOffset();
      if (daylightSavingTimeDiff !== 0) {
        minutesToAdd += daylightSavingTimeDiff;
      }
      return moment(date).add(minutesToAdd, 'minutes').toISOString();
    },
  },
};
