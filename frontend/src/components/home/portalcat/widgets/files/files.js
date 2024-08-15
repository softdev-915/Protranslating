import _ from 'lodash';
import Widget from '../widget.vue';
import PortalCatStoreMixin from '../../mixins/pc-store-mixin';
import WidgetMixin from '../widget-mixin';

const PL_STATUS_INPROGRESS = 'running';

export default {
  mixins: [
    PortalCatStoreMixin,
    WidgetMixin,
  ],
  components: {
    Widget,
  },
  computed: {
    isInProgress() {
      return this.pipelineStatus === PL_STATUS_INPROGRESS;
    },
  },
  methods: {
    changeActiveDocument(documentId) {
      if (!this.isLoading && !this.isPipelineInProgress && !this.isInProgress) {
        this.setActiveDocument(documentId);
        this.$emit('config-change', { activeDocument: documentId });
      }
    },
    getDocumentName(documentId) {
      return _.get(this.documentById(documentId), 'name', '');
    },
  },
};
