import _ from 'lodash';
import userRoleCheckMixin from '../../../mixins/user-role-check';
import { entityEditMixin } from '../../../mixins/entity-edit';
import AccountService from '../../../services/revenue-account-service';

export default {
  mixins: [userRoleCheckMixin, entityEditMixin],
  data() {
    return {
      entityName: 'account',
      account: {},
    };
  },
  computed: {
    canCreateOrEdit() {
      return this.canCreate || this.canEdit;
    },
    canCreate() {
      return this.isNew && this.hasRole('REVENUE-ACCOUNT_CREATE_ALL');
    },
    canEdit() {
      return !this.isNew && this.hasRole('REVENUE-ACCOUNT_UPDATE_ALL');
    },
    isNew() {
      return _.isNil(this.account._id);
    },
    isValid() {
      return Object.keys(this.fields).every((key) => _.get(this.fields, `[${key}].valid`, false));
    },
  },
  methods: {
    _service() {
      return new AccountService();
    },
    _handleEditResponse(response) {
      this._handleRetrieve(response);
    },
    _handleRetrieve(response) {
      const account = _.get(response, 'data.account', {});
      this.account = account;
      this.validateForm();
    },
    _handleCreate(response) {
      const account = _.get(response, 'data.account', {});
      this.$router.replace({ name: 'revenue-account-edition', params: { entityId: account._id } });
    },
    save() {
      this._save(this.account);
    },
    validateForm() {
      this.$nextTick(() => {
        this.$validator.validateAll();
      });
    },
  },
};
