import _ from 'lodash';
import { mapGetters, mapActions } from 'vuex';
import CurrencyService from '../../../services/currency-service';
import { entityEditMixin } from '../../../mixins/entity-edit';
import userRoleCheckMixin from '../../../mixins/user-role-check';
import { findCurrencyValidationError } from './currency-validator';

const currencyService = new CurrencyService();

export default {
  mixins: [entityEditMixin, userRoleCheckMixin],
  data() {
    return {
      currency: {
        _id: '',
        name: '',
        isoCode: '',
        symbol: '',
        deleted: false,
        readDate: null,
      },
    };
  },
  computed: {
    ...mapGetters('app', ['userLogged', 'currencyList']),
    entityName() {
      return 'currency';
    },
    canCreate() {
      return this.hasRole('CURRENCY_CREATE_ALL');
    },
    canEdit() {
      return this.hasRole('CURRENCY_UPDATE_ALL');
    },
    canCreateOrEdit() {
      return this.canEdit || (this.isNew && this.canCreate);
    },
    canOnlyEdit() {
      return !this.canCreate && this.canEdit;
    },
    showBreadcrumb() {
      return this.navigationBreadcrumb.length > 1;
    },
    isNew() {
      return this.currency._id === '';
    },
    isValid() {
      return this.entityValidationErrors.length === 0;
    },
    entityValidationErrors() {
      return findCurrencyValidationError(this.currency);
    },
  },
  methods: {
    ...mapActions('app', ['setCurrencyList']),
    _service() {
      return currencyService;
    },
    _handleRetrieve(response) {
      this.currency = response.data.currency;
    },
    _handleCreate(response) {
      this.currency._id = _.get(response, 'data.currency._id');
      if (!_.isEmpty(this.currencyList)) {
        const newCurrencies = this.currencyList.slice();
        newCurrencies.push(this.currency);
        this.setCurrencyList(newCurrencies);
      }
    },
    _handleEditResponse(response) {
      const newReadDate = _.get(response, 'data.currency.readDate');
      if (newReadDate) {
        this.currency.readDate = newReadDate;
      }
    },
    _refreshEntity(freshEntity) {
      this.$set(this, 'currency', freshEntity);
    },
    save() {
      if (this.isValid) {
        this._save(this.currency);
      }
    },
    cancel() {
      this.close();
    },
  },
};
