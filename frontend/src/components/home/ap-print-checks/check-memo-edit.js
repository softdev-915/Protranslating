import _ from 'lodash';
import { mapActions } from 'vuex';
import CheckService from '../../../services/check-service';
import { errorNotification, successNotification } from '../../../utils/notifications';

const checkService = new CheckService();

export default {
  props: {
    item: { type: Object, required: true },
  },
  data() {
    return {
      check: {
        memo: '',
      },
      isEditMode: false,
    };
  },
  created() {
    this.check = Object.assign(this.check, _.clone(this.item));
  },
  computed: {
    memoToDisplay() {
      const { memo } = this.check;
      return _.isEmpty(_.trim(memo)) ? '---' : memo;
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    switchEditMode() {
      this.isEditMode = !this.isEditMode;
    },
    async save() {
      this.switchEditMode();
      try {
        await checkService.updateMemo(this.check._id, this.check.memo);
        this.pushNotification(successNotification('Memo updated successfully'));
      } catch (e) {
        const message = _.get(e, 'status.message', '');
        this.pushNotification(errorNotification(message, null, e));
      }
    },
  },
};
