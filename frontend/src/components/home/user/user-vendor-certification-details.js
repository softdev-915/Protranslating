import _ from 'lodash';
import moment from 'moment';
import { mapGetters, mapActions } from 'vuex';
import CertificationService from '../../../services/certification-service';
import { hasRole } from '../../../utils/user';
import UtcFlatpickr from '../../form/utc-flatpickr.vue';
import CertificationSelector from './certification/certification-selector.vue';

const service = new CertificationService();
const buildInitialState = () => ({
  certifications: [],
  selectedCertifications: [],
  certification: {
    _id: null,
    name: '',
    expirationDate: null,
  },
  expirationDate: null,
});

export default {
  components: {
    UtcFlatpickr,
    CertificationSelector,
  },

  props: {
    value: Array,
    readOnly: { type: Boolean, default: true },
  },

  created() {
    this._retrieveCertifications();
  },

  data() {
    return buildInitialState();
  },

  watch: {
    value: {
      handler(newVal) {
        this.selectedCertifications = _.isNil(newVal)
          ? buildInitialState().selectedCertifications
          : newVal;
      },
      immediate: true,
    },
    certification(newVal) {
      if (newVal._id) {
        newVal.expirationDate = this.expirationDate;
      } else {
        this.expirationDate = null;
        if (this.$refs.expirationDateFlatpikr) {
          this.$refs.expirationDateFlatpikr.clientDateStr = '';
        }
      }
    },
    selectedCertifications(newVal) {
      this.$emit('input', newVal);
    },
  },

  methods: {
    ...mapActions('notifications', ['pushNotification']),

    onExpirationDateChange(selectedDates) {
      const date = _.get(selectedDates, '[0]', null);
      this.certification.expirationDate = date;
    },

    addCertification() {
      if (_.get(this, 'certification._id', false)) {
        this.selectedCertifications.push(this.certification);
        this.certification = buildInitialState().certification;
      }
    },

    deleteCertification(idx) {
      this.selectedCertifications = this.selectedCertifications.filter((c, i) => i !== idx);
    },

    _retrieveCertifications() {
      return new Promise((resolve, reject) => {
        if (!this.canRetrieveCertifications) {
          reject();
        }
        resolve();
      })
        .then(() => {
          this.loading = true;
          return service.retrieve();
        })
        .then((response) => {
          this.certifications = response.data.list;
        })
        .catch((err) => {
          const notification = {
            title: 'Error',
            message: 'Certifications could not be retrieved',
            state: 'danger',
            response: err,
          };
          this.pushNotification(notification);
        })
        .finally(() => {
          this.loading = false;
        });
    },
  },

  computed: {
    ...mapGetters('app', ['userLogged']),

    localExpirationDates() {
      return this.selectedCertifications
        .map((c) => {
          if (c.expirationDate) {
            return moment(c.expirationDate).format('MM-DD-YYYY');
          }
          return 'N/A';
        });
    },

    canRetrieveCertifications() {
      return hasRole(this.userLogged, 'USER_READ_ALL');
    },

    certificationsAvailable() {
      const filtered = _.differenceWith(this.certifications,
        this.selectedCertifications, (o1, o2) => o1._id === o2._id);
      return filtered;
    },
  },
};
