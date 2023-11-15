import _ from 'lodash';
import { mapGetters } from 'vuex';
import { hasRole } from '../utils/user';

export default {
  methods: {
    hasRole(role) {
      return hasRole(this.userLogged, role);
    },
    userBelongsToCompanyHierarchy(hierarchy) {
      const userLoggedCompanyName = _.get(this.userLogged, 'company.name');
      return !_.isEmpty(hierarchy) && !_.isEmpty(userLoggedCompanyName)
        && hierarchy.includes(userLoggedCompanyName);
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
  },
};
