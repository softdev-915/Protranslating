import _ from 'lodash';
import userRoleCheckMixin from '../../../mixins/user-role-check';

export default {
  mixins: [userRoleCheckMixin],
  props: {
    projectedCost: {
      type: Object,
    },
  },
  created() {
    this.canRead = this.hasRole({ oneOf: ['TASK-FINANCIAL_READ_ALL', 'PROJECTED-RATE_READ_ALL', 'PROJECTED-RATE_UPDATE_ALL'] });
    this.breakdownName = _.get(this.projectedCost, 'breakdown.name', '');
    this.translationUnitName = _.get(this.projectedCost, 'translationUnit.name', '');
    this.unitPriceText = _.get(this.projectedCost, 'unitPrice', 0).toFixed(4);
    this.totalText = _.get(this.projectedCost, 'total', 0).toFixed(4);
  },
};
