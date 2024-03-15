import _ from 'lodash';
import { mapGetters } from 'vuex';
import FooterTemplateService from '../../../services/footer-template-service';
import { entityEditMixin } from '../../../mixins/entity-edit';
import { hasRole } from '../../../utils/user';

const footerTemplateService = new FooterTemplateService();
const buildInitialState = () => ({
  footerTemplate: {
    _id: '',
    name: '',
    description: '',
    deleted: false,
    readDate: null,
  },
});

export default {
  mixins: [entityEditMixin],
  data() {
    return buildInitialState();
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    entityName() {
      return 'footer template';
    },
    canCreate() {
      return hasRole(this.userLogged, 'FOOTER-TEMPLATE_CREATE_ALL');
    },
    canCreateOrEdit() {
      return this.canEdit || (this.isNew && this.canCreate);
    },
    canEdit() {
      return hasRole(this.userLogged, 'FOOTER-TEMPLATE_UPDATE_ALL');
    },
    cancelText() {
      return this.canCreateOrEdit ? 'Cancel' : 'Exit';
    },
    showBreadcrumb() {
      return this.navigationBreadcrumb.length > 1;
    },
    isNew() {
      return _.get(this, 'footerTemplate._id') === '';
    },
    isValidName() {
      return !_.isEmpty(this.footerTemplate.name);
    },
    isValidDescription() {
      return !_.isEmpty(this.footerTemplate.description);
    },
    isValid() {
      return this.isValidName && this.isValidDescription;
    },
  },
  methods: {
    _service() {
      return footerTemplateService;
    },
    _handleRetrieve(response) {
      this.footerTemplate = response.data.footerTemplate;
    },
    _handleCreate(response) {
      this.footerTemplate._id = response.data.footerTemplate._id;
    },
    _handleEditResponse(response) {
      const newReadDate = _.get(response, 'data.footerTemplate.readDate');
      if (newReadDate) {
        this.footerTemplate.readDate = newReadDate;
      }
    },
    _refreshEntity(freshEntity) {
      Object.assign(this.footerTemplate, freshEntity);
    },
    save() {
      if (this.isValid) {
        this._save(this.footerTemplate);
      }
    },
    cancel() {
      this.close();
    },
  },
};
