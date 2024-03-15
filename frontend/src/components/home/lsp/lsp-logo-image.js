import { mapActions, mapGetters } from 'vuex';
import _ from 'lodash';
import ImageCropper from '../../image-cropper/image-cropper.vue';
import { successNotification } from '../../../utils/notifications';

export default {
  props: {
    loading: {
      type: Boolean,
      default: false,
    },
    canEdit: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    ImageCropper,
  },
  computed: {
    ...mapGetters('app', ['lsp']),
    ...mapGetters('features', ['mock']),
    cropWindowVisible() {
      return _.get(this.imageProspect, '_id');
    },
    lspLogo() {
      return _.get(this.lsp, 'logoImage.base64Image');
    },
    hasLogo() {
      return this.lspLogo && typeof this.lspLogo === 'string';
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    ...mapActions('app', ['setLsp']),
    onCropImage(base64Image) {
      Object.assign(this.lsp, {
        logoImage: {
          base64Image,
        },
      });
      this.$emit('lsp-logo-save');
    },
    onDeleteImage() {
      Object.assign(this.lsp, { logoImage: { base64Image: '' } });
      if (!this.mock) {
        this.$emit('lsp-logo-delete');
      }
      this.pushNotification(successNotification('Logo was deleted.'));
    },
  },
};
