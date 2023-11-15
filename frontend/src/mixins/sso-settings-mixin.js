import _ from 'lodash';
import { mapActions } from 'vuex';
import CompanyService from '../services/company-service';

const companyService = new CompanyService();
export default {
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    async getSsoSettings(company) {
      try {
        const ssoSettings = await companyService.getSsoSettings(company._id);
        return _.get(ssoSettings, 'data', null);
      } catch (err) {
        const notification = {
          title: 'Error',
          message: _.get(err, 'message', `Failed to retrieve details of selected company '${company.name}'`),
          state: 'warning',
          response: err,
        };
        this.pushNotification(notification);
      }
    },
  },
};
