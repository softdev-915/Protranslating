
import _ from 'lodash';
import Cropper from 'cropperjs';
import { mapActions } from 'vuex';
import 'cropperjs/dist/cropper.min.css';

export default {
  props: {
    loading: {
      type: Boolean,
      default: false,
    },
    customClass: {
      type: String,
    },
    aspectRatio: {
      type: Number,
      default: 6,
    },
  },
  data() {
    return {
      croppedImage: '',
      uploadedImage: '',
    };
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    sendFireUploadEvent(event) {
      event.preventDefault();
      this.$refs.fileUpload.click(event);
    },
    onFileUpload(event) {
      const self = this;
      const files = _.get(event, 'target.files', []);
      if (files.length !== 1) {
        return;
      }
      const file = files.item(0);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = function (e) {
        const image = new Image();
        image.src = e.target.result;
        self.uploadedImage = image.src;
        image.onload = function () {
          const canvas = document.getElementById('canvas');
          if (canvas) {
            canvas.width = image.width;
            canvas.height = image.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0);
            const options = {
              viewMode: 2,
              crop() {
                _.debounce(() => {
                  self.croppedImage = this.cropper.getCroppedCanvas().toDataURL();
                }, 550)();
              },
            };
            if (!_.isNil(this.aspectRatio)) {
              options.aspectRatio = self.aspectRatio;
            }
            self.cropper = new Cropper(canvas, options);
          }
        };
      };
    },
    cropImage() {
      this.croppedImage = this.cropper.getCroppedCanvas().toDataURL();
      this.$emit('on-crop-image', this.croppedImage);
    },
    cancelCrop() {
      this.cropper = null;
      this.uploadedImage = null;
      this.croppedImage = null;
    },
    deleteImage() {
      this.$emit('on-image-delete');
    },
  },
};
