import _ from 'lodash';
import { mapGetters } from 'vuex';
import moment from 'moment';
import MtModelService from '../../../services/mt-model-service';
import { entityEditMixin } from '../../../mixins/entity-edit';
import { hasRole } from '../../../utils/user';
import { findModelValidationErrors } from './model-validator';
import CompanySelect from '../company/company-ajax-basic-select.vue';
import IndustrySelect from '../../industry-select/industry-select.vue';
import { toOption } from '../../../utils/select2';
import LanguageSelector from '../../language-select/language-select.vue';
import localDateTime from '../../../utils/filters/local-date-time';

const mtModelService = new MtModelService();

export default {
  mixins: [entityEditMixin],
  components: {
    CompanySelect,
    LanguageSelector,
    IndustrySelect,
  },
  data() {
    return {
      mtModel: {
        _id: '',
        code: '',
        lastTrainedAt: new Date(),
        sourceLanguage: {
          isoCode: '',
          name: '',
        },
        targetLanguage: {
          isoCode: '',
          name: '',
        },
        isGeneral: false,
        industry: '',
        client: {},
        deleted: false,
        isProductionReady: false,
      },
    };
  },
  created() {
    this.datepickerOptions = {
      onValueUpdate: null,
      allowInput: false,
      disableMobile: 'true',
    };
  },
  watch: {
    'mtModel.industry': {
      immediate: true,
      handler(industry) {
        if (!_.isEmpty(industry)) {
          this.mtModel.isGeneral = false;
        }
      },
    },
    'mtModel.client': {
      immediate: true,
      handler(client) {
        if (!_.isEmpty(client)) {
          this.mtModel.isGeneral = false;
        }
      },
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    entityName() {
      return 'mt-model';
    },
    canCreate: function () {
      return hasRole(this.userLogged, 'MT-MODEL_CREATE_ALL');
    },
    canCreateOrEdit: function () {
      return this.canEdit || (this.isNew && this.canCreate);
    },
    canEdit: function () {
      return !this.httpRequesting && hasRole(this.userLogged, 'MT-MODEL_UPDATE_ALL');
    },
    canDelete: function () {
      return hasRole(this.userLogged, 'MT-MODEL_DELETE_ALL');
    },
    cancelText: function () {
      return this.canCreateOrEdit ? 'Cancel' : 'Exit';
    },
    showBreadcrumb: function () {
      return this.navigationBreadcrumb.length > 1;
    },
    isNew() {
      if (this.mtModel && typeof this.mtModel === 'object') {
        return this.mtModel._id === '';
      }
    },
    selectedClient() {
      return toOption(this.mtModel.client, 'hierarchy');
    },
    isValid: function () {
      return this.entityValidationErrors.length === 0;
    },
    entityValidationErrors() {
      return findModelValidationErrors(this.mtModel);
    },
    localDate() {
      const mtModelDate = _.get(this, 'mtModel.lastTrainedAt', new Date());
      return localDateTime(mtModelDate, 'YYYY-MM-DD HH:mm');
    },
    isGeneralSelected() {
      return this.mtModel.isGeneral;
    },
    isGeneralDisabled() {
      return !_.isEmpty(this.mtModel.industry) || !_.isEmpty(this.mtModel.client);
    },
  },
  methods: {
    _service() {
      return mtModelService;
    },
    _handleRetrieve(response) {
      this.mtModel = response.data.mtModel;
    },
    _handleCreate(response) {
      this.mtModel._id = response.data.mtModel._id;
    },
    _handleEditResponse(response) {
      const newReadDate = _.get(response, 'data.currency.readDate');
      if (!_.isNil(newReadDate)) {
        this.mtModel.readDate = newReadDate;
      }
    },
    _refreshEntity(freshEntity) {
      this.$set(this, 'mtModel', freshEntity);
    },
    _prepareForSave() {
      const mtModel = _.pick(
        this.mtModel,
        ['code', 'lastTrainedAt', 'sourceLanguage', 'targetLanguage', 'isGeneral', 'industry', 'client', 'deleted', '_id', 'isProductionReady'],
      );
      return mtModel;
    },
    onClientSelected(client) {
      this.mtModel.client = _.pick(client, ['_id', 'name', 'hierarchy']);
    },
    onDateChange(date) {
      this.mtModel.lastTrainedAt = moment(date).utc();
    },
    save() {
      if (this.isValid) {
        const mtModel = this._prepareForSave();
        this._save(mtModel);
      }
    },
    cancel() {
      this.close();
    },
  },
};
