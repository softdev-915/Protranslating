import _ from 'lodash';
import moment from 'moment';
import { mapActions } from 'vuex';
import ConnectorService from '../../../services/connector-service';
import UtcFlatpickr from '../../form/utc-flatpickr.vue';
import RichTextEditor from '../../rich-text-editor/rich-text-editor.vue';
import { entityEditMixin } from '../../../mixins/entity-edit';
import roleCheckMixin from '../../../mixins/user-role-check';
import { successNotification, errorNotification, iframeDownloadError } from '../../../utils/notifications';
import IframeDownload from '../../iframe-download/iframe-download.vue';

const service = new ConnectorService();
const buildInitialState = () => ({
  connector: {
    _id: '',
    name: '',
    username: '',
    password: '',
    notes: '',
    syncFromDate: null,
    deleted: false,
    readDate: null,
    hasAuthError: false,
  },
  payloads: [],
  authErrorMessage: 'Authentication error. Check configuration and hit Test Connectivity button.',
});

export default {
  mixins: [roleCheckMixin, entityEditMixin],
  components: {
    UtcFlatpickr,
    RichTextEditor,
    IframeDownload,
  },

  data() {
    return buildInitialState();
  },

  methods: {
    ...mapActions('notifications', ['pushNotification']),
    _service() {
      return service;
    },
    save() {
      this.$validator.validateAll().then((isValid) => {
        if (isValid) {
          this._save(this.connector);
        }
      });
    },
    _handleRetrieve(response) {
      Object.assign(this.connector, response.data.connector);
      this.payloads = response.data.payloads;
      this.$nextTick(() => this.$validator.validateAll());
    },
    _refreshEntity(freshEntity) {
      this.$set(this, 'connector', freshEntity);
    },
    triggerFilesDownload(payloadName, index) {
      let iframeDownload = this.$refs[`iframe_doc_${index}`];
      if (Array.isArray(iframeDownload)) {
        // eslint-disable-next-line prefer-destructuring
        iframeDownload = iframeDownload[0];
      }
      iframeDownload.download(this.getLinkToPayload(payloadName));
    },
    onIframeDownloadError(err) {
      const notification = iframeDownloadError(err);
      this.pushNotification(notification);
    },
    getLinkToPayload(payloadName) {
      const connectorId = _.get(this.connector, '_id', '');
      if (_.isEmpty(connectorId)) {
        return '';
      }
      return this._service().getPayloadDownloadUrl(connectorId, payloadName);
    },
    async testConnectivity() {
      const shouldMockSiAuthFailQuery = _.get(this.$route, 'query.shouldMockSiAuthFail', false);
      const shouldMockSiAuthFail = _.isArray(shouldMockSiAuthFailQuery)
        ? shouldMockSiAuthFailQuery[0] : shouldMockSiAuthFailQuery;
      try {
        const response = await service.testConnectivity({ shouldMockSiAuthFail });
        const message = _.get(response, 'data.message', '');
        this.pushNotification(successNotification(message, 3));
      } catch (e) {
        const message = 'Authorization to the remote endpoint was unsuccessful';
        this.pushNotification(errorNotification(message, null, e));
      } finally {
        const response = await service.get(this.connector._id);
        this._refreshEntity(_.get(response, 'data.connector'));
      }
    },
  },

  computed: {
    entityName() {
      return 'connector';
    },
    canEdit() {
      return this.hasRole('CONNECTOR_UPDATE_ALL');
    },
    isValid() {
      return _.isEmpty(_.get(this, 'errors.items', [])) && this.isValidSyncFromDate;
    },
    isValidSyncFromDate() {
      return moment(_.get(this.connector, 'syncFromDate', null)).isValid();
    },
  },
};
