import { mapActions, mapGetters } from 'vuex';
import { hasRole } from '../../../utils/user';
import RequestService from '../../../services/request-service';

const requestService = new RequestService();
const RETRIEVE_ROLES = ['REQUEST_READ_ALL', 'REQUEST_READ_OWN'];
const buildInitialState = () => ({
  options: [],
  loading: false,
});

export default {
  props: {
    value: Object,
    requestsAvailable: Array,
    filter: Object,
  },
  data() {
    return buildInitialState();
  },
  watch: {
    requestsAvailable: {
      handler: function () {
        if (this.requestsAvailable) {
          this.options = this.requestsAvailable;
        } else {
          this._retrieveRequests();
        }
      },
      immediate: true,
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),

    onRequestSelected(request) {
      this.$emit('input', request);
    },
    _retrieveRequests() {
      return new Promise((resolve, reject) => {
        if (!this.canRetrieve) {
          reject();
        }
        resolve();
      })
        .then(() => {
          this.loading = true;
          return requestService.retrieve({ filter: this.filter });
        })
        .then((response) => {
          if (Array.isArray(response.data.list)) {
            this.options = response.data.list.map((r) => ({
              no: r.no,
              _id: r._id,
              companyId: r.companyId,
            }));
          }
        })
        .catch((err) => {
          const notification = {
            title: 'Error',
            message: 'Requests could not be retrieved',
            state: 'danger',
            response: err,
          };
          this.pushNotification(notification);
        })
        .finally(() => {
          this.loading = false;
        });
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    requestsOptions() {
      return this.options.map(o => ({ text: o.no, value: o._id }));
    },
    canRetrieve() {
      return RETRIEVE_ROLES.some((role) => hasRole(this.userLogged, role));
    },
  },
};
