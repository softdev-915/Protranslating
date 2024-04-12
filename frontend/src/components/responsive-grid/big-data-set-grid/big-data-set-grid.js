import _ from 'lodash';
import { mapActions } from 'vuex';
import { gridMixin } from '../../../mixins/grid';
import IframeDownload from '../../iframe-download/iframe-download.vue';
import ConfirmDialog from '../../form/confirm-dialog.vue';

const GRID_ROWS_DISPLAY_LIMIT = 500;

export default {
  components: {
    IframeDownload,
    ConfirmDialog,
  },
  props: {
    hasImportLink: {
      type: Boolean,
      default: true,
    },
    forceWarningMessageOnExport: Boolean,
  },
  mixins: [gridMixin],
  data() {
    return {
      wasCsvImported: false,
    };
  },
  watch: {
    query: function (newQuery) {
      newQuery.count = true;
      newQuery.page = 1;
      newQuery.limit = 10;
      this.currentQuery = newQuery;
    },
    currentQuery: function (newQuery) {
      this.currentQuery.page = 1;
      this.currentQuery.limit = 10;
      this.fetchData(newQuery);
    },
  },
  computed: {
    warningMessage() {
      return 'This will display all entries in the grid. This could freeze your browser for several seconds. Are you sure you want to continue?';
    },
    totalRecords() {
      return this.listData.totalRecords;
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onGridDataImport() {
      this.$refs.importedFile.click();
    },
    onGridRowToggle(item) {
      this.$emit('grid-row-toggle', item);
    },
    onFileUpload(event) {
      const files = _.get(event, 'target.files', []);
      if (_.isEmpty(files)) {
        return;
      }
      const f = files.item(0);
      const formData = new FormData();
      formData.append(event.target.name, f, f.name);
      this.loading = true;
      this.wasCsvImported = false;
      this.service.uploadCsv(formData, this.gridName)
        .then((response) => {
          this.wasCsvImported = true;
          const entries = _.get(response, 'data.entries');
          const total = _.get(response, 'data.total');
          if (!_.isNil(entries)) {
            Object.assign(this.listData, {
              list: entries,
              total: entries.length,
            });
            this.$emit('grid-data-loaded', this.listData);
          }
          this.onGridDataImported(entries, total);
        })
        .catch((err) => {
          this.uploading = false;
          const notification = {
            title: 'Error',
            message: _.get(err, 'status.message', 'Failed to upload csv'),
            state: 'danger',
          };
          this.pushNotification(notification);
        })
        .finally(() => {
          this.loading = false;
          this.$refs.importedFileForm.reset();
        });
    },
    onGridShowAllRecords() {
      if (this.totalRecords > GRID_ROWS_DISPLAY_LIMIT || this.forceWarningMessageOnExport) {
        this.$refs.confirmDialog.show();
      } else {
        this.onDialogConfirm({ confirm: true });
      }
    },
    onDialogConfirm(response) {
      if (response.confirm) {
        this.currentQuery.page = 1;
        this.currentQuery.limit = 1e10;
        this.fetchData(this.currentQuery);
      }
    },
    onGridDataImported(entries, total) {
      let message = 'Entries were imported correctly';
      if (!_.isNil(entries) && !_.isNil(total) && entries.length < total) {
        message = `${total} entries were imported correctly. ${entries.length} entries are displayed`;
      }
      const notification = {
        title: 'Success',
        message,
        state: 'success',
      };
      this.pushNotification(notification);
      this.$emit('grid-data-imported', entries);
    },
    handleGridShowAllRecords(event) {
      this.wasCsvImported = false;
      this.onGridShowAllRecords(event);
    },
    handleGridQueryReset(event) {
      this.wasCsvImported = false;
      this.onGridQueryReset(event);
    },
  },
};

