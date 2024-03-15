import _ from 'lodash';
import { mapGetters } from 'vuex';
import BillingTermService from '../../../services/billing-term-service';
import { entityEditMixin } from '../../../mixins/entity-edit';
import { hasRole } from '../../../utils/user';

const billingTermService = new BillingTermService();
const buildInitialState = () => ({
  billingTerm: {
    _id: '',
    name: '',
    deleted: false,
    readDate: null,
    days: null,
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
      return 'billingTerm';
    },
    canCreate: function () {
      return hasRole(this.userLogged, 'BILLING-TERM_CREATE_ALL');
    },
    canCreateOrEdit: function () {
      return this.canEdit || (this.isNew && this.canCreate);
    },
    canEdit: function () {
      return hasRole(this.userLogged, 'BILLING-TERM_UPDATE_ALL');
    },
    cancelText: function () {
      return this.canCreateOrEdit ? 'Cancel' : 'Exit';
    },
    showBreadcrumb() {
      return this.navigationBreadcrumb.length > 1;
    },
    isNew() {
      if (this.billingTerm && typeof this.billingTerm === 'object') {
        return this.billingTerm._id === '';
      }
    },
    isValid() {
      return _.isEmpty(_.get(this, 'errors.items', []));
    },
  },
  methods: {
    _service() {
      return billingTermService;
    },
    _handleRetrieve(response) {
      this.billingTerm = response.data.billingTerm;
    },
    _handleCreate(response) {
      this.billingTerm._id = response.data.billingTerm._id;
    },
    _handleEditResponse(response) {
      const newReadDate = _.get(response, 'data.billingTerm.readDate');
      if (newReadDate) {
        this.billingTerm.readDate = newReadDate;
      }
    },
    _refreshEntity(freshEntity) {
      this.$set(this, 'billingTerm', freshEntity);
    },
    save() {
      if (this.isValid) {
        this._save(this.billingTerm);
      }
    },
    cancel() {
      this.close();
    },
  },
};
