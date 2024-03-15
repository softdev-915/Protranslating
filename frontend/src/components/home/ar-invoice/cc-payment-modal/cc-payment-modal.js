import _ from 'lodash';
import CcPaymentService from '../../../../services/cc-payment-service';
import SimpleBasicSelect from '../../../form/simple-basic-select.vue';
import CountryService from '../../../../services/country-service';
import StateService from '../../../../services/state-service';
import NotificationMixin from '../../../../mixins/notification-mixin';
import userRoleCheckMixin from '../../../../mixins/user-role-check';

const CARD_TYPES = [
  {
    name: 'VISA',
    regex: new RegExp('^4'),
  },
  {
    name: 'AMEX',
    regex: new RegExp('^(34|37)'),
  },
  {
    name: 'MASTERCARD',
    regex: new RegExp('^5[1-5]'),
  },
  {
    name: 'DISCOVER',
    regex: new RegExp('^6011'),
  },
  {
    name: 'TROY',
    regex: new RegExp('^9792'),
  },
];
const NOT_PAID_STATUSES = ['FAILED', 'NOT FOUND'];
export default {
  name: 'CCPaymentModal',
  mixins: [NotificationMixin, userRoleCheckMixin],
  components: {
    SimpleBasicSelect,
  },
  props: {
    entityNo: {
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
    },
    entityStatus: {
      type: String,
    },
    entityContactId: String,
    entityCompanyHierarchy: String,
    enableNewButton: {
      type: Boolean,
      default: false,
    },
    isSynced: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      payment: {
        amount: this.amount,
        currency: this.currency,
        entityNo: this.entityNo,
        billTo: {
          email: '',
          firstName: '',
          lastName: '',
          country: '',
          state: '',
          city: '',
          address1: '',
          address2: '',
          zipCode: '',
        },
        card: {
          no: '',
          month: '',
          year: '',
          type: '',
        },
      },
      cardMask: '#### #### #### ####',
      amexCardMask: '#### ###### #####',
      dateMask: '##',
      isLoading: false,
      error: null,
      areCountriesLoading: false,
      areStatesLoading: false,
      countries: [],
      states: [],
      disabled: true,
      service: new CcPaymentService(),
      countryService: new CountryService(),
      stateService: new StateService(),
      countriesFormatter: ({ name, code }) => ({ text: name, value: code }),
      statesFormatter: ({ name, code }) => ({ text: name, value: code }),
    };
  },
  watch: {
    entityNo: {
      handler(value) {
        if (this.isEntityPaid || !value) {
          return;
        }
        this.service.getPaymentStatus(value, this.$route.query)
          .then((res) => {
            if (NOT_PAID_STATUSES.includes(_.get(res, 'data.status'))) {
              this.disabled = false;
            }
          })
          .catch((e) => this.pushError(_.get(e, 'status.message', 'Failed to get payment status')));
      },
      immediate: true,
    },
  },
  computed: {
    isEntityPaid() {
      return this.entityStatus === 'Paid';
    },
    doesOwnInvoice() {
      const companyOwnInvoice = this.hasRole('INVOICE_READ_COMPANY')
        && this.userBelongsToCompanyHierarchy(this.entityCompanyHierarchy);
      const userOwnInvoice = this.hasRole('INVOICE_READ_OWN')
        && this.userLogged._id === this.entityContactId;
      return companyOwnInvoice || userOwnInvoice;
    },
    canMakePayment() {
      const hasPermissions = this.doesOwnInvoice || this.hasRole('CC-PAYMENT_READ_ALL');
      return hasPermissions && this.currency === 'USD' && !this.disabled && this.isSynced;
    },
    currentCardMask() {
      return this.payment.card.type === 'AMEX' ? this.amexCardMask : this.cardMask;
    },
    cardType() {
      const type = CARD_TYPES.find((c) => c.regex.test(this.payment.card.no));
      this.payment.card.type = _.get(type, 'name', '');
      return this.payment.card.type;
    },
    isFormValid() {
      return !_.isEmpty(this.payment.card.no)
       && !_.isEmpty(this.payment.card.month)
       && !_.isEmpty(this.payment.card.year)
       && !_.isEmpty(this.payment.card.type)
       && !_.isEmpty(this.payment.billTo.firstName)
       && !_.isEmpty(this.payment.billTo.lastName)
       && !_.isEmpty(this.payment.billTo.address1)
       && !_.isEmpty(this.payment.billTo.country)
       && !_.isEmpty(this.payment.billTo.city)
       && !_.isEmpty(this.payment.billTo.state)
       && !_.isEmpty(this.payment.billTo.zipCode)
       && this.payment.amount > 0;
    },
  },
  methods: {
    show() {
      const { firstName, lastName, billingDetails } = this.userLogged;
      if (_.isEmpty(this.countries)) {
        this._retrieveCountries();
      } else {
        this._setCountry();
      }
      _.assign(this.payment.billTo, billingDetails, { firstName, lastName });
      this.$refs.modal.show();
    },
    hide() {
      this.$refs.modal.hide();
    },
    submit() {
      this.isLoading = true;
      this.service.create({ paymentData: this.payment, mockingFlags: this.$route.query })
        .then(() => this.pushSuccess('Payment Accepted'))
        .catch((e) => this.pushError(`Payment Declined: ${_.get(e, 'status.message', e)}`))
        .finally(() => {
          this.disabled = true;
          this.isLoading = false;
          this.hide();
        });
    },
    retrieveStates() {
      const selectedCountry = this.countries.find((c) => c.code === this.payment.billTo.country);
      if (_.isNil(selectedCountry)) {
        return;
      }
      this.areStatesLoading = true;
      this.stateService.retrieve({ country: selectedCountry._id })
        .then((res) => {
          this.states = _.get(res, 'data.list', []);
          this.payment.billTo.state = _.get(this.userLogged, 'billingDetails.state');
        })
        .catch((e) => this.pushError('States could not be retrieved', e))
        .finally(() => (this.areStatesLoading = false));
    },
    _retrieveCountries() {
      this.areCountriesLoading = true;
      this.countryService.retrieve()
        .then((res) => {
          this.countries = _.get(res, 'data.list', []);
          this._setCountry();
        })
        .catch((e) => this.pushError('Countries could not be retrieved', e))
        .finally(() => (this.areCountriesLoading = false));
    },
    _setCountry() {
      this.payment.billTo.country = _.get(this.userLogged, 'billingDetails.country');
      this.retrieveStates();
    },
  },
};
