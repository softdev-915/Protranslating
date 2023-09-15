/* global print, assert, db */
/**
 * Mongo Script

Usage:

$ mongo
> use lms
> load('alexander-testing-script.js') // or copy and paste on terminal
true
> nsDecomissionChecks()

*/
const PTS_NAME = 'Protranslating';
const PTI_NAME = 'PTI';
const BIG_IP_NAME = 'Big IP';
const US_BANK_NAME = 'US Bank';
const migration20210315143425 = (lspIdList) => {
  let counter;
  print('20210315143425: Confirming schedulers');
  [BIG_IP_NAME, US_BANK_NAME].forEach((lspName) => {
    counter = db.schedulers.find({ name: 'custom-query-run', lspId: lspIdList[lspName] }).count();
    assert(counter === 1, `Missing scheduler for ${lspName}`);
  });
};

const migration20210212155025 = (lspIdList) => {
  let counter;
  print('20210212155025: Confirming schedulers');
  [PTS_NAME, PTI_NAME].forEach((lspName) => {
    counter = db.schedulers.find({ name: 'custom-query-run', lspId: lspIdList[lspName] }).count();
    assert(counter === 1, `Missing scheduler for ${lspName}`);
  });
};

const migration20210211161025 = () => {
  let counter;
  print('20210211161025: Confirming roles renaming');
  const rolesToExist = [
    'AP-PAYMENT_READ_ALL', 'AP-PAYMENT_CREATE_ALL', 'AP-PAYMENT_UPDATE_ALL', 'AP-PAYMENT_READ_OWN',
  ];
  rolesToExist.forEach((role) => {
    counter = db.roles.find({ name: role }).count();
    assert(counter === 1, `Missing role ${role}`);
  });
  const rolesToNotExist = [
    'BILL-PAYMENT_READ_ALL',
    'BILL-PAYMENT_CREATE_ALL',
    'BILL-PAYMENT_UPDATE_ALL',
    'BILL-PAYMENT_READ_OWN',
  ];
  rolesToNotExist.forEach((role) => {
    counter = db.roles.find({ name: role }).count();
    assert(counter === 0, `Role ${role} should not exist`);
  });
};

// eslint-disable-next-line no-unused-vars
const nsDecomissionChecks = () => {
  const lspList = db.lsp.find({}, { _id: 1, name: 1 }).toArray();
  const docPTS = lspList.find(doc => doc.name === PTS_NAME);
  const docPTI = lspList.find(doc => doc.name === PTI_NAME);
  const docBigIP = lspList.find(doc => doc.name === BIG_IP_NAME);
  const docUsBank = lspList.find(doc => doc.name === US_BANK_NAME);
  const lspIdList = {};
  lspIdList[PTS_NAME] = docPTS._id;
  lspIdList[PTI_NAME] = docPTI._id;
  lspIdList[BIG_IP_NAME] = docBigIP._id;
  lspIdList[US_BANK_NAME] = docUsBank._id;
  migration20210315143425(lspIdList);
  migration20210212155025(lspIdList);
  migration20210211161025();
};
