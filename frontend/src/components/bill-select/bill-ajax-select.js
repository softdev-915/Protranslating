import _ from 'lodash';
import { AjaxBasicSelect } from '../search-select';
import BillService from '../../services/bill-service';
import ServiceRequestLocker from '../../services/service-request-locker';
import notificationMixin from '../../mixins/notification-mixin';

const service = new ServiceRequestLocker(new BillService());

export default {
  mixins: [notificationMixin],
  components: {
    AjaxBasicSelect,
  },
  props: {
    value: Object,
    filter: {
      type: Object,
      default: {},
    },
    isDisabled: {
      type: Boolean,
      default: false,
    },
    fetchOnCreated: {
      type: Boolean,
      default: true,
    },
    placeholder: String,
    searchTerm: String,
    limit: {
      type: Number,
      default: 10,
    },
  },
  data() {
    return {
      loading: false,
      selectedBill: {},
    };
  },
  watch: {
    filter(newVal, oldVal) {
      if (this.$refs.abs && this.$refs.abs.resetData && !_.isEqual(newVal, oldVal)) {
        // if the ajax basic select exist and the filter changes
        // reset the initial data to force the component
        // reset the first 10 values upon filter changes.
        this.$refs.abs.resetData();
      }
    },
    value() {
      this.selectedBill = _.isNil(this.value) ? {} : this.value;
    },
  },
  created() {
    this.filterField = 'no';
  },
  methods: {
    httpClient(term, page) {
      term = _.isEmpty(this.searchTerm) ? term : this.searchTerm;
      return this._requestBills(term, page);
    },

    formatOption(bill) {
      const { _id, no } = bill;
      bill = _.pick(bill, [
        '_id', 'no', 'vendor', 'vendorId', 'vendorName', 'amountPaid', 'totalAmount', 'serviceDetails',
      ]);
      return { ...bill, value: _id, text: no };
    },

    async _requestBills(term, page = 0) {
      let bills = [];
      const filter = { ...this.filter, no: term };
      const params = { limit: this.limit, page, filter };
      try {
        this.loading = true;
        const response = await service.retrieve(params);
        this.loading = false;
        bills = _.get(response, 'data.list', []).map(this.formatOption);
        const selectedBillNo = _.get(this.value, 'no');
        this.selectedBill = bills.find(bill => bill.no === selectedBillNo) || {};
      } catch (e) {
        this.pushError(e.message, e);
      } finally {
        this.loading = false;
      }
      return bills;
    },

    onBillSelect(value) {
      this.$emit('input', value);
    },
  },
};
