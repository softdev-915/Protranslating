import _ from 'lodash';
import cronParser from 'cron-parser';
import { entityEditMixin } from '../../../../mixins/entity-edit';
import CustomQueryPreferenceService from '../../../../services/custom-query-preference-service';

const customQueryPreferenceService = new CustomQueryPreferenceService();

export default {
  name: 'custom-query-preference-edit',
  mixins: [entityEditMixin],
  props: {
    canEdit: {
      type: Boolean,
      default: false,
    },
    isRunForced: {
      type: Boolean,
      default: false,
    },
  },
  data: () => ({
    customQueryPreference: { customQueryId: '', scheduledAt: '', isRunForced: false },
    showErrorOnRetrieve: false,
    showHelp: false,
  }),
  computed: {
    isValid() {
      return _.isEmpty(this.customQueryIdError) && !this.errors.has('scheduledAt');
    },
    customQueryIdError() {
      const customQueryId = _.get(this, 'customQueryPreference.customQueryId', '');
      return _.isEmpty(customQueryId) ? 'Save custom query first' : '';
    },
    scheduledAtText() {
      const scheduledAt = _.get(this, 'customQueryPreference.scheduledAt', '');
      if (this.errors.has('scheduledAt') || _.isEmpty(scheduledAt)) {
        return '';
      }
      let nextRunTime = '';
      try {
        nextRunTime = `on ${cronParser.parseExpression(scheduledAt, { utc: true }).next().toString()}`;
      } catch (error) {
        return '';
      }
      return `Next run will be ${nextRunTime}`;
    },
  },
  watch: {
    entityId(newEntityId) {
      _.set(this, 'customQueryPreference.customQueryId', newEntityId);
      this._initialize(newEntityId);
    },
    isRunForced(isRunForced) {
      _.set(this, 'customQueryPreference.isRunForced', isRunForced);
      if (!isRunForced) {
        return;
      }
      const successMessage = 'You will receive an email notification with results. In addition, results are available to download from the custom query grid.';
      this._save(this.customQueryPreference, {
        successCreateMessage: successMessage,
        successEditMessage: successMessage,
      }).then(() => this.$emit('cancel-forced-run'));
    },
  },
  created() {
    this.entityName = 'Custom Query Preference';
  },
  methods: {
    _service: () => customQueryPreferenceService,
    _handleRetrieve(response) {
      const customQueryPreference = _.get(response, 'data.customQueryPreference', {});
      customQueryPreference.customQueryId = this.entityId;
      this.customQueryPreference = customQueryPreference;
    },
    _handleEditResponse(response) {
      const newReadDate = _.get(response, 'data.customQueryPreference.readDate', '');
      if (!_.isEmpty(newReadDate)) {
        _.set(this, 'customQueryPreference.readDate', newReadDate);
      }
    },
    _refreshEntity(freshEntity) {
      this.customQueryPreference = freshEntity;
    },
    _getEntityId() {
      return _.get(this, 'customQueryPreference.customQueryId', '');
    },
    save() {
      if (this.isValid) {
        delete this.customQueryPreference.isRunForced;
        this._save(this.customQueryPreference);
      }
    },
  },
};
