import _ from 'lodash';
import { mapGetters } from 'vuex';
import FooterTemplateService from '../../../services/footer-template-service';
import ReportService from '../../../services/report-service';
import { downloadPdf, setPageStyles } from '../../../utils/pdf';
import userRoleCheckMixin from '../../../mixins/user-role-check';

const footerTemplateService = new FooterTemplateService();
const reportService = new ReportService();

export default {
  computed: {
    ...mapGetters('app', ['lspAddressFooter']),
  },
  mixins: [
    userRoleCheckMixin,
  ],
  methods: {
    async generatePdfReport(data, pdfName, template) {
      let footerTemplate = null;
      if (this.hasRole('FOOTER-TEMPLATE_READ_ALL')) {
        const res = await footerTemplateService.get(data);
        footerTemplate = _.get(res, 'data.footerTemplate.description', '');
      }
      const footerContent = footerTemplate || this.lspAddressFooter || '';
      setPageStyles(footerContent, { right: 0 });
      const response = await reportService.generatePdfReport(
        pdfName,
        template,
      );
      downloadPdf(response, pdfName);
    },
  },
};
