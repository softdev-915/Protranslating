import { mapActions } from 'vuex';

export default {
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    pushError(message, err) {
      this.pushNotification({
        title: 'Error', message, state: 'danger', response: err,
      });
    },
    pushSuccess(message) {
      this.pushNotification({ title: 'Success', message, state: 'success' });
    },
  },
};
