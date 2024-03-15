import { mapGetters, mapActions } from 'vuex';

export default {
  computed: {
    ...mapGetters('app', ['versionChanged']),
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
  },
  watch: {
    versionChanged: function (newVersionChanged) {
      // skip the first read
      if (newVersionChanged) {
        const messageHtml = `Please,
          <span class="update__link">
            click here to update
          </span>.`;
        this.pushNotification({
          title: 'There is a new version of the application available.',
          message: '',
          html: messageHtml,
          onClick: () => document.location.reload(),
          state: 'warning',
          sticky: true,
        });
      }
    },
  },
};
