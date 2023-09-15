const bcrypt = require('bcrypt');
const moment = require('moment');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const password = 'rDx6VXE^w7CHSr+2PGEYaED7QaGypQZ$cr#@ry=jy3CMVU9_B?ThFY4sF+k8Vfze=q3pS%AYekEFas^BkLU^tkm9G*+Jz$@EQ6-WY#Tz+8tpPGEkQvhxrP?4Ru!6t$KzDQM9as3mNehp*7fgfBH6Mmr9Nzeqx@Le33CC#VY$Ah6UFe2Uh7*cvpXJ4Y#Cm%c?jZAH##tP-aJrsP!qSA2?Lyryp2uf9^9V5N6hx9meus-Fqj&5wbaDW2Wc5L^FkpeT';
// LMS-97 migration
const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  const usersCol = db.collection('users');
  const lmsAuthCol = connections.mongooseAuth.collection('lmsAuth');
  const envConfig = configuration.environment;
  const hashedPassword = bcrypt.hashSync(password, envConfig.PWD_SALT_ROUND);
  await usersCol.updateMany({ email: { $ne: 'e2e@sample.com' } }, { $set: { forcePasswordChange: true } });
  await lmsAuthCol.updateMany({ email: 'e2e@sample.com' }, {
    $set: {
      passwordChangeDate: moment.utc().toISOString(),
      password: hashedPassword,
    },
  });
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
