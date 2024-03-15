/* global navigator Blob */
import _ from 'lodash';
import { mapActions } from 'vuex';
import { saveAs } from 'file-saver';
import moment from 'moment';
import UtcFlatpickr from '../../form/utc-flatpickr.vue';
import SimpleBasicSelect from '../../form/simple-basic-select.vue';
import RequestProviderSearchGrid from './request-provider-search-grid.vue';
import FileUpload from '../../../components/file-upload/file-upload.vue';
import PpoService from '../../../services/provider-pooling-offer-service';
import { errorNotification, successNotification } from '../../../utils/notifications';
import { entityEditMixin } from '../../../mixins/entity-edit';
import LocalStorageOffer from '../../../utils/offer/local-storage-offer';
import BrowserStorage from '../../../utils/browser-storage';
import { COMPLETED_AMOUNT, FIELDS_TO_COPY_PASTE, isJsonOfferStringValid, RATE, TOTAL_IN_QUEUE } from '../../../utils/offer/offer-helpers';

const EDITABLE_FIELDS_KEYS = [
  'maxRate',
  'roundsNo',
  'isUrgent',
  'providersPerRoundNo',
  'sortBy',
  'quantity',
  'providerTaskInstructions',
];
const BE_NODE_ENV = new BrowserStorage('lms-flags-storage').findInCache('BE_NODE_ENV');
const DOWNLOAD_FILE_NAME = 'ppo-json-offer.json';
const emptyOffer = () => ({
  request: {
    _id: '',
    no: '',
  },
  abilityId: {
    _id: '',
    name: '',
  },
  languageCombination: {
    ids: [],
    text: '',
  },
  translationUnitId: null,
  breakdownId: null,
  filesAmount: 0,
  referenceAmount: 0,
  maxRate: null,
  roundsNo: 1,
  isUrgent: false,
  providersPerRoundNo: 10,
  sortBy: RATE.value,
  dueDate: null,
  startDate: moment().utc().format(),
  selectedProviders: [],
  quantity: '',
  providerTaskInstructions: '',
  isActive: false,
});
export default {
  components: {
    UtcFlatpickr,
    SimpleBasicSelect,
    RequestProviderSearchGrid,
    FileUpload,
  },
  mixins: [
    entityEditMixin,
  ],
  data() {
    return {
      datepickerOptions: {
        onValueUpdate: null,
        enableTime: true,
        allowInput: false,
        disableMobile: 'true',
        minDate: null,
      },
      service: new PpoService(),
      offer: emptyOffer(),
      revenueAccountsPromise: null,
      isLoading: false,
      initialState: {},
      offerDataFetched: false,
      providerRates: [],
      doesRoundsAmountSetManually: false,
      doesProviderPerRoundSetmanually: false,
      breakdownOptions: [],
      translationUnitOptions: [],
      hasOfferTaskFetched: false,
    };
  },
  created() {
    this.entityName = 'Provider pooling offer';
    this.sortByOptions = [RATE, COMPLETED_AMOUNT, TOTAL_IN_QUEUE];
    this.localStorageOffer = new LocalStorageOffer();
    const { requestId, workflowId, taskId, providerTaskId } = this.$route.query;
    if (this.isNewOffer) {
      this.service.getNewOfferData({ requestId, workflowId, taskId, providerTaskId })
        .then(({ data }) => {
          _.assign(this.offer, emptyOffer(), data);
          this.setEditableFieldsInitialValues();
        })
        .catch(() => this.pushNotification(errorNotification('Failed to pull new offer data')));
    }
  },
  watch: {
    gridQuery(newValue) {
      if (this.hasOfferTaskFetched) {
        return;
      }
      const { requestId, workflowId, taskId } = newValue;
      if (requestId && workflowId && taskId) {
        this.service.getOfferTask(requestId, workflowId, taskId)
          .then(({ data }) => {
            const invoiceDetails = _.get(data, 'invoiceDetails', []);
            const translationUnits = [];
            const breakdowns = [{ _id: null, name: '' }];
            invoiceDetails.forEach(((invoiceDetail) => {
              const unit = _.get(invoiceDetail, 'invoice.translationUnit');
              if (!_.isEmpty(_.get(unit, '_id')) && !_.some(translationUnits, unit)) {
                translationUnits.push(unit);
              }
              const breakdown = _.get(invoiceDetail, 'invoice.breakdown');
              if (!_.isEmpty(_.get(breakdown, '_id')) && !_.some(breakdowns, breakdown)) {
                breakdowns.push(breakdown);
              }
            }));
            this.breakdownOptions = breakdowns;
            this.translationUnitOptions = translationUnits;
          })
          .catch(() => this.pushNotification(errorNotification('Failed to pull the task')))
          .finally(() => {
            this.hasOfferTaskFetched = true;
          });
      }
    },
  },
  computed: {
    gridQuery() {
      return {
        sort: this.offer.sortBy,
        requestId: this.$route.query.requestId,
        workflowId: this.$route.query.workflowId,
        taskId: this.$route.query.taskId,
        offerId: this.offer._id || '',
        translationUnitId: this.offer.translationUnitId,
        breakdownId: this.offer.breakdownId,
        maxRate: this.offer.maxRate,
        selectedProviders: this.offer.selectedProviders,
      };
    },
    isNewOffer() {
      return Boolean(this.$route.query.isNewOffer);
    },
    isValidDueDate() {
      return !_.isNil(this.offer.dueDate);
    },
    isValidStartDate() {
      return !_.isNil(this.offer.startDate);
    },
    shouldHideGrid() {
      if (!this.offerDataFetched) {
        return true;
      }
      return _.isNil(this.$route.query.requestId)
        || _.isNil(this.$route.query.taskId)
        || _.isNil(this.$route.query.workflowId);
    },
    isNumberRoundsNo() {
      return this.offer.roundsNo && _.isInteger(_.toNumber(this.offer.roundsNo));
    },
    isInsideRangeRoundsNo() {
      return _.inRange(this.offer.roundsNo, 1, 4);
    },
    isValidRoundsNo() {
      if (this.isNumberRoundsNo && this.isInsideRangeRoundsNo) {
        return true;
      }
      return false;
    },
    copyableOfferFieldsString() {
      return JSON.stringify(this.copyableOfferFields);
    },
    copyableOfferFields() {
      return _.pick(this.offer, FIELDS_TO_COPY_PASTE);
    },
    isNumberProviderPerRoundNo() {
      return this.offer.providersPerRoundNo &&
        _.isInteger(_.toNumber(this.offer.providersPerRoundNo));
    },
    isInsideRangeProviderPerRoundNo() {
      return _.inRange(this.offer.providersPerRoundNo, 1, 26);
    },
    isValidProviderPerRoundNo() {
      if (this.isNumberProviderPerRoundNo && this.isInsideRangeProviderPerRoundNo) {
        return true;
      }
      return false;
    },
    isValidSortBy() {
      if (this.offer.sortBy) {
        return true;
      }
      return false;
    },
    isOfferActive() {
      return _.get(this, 'offer.isActive', false);
    },
    isSaveButtonDisabled() {
      if (!this.isValidDueDate) {
        return true;
      }
      if (!this.isValidStartDate) {
        return true;
      }
      if (!this.isValidRoundsNo) {
        return true;
      }
      if (!this.isValidProviderPerRoundNo) {
        return true;
      }
      if (!this.isValidSortBy) {
        return true;
      }
      if (this.isOfferActive) {
        return true;
      }
      if (this.isLoading) {
        return true;
      }
      return false;
    },
    isSendButtonDisabled() {
      if (this.isOfferActive) {
        return true;
      }
      if (this.providerRates.length === 0) {
        return true;
      }
      return false;
    },
    isProdEnv() {
      return BE_NODE_ENV === 'PROD';
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    _service() {
      return this.service;
    },
    save() {
      this._save(this._prepareForSave());
    },
    _prepareForSave() {
      const propsToOmit = ['abilityId'];
      const offer = _.cloneDeep(_.omit(this.offer, propsToOmit));
      const selectedProviders = this.providerRates
        .filter(p => this.offer.selectedProviders.includes(p._id));
      Object.assign(offer, {
        abilityId: this.offer.abilityId._id,
        workflowId: this.$route.query.workflowId,
        taskId: this.$route.query.taskId,
        providerTaskId: this.$route.query.providerTaskId,
        selectedProviders,
      });
      return offer;
    },
    isLoadingProviders(event, value) {
      this.isLoading = value;
    },
    _handleCreate(response) {
      const offerId = _.get(response, 'data.providerPoolingOffer._id');
      this.$router.replace({ name: 'request-provider-pooling-offer-edit', params: { entityId: offerId } });
      this.setEditableFieldsInitialValues();
    },
    _handleRetrieve(response) {
      const offer = _.get(response, 'data.providerPoolingOffer');
      if (_.isEmpty(offer)) {
        return this.pushNotification(errorNotification('Failed to fetch offer data'));
      }
      this._setOffer(offer);
      this.$router.replace({ query: {
        ...this.$route.query,
        requestId: this.offer.request._id,
        workflowId: this.offer.workflowId,
        taskId: this.offer.taskId,
      } });
      this.setEditableFieldsInitialValues();
    },
    _handleEditResponse(response) {
      const offer = _.get(response, 'data.providerPoolingOffer');
      this._setOffer(offer);
      this.setEditableFieldsInitialValues();
    },
    _setOffer(offer) {
      Object.assign(this.offer, offer, {
        selectedProviders: offer.selectedProviders.map(item => item._id),
      });
    },
    copyOffer(payload) {
      this.localStorageOffer.save(payload);
    },
    getOfferFromStorage() {
      return this.localStorageOffer.getOffer();
    },
    onOfferCopy() {
      this.copyOffer(this.copyableOfferFields);
      navigator.clipboard.writeText(this.copyableOfferFieldsString);
    },
    onOfferPaste() {
      if (this.isOfferActive) {
        return;
      }
      const clipboard = this.getOfferFromStorage();
      this.offer = _.assign(this.offer, clipboard);
    },
    onClickDownload() {
      try {
        const blob = new Blob([this.copyableOfferFieldsString], { type: 'text/json' });
        saveAs(blob, DOWNLOAD_FILE_NAME);
      } catch (error) {
        this.pushNotification({
          title: 'Error',
          message: `An error occurred during download action. ${error}`,
          state: 'danger',
        });
      }
    },
    async onUpload(file) {
      if (this.isOfferActive) {
        return;
      }
      const content = await file.text();
      this._updateOffer(content);
    },
    async onOfferPasteFromClipboard() {
      if (this.isOfferActive) {
        return;
      }
      const clipboardString = await navigator.clipboard.readText();
      this._updateOffer(clipboardString);
    },
    async _updateOffer(offerString) {
      if (!isJsonOfferStringValid(offerString)) {
        return this.pushNotification(errorNotification('JSON offer is not valid, ensure filling out and copying all criteria'));
      }
      this.offer = _.assign(this.offer, JSON.parse(offerString));
      return this.pushNotification(successNotification('JSON offer is pasted from the clipboard'));
    },
    setEditableFieldsInitialValues() {
      Object.assign(this.initialState, _.pick(this.offer, EDITABLE_FIELDS_KEYS));
      this.offerDataFetched = true;
    },
    resetEditableFieldsToInitialValues() {
      Object.assign(this.offer, _.pick(this.initialState, EDITABLE_FIELDS_KEYS));
    },
    sendOffer() {
      if (_.isEmpty(this.offer._id)) {
        return;
      }
      this.service.send(this.offer._id)
        .then(() => {
          this.pushNotification(successNotification('Offer was sent'));
          this.offer.isActive = true;
        })
        .catch((err) => {
          const message = _.get(err, 'status.message', 'Offer was not sent. Please try again later');
          this.pushNotification(errorNotification(message));
        });
    },
    closeOffer() {
      if (_.isEmpty(this.offer._id)) {
        return;
      }
      this.service.close(this.offer._id)
        .then(() => {
          this.pushNotification(successNotification('Offer was closed'));
          this.offer.isActive = false;
        })
        .catch((err) => {
          const message = _.get(err, 'status.message', 'Offer was not closed. Please try again later');
          this.pushNotification(errorNotification(message));
        });
    },
    onProviderRatesLoaded(providerRates) {
      const fetchedProviderIds = providerRates.map(({ _id }) => _id);
      this.providerRates = this.providerRates
        .filter(p => !fetchedProviderIds.includes(p._id));
      this.providerRates = this.providerRates.concat(providerRates);
    },
  },
};
