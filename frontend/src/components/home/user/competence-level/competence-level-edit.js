import _ from 'lodash';
import { mapGetters } from 'vuex';
import { hasRole } from '../../../../utils/user';
import { entityEditMixin } from '../../../../mixins/entity-edit';
import CompetenceLevelService from '../../../../services/competence-level-service';

const competenceLevelService = new CompetenceLevelService();
const buildInitialState = () => ({
  competenceLevel: {
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
      return 'competence level';
    },
    canCreate: function () {
      return hasRole(this.userLogged, 'USER_CREATE_ALL');
    },
    canCreateOrEdit: function () {
      return this.canEdit || (this.isNew && this.canCreate);
    },
    canOnlyEdit: function () {
      return !this.isNew && this.canEdit;
    },
    canEdit: function () {
      return hasRole(this.userLogged, 'USER_UPDATE_ALL');
    },
    cancelText: function () {
      return this.canEdit ? 'Cancel' : 'Exit';
    },
    isNew: function () {
      return !this.competenceLevel._id;
    },
    isValidName: function () {
      return this.competenceLevel && this.competenceLevel.name.length !== 0;
    },
    isValid: function () {
      return this.isValidName;
    },
  },
  methods: {
    _service() {
      return competenceLevelService;
    },
    _handleEditResponse(response) {
      const newReadDate = _.get(response, 'data.competenceLevel.readDate');
      if (newReadDate) {
        this.competenceLevel.readDate = newReadDate;
      }
    },
    _handleRetrieve(response) {
      this.competenceLevel = response.data.competenceLevel;
    },
    _refreshEntity(freshEntity) {
      this.$set(this, 'competenceLevel', freshEntity);
    },
    _handleCreate(response) {
      this.competenceLevel._id = response.data.competenceLevel._id;
    },
    validateBeforeSubmit() {
      this.$validator.validateAll().then((isValid) => {
        if (isValid) {
          this.save();
        }
      });
    },
    save() {
      if (this.isValid) {
        this._save(this.competenceLevel);
      }
    },
  },
};
