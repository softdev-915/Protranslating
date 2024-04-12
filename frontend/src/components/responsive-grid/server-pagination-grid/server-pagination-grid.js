import { mapActions } from 'vuex';
import { gridMixin } from '../../../mixins/grid';
import IframeDownload from '../../iframe-download/iframe-download.vue';

export default {
  components: {
    IframeDownload,
  },
  mixins: [gridMixin],
  methods: {
    ...mapActions('notifications', ['pushNotification']),
  },
};

