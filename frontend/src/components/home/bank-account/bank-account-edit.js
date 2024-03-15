import _ from 'lodash';
import userRoleCheckMixin from '../../../mixins/user-role-check';
import { entityEditMixin } from '../../../mixins/entity-edit';
import BankAccountService from '../../../services/bank-account-service';

export default {
  mixins: [userRoleCheckMixin, entityEditMixin],
  data() {
    return {
      entityName: 'bank-account',
      account: {
        _id: '',
        no: '',
        name: '',
      },
    };
  },
  props: {
    canCreate: {
      type: Boolean,
      default: false,
    },
    canEdit: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    isNew() {
      return _.isEmpty(this.account._id);
    },
    isValid() {
      return this.errors.items.length === 0;
    },
    canCreateOrEdit() {
      return this.canEdit || (this.isNew && this.canCreate);
    },
  },
  methods: {
    _service: () => new BankAccountService(),
    _handleEditResponse(response) {
      this._handleRetrieve(response);
    },
    _handleRetrieve({ data = {} }) {
      this.account = data.account;
      this.validateForm();
    },
    _handleCreate(response) {
      this.$router.replace({
        name: 'bank-account-edition',
        params: { entityId: _.get(response, 'data.account._id') },
      });
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
