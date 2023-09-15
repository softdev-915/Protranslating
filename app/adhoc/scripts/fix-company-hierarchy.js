/* global db, print */
/**
 * Mongo Script

Usage:

$ mongo
> use lms
> load('fix-company-hierarchy.js') // or copy and paste on terminal
true
> fixCompanyHierarchy(company1Id, company2Id, company3Id)

*/

const getCompanyInfo = function (_id) {
  return db.companies.findOne({ _id },
    { _id: 1, hierarchy: 1, name: 1, status: 1, securityPolicy: 1, parentCompany: 1 });
};

// eslint-disable-next-line no-unused-vars
const fixCompanyHierarchy = function (company1Id, company2Id, company3Id) {
  let company1Info = getCompanyInfo(company1Id);
  let company2Info = getCompanyInfo(company2Id);
  const company3Info = getCompanyInfo(company3Id);
  db.companies.updateOne({ _id: company1Id }, {
    $set: { hierarchy: company1Info.name },
    $unset: { parentCompany: 1 },
  });
  company1Info = getCompanyInfo(company1Id);
  print(company1Info);
  db.companies.updateOne({ _id: company2Id }, {
    $set: { hierarchy: [company1Info.name, company2Info.name].join(' : '), parentCompany: company1Info },
  });
  company2Info = getCompanyInfo(company2Id);
  print(company2Info);
  db.companies.updateOne({ _id: company3Id }, {
    $set: { hierarchy: [company1Info.name, company2Info.name, company3Info.name].join(' : '), parentCompany: company2Info },
  });
  print('done');
};
