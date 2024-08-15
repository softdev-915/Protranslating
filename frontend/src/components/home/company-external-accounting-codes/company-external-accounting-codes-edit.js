import _ from 'lodash';
import { mapGetters } from 'vuex';
import CompanyAjaxBasicSelect from '../company/company-ajax-basic-select.vue';
import CompanyExternalAccountingCodeService from '../../../services/company-external-accounting-code-service';
import { entityEditMixin } from '../../../mixins/entity-edit';
import { hasRole } from '../../../utils/user';

const companyExternalAccountingCodeService = new CompanyExternalAccountingCodeService();

export default {
  components: {
    CompanyAjaxBasicSelect,
  },
  mixins: [entityEditMixin],
  data() {
    return {
      companyExternalAccountingCode: {
        _id: '',
        company: {
          _id: null,
          name: '',
          hierarchy: '',
        },
        companyExternalAccountingCode: '',
      },
    };
  },
  created() {
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    entityName() {
      return 'companyExternalAccountingCode';
    },
    canCreate() {
      return hasRole(this.userLogged, 'EXTERNAL-ACCOUNTING-CODE_CREATE_ALL');
    },
    canCreateOrEdit() {
      return this.canEdit || (this.isNew && this.canCreate);
    },
    canEdit() {
      return hasRole(this.userLogged, 'EXTERNAL-ACCOUNTING-CODE_UPDATE_ALL');
    },
    showBreadcrumb() {
      return this.navigationBreadcrumb.length > 1;
    },
    isNew() {
      return _.isEmpty(_.get(this, 'companyExternalAccountingCode._id', ''));
    },
    isValid() {
      return _.isEmpty(this.errors.items)
        && this.isValidCompany;
    },
    isValidCompany() {
      return !_.isEmpty(_.get(this, 'companyExternalAccountingCode.company._id', ''));
    },
    isValidCompanyExternalAccountingCode() {
      return !_.isEmpty(_.get(this, 'companyExternalAccountingCode.companyExternalAccountingCode', ''));
    },
    selectedCompany() {
      return {
        text: _.get(this, 'companyExternalAccountingCode.company.name', ''),
        value: _.get(this, 'companyExternalAccountingCode.company._id', ''),
      };
    },
  },
  methods: {
    _service() {
      return companyExternalAccountingCodeService;
    },
    _handleRetrieve(response) {
      this.companyExternalAccountingCode = _.get(response, 'data.companyExternalAccountingCode', {});
    },
    _handleEditResponse(response) {
      this.companyExternalAccountingCode = _.get(response, 'data.companyExternalAccountingCode', {});
    },
    _handleCreate(response) {
      this.companyExternalAccountingCode = _.get(response, 'data.companyExternalAccountingCode._id', '');
      if (!_.isEmpty(this.companyExternalAccountingCode)) {
        this.$router.replace({
          name: 'company-external-accounting-codes-edition',
          params: { entityId: this.companyExternalAccountingCode },
        });
      }
    },
    _refreshEntity(freshEntity) {
      this.$set(this, 'companyExternalAccountingCode', freshEntity);
    },
    save() {
      const clone = _.cloneDeep(this.companyExternalAccountingCode);
      this._save(clone);
    },
    onCompanySelect(selectedCompany) {
      this.companyExternalAccountingCode.company = selectedCompany;
    },
  },
};
