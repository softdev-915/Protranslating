const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const Promise = require('bluebird');
const bcrypt = require('bcrypt');

const envConfig = configuration.environment;
const password = 'rDx6VXE^w7CHSr+2PGEYaED7QaGypQZ$cr#@ry=jy3CMVU9_B?ThFY4sF+k8Vfze=q3pS%AYekEFas^BkLU^tkm9G*+Jz$@EQ6-WY#Tz+8tpPGEkQvhxrP?4Ru!6t$KzDQM9as3mNehp*7fgfBH6Mmr9Nzeqx@Le33CC#VY$Ah6UFe2Uh7*cvpXJ4Y#Cm%c?jZAH##tP-aJrsP!qSA2?Lyryp2uf9^9V5N6hx9meus-Fqj&5wbaDW2Wc5L^FkpeT';
const hashedPassword = bcrypt.hashSync(password, envConfig.PWD_SALT_ROUND);
const migration = () => mongo.connect(configuration)
  .then(async (connections) => {
    const db = connections.mongoose.connection;
    const usersCol = db.collection('users');
    const lmsAuthCol = connections.mongooseAuth.collection('lmsAuth');
    if (envConfig.NODE_ENV === 'PROD') {
      return Promise.resolve();
    }
    const userStream = await usersCol.find({ email: /sample.com/ }, '_id email lsp').stream();
    return new Promise((resolve, reject) => {
      userStream.on('end', resolve);
      userStream.on('error', reject);
      userStream.on('data', async (user) => {
        userStream.pause();
        const userAuth = {
          email: user.email,
          lspId: user.lsp,
          passwordChangeDate: new Date(),
          password: hashedPassword,
        };
        await lmsAuthCol.updateOne(
          { email: user.email, lspId: user.lsp },
          { $set: userAuth },
          { upsert: true });
        userStream.resume();
      });
    });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
