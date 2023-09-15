/* global print, assert, db */
/**
 * Mongo Script

Usage:

$ mongo
> load('alejandro-testing-script.js') // or copy and paste on terminal
true
> nsDecomissionChecks()

*/

// eslint-disable-next-line no-unused-vars
const nsDecomissionChecks = function () {
  let counter;
  const lspList = db.lsp.find({}, { _id: 1, name: 1 }).toArray();
  const docPTS = lspList.find(doc => doc.name === 'Protranslating');
  const docPTI = lspList.find(doc => doc.name === 'PTI');
  const PTS_ID = docPTS._id;
  const PTI_ID = docPTI._id;

  // 20200722140414
  print(' Confirming EN-EN language for opportunities is migrated');
  counter = db.users.find({ 'tgtLangs.isoCode': 'EN-EN' }).count(); // Should be 0
  assert(counter === 0, 'There should not be Opportunities with EN-EN target language');

  // 20200722140413
  print(' Confirming EN-EN language for opportunities is migrated');
  counter = db.users.find({ 'srcLangs.isoCode': 'EN-EN' }).count(); // Should be 0
  assert(counter === 0, 'There should not be Opportunities with EN-EN source language');

  // 20200930160439
  // Not checking since there are more migrations to fix this

  // 20200930183655
  const newRoles = [
    'COMPANY-BILLING_READ_OWN',
    'COMPANY-BILLING_UPDATE_OWN',
    'COMPANY-BILLING_UPDATE_ALL',
    'BILLING-TERM_CREATE_ALL',
    'TRANSLATION-UNIT_CREATE_ALL',
    'TRANSLATION-UNIT_UPDATE_ALL',
    'INTERNAL-DEPARTMENT_CREATE_ALL',
    'INTERNAL-DEPARTMENT_READ_ALL',
    'INTERNAL-DEPARTMENT_UPDATE_ALL',
    'PAYMENT-METHOD_READ_ALL',
    'PAYMENT-METHOD_CREATE_ALL',
    'PAYMENT-METHOD_UPDATE_ALL',
    'BILLING-TERM_READ_ALL',
    'TRANSLATION-UNIT_READ_ALL',
    'BILLING-TERM_UPDATE_ALL',
    'BREAKDOWN_CREATE_ALL',
    'BREAKDOWN_READ_ALL',
    'BREAKDOWN_UPDATE_ALL',
    'CURRENCY_CREATE_ALL',
    'CURRENCY_READ_ALL',
    'QUOTE_UPATE_ALL',
    'ASSIGNMENT-STATUS_CREATE_ALL',
    'ASSIGNMENT-STATUS_UPDATE_ALL',
    'ASSIGNMENT-STATUS_READ_ALL',
    'COMPANY-MIN-CHARGE_CREATE_ALL',
    'COMPANY-MIN-CHARGE_READ_ALL',
    'COMPANY-MIN-CHARGE_UPDATE_ALL'];
  print('20200930183655: Confirming new roles');
  counter = db.roles.find({ name: { $in: newRoles } }).count(); // Should be 27
  const ptiCount1 = db.groups.find({ lspId: PTI_ID, name: 'LSP_ADMIN', roles: { $in: newRoles } }).count(); // Should be 1
  const ptiCount2 = db.groups.find({ lspId: PTI_ID, name: 'LSP_PM', roles: { $in: newRoles } }).count(); // Should be 1
  const ptsCount1 = db.groups.find({ lspId: PTS_ID, name: 'LSP_ADMIN', roles: { $in: newRoles } }).count(); // Should be 1
  const ptsCount2 = db.groups.find({ lspId: PTS_ID, name: 'LSP_PM', roles: { $in: newRoles } }).count(); // Should be 1
  assert(ptiCount1 === 1, 'LSP_ADMIN roles missing for PTI');
  assert(ptiCount2 === 1, 'LSP_PM roles missing for PTI');
  assert(ptsCount1 === 1, 'LSP_ADMIN roles missing for PTS');
  assert(ptsCount2 === 1, 'LSP_PM roles missing for PTS');

  // 20201027191820
  print('20201027191820: Confirming new template name: PTI Email template from NS-Firm Confirmation (Converted)');
  counter = db.templates.find({ lspId: PTI_ID, name: 'PTI Email template from NS-Firm Confirmation (Converted)' }).count(); // Should be 1
  assert(counter === 1, 'Missing template PTI PTI Email template from NS-Firm Confirmation (Converted)');
  // 20201027190513
  print('20201027190513: Confirming new template name: Interpreting Quote_PTI');
  counter = db.templates.find({ lspId: PTI_ID, name: 'Interpreting Quote_PTI' }).count(); // Should be 1
  assert(counter === 1, 'Missing template PTI Interpreting Quote_PTI');
  // 20201027190419
  print('20201027190419: Confirming new template name: Conference Proposal 2_PTI');
  counter = db.templates.find({ lspId: PTI_ID, name: 'Conference Proposal 2_PTI' }).count(); // Should be 1
  assert(counter === 1, 'Missing template PTI Conference Proposal 2_PTI');
  // 20201027190307
  print('20201027190307: Confirming new template name: Email Template PTI 2');
  counter = db.templates.find({ lspId: PTI_ID, name: 'Email Template PTI 2' }).count(); // Should be 1
  assert(counter === 1, 'Missing template PTI Email Template PTI 2');
  // 20201027190109
  print('20201027190109: Confirming new template name: Email Template PTI 1');
  counter = db.templates.find({ lspId: PTI_ID, name: 'Email Template PTI 1' }).count(); // Should be 1
  assert(counter === 1, 'Missing template PTI Email Template PTI 1');

  // 20201007162530
  print('20201007162530: Confirming roles to be removed');
  const rolesToRemove = ['WORKFLOW-TASK-FINANCIAL_CREATE_ALL', 'WORKFLOW-TASK-FINANCIAL_UPDATE_ALL', 'WORKFLOW-TASK-FINANCIAL_READ_ALL'];
  counter = db.users.find({ roles: { $in: [rolesToRemove] } }).count(); // Should be 0
  counter = db.users.find({ 'groups.roles': { $in: [rolesToRemove] } }).count(); // Should be 0
  counter = db.groups.find({ roles: { $in: [rolesToRemove] } }).count(); // Should be 0

  // 20201007162232
  print('20201007162232: Confirming roles to be added');
  const rolesToAdd = ['TASK-FINANCIAL_READ_ALL'];
  counter = db.roles.find({ name: rolesToAdd[0] }).count(); // Should be 1
  assert(counter === 1, 'TASK-FINANCIAL_READ_ALL missing in roles collection');
  counter = db.groups.find({ roles: { $in: rolesToAdd } }).count(); // Should be greater than 1
  assert(counter >= 1, 'TASK-FINANCIAL_READ_ALL missing in groups collection');

  // 20201001125851
  print('20201001125851: Confirming LSP base currencies');
  const ptiUsdCurrency = db.currencies.findOne({ lspId: PTI_ID, name: 'US Dollar' });
  const ptsUsdCurrency = db.currencies.findOne({ lspId: PTS_ID, name: 'US Dollar' });
  counter = db.lsp.find({
    _id: PTI_ID,
    'currencyExchangeDetails.base': ptiUsdCurrency._id,
    'currencyExchangeDetails.quote': ptiUsdCurrency._id,
    'currencyExchangeDetails.quotation': 1,
  }).count();
  assert(counter === 1, 'USD missing for PTI');
  counter = db.lsp.find({
    _id: PTS_ID,
    'currencyExchangeDetails.base': ptsUsdCurrency._id,
    'currencyExchangeDetails.quote': ptsUsdCurrency._id,
    'currencyExchangeDetails.quotation': 1,
  }).count();
  assert(counter === 1, 'USD missing for PTS');

  // 20200930184119
  print('20200930184119: Confirming fuzzyMatches collection is renamed to breakdowns');
  counter = db.breakdowns.find({ lspId: PTS_ID }).count(); // Should be > 1
  assert(counter >= 1, 'Breakdowns missing for PTS');

  // 20200930175105
  print('20200930175105: Confirming fuzzyMatch field is renamed to breakdown for vendor rates');
  counter = db.users.find({ lsp: PTS_ID, 'vendorDetails.rates.rateDetails.breakdown': { $exists: true } }).count(); // Should be >= 1
  assert(counter >= 1, 'Breakdowns missing for vendors');

  // 20200930175049
  print('20200930175049: Confirming fuzzyMatch field is renamed to breakdown for staff rates');
  counter = db.users.find({ lsp: PTS_ID, 'staffDetails.rates.rateDetails.breakdown': { $exists: true } }).count(); // Should be >= 1
  assert(counter >= 1, 'Breakdowns missing for staff users');

  // 20200930160510
  print('20200930160510: Confirming quote currency for all companies is USD');
  const ptsCompaniesCount = db.companies.find({ lspId: PTS_ID }).count();
  const ptsUsdCompaniesCount = db.companies.find({ 'billingInformation.quoteCurrency._id': ptsUsdCurrency._id }).count();
  assert(ptsCompaniesCount === ptsUsdCompaniesCount, 'USD quote currency missing for PTS companies');
  const ptiCompaniesCount = db.companies.find({ lspId: PTI_ID }).count();
  const ptiUsdCompaniesCount = db.companies.find({ 'billingInformation.quoteCurrency._id': ptiUsdCurrency._id }).count();
  assert(ptiCompaniesCount === ptiUsdCompaniesCount, 'USD quote currency missing for PTI companies');

  // 20200930160509
  const currencies = [
    { name: 'Afghani', isoCode: 'AFN' },
    { name: 'Euro', isoCode: 'EUR' },
    { name: 'Lek', isoCode: 'ALL' },
    { name: 'Algerian Dinar', isoCode: 'DZD' },
    { name: 'US Dollar', isoCode: 'USD' },
    { name: 'Euro', isoCode: 'EUR' },
    { name: 'Kwanza', isoCode: 'AOA' },
    { name: 'East Caribbean Dollar', isoCode: 'XCD' },
    { name: 'No universal currency', isoCode: '' },
    { name: 'East Caribbean Dollar', isoCode: 'XCD' },
    { name: 'Argentine Peso', isoCode: 'ARS' },
    { name: 'Armenian Dram', isoCode: 'AMD' },
    { name: 'Aruban Florin', isoCode: 'AWG' },
    { name: 'Australian Dollar', isoCode: 'AUD' },
    { name: 'Euro', isoCode: 'EUR' },
    { name: 'Azerbaijan Manat', isoCode: 'AZN' },
    { name: 'Bahamian Dollar', isoCode: 'BSD' },
    { name: 'Bahraini Dinar', isoCode: 'BHD' },
    { name: 'Taka', isoCode: 'BDT' },
    { name: 'Barbados Dollar', isoCode: 'BBD' },
    { name: 'Belarusian Ruble', isoCode: 'BYN' },
    { name: 'Euro', isoCode: 'EUR' },
    { name: 'Belize Dollar', isoCode: 'BZD' },
    { name: 'CFA Franc BCEAO', isoCode: 'XOF' },
    { name: 'Bermudian Dollar', isoCode: 'BMD' },
    { name: 'Indian Rupee', isoCode: 'INR' },
    { name: 'Ngultrum', isoCode: 'BTN' },
    { name: 'Boliviano', isoCode: 'BOB' },
    { name: 'Mvdol', isoCode: 'BOV' },
    { name: 'US Dollar', isoCode: 'USD' },
    { name: 'Convertible Mark', isoCode: 'BAM' },
    { name: 'Pula', isoCode: 'BWP' },
    { name: 'Norwegian Krone', isoCode: 'NOK' },
    { name: 'Brazilian Real', isoCode: 'BRL' },
    { name: 'US Dollar', isoCode: 'USD' },
    { name: 'Brunei Dollar', isoCode: 'BND' },
    { name: 'Bulgarian Lev', isoCode: 'BGN' },
    { name: 'CFA Franc BCEAO', isoCode: 'XOF' },
    { name: 'Burundi Franc', isoCode: 'BIF' },
    { name: 'Cabo Verde Escudo', isoCode: 'CVE' },
    { name: 'Riel', isoCode: 'KHR' },
    { name: 'CFA Franc BEAC', isoCode: 'XAF' },
    { name: 'Canadian Dollar', isoCode: 'CAD' },
    { name: 'Cayman Islands Dollar', isoCode: 'KYD' },
    { name: 'CFA Franc BEAC', isoCode: 'XAF' },
    { name: 'CFA Franc BEAC', isoCode: 'XAF' },
    { name: 'Chilean Peso', isoCode: 'CLP' },
    { name: 'Unidad de Fomento', isoCode: 'CLF' },
    { name: 'Yuan Renminbi', isoCode: 'CNY' },
    { name: 'Australian Dollar', isoCode: 'AUD' },
    { name: 'Australian Dollar', isoCode: 'AUD' },
    { name: 'Colombian Peso', isoCode: 'COP' },
    { name: 'Unidad de Valor Real', isoCode: 'COU' },
    { name: 'Comorian Franc', isoCode: 'KMF' },
    { name: 'Congolese Franc', isoCode: 'CDF' },
    { name: 'CFA Franc BEAC', isoCode: 'XAF' },
    { name: 'New Zealand Dollar', isoCode: 'NZD' },
    { name: 'Costa Rican Colon', isoCode: 'CRC' },
    { name: 'CFA Franc BCEAO', isoCode: 'XOF' },
    { name: 'Kuna', isoCode: 'HRK' },
    { name: 'Cuban Peso', isoCode: 'CUP' },
    { name: 'Peso Convertible', isoCode: 'CUC' },
    { name: 'Netherlands Antillean Guilder', isoCode: 'ANG' },
    { name: 'Euro', isoCode: 'EUR' },
    { name: 'Czech Koruna', isoCode: 'CZK' },
    { name: 'Danish Krone', isoCode: 'DKK' },
    { name: 'Djibouti Franc', isoCode: 'DJF' },
    { name: 'East Caribbean Dollar', isoCode: 'XCD' },
    { name: 'Dominican Peso', isoCode: 'DOP' },
    { name: 'US Dollar', isoCode: 'USD' },
    { name: 'Egyptian Pound', isoCode: 'EGP' },
    { name: 'El Salvador Colon', isoCode: 'SVC' },
    { name: 'US Dollar', isoCode: 'USD' },
    { name: 'CFA Franc BEAC', isoCode: 'XAF' },
    { name: 'Nakfa', isoCode: 'ERN' },
    { name: 'Euro', isoCode: 'EUR' },
    { name: 'Lilangeni', isoCode: 'SZL' },
    { name: 'Ethiopian Birr', isoCode: 'ETB' },
    { name: 'Euro', isoCode: 'EUR' },
    { name: 'Falkland Islands Pound', isoCode: 'FKP' },
    { name: 'Danish Krone', isoCode: 'DKK' },
    { name: 'Fiji Dollar', isoCode: 'FJD' },
    { name: 'Euro', isoCode: 'EUR' },
    { name: 'Euro', isoCode: 'EUR' },
    { name: 'Euro', isoCode: 'EUR' },
    { name: 'CFP Franc', isoCode: 'XPF' },
    { name: 'Euro', isoCode: 'EUR' },
    { name: 'CFA Franc BEAC', isoCode: 'XAF' },
    { name: 'Dalasi', isoCode: 'GMD' },
    { name: 'Lari', isoCode: 'GEL' },
    { name: 'Euro', isoCode: 'EUR' },
    { name: 'Ghana Cedi', isoCode: 'GHS' },
    { name: 'Gibraltar Pound', isoCode: 'GIP' },
    { name: 'Euro', isoCode: 'EUR' },
    { name: 'Danish Krone', isoCode: 'DKK' },
    { name: 'East Caribbean Dollar', isoCode: 'XCD' },
    { name: 'Euro', isoCode: 'EUR' },
    { name: 'US Dollar', isoCode: 'USD' },
    { name: 'Quetzal', isoCode: 'GTQ' },
    { name: 'Pound Sterling', isoCode: 'GBP' },
    { name: 'Guinean Franc', isoCode: 'GNF' },
    { name: 'CFA Franc BCEAO', isoCode: 'XOF' },
    { name: 'Guyana Dollar', isoCode: 'GYD' },
    { name: 'Gourde', isoCode: 'HTG' },
    { name: 'US Dollar', isoCode: 'USD' },
    { name: 'Australian Dollar', isoCode: 'AUD' },
    { name: 'Euro', isoCode: 'EUR' },
    { name: 'Lempira', isoCode: 'HNL' },
    { name: 'Hong Kong Dollar', isoCode: 'HKD' },
    { name: 'Forint', isoCode: 'HUF' },
    { name: 'Iceland Krona', isoCode: 'ISK' },
    { name: 'Indian Rupee', isoCode: 'INR' },
    { name: 'Rupiah', isoCode: 'IDR' },
    { name: 'SDR (Special Drawing Right)', isoCode: 'XDR' },
    { name: 'Iranian Rial', isoCode: 'IRR' },
    { name: 'Iraqi Dinar', isoCode: 'IQD' },
    { name: 'Euro', isoCode: 'EUR' },
    { name: 'Pound Sterling', isoCode: 'GBP' },
    { name: 'New Israeli Sheqel', isoCode: 'ILS' },
    { name: 'Euro', isoCode: 'EUR' },
    { name: 'Jamaican Dollar', isoCode: 'JMD' },
    { name: 'Yen', isoCode: 'JPY' },
    { name: 'Pound Sterling', isoCode: 'GBP' },
    { name: 'Jordanian Dinar', isoCode: 'JOD' },
    { name: 'Tenge', isoCode: 'KZT' },
    { name: 'Kenyan Shilling', isoCode: 'KES' },
    { name: 'Australian Dollar', isoCode: 'AUD' },
    { name: 'North Korean Won', isoCode: 'KPW' },
    { name: 'Won', isoCode: 'KRW' },
    { name: 'Kuwaiti Dinar', isoCode: 'KWD' },
    { name: 'Som', isoCode: 'KGS' },
    { name: 'Lao Kip', isoCode: 'LAK' },
    { name: 'Euro', isoCode: 'EUR' },
    { name: 'Lebanese Pound', isoCode: 'LBP' },
    { name: 'Loti', isoCode: 'LSL' },
    { name: 'Rand', isoCode: 'ZAR' },
    { name: 'Liberian Dollar', isoCode: 'LRD' },
    { name: 'Libyan Dinar', isoCode: 'LYD' },
    { name: 'Swiss Franc', isoCode: 'CHF' },
    { name: 'Euro', isoCode: 'EUR' },
    { name: 'Euro', isoCode: 'EUR' },
    { name: 'Pataca', isoCode: 'MOP' },
    { name: 'Denar', isoCode: 'MKD' },
    { name: 'Malagasy Ariary', isoCode: 'MGA' },
    { name: 'Malawi Kwacha', isoCode: 'MWK' },
    { name: 'Malaysian Ringgit', isoCode: 'MYR' },
    { name: 'Rufiyaa', isoCode: 'MVR' },
    { name: 'CFA Franc BCEAO', isoCode: 'XOF' },
    { name: 'Euro', isoCode: 'EUR' },
    { name: 'US Dollar', isoCode: 'USD' },
    { name: 'Euro', isoCode: 'EUR' },
    { name: 'Ouguiya', isoCode: 'MRU' },
    { name: 'Mauritius Rupee', isoCode: 'MUR' },
    { name: 'Euro', isoCode: 'EUR' },
    { name: 'ADB Unit of Account', isoCode: 'XUA' },
    { name: 'Mexican Peso', isoCode: 'MXN' },
    { name: 'Mexican Unidad de Inversion (UDI)', isoCode: 'MXV' },
    { name: 'US Dollar', isoCode: 'USD' },
    { name: 'Moldovan Leu', isoCode: 'MDL' },
    { name: 'Euro', isoCode: 'EUR' },
    { name: 'Tugrik', isoCode: 'MNT' },
    { name: 'Euro', isoCode: 'EUR' },
    { name: 'East Caribbean Dollar', isoCode: 'XCD' },
    { name: 'Moroccan Dirham', isoCode: 'MAD' },
    { name: 'Mozambique Metical', isoCode: 'MZN' },
    { name: 'Kyat', isoCode: 'MMK' },
    { name: 'Namibia Dollar', isoCode: 'NAD' },
    { name: 'Rand', isoCode: 'ZAR' },
    { name: 'Australian Dollar', isoCode: 'AUD' },
    { name: 'Nepalese Rupee', isoCode: 'NPR' },
    { name: 'Euro', isoCode: 'EUR' },
    { name: 'CFP Franc', isoCode: 'XPF' },
    { name: 'New Zealand Dollar', isoCode: 'NZD' },
    { name: 'Cordoba Oro', isoCode: 'NIO' },
    { name: 'CFA Franc BCEAO', isoCode: 'XOF' },
    { name: 'Naira', isoCode: 'NGN' },
    { name: 'New Zealand Dollar', isoCode: 'NZD' },
    { name: 'Australian Dollar', isoCode: 'AUD' },
    { name: 'US Dollar', isoCode: 'USD' },
    { name: 'Norwegian Krone', isoCode: 'NOK' },
    { name: 'Rial Omani', isoCode: 'OMR' },
    { name: 'Pakistan Rupee', isoCode: 'PKR' },
    { name: 'US Dollar', isoCode: 'USD' },
    { name: 'No universal currency', isoCode: '' },
    { name: 'Balboa', isoCode: 'PAB' },
    { name: 'US Dollar', isoCode: 'USD' },
    { name: 'Kina', isoCode: 'PGK' },
    { name: 'Guarani', isoCode: 'PYG' },
    { name: 'Sol', isoCode: 'PEN' },
    { name: 'Philippine Peso', isoCode: 'PHP' },
    { name: 'New Zealand Dollar', isoCode: 'NZD' },
    { name: 'Zloty', isoCode: 'PLN' },
    { name: 'Euro', isoCode: 'EUR' },
    { name: 'US Dollar', isoCode: 'USD' },
    { name: 'Qatari Rial', isoCode: 'QAR' },
    { name: 'Euro', isoCode: 'EUR' },
    { name: 'Romanian Leu', isoCode: 'RON' },
    { name: 'Russian Ruble', isoCode: 'RUB' },
    { name: 'Rwanda Franc', isoCode: 'RWF' },
    { name: 'Euro', isoCode: 'EUR' },
    { name: 'Saint Helena Pound', isoCode: 'SHP' },
    { name: 'East Caribbean Dollar', isoCode: 'XCD' },
    { name: 'East Caribbean Dollar', isoCode: 'XCD' },
    { name: 'Euro', isoCode: 'EUR' },
    { name: 'Euro', isoCode: 'EUR' },
    { name: 'East Caribbean Dollar', isoCode: 'XCD' },
    { name: 'Tala', isoCode: 'WST' },
    { name: 'Euro', isoCode: 'EUR' },
    { name: 'Dobra', isoCode: 'STN' },
    { name: 'Saudi Riyal', isoCode: 'SAR' },
    { name: 'CFA Franc BCEAO', isoCode: 'XOF' },
    { name: 'Serbian Dinar', isoCode: 'RSD' },
    { name: 'Seychelles Rupee', isoCode: 'SCR' },
    { name: 'Leone', isoCode: 'SLL' },
    { name: 'Singapore Dollar', isoCode: 'SGD' },
    { name: 'Netherlands Antillean Guilder', isoCode: 'ANG' },
    { name: 'Sucre', isoCode: 'XSU' },
    { name: 'Euro', isoCode: 'EUR' },
    { name: 'Euro', isoCode: 'EUR' },
    { name: 'Solomon Islands Dollar', isoCode: 'SBD' },
    { name: 'Somali Shilling', isoCode: 'SOS' },
    { name: 'Rand', isoCode: 'ZAR' },
    { name: 'No universal currency', isoCode: '' },
    { name: 'South Sudanese Pound', isoCode: 'SSP' },
    { name: 'Euro', isoCode: 'EUR' },
    { name: 'Sri Lanka Rupee', isoCode: 'LKR' },
    { name: 'Sudanese Pound', isoCode: 'SDG' },
    { name: 'Surinam Dollar', isoCode: 'SRD' },
    { name: 'Norwegian Krone', isoCode: 'NOK' },
    { name: 'Swedish Krona', isoCode: 'SEK' },
    { name: 'Swiss Franc', isoCode: 'CHF' },
    { name: 'WIR Euro', isoCode: 'CHE' },
    { name: 'WIR Franc', isoCode: 'CHW' },
    { name: 'Syrian Pound', isoCode: 'SYP' },
    { name: 'New Taiwan Dollar', isoCode: 'TWD' },
    { name: 'Somoni', isoCode: 'TJS' },
    { name: 'Tanzanian Shilling', isoCode: 'TZS' },
    { name: 'Baht', isoCode: 'THB' },
    { name: 'US Dollar', isoCode: 'USD' },
    { name: 'CFA Franc BCEAO', isoCode: 'XOF' },
    { name: 'New Zealand Dollar', isoCode: 'NZD' },
    { name: 'Pa’anga', isoCode: 'TOP' },
    { name: 'Trinidad and Tobago Dollar', isoCode: 'TTD' },
    { name: 'Tunisian Dinar', isoCode: 'TND' },
    { name: 'Turkish Lira', isoCode: 'TRY' },
    { name: 'Turkmenistan New Manat', isoCode: 'TMT' },
    { name: 'US Dollar', isoCode: 'USD' },
    { name: 'Australian Dollar', isoCode: 'AUD' },
    { name: 'Uganda Shilling', isoCode: 'UGX' },
    { name: 'Hryvnia', isoCode: 'UAH' },
    { name: 'UAE Dirham', isoCode: 'AED' },
    { name: 'Pound Sterling', isoCode: 'GBP' },
    { name: 'US Dollar', isoCode: 'USD' },
    { name: 'US Dollar', isoCode: 'USD' },
    { name: 'US Dollar (Next day)', isoCode: 'USN' },
    { name: 'Peso Uruguayo', isoCode: 'UYU' },
    { name: 'Uruguay Peso en Unidades Indexadas (UI)', isoCode: 'UYI' },
    { name: 'Unidad Previsional', isoCode: 'UYW' },
    { name: 'Uzbekistan Sum', isoCode: 'UZS' },
    { name: 'Vatu', isoCode: 'VUV' },
    { name: 'Bolívar Soberano', isoCode: 'VES' },
    { name: 'Dong', isoCode: 'VND' },
    { name: 'US Dollar', isoCode: 'USD' },
    { name: 'US Dollar', isoCode: 'USD' },
    { name: 'CFP Franc', isoCode: 'XPF' },
    { name: 'Moroccan Dirham', isoCode: 'MAD' },
    { name: 'Yemeni Rial', isoCode: 'YER' },
    { name: 'Zambian Kwacha', isoCode: 'ZMW' },
    { name: 'Zimbabwe Dollar', isoCode: 'ZWL' },
    { name: 'Bond Markets Unit European Composite Unit (EURCO)', isoCode: 'XBA' },
    { name: 'Bond Markets Unit European Monetary Unit (E.M.U.-6)', isoCode: 'XBB' },
    { name: 'Bond Markets Unit European Unit of Account 9 (E.U.A.-9)', isoCode: 'XBC' },
    { name: 'Bond Markets Unit European Unit of Account 17 (E.U.A.-17)', isoCode: 'XBD' },
    { name: 'Codes specifically reserved for testing purposes', isoCode: 'XTS' },
    { name: 'The codes assigned for transactions where no currency is involved', isoCode: 'XXX' },
    { name: 'Gold', isoCode: 'XAU' },
    { name: 'Palladium', isoCode: 'XPD' },
    { name: 'Platinum', isoCode: 'XPT' },
    { name: 'Silver', isoCode: 'XAG' },
  ];

  print('20200930160509: Confirming new currencies are renamed');
  counter = db.currencies.find({ name: {
    $in: currencies.map(c => c.name) },
  lspId: PTI_ID }).count();
  assert(counter === 180, 'Missing currency for PTI');
  counter = db.currencies.find({ name: {
    $in: currencies.map(c => c.name) },
  lspId: PTS_ID }).count();
  assert(counter === 180, 'Missing currency for PTs');

  // 20200930160508
  print('20200930160508: Confirming currency index is removed');
  const collectionIndexes = db.currencies.getIndexes();
  counter = Object.keys(collectionIndexes).indexOf('name_1_lspId_1');
  assert(counter === -1, 'Currency index was not removed');

  // 20200930160507
  print('20200930160507: Confirming new roles');
  const newRoles3 = ['TEMPLATE_CREATE_ALL', 'TEMPLATE_READ_ALL', 'TEMPLATE_UPDATE_ALL', 'COMPANY-MIN-CHARGE_CREATE_ALL', 'COMPANY-MIN-CHARGE_UPDATE_ALL'];
  const rolesToRemove3 = ['QUOTE_TEMPLATE_CREATE_ALL', 'QUOTE_TEMPLATE_READ_ALL', 'QUOTE_TEMPLATE_UPDATE_ALL'];
  counter = db.roles.find({ name: { $in: newRoles3 } }).count(); // Should be 5
  assert(counter === 5, 'Failed to add new roles');
  counter = db.roles.find({ name: { $in: rolesToRemove3 } }).count(); // Should be 0
  assert(counter === 0, 'Failed to remove old roles');

  // 20201029111848
  print('20201029111848: Confirming new PTS template is added');
  counter = db.templates.find({ lspId: PTS_ID, name: 'Email Template PTS' }).count();
  assert(counter === 1, 'Failed to add new PTS template');

  // 20201029145923
  print('20201029145923: Confirming templates without name were removed');
  counter = db.templates.find({ name: '' }).count();
  assert(counter === 0, 'Failed to remove old templates');

  // 20201123153956
  print('20201123153956: Confirming role is renamed');
  counter = db.groups.find({ lspId: PTS_ID, name: 'LSP_ADMIN', roles: { $in: ['QUOTE_UPDATE_ALL'] } }).count(); // Should be 1
  assert(counter === 1, 'Failed to rename role for PTS');
  counter = db.groups.find({ lspId: PTI_ID, name: 'LSP_ADMIN', roles: { $in: ['QUOTE_UPDATE_ALL'] } }).count(); // Should be 1
  assert(counter === 1, 'Failed to rename role for PTI');

  // 20201125154948
  print('20201125154948: Confirming company rates languages denormalization');
  counter = db.companies.find({ lspId: PTS_ID, 'billingInformation.rates.sourceLanguage._id': { $exists: true } }).count(); // Should be >= 1
  assert(counter >= 1, 'Failed to denormalize sourceLanguage for company rates');
  counter = db.companies.find({ lspId: PTS_ID, 'billingInformation.rates.targetLanguage._id': { $exists: true } }).count(); // Should be >= 1
  assert(counter >= 1, 'Failed to denormalize targetLanguage for company rates');

  // 20201130193139
  print('20201130193139: Confirming all staff rates have an Id');
  counter = db.users.find({ 'staffDetails.rates._id': { $exists: true } }).count(); // Should be >= 1
  assert(counter >= 1, 'Failed to add rates id for staff users');

  // 20201130193026
  print('20201130193139: Confirming all vendor rates have an Id');
  counter = db.users.find({ 'vendorDetails.rates._id': { $exists: true } }).count(); // Should be >= 1
  assert(counter >= 1, 'Failed to add rates id for vendor users');

  // 20201130180532
  print('20201130193139: Confirming all company rates have an Id');
  counter = db.companies.find({ 'billingInformation.rates._id': { $exists: true } }).count(); // Should be >= 1
  assert(counter >= 1, 'Failed to add rates id for companies');

  // 20201204192330.js
  print('20201130193139: Confirming new PTS template');
  counter = db.templates.find({ lspId: PTS_ID, name: 'Master -USE THIS TEMPLATE for testing' }).count();
  assert(counter === 1, 'Failed to add new PTS template');

  // 20210106135206
  print('20210106135206: Confirming new roles');
  const newRoles4 = [
    'VENDOR-MIN-CHARGE_READ_ALL',
    'VENDOR-MIN-CHARGE_CREATE_ALL',
    'VENDOR-MIN-CHARGE_UPDATE_ALL',
  ];
  counter = db.roles.find({ name: { $in: newRoles4 } }).count(); // Should be 3
  assert(counter === 3, 'Failed to add new roles');
  counter = db.groups.find({ lspId: PTI_ID, name: 'LSP_ADMIN', roles: { $in: newRoles4 } }).count(); // Should be 1
  assert(counter === 1, 'Failed to add new roles to group for PTI');
  counter = db.groups.find({ lspId: PTS_ID, name: 'LSP_ADMIN', roles: { $in: newRoles4 } }).count(); // Should be 1
  assert(counter === 1, 'Failed to add new roles to group for PTS');

  // 20210222142921
  print('20210106135206: Confirming new LSP is added');
  counter = db.lsp.find({ name: 'US Bank' }).count();
  assert(counter === 1, 'Failed to add US Bank lsp');

  // 20210222142959
  const USBANK_LSP = db.lsp.findOne({ name: 'US Bank' });
  /*
  print('20210222142959: Confirming new users and groups for US Bank');
  const usBankProdUsers = ['ptzankova@protranslating.com', 'nurquiza@protranslating.com'];

  counter = db.users.find({ email: { $in: usBankProdUsers }, lsp: USBANK_LSP._id });
  assert(counter === 2, 'Missing prod users for US Bank');
  counter = db.grous.find({ name: 'LSP_ADMIN', lspId: USBANK_LSP._id }).count();
  assert(counter === 1, 'Missing LSP_ADMIN group for US Bank');
*/
  // 20210222142951
  print('20210222142951: Confirming US Bank currencies and languages are migrated');
  const ptsCurrenciesCount = db.currencies.find({ lspId: PTS_ID }).count();
  counter = db.currencies.find({ lspId: USBANK_LSP._id }).count();
  assert(ptsCurrenciesCount === counter, 'Failed to migrate currencies for US Bank');
  const ptsLanguagesCount = db.languages.find({ lspId: PTS_ID }).count();
  counter = db.languages.find({ lspId: USBANK_LSP._id }).count();
  assert(ptsLanguagesCount === counter, 'Failed to migrate languages for US Bank');

  // 20210222142942
  print('20210222142942: Confirming US Bank schedulers are migrated');
  const schedulersToCopy = [
    'forgotPassword',
    'backup-notifications-monthly',
    'quoted-request-creation-pm-email',
    'quote-client-approved-pm-email',
    'service-to-do-provider-notification',
    'request-creation-pm-email',
    'document-retention-policy',
    'bill-pending-approval-provider',
    'competence-audit-create',
    'competence-audit-update',
    'inactivate-user',
    'provider-availability-email',
    'quote-pending-approval-contact',
    'request-delivered-email',
    'request-creation-email',
    'request-modified-pm-email',
    'service-to-do-provider-conference',
    'service-to-do-provider-consecutive',
    'user-feedback-create-for-auditor',
    'user-feedback-update-for-auditor',
    'bill-flat-rate',
    'bill-invoice-per-period',
    'bill-paid-provider',
    'bill-variable-rate',
    'custom-query-last-result',
    'custom-query-run',
    'si-connector',
  ];
  counter = db.schedulers.find({ name: { $in: schedulersToCopy }, lspId: USBANK_LSP._id }).count();
  assert(counter === schedulersToCopy.length, 'Failed to migrate schedulers for US Bank');

  // 20210222142933
  print('20210222142933: Confirming US Bank groups are migrated');
  counter = db.groups.find({
    lspId: USBANK_LSP._id,
    name: { $in: ['LSP_ADMIN', 'LSP_VENDOR', 'LSP_PM'] },
  }).count();
  assert(counter === 3, 'Failed to add new groups to US Bank');

  // 20210310161320
  print('20210222142933: Confirming US Bank currency is migrated');
  const usBankUsdCurrency = db.currencies.findOne({ lspId: USBANK_LSP._id, name: 'US Dollar' });
  counter = db.lsp.find({
    _id: USBANK_LSP._id,
    'currencyExchangeDetails.base': usBankUsdCurrency._id,
    'currencyExchangeDetails.quote': usBankUsdCurrency._id,
    'currencyExchangeDetails.quotation': 1,
  }).count();
  assert(counter === 1, 'USD missing for US Bank');

  // 20210310213754
  print('20210310213754: Confirming countries are renamed');
  const countriesToUpdate = [
    'Vietnam',
    'Venezuela',
    'Vatican City State',
    'US Minor Outlying Islands',
    'Taiwan',
    'Sint Maarten',
    'Saint Helena',
    'Reunion',
    'Palestinian Territory, Occupied',
    'Macedonia',
    'Saint Martin',
    'Libyan Arab Jamahiriya',
    'Lao',
    "Korea, Demo. People's Rep",
    'Heard Is. & Mcdonald Islands',
    'S.Georgia & S.Sandwich Is',
    'Micronesia',
    'Congo, Democratic Republic',
    'Bolivia',
    'Saint Barthelemy',
    'Aland Islands',
    'Kosovo',
    'Netherlands Antilles',
  ];

  counter = db.countries.find({ name: { $in: countriesToUpdate } }).count();
  assert(counter === 23, 'Failed to rename countries');
};

