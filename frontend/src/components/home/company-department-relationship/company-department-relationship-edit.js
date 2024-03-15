import _ from 'lodash';
import { mapGetters } from 'vuex';
import CompanyAjaxBasicSelect from '../company/company-ajax-basic-select.vue';
import InternalDepartmentSelector from '../../internal-department-select/internal-department-selector.vue';
import CompanyDepartmentRelationshipService from '../../../services/company-department-relationship-service';
import { entityEditMixin } from '../../../mixins/entity-edit';
import { hasRole } from '../../../utils/user';

const companyDepartmentRelationshipService = new CompanyDepartmentRelationshipService();

export default {
  components: {
    CompanyAjaxBasicSelect,
    InternalDepartmentSelector,
  },
  mixins: [entityEditMixin],
  data() {
    return {
      companyDepartmentRelationship: {
        _id: '',
        company: {
          _id: '',
          name: '',
        },
        deleted: false,
        internalDepartment: '',
        acceptInvoicePerPeriod: false,
        billCreationDay: '',
      },
    };
  },
  created() {
    this.billCreationDayMin = 1;
    this.billCreationDayMax = 28;
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    entityName() {
      return 'companyDepartmentRelationship';
    },
    canCreate() {
      return hasRole(this.userLogged, 'COMPANY-DEPT-RELATIONSHIP_CREATE_ALL');
    },
    canCreateOrEdit() {
      return this.canEdit || (this.isNew && this.canCreate);
    },
    canEdit() {
      return hasRole(this.userLogged, 'COMPANY-DEPT-RELATIONSHIP_UPDATE_ALL');
    },
    showBreadcrumb() {
      return this.navigationBreadcrumb.length > 1;
    },
    isNew() {
      return _.isEmpty(_.get(this, 'companyDepartmentRelationship._id', ''));
    },
    isValid() {
      return _.isEmpty(this.errors.items)
        && this.isValidCompany
        && this.isValidInternalDepartment;
    },
    isValidCompany() {
      return !_.isEmpty(_.get(this, 'companyDepartmentRelationship.company._id', ''));
    },
    isValidInternalDepartment() {
      return !_.isEmpty(_.get(this, 'companyDepartmentRelationship.internalDepartment', ''));
    },
    selectedCompany() {
      return {
        text: _.get(this, 'companyDepartmentRelationship.company.name', ''),
        value: _.get(this, 'companyDepartmentRelationship.company._id', ''),
      };
    },
  },
  methods: {
    _service() {
      return companyDepartmentRelationshipService;
    },
    _handleRetrieve(response) {
      this.companyDepartmentRelationship = _.get(response, 'data.companyDepartmentRelationship', {});
    },
    _handleEditResponse(response) {
      this.companyDepartmentRelationship = _.get(response, 'data.companyDepartmentRelationship', {});
    },
    _handleCreate(response) {
      this.companyDepartmentRelationship._id = _.get(response, 'data.companyDepartmentRelationship._id', '');
    },
    _refreshEntity(freshEntity) {
      this.$set(this, 'companyDepartmentRelationship', freshEntity);
    },
    save() {
      if (this.isValid) {
        const companyDepartmentRelationship = _.assign({}, this.companyDepartmentRelationship, {
          company: _.get(this, 'companyDepartmentRelationship.company._id'),
        });
        const billCreationDay = _.get(companyDepartmentRelationship, 'billCreationDay', '');
        if (!_.isEmpty(billCreationDay)) {
          _.set(
            companyDepartmentRelationship,
            'billCreationDay',
            _.toNumber(billCreationDay),
          );
        }

        this._save(
          _.omitBy(companyDepartmentRelationship, (field) => _.isString(field) && _.isEmpty(field)),
        );
      }
    },
    cancel() {
      this.close();
    },
    onCompanySelect(selectedCompany) {
      this.companyDepartmentRelationship.company = {
        _id: selectedCompany.value,
        name: selectedCompany.text,
      };
    },
  },
};
