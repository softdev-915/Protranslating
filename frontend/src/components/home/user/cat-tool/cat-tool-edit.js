import _ from 'lodash';
import { mapGetters } from 'vuex';
import { hasRole } from '../../../../utils/user';
import { entityEditMixin } from '../../../../mixins/entity-edit';
import CatToolService from '../../../../services/cat-tool-service';

const catToolService = new CatToolService();
const buildInitialState = () => ({
  catTool: {
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
      return 'catTool';
    },
    canCreate: function () {
      return hasRole(this.userLogged, 'USER_CREATE_ALL') || hasRole(this.userLogged, 'CAT_CREATE_ALL');
    },
    canCreateOrEdit: function () {
      return this.canEdit || (this.isNew && this.canCreate);
    },
    canOnlyEdit: function () {
      return !this.isNew && this.canEdit;
    },
    canEdit: function () {
      return hasRole(this.userLogged, 'USER_UPDATE_ALL') || hasRole(this.userLogged, 'CAT_UPDATE_ALL');
    },
    cancelText: function () {
      return this.canEdit ? 'Cancel' : 'Exit';
    },
    isNew: function () {
      return this.index === -1;
    },
    isValidName: function () {
      return this.catTool.name.length !== 0;
    },
    isValid: function () {
      return this.isValidName;
    },
  },
  methods: {
    _service() {
      return catToolService;
    },
    _handleEditResponse(response) {
      const newReadDate = _.get(response, 'data.catTool.readDate');
      if (newReadDate) {
        this.catTool.readDate = newReadDate;
      }
    },
    _handleRetrieve(response) {
      this.catTool = response.data.catTool;
    },
    _refreshEntity(freshEntity) {
      this.$set(this, 'catTool', freshEntity);
    },
    _handleCreate(response) {
      this.catTool._id = response.data.catTool._id;
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
        this._save(this.catTool);
      }
    },
  },
};
