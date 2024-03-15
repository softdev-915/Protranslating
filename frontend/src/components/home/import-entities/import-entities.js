import { mapActions } from 'vuex';
import lspAwareUrl from '../../../resources/lsp-aware-url';
import FileUpload from '../../file-upload/file-upload.vue';
import IframeDownload from '../../iframe-download/iframe-download.vue';
import ImportEntitiesService from '../../../services/import-entities-service';

const service = new ImportEntitiesService();

export default {
  components: {
    IframeDownload,
    FileUpload,
  },
  computed: {
    exportEntitiesURL() {
      return lspAwareUrl('import-entity/export');
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    importFile(file) {
      const formData = new FormData();
      formData.append('file', file, file.name);
      service.import(formData)
        .then(() => this.pushNotification({
          title: 'Success', message: 'All entities imported successfully', state: 'success',
        }))
        .catch((error) => this.pushNotification({
          title: 'Error', message: 'Some entities weren\'t imported', state: 'danger', response: error, isShowStack: true,
        }));
    },
    exportEntities() {
      this.pushNotification({
        title: 'Info',
        message: 'Exporting XLSX template has started',
        state: 'info',
      });
      this.$refs.exportEntitiesIframe.download();
    },
  },
};
