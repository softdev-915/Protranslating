import { mapGetters } from 'vuex';
import { entityEditMixin } from '../../../mixins/entity-edit';
import NotificationService from '../../../services/notification-service';

const notificationService = new NotificationService();
const buildInitialState = () => ({
  notification: {
    _id: null,
    deleted: null,
    email: {
      subject: '',
      to: [],
      content: [{
        data: '',
      }],
    },
    emailConnectionString: '',
    error: null,
    processed: null,
    type: '',
    updatedAt: null,
    updatedBy: null,
    createdBy: null,
  },
});

export default {
  mixins: [entityEditMixin],
  data() {
    return buildInitialState();
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    body() {
      return this.notification.email.content[0].data;
    },
    addresses() {
      return this.notification.email.to.map((address) => address.email.concat(', ')).join(', ');
    },
    canEdit() {
      return false;
    },
  },
  methods: {
    _service() {
      return notificationService;
    },
    _handleRetrieve(response) {
      this.$set(this, 'notification', response.data);
    },
    _refreshEntity(freshEntity) {
      this.$set(this, 'notification', freshEntity);
    },
  },
};
