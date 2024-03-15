import _ from 'lodash';
import { mapGetters } from 'vuex';
import SimpleBasicSelect from '../../form/simple-basic-select.vue';
import UserAjaxBasicSelect from '../../form/user-ajax-basic-select.vue';
import CompanyAjaxBasicSelect from '../company/company-ajax-basic-select.vue';
import BillAjaxSelect from '../../bill-select/bill-ajax-select.vue';
import InvoiceAjaxSelect from '../../invoice-ajax-select/invoice-ajax-select.vue';
import BillAdjustmentSelect from '../../bill-adjustment-select/bill-adjustment-ajax-select.vue';
import ArAdjustmentSelect from '../../ar-adjustment-select/ar-adjustment-ajax-select.vue';
import ArAdvanceSelect from '../../ar-advance-select/ar-advance-ajax-select.vue';
import RequestSelector from '../user/request-selector.vue';
import RequestAjaxMultiSelect from '../../request-select/request-ajax-multi-select.vue';
import ApPaymentAjaxSelect from '../../ap-payment-select/ap-payment-ajax-select.vue';
import ArPaymentAjaxSelect from '../../ar-payment-select/ar-payment-ajax-select.vue';

export default {
  components: {
    SimpleBasicSelect,
    UserAjaxBasicSelect,
    CompanyAjaxBasicSelect,
    BillAjaxSelect,
    InvoiceAjaxSelect,
    ArAdjustmentSelect,
    ArAdvanceSelect,
    BillAdjustmentSelect,
    RequestSelector,
    RequestAjaxMultiSelect,
    ApPaymentAjaxSelect,
    ArPaymentAjaxSelect,
  },
  props: {
    showModal: {
      type: Boolean,
      default: false,
    },
    schedulerName: String,
  },
  data() {
    return {
      selectedEntityValue: { value: '', text: '' },
      selectedEntity: '',
    };
  },
  created() {
    this.entities = [
      'User',
      'Company',
      'Bill',
      'Invoice',
      'ArAdjustment',
      'BillAdjustment',
      'ApPayment',
      'ArAdvance',
      'ArPayment',
    ];
    this.filter = { };
    this.userFilter = { terminated: false, deleted: false };
    if (this.schedulerName.match('si-connector')) {
      this.filter = { isSyncedText: 'false' };
      this.userFilter.isSynced = false;
      if (this.mock && this.shouldSyncTerminatedEntity) {
        delete this.userFilter.terminated;
      }
    }
  },
  watch: {
    selectedEntity() {
      this.selectedEntityValue = { text: '', value: '' };
      if (this.schedulerName.match('si-connector')) {
        this.filter = this.selectedEntity === 'Invoice' ? {} : { isSyncedText: 'false' };
      }
    },
    showModal(show) {
      if (!show) {
        this.selectedEntityValue = { text: '', value: '' };
        this.selectedEntity = '';
      }
      return show ? this.openModal() : this.hideModal();
    },
  },
  computed: {
    ...mapGetters('features', ['mock', 'shouldSyncTerminatedEntity']),
    filteredEntities() {
      if (this.schedulerName.match('document-retention-policy')) {
        return ['Company'];
      }
      if (this.schedulerName.match('bill')) {
        return ['User'];
      }
      if (this.schedulerName.match('pdf-to-mt')) {
        return ['AutoTranslateRequest'];
      }
      return this.entities;
    },
    canShowMockedEntityPayload() {
      return this.mock
        && !_.isEmpty(this.selectedEntityValue.text)
        && this.schedulerName.match('si-connector');
    },
    wasEntitySelected() {
      return _.isEmpty(this.selectedEntity);
    },
  },
  methods: {
    openModal() {
      if (this.$refs.modal) {
        this.$emit('on-modal-show');
        this.$refs.modal.show();
      }
    },
    hideModal() {
      if (this.$refs.modal) {
        this.$emit('on-modal-hide');
        this.$refs.modal.hide();
      }
    },
    runNow() {
      this.$emit('on-run-now', this.selectedEntity);
    },
    onOptionSelect(selectedOption) {
      this.selectedEntityValue = selectedOption;
      this.$emit('on-option-select', this.selectedEntity, selectedOption.value);
    },
    populateMockedEntitySIPayload() {
      this.$emit('on-populate-mocked-entity-si-payload', this.selectedEntity);
    },
  },
};
