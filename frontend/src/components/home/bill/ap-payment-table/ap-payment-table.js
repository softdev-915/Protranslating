import { mapGetters } from 'vuex';
import _ from 'lodash';
import userRoleCheckMixin from '../../../../mixins/user-role-check';
import ApPaymentService from '../../../../services/ap-payment-service';

const apPaymentService = new ApPaymentService();

export default {
  mixins: [userRoleCheckMixin],
  props: {
    billId: {
      type: String,
    },
  },
  data() {
    return {
      apPayments: [],
    };
  },
  watch: {
    billId() {
      if (_.isEmpty(_.get(this, 'billId', ''))) return;
      apPaymentService.retrieve({
        filter: {
          bill: this.billId,
          voidDetails: { isVoided: false },
        },
      }).then((res) => {
        const payments = _.get(res, 'data.list', [])
          .map(({ details = [], paymentDate, vendorName }) => details.map(({ appliedTo, paymentAmount, appliedCredits }) => {
            if (appliedTo !== this.billId) {
              return null;
            }
            return {
              paymentDate, paymentAmount, appliedCredits, vendorName,
            };
          }));
        this.apPayments = _.flatten(payments).filter((payment) => !_.isNull(payment));
      });
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    tableColumns() {
      return ['Payment Date', 'Amount Paid', 'Applied Credits', 'Vendor Name'];
    },
  },
};
