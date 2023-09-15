const mongoose = require('mongoose');
const { validObjectId } = require('../../../utils/schema');
const { getRoles, hasRole } = require('../../../utils/roles');
const { models: mongooseSchema } = require('../../../components/database/mongo');

const checkSalesRepBelongsToCompany = async (user, lspId, opportunity) => {
  const roles = getRoles(user);
  const canCreateOwn = hasRole('OPPORTUNITY_CREATE_OWN', roles);
  const canCreateAll = hasRole('OPPORTUNITY_CREATE_ALL', roles);
  const canUpdateOwn = hasRole('OPPORTUNITY_UPDATE_OWN', roles);
  const canUpdateAll = hasRole('OPPORTUNITY_UPDATE_ALL', roles);
  let canOnlyCreateOrUpdateOwn;

  if (canCreateAll || canUpdateAll) {
    canOnlyCreateOrUpdateOwn = false;
  } else {
    canOnlyCreateOrUpdateOwn = canCreateOwn || canUpdateOwn;
  }

  // If user only has _OWN roles he will be able to upsert opportunities for the
  // companies that he is a sales rep of
  if (canOnlyCreateOrUpdateOwn) {
    if (validObjectId(opportunity.company)) {
      const companyId = new mongoose.Types.ObjectId(opportunity.company);
      const salesRepId = new mongoose.Types.ObjectId(opportunity.salesRep);
      const opportunityCompany = await mongooseSchema.Company.findOne({
        lspId,
        _id: companyId,
        salesRep: salesRepId,
      });

      return opportunityCompany !== null;
    }

    return false;
  }

  return true;
};

module.exports = {
  checkSalesRepBelongsToCompany,
};
