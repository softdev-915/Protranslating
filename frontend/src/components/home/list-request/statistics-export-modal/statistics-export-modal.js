/* global document, Blob */

import { mapActions } from 'vuex';
import StatisticsTable from '../statistics-table/statistics-table.vue';
import ReportService from '../../../../services/report-service';

const reportService = new ReportService();

export default {
  components: {
    StatisticsTable,
  },
  props: {
    exportData: {
      type: Array,
      required: true,
    },
    requestNo: {
      type: String,
      required: true,
    },
    tabName: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      isDownloadingPdf: false,
    };
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    open() {
      this.$refs.modal.show();
    },
    close() {
      this.$refs.modal.hide();
    },
    async exportPdf() {
      this.isDownloadingPdf = true;
      try {
        const response = await reportService.generatePdfReport(
          `request-statistics-${this.requestNo}`,
          this.$refs.previewContainer.outerHTML,
        );
        const contentType = response.headers.get('content-type');
        const disposition = response.headers.get('content-disposition');
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        const filename = matches[1].replace(/['"]/g, '');
        const blob = new Blob(
          [response.data],
          { type: contentType },
        );
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        this.close();
        this.$emit('exportSuccess');
      } catch (err) {
        this.pushNotification({
          title: 'Error',
          message: 'Could not export statistics data',
          state: 'danger',
          response: err,
        });
      } finally {
        this.isDownloadingPdf = false;
      }
    },
  },
};
