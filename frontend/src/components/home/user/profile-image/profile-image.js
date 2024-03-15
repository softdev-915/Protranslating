import { mapActions, mapGetters } from 'vuex';
import { successNotification, updateFailedNotification } from '../../../../utils/notifications';
import ImageCropper from '../../../image-cropper/image-cropper.vue';
import SectionContainer from '../../../section-container/section-container.vue';
import UserService from '../../../../services/user-service';

const userService = new UserService();

export default {
  components: {
    SectionContainer,
    ImageCropper,
  },
  data() {
    return {
      loading: false,
    };
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    ...mapActions('app', ['setProfilePicture']),
    onLogodelete() {
      this.loading = true;
      userService.deleteProfileImage(this.userLogged._id)
        .then(() => {
          this.setProfilePicture({ file: '' });
          this.pushNotification(successNotification('User profile image was deleted successfully'));
        })
        .catch(() => {
          this.pushNotification(updateFailedNotification('Failed to delete user profile image'));
        })
        .finally(() => {
          this.loading = false;
        });
    },
    onCropImage(base64Image) {
      this.loading = true;
      userService.saveProfileImage(this.userLogged._id, base64Image)
        .then(() => {
          this.setProfilePicture({ file: base64Image });
          this.pushNotification(successNotification('User image was updated successfully'));
        })
        .catch(() => {
          this.pushNotification(updateFailedNotification('Failed to update user profile image'));
        })
        .finally(() => {
          this.loading = false;
        });
    },
  },
};
