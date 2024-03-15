import { mapActions } from 'vuex';
import IframeDownload from '../../iframe-download/iframe-download.vue';
import BillAdjustmentService from '../../../services/bill-adjustment-service';
import FilesMixin from '../../../mixins/files-mixin';

export default {
  mixins: [FilesMixin],
  components: {
    IframeDownload,
  },
  props: {
    entityId: String,
    companyId: String,
    documents: Array,
    canEdit: Boolean,
    urlResolver: Function,
    visibleColumns: Array,
    isDisabled: Boolean,
  },
  created() {
    this.service = new BillAdjustmentService();
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    getDocumentUrl(document) {
      if (document.url) {
        return document.url;
      }
      return this.urlResolver(this.entityId, document._id, document.name);
    },
  },
};
