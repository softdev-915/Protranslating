
import { mapActions } from 'vuex';

const COMMON_ZOOM_LEVEL = 100;
const RETINA_ZOOM_LEVEL = 200;

export default {
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    isBrowserZoomSetTo100() {
      const browserZoomLevel = Math.round(window.devicePixelRatio * 100);
      if ([COMMON_ZOOM_LEVEL, RETINA_ZOOM_LEVEL].includes(browserZoomLevel)) {
        return true;
      }
      this.pushNotification({
        title: 'Warning!',
        message: 'Please set your browser to 100% zoom. Higher zoom settings may affect printing the PDF output of your document',
        state: 'danger',
      });
      return false;
    },
  },
};
