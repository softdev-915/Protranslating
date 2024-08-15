import _ from 'lodash';
import Promise from 'bluebird';
import { mapActions } from 'vuex';
import RequestService from '../../../../../services/request-service';
import IpButton from '../../components/ip-button.vue/ip-button.vue';
import IpInput from '../../components/ip-input.vue';
import IpModal from '../../components/ip-modal.vue';
import IpFileUpload from '../../components/ip-file-upload/ip-file-upload.vue';

const TEXT_SAVING = 'Saving...';
const TEXT_SUBMIT_ORDER = 'Submit and see your order';
const requestService = new RequestService();
export default {
  components: {
    IpButton,
    IpInput,
    IpFileUpload,
    IpModal,
  },
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    request: {
      type: Object,
    },
    canEditQuote: {
      type: Boolean,
      default: true,
    },
    trackSubmit: {
      type: Function,
      default: () => {},
    },
  },
  data() {
    return {
      loading: false,
      isOpened: false,
      files: [],
      instructionsAndComments: '',
    };
  },
  watch: {
    value() {
      this.isOpened = this.value;
    },
    isOpened() {
      this.$emit('input', this.isOpened);
    },
  },
  computed: {
    approveButtonText() {
      return this.loading ? TEXT_SAVING : TEXT_SUBMIT_ORDER;
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    saveAndSeeQuote() {
      this.loading = true;
      const commentsEmpty = _.isEmpty(this.instructionsAndComments);
      this.trackSubmit();
      const requestUpdated = _.assign(requestService.getRequestUpdateRequiredFields(this.request), {
        comments: commentsEmpty ? 'No Comments' : this.instructionsAndComments,
        isQuoteApproved: true,
      });
      requestService.edit(requestUpdated)
        .then(() => {
          const requestData = {
            requestId: requestUpdated._id,
            languageCombinationId: _.get(requestUpdated, 'languageCombinations[0]._id', null),
          };
          const filesToUpload = this.files.map((file) => {
            const formData = new FormData();
            formData.append('files', file);
            return formData;
          });
          return Promise.map(
            filesToUpload,
            (file) => requestService.uploadRequestDocument(file, requestData),
            { concurrency: 3 },
          ).then(async () => {
            this.$router.push({
              name: 'request-quote-detail',
              params: { requestId: this.request._id },
            });
            this.loading = false;
            this.isOpened = false;
          });
        })
        .catch((err) => {
          this.pushNotification({
            title: 'Error',
            message: "Couldn't save a quote",
            state: 'danger',
            response: err,
          });
          this.loading = false;
        });
    },
    onFilesUpload(files) {
      this.files = files;
    },
  },
};
