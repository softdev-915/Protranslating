import _ from 'lodash';
import { mapGetters } from 'vuex';
import { BasicSelect } from '../../search-select';
import MtEnginesService from '../../../services/mt-engine-service';
import MtProviderService from '../../../services/mt-provider-service';
import { entityEditMixin } from '../../../mixins/entity-edit';
import { hasRole } from '../../../utils/user';

const mtEnginesService = new MtEnginesService();
const mtProviderService = new MtProviderService();
const buildInitialState = () => ({
  mtEngine: {
    _id: '',
    mtProvider: '',
    apiKey: '',
    deleted: false,
    readDate: null,
    isEditable: true,
  },
  mtProviders: [],
});

export default {
  mixins: [entityEditMixin],
  components: {
    BasicSelect,
  },
  data() {
    return buildInitialState();
  },
  created() {
    this.retrieveMtProviders();
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    entityName() {
      return 'mtEngine';
    },
    canCreate() {
      return hasRole(this.userLogged, 'MT-ENGINES_CREATE_ALL');
    },
    canEdit() {
      return this.mtEngine.isEditable && hasRole(this.userLogged, 'MT-ENGINES_UPDATE_ALL');
    },
    canCreateOrEdit() {
      return this.isNew ? this.canCreate : this.canEdit;
    },
    showBreadcrumb() {
      return _.get(this, 'navigationBreadcrumb.length', 0) > 1;
    },
    isNew() {
      return _.isEmpty(_.get(this, 'mtEngine._id', ''));
    },
    isValid() {
      return this.isValidMtProvider && this.isValidApiKey;
    },
    isValidMtProvider() {
      return !_.isEmpty(this.mtEngine.mtProvider);
    },
    isValidApiKey() {
      return !_.isEmpty(_.get(this, 'mtEngine.apiKey', ''));
    },
    mtProviderSelected() {
      const { mtProvider } = this.mtEngine;
      return { value: mtProvider, text: mtProvider };
    },
  },
  methods: {
    async retrieveMtProviders() {
      const response = await mtProviderService.retrieve();
      const providers = _.get(response, 'data.list', []);
      this.mtProviders = providers.map(({ name }) => ({ value: name, text: name }));
    },
    onMtProviderSelect({ value }) {
      this.mtEngine.mtProvider = value;
    },
    _service() {
      return mtEnginesService;
    },
    _handleRetrieve(response) {
      const mtEngine = _.get(response, 'data.mtEngine', {});
      if (!_.isEmpty(mtEngine)) {
        Object.assign(this.mtEngine, mtEngine);
      }
    },
    _handleCreate(response) {
      const mtEngineId = _.get(response, 'data.mtEngine._id');
      if (!_.isNil(mtEngineId)) {
        this.mtEngine._id = mtEngineId;
      }
    },
    _handleEditResponse(response) {
      const newReadDate = _.get(response, 'data.mtEngine.readDate');
      if (!_.isNil(newReadDate)) {
        this.mtEngine.readDate = newReadDate;
      }
    },
    _refreshEntity(freshEntity) {
      this.mtEngine = freshEntity;
    },
    save() {
      if (this.isValid) {
        this._save(this.mtEngine);
      }
    },
    cancel() {
      this.close();
    },
  },
};
