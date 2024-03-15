import _ from 'lodash';
import { mapActions, mapGetters } from 'vuex';
import RichTextEditor from '../../rich-text-editor/rich-text-editor.vue';
import ExternalResourceService from '../../../services/external-resource-service';
import { hasRole } from '../../../utils/user';

const EXT_RES_UPDATE_ALL = 'EXTERNAL-RESOURCES_UPDATE_ALL';
const externalResourceService = new ExternalResourceService();
const cleanExternalResource = () => ({
  html: '',
  createdBy: '',
  editedBy: '',
});

export default {
  components: {
    RichTextEditor,
  },
  data() {
    return {
      editing: false,
      noContent: false,
      externalResource: cleanExternalResource(),
      httpRequesting: false,
      originalExternalResource: cleanExternalResource(),
      saving: false,
    };
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canEdit() {
      return hasRole(this.userLogged, EXT_RES_UPDATE_ALL);
    },
  },
  created() {
    this.httpRequesting = true;
    externalResourceService.retrieve().then((response) => {
      this.externalResource = response.data.externalResource;
    }).catch((err) => {
      const statusCode = _.get(err, 'status.code');
      if (statusCode !== 404) {
        const notification = {
          title: 'Error',
          message: 'Could not retrieve external resources',
          state: 'danger',
          response: err,
        };
        this.pushNotification(notification);
      } else {
        this.noContent = true;
      }
    }).finally(() => {
      this.httpRequesting = false;
    });
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    edit() {
      this.editing = true;
      this.originalExternalResource = _.cloneDeep(this.externalResource);
    },
    cancel() {
      this.editing = false;
      this.externalResource = this.originalExternalResource;
    },
    save() {
      this.saving = true;
      externalResourceService.save(this.externalResource).then((response) => {
        const savedExternalResource = _.get(response, 'data.externalResource');
        this.externalResource = savedExternalResource;
        // avoid assigning the same object to the originalExternalResources
        // otherwise externalResource will point to the same objects than
        // originalExternalResources
        this.originalExternalResource = _.cloneDeep(savedExternalResource);
        const notification = {
          title: 'Success',
          message: 'External resources saved',
          state: 'success',
        };
        this.pushNotification(notification);
        this.noContent = false;
      }).catch((err) => {
        const notification = {
          title: 'Error',
          message: 'Could not save external resources',
          state: 'danger',
          response: err,
        };
        this.pushNotification(notification);
      }).finally(() => {
        this.saving = false;
      });
    },
  },
};
