import _ from 'lodash';
import { mapActions, mapGetters } from 'vuex';
import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import SimpleBasicSelect from '../../form/simple-basic-select.vue';
import CheckService from '../../../services/check-service';
import CheckMemoEdit from './check-memo-edit.vue';
import { errorNotification } from '../../../utils/notifications';
import ConfirmDialog from '../../form/confirm-dialog.vue';
import BankAccountService from '../../../services/bank-account-service';

const CHECK_STATUS_PRINTED = 'Printed';

export default {
  components: {
    SimpleBasicSelect,
    ServerPaginationGrid,
    ConfirmDialog,
  },
  data() {
    return {
      isLoading: false,
      checksList: [],
      bankAccounts: [],
      checkDetails: {
        account: '',
        nextCheckNo: '',
        selectedChecksIdsArray: [],
      },
    };
  },
  created() {
    this.checkService = new CheckService();
    this.selectedChecksIds = new Set();
    this.gridComponents = { CheckMemoEdit };
    this.bankAccounts = new BankAccountService().retrieve();
  },
  computed: {
    ...mapGetters('features', ['mock']),
    isValidBankAccount() {
      return !_.isEmpty(this.checkDetails.account);
    },
    isValidNextCheckNo() {
      return !_.isEmpty(this.checkDetails.nextCheckNo);
    },
    isValidChecksIds() {
      return !_.isEmpty(this.checkDetails.selectedChecksIdsArray);
    },
    checkGridQuery() {
      const filter = {};
      if (this.isValidBankAccount) {
        filter.bankAccount = this.checkDetails.account;
      }
      return { filter: JSON.stringify(filter) };
    },
    isValid() {
      return this.isValidBankAccount
        && this.isValidNextCheckNo
        && this.isValidChecksIds;
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onRowSelected(_id, selected) {
      if (selected) {
        this.selectedChecksIds.add(_id);
      } else {
        this.selectedChecksIds.delete(_id);
      }
      this.checkDetails.selectedChecksIdsArray = Array.from(this.selectedChecksIds.values());
    },
    onChecksLoaded({ list = [], nextCheckNo }) {
      this.checksList = list;
      this.selectedChecksIds.clear();
      this.checkDetails.selectedChecksIdsArray = [];
      this.checkDetails.nextCheckNo = nextCheckNo;
    },
    onAllRowsSelected(selected) {
      this.checksList.forEach(({ _id }) => {
        if (selected) {
          this.selectedChecksIds.add(_id);
        } else {
          this.selectedChecksIds.delete(_id);
        }
      });
      this.checkDetails.selectedChecksIdsArray = Array.from(this.selectedChecksIds.values());
    },
    onPrintClick() {
      const hasPrinted = this.checkDetails.selectedChecksIdsArray.some((checkId) => {
        const check = this.checksList.find((ch) => ch._id === checkId);
        return check.status === CHECK_STATUS_PRINTED;
      });
      if (hasPrinted) {
        this.$refs.confirmDialog.show();
      } else {
        this.print();
      }
    },
    async print({ confirm = true } = {}) {
      if (!confirm) {
        return;
      }
      try {
        this.isLoading = true;
        const { data } = await this.checkService.printChecks(this.checkDetails);
        this.$refs.checkGrid.fetchData(this.checkGridQuery);
        if (!this.mock) {
          const downloadUrl = URL.createObjectURL(data);
          this.$refs.downloadLink.href = downloadUrl;
          this.$refs.downloadLink.click();
          this.$refs.downloadLink.href = '#';
          URL.revokeObjectURL(downloadUrl);
        }
      } catch (err) {
        const message = _.get(err, 'body.status.message', '');
        this.pushNotification(errorNotification(message));
      }
      this.isLoading = false;
    },
  },
};
