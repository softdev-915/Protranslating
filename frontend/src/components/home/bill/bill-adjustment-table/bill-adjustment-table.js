import { mapGetters } from 'vuex';
import _ from 'lodash';
import userRoleCheckMixin from '../../../../mixins/user-role-check';
import BillAdjustmentService from '../../../../services/bill-adjustment-service';

const billAdjustmentService = new BillAdjustmentService();

export default {
  mixins: [userRoleCheckMixin],
  props: {
    billNo: {
      type: String,
    },
  },
  data() {
    return {
      billAdjustments: [],
    };
  },
  watch: {
    billNo() {
      if (_.isEmpty(_.get(this, 'billNo', ''))) return;
      billAdjustmentService.retrieve({
        filter: {
          referenceBillNo: this.billNo,
        },
      }).then((res) => {
        this.billAdjustments = _.get(res, 'data.list', []);
      });
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    tableColumns() {
      return ['Adjustment No', 'Adjustment Date', 'Type', 'Status', 'Adjustment Balance', 'Adjustment Total'];
    },
  },
};
