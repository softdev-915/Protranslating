import _ from 'lodash';
import { mapGetters } from 'vuex';
import { hasRole } from '../../../../utils/user';
import { entityEditMixin } from '../../../../mixins/entity-edit';
import CertificationService from '../../../../services/certification-service';

const service = new CertificationService();
const buildInitialState = () => ({
  certification: {
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

  methods: {
    _service() {
      return service;
    },
    save() {
      this.$validator.validateAll().then((isValid) => {
        if (isValid) {
          this._save(this.certification);
        }
      });
    },
    _handleCreate(response) {
      this.certification._id = response.data.certification_id;
    },
    _handleRetrieve(response) {
      this.certification = response.data.certification;
    },
  },

  computed: {
    ...mapGetters('app', ['userLogged']),

    entityName() {
      return 'certification';
    },
    isNew() {
      return _.get(this, 'certification._id.length', 0) === 0;
    },
    canCreate() {
      return hasRole(this.userLogged, 'USER_CREATE_ALL');
    },
    canEdit() {
      return hasRole(this.userLogged, 'USER_UPDATE_ALL');
    },
    canOnlyEdit() {
      return !this.isNew && this.canEdit;
    },
    canCreateOrEdit() {
      return this.canEdit || (this.isNew && this.canCreate);
    },
    isValidName() {
      const certificationName = _.get(this, 'certification.name');
      return !_.isEmpty(certificationName);
    },
    isValid() {
      return this.isValidName;
    },
  },
};
