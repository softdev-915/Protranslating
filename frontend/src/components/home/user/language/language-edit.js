import _ from 'lodash';
import { mapGetters } from 'vuex';
import { entityEditMixin } from '../../../../mixins/entity-edit';
import userRoleCheckMixin from '../../../../mixins/user-role-check';
import LanguageService from '../../../../services/language-service';

const languageService = new LanguageService();

export default {
  mixins: [entityEditMixin, userRoleCheckMixin],
  data() {
    return {
      language: {
        _id: '',
        name: '',
        isoCode: '',
        deleted: false,
        readDate: null,
      },
    };
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    entityName() {
      return 'language';
    },
    canCreate() {
      return this.hasRole('LANGUAGE_CREATE_ALL');
    },
    canEdit() {
      return this.hasRole('LANGUAGE_UPDATE_ALL');
    },
    canCreateOrEdit() {
      return this.canEdit || (this.isNew && this.canCreate);
    },
    canOnlyEdit() {
      return !this.isNew && this.canEdit;
    },
    isValid() {
      return _.isEmpty(this.errors.items);
    },
    isNew() {
      return this.language._id === '';
    },
  },
  methods: {
    save() {
      this.$validator.validateAll().then((isValid) => {
        if (isValid) {
          this._save(this.language);
        }
      });
    },
    _service() {
      return languageService;
    },
    _handleEditResponse(response) {
      const newReadDate = _.get(response, 'data.language.readDate');
      if (newReadDate) {
        this.language.readDate = newReadDate;
      }
    },
    _handleRetrieve(response) {
      this.language = response.data.language;
    },
    _refreshEntity(freshEntity) {
      this.$set(this, 'language', freshEntity);
    },
    _handleCreate(response) {
      this.language._id = response.data.language._id;
    },
  },
};
