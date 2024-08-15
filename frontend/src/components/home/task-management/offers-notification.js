import _ from 'lodash';
import { mapGetters, mapActions } from 'vuex';
import ProviderOffersService from '../../../services/provider-offers-service';

const NOTIFICATION_HEIGHT = 61.5;
const NOTIFICATION_CONTAINER_TOP_POSITION = 10;
const providerOffersService = new ProviderOffersService();

export default {
  props: {
    value: {
      type: Array,
      default: () => [],
    },
    providerId: {
      type: String,
      required: true,
    },
  },
  computed: {
    ...mapGetters('app', [
      'userLogged',
    ]),
    ...mapGetters('notifications', [
      'notifications',
    ]),
    offerNotifications() {
      return this.value.map((v) => {
        const messageSubject = `${v.offers.length} ${v.offers.length > 1 ? 'offers' : 'offer'}`;
        const messageVerb = `${v.accepted ? 'accepted' : 'declined'}`;
        const notificationMessage = `${messageSubject} ${messageVerb}`;
        return ({ message: notificationMessage, accepted: v.accepted });
      });
    },
    topPosition() {
      const top = (NOTIFICATION_HEIGHT * this.notifications.length)
        + NOTIFICATION_CONTAINER_TOP_POSITION;
      return top;
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    removeNotification(index) {
      const newValue = this.value.filter((_el, i) => i !== index);
      this.$emit('input', newValue);
    },
    undoOffersOperation(index) {
      const offerStatus = _.get(this.value, index, []);
      providerOffersService
        .undoOffersOperation(offerStatus.offers, this.providerId, offerStatus.accepted)
        .then(() => {
          this.removeNotification(index);
          this.$emit('refresh-tasks', offerStatus.accepted);
        })
        .catch(() => {
          const notification = {
            title: 'Error',
            message: 'Offer decline undo failed',
            state: 'danger',
          };
          this.pushNotification(notification);
        });
    },
  },
};
