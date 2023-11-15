import _ from 'lodash';
import { mapActions, mapGetters } from 'vuex';
import { errorNotification } from '../utils/notifications';
import UserRoleCheckMixin from './user-role-check';

export default {
  mixins: [UserRoleCheckMixin],
  props: {
    resourcesService: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      checkedResources: {},
      resources: [],
      isUserIpAllowed: true,
    };
  },
  created() {
    this._retrieve();
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canUpload() {
      return this.hasRole('CAT-RESOURCES_CREATE_ALL') && this.isUserIpAllowed;
    },
    canDelete() {
      return this.hasRole('CAT-RESOURCES_DELETE_ALL') && this.isUserIpAllowed;
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    async _retrieve() {
      this.isLoading = true;
      const response =
        await this.resourcesService.retrievePcSettingsResources(
          this.companyId,
          { type: this.type },
        );
      this.resources = _.get(response, 'data.list', []);
      this.isUserIpAllowed = _.get(response, 'data.isUserIpAllowed', true);
      this.isLoading = false;
    },
    async _upload(data) {
      data = Object.assign(data, { type: this.type, companyId: this.companyId });
      try {
        await this.resourcesService.uploadPcSettingsResource(data);
      } catch (err) {
        const code = _.get(err, 'status.code', '');
        const message = _.get(err, 'status.message', err);
        if (code !== 409) {
          this.pushNotification(errorNotification(`${this.type.toUpperCase()} uploading failed: ${message}`));
        } else {
          throw err;
        }
      }
      await this._retrieve();
    },
    async _delete() {
      const resourceIds = _.keys(_.pickBy(this.checkedResources));
      if (_.isEmpty(resourceIds)) {
        return;
      }
      try {
        await this.resourcesService.deletePcSettingsResources({
          type: this.type,
          resourceIds,
          companyId: this.companyId,
        });
        this.checkedResources = _.omit(this.checkedResources, resourceIds);
        await this._retrieve();
      } catch (err) {
        const message = _.get(err, 'status.message', err);
        this.pushNotification(errorNotification(`Resource deleting failed. ${message}`));
      }
    },
    async _download() {
      const resourceIds = _.keys(_.pickBy(this.checkedResources));
      if (_.isEmpty(resourceIds)) {
        return;
      }
      let data;
      let filename;
      try {
        if (resourceIds.length === 1) {
          const resourceId = _.first(resourceIds);
          ({ data, filename } =
            await this.resourcesService.getPcSettingsResource({
              type: this.type,
              resourceId,
              companyId: this.companyId,
            }));
        } else {
          ({ data, filename } = await this.resourcesService.getPcSettingsResourcesZip({
            resourceIds,
            companyId: this.companyId,
            type: this.type,
          }));
        }
        const downloadUrl = URL.createObjectURL(data);
        this.$refs.downloadLink.href = downloadUrl;
        this.$refs.downloadLink.download = filename;
        this.$refs.downloadLink.click();
        this.$refs.downloadLink.href = '#';
        URL.revokeObjectURL(downloadUrl);
      } catch (err) {
        this.pushNotification(errorNotification('Resource downloading failed'));
      }
    },
  },
};
