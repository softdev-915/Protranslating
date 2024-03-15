import _ from 'lodash';
import { mapGetters } from 'vuex';
import SoftwareRequirementService from '../../../../services/software-requirement-service';
import { entityEditMixin } from '../../../../mixins/entity-edit';
import { hasRole } from '../../../../utils/user';

const softwareRequirementService = new SoftwareRequirementService();
const buildInitialState = () => ({
  softwareRequirement: {
    _id: '',
    name: '',
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
      return 'softwareRequirement';
    },
    canCreate: function () {
      return hasRole(this.userLogged, 'SOFTWARE-REQUIREMENT_CREATE_ALL');
    },
    canEdit: function () {
      return hasRole(this.userLogged, 'SOFTWARE-REQUIREMENT_UPDATE_ALL');
    },
    canCreateOrEdit: function () {
      return this.canEdit || (this.isNew && this.canCreate);
    },
    showBreadcrumb() {
      return this.navigationBreadcrumb.length > 1;
    },
    isNew() {
      return _.get(this, 'softwareRequirement._id', '') === '';
    },
    isValid: function () {
      return _.get(this, 'softwareRequirement.name', '') !== '';
    },
  },
  methods: {
    _service() {
      return softwareRequirementService;
    },
    _handleRetrieve(response) {
      this.softwareRequirement = _.get(response, 'data.softwareRequirement');
    },
    _handleCreate(response) {
      this.softwareRequirement._id = _.get(response, 'data.softwareRequirement._id');
    },
    _handleEditResponse(response) {
      const newReadDate = _.get(response, 'data.softwareRequirement.readDate');
      if (newReadDate) {
        this.softwareRequirement.readDate = newReadDate;
      }
    },
    _refreshEntity(freshEntity) {
      this.$set(this, 'softwareRequirement', freshEntity);
    },
    save() {
      if (this.isValid) {
        this._save(this.softwareRequirement);
      }
    },
    cancel() {
      this.close();
    },
  },
};
