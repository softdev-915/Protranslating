const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const countriesSiInfo = {
  'United States': { siCode: 'US', siCountry: 'United States' },
  Afghanistan: { siCode: 'AF', siCountry: 'Afghanistan' },
  'Aland Islands': { siCode: 'AX', siCountry: 'Aland Islands' },
  Albania: { siCode: 'AL', siCountry: 'Albania' },
  Algeria: { siCode: 'DZ', siCountry: 'Algeria' },
  'American Samoa': { siCode: 'AS', siCountry: 'American Samoa' },
  Andorra: { siCode: 'AD', siCountry: 'Andorra' },
  Angola: { siCode: 'AO', siCountry: 'Angola' },
  Anguilla: { siCode: 'AI', siCountry: 'Anguilla' },
  Antarctica: { siCode: 'AQ', siCountry: 'Antarctica' },
  'Antigua and Barbuda': { siCode: 'AG', siCountry: 'Antigua and Barbuda' },
  Argentina: { siCode: 'AR', siCountry: 'Argentina' },
  Armenia: { siCode: 'AM', siCountry: 'Armenia' },
  Aruba: { siCode: 'AW', siCountry: 'Aruba' },
  Australia: { siCode: 'AU', siCountry: 'Australia' },
  Austria: { siCode: 'AT', siCountry: 'Austria' },
  Azerbaijan: { siCode: 'AZ', siCountry: 'Azerbaijan' },
  Bahamas: { siCode: 'BS', siCountry: 'Bahamas' },
  Bahrain: { siCode: 'BH', siCountry: 'Bahrain' },
  Bangladesh: { siCode: 'BD', siCountry: 'Bangladesh' },
  Barbados: { siCode: 'BB', siCountry: 'Barbados' },
  Belarus: { siCode: 'BY', siCountry: 'Belarus' },
  Belgium: { siCode: 'BE', siCountry: 'Belgium' },
  Belize: { siCode: 'BZ', siCountry: 'Belize' },
  Benin: { siCode: 'BJ', siCountry: 'Benin' },
  Bermuda: { siCode: 'BM', siCountry: 'Bermuda' },
  Bhutan: { siCode: 'BT', siCountry: 'Bhutan' },
  Bolivia: { siCode: 'BO', siCountry: 'Bolivia' },
  'Bonaire, Sint Eustatius and Saba': { siCode: 'BQ', siCountry: 'Bonaire, Sint Eustatius and Saba' },
  'Bosnia and Herzegovina': { siCode: 'BA', siCountry: 'Bosnia and Herzegovina' },
  Botswana: { siCode: 'BW', siCountry: 'Botswana' },
  'Bouvet Island': { siCode: 'BV', siCountry: 'Bouvet Island' },
  Brazil: { siCode: 'BR', siCountry: 'Brazil' },
  'British Indian Ocean Territory': { siCode: 'IO', siCountry: 'British Indian Ocean Territory' },
  'Brunei Darussalam': { siCode: 'BN', siCountry: 'Brunei Darussalam' },
  Bulgaria: { siCode: 'BG', siCountry: 'Bulgaria' },
  'Burkina Faso': { siCode: 'BF', siCountry: 'Burkina Faso' },
  Burundi: { siCode: 'BI', siCountry: 'Burundi' },
  Cambodia: { siCode: 'KH', siCountry: 'Cambodia' },
  Cameroon: { siCode: 'CM', siCountry: 'Cameroon' },
  Canada: { siCode: 'CA', siCountry: 'Canada' },
  'Cape Verde': { siCode: 'CV', siCountry: 'Cape Verde' },
  'Cayman Islands': { siCode: 'KY', siCountry: 'Cayman Islands' },
  'Central African Republic': { siCode: 'CF', siCountry: 'Central African Republic' },
  Chad: { siCode: 'TD', siCountry: 'Chad' },
  Chile: { siCode: 'CL', siCountry: 'Chile' },
  China: { siCode: 'CN', siCountry: 'China' },
  'Christmas Island': { siCode: 'CX', siCountry: 'Christmas Island' },
  'Cocos (Keeling) Islands': { siCode: 'CC', siCountry: 'Cocos (Keeling) Islands' },
  Colombia: { siCode: 'CO', siCountry: 'Colombia' },
  Comoros: { siCode: 'KM', siCountry: 'Comoros' },
  Congo: { siCode: 'CG', siCountry: 'Congo' },
  'Congo, Democratic Republic': { siCode: 'CD', siCountry: 'Congo, Democratic Republic' },
  'Cook Islands': { siCode: 'CK', siCountry: 'Cook Islands' },
  'Costa Rica': { siCode: 'CR', siCountry: 'Costa Rica' },
  'Côte d\'Ivoire': { siCode: 'CI', siCountry: 'Côte d\'Ivoire' },
  Croatia: { siCode: 'HR', siCountry: 'Croatia' },
  Cuba: { siCode: 'CU', siCountry: 'Cuba' },
  Curaçao: { siCode: 'CW', siCountry: 'Curacao' },
  Cyprus: { siCode: 'CY', siCountry: 'Cyprus' },
  'Czech Republic': { siCode: 'CZ', siCountry: 'Czech Republic' },
  Denmark: { siCode: 'DK', siCountry: 'Denmark' },
  Djibouti: { siCode: 'DJ', siCountry: 'Djibouti' },
  Dominica: { siCode: 'DM', siCountry: 'Dominica' },
  'Dominican Republic': { siCode: 'DO', siCountry: 'Dominican Republic' },
  Ecuador: { siCode: 'EC', siCountry: 'Ecuador' },
  Egypt: { siCode: 'EG', siCountry: 'Egypt' },
  'El Salvador': { siCode: 'SV', siCountry: 'El Salvador' },
  'Equatorial Guinea': { siCode: 'GQ', siCountry: 'Equatorial Guinea' },
  Eritrea: { siCode: 'ER', siCountry: 'Eritrea' },
  Estonia: { siCode: 'EE', siCountry: 'Estonia' },
  Ethiopia: { siCode: 'ET', siCountry: 'Ethiopia' },
  'Falkland Islands (Malvinas)': { siCode: 'FK', siCountry: 'Falkland Islands (Malvinas)' },
  'Faroe Islands': { siCode: 'FO', siCountry: 'Faroe Islands' },
  Fiji: { siCode: 'FJ', siCountry: 'Fiji' },
  Finland: { siCode: 'FI', siCountry: 'Finland' },
  France: { siCode: 'FR', siCountry: 'France' },
  'French Guiana': { siCode: 'GF', siCountry: 'French Guiana' },
  'French Polynesia': { siCode: 'PF', siCountry: 'French Polynesia' },
  'French Southern Territories': { siCode: 'TF', siCountry: 'French Southern Territories' },
  Gabon: { siCode: 'GA', siCountry: 'Gabon' },
  Gambia: { siCode: 'GM', siCountry: 'Gambia' },
  Georgia: { siCode: 'GE', siCountry: 'Georgia' },
  Germany: { siCode: 'DE', siCountry: 'Germany' },
  Ghana: { siCode: 'GH', siCountry: 'Ghana' },
  Gibraltar: { siCode: 'GI', siCountry: 'Gibraltar' },
  Greece: { siCode: 'GR', siCountry: 'Greece' },
  Greenland: { siCode: 'GL', siCountry: 'Greenland' },
  Grenada: { siCode: 'GD', siCountry: 'Grenada' },
  Guadeloupe: { siCode: 'GP', siCountry: 'Guadeloupe' },
  Guam: { siCode: 'GU', siCountry: 'Guam' },
  Guatemala: { siCode: 'GT', siCountry: 'Guatemala' },
  Guernsey: { siCode: 'GG', siCountry: 'Guernsey' },
  Guinea: { siCode: 'GN', siCountry: 'Guinea' },
  'Guinea-Bissau': { siCode: 'GW', siCountry: 'Guinea-Bissau' },
  Guyana: { siCode: 'GY', siCountry: 'Guyana' },
  Haiti: { siCode: 'HT', siCountry: 'Haiti' },
  'Heard Is. & Mcdonald Islands': { siCode: 'HM', siCountry: 'Heard Is. & Mcdonald Islands' },
  Honduras: { siCode: 'HN', siCountry: 'Honduras' },
  'Hong Kong': { siCode: 'HK', siCountry: 'Hong Kong' },
  Hungary: { siCode: 'HU', siCountry: 'Hungary' },
  Iceland: { siCode: 'IS', siCountry: 'Iceland' },
  India: { siCode: 'IN', siCountry: 'India' },
  Indonesia: { siCode: 'ID', siCountry: 'Indonesia' },
  'Iran, Islamic Republic of': { siCode: 'IR', siCountry: 'Iran, Islamic Republic of' },
  Iraq: { siCode: 'IQ', siCountry: 'Iraq' },
  Ireland: { siCode: 'IE', siCountry: 'Ireland' },
  'Isle of Man': { siCode: 'IM', siCountry: 'Isle of Man' },
  Israel: { siCode: 'IL', siCountry: 'Israel' },
  Italy: { siCode: 'IT', siCountry: 'Italy' },
  Jamaica: { siCode: 'JM', siCountry: 'Jamaica' },
  Japan: { siCode: 'JP', siCountry: 'Japan' },
  Jersey: { siCode: 'JE', siCountry: 'Jersey' },
  Jordan: { siCode: 'JO', siCountry: 'Jordan' },
  Kazakhstan: { siCode: 'KZ', siCountry: 'Kazakhstan' },
  Kenya: { siCode: 'KE', siCountry: 'Kenya' },
  Kiribati: { siCode: 'KI', siCountry: 'Kiribati' },
  'Korea, Republic of': { siCode: 'KR', siCountry: 'Korea, Republic of' },
  'Korea, Demo. People\'s Rep': { siCode: 'KP', siCountry: 'Korea, Demo. People\'s Rep.' },
  Kosovo: { siCode: 'XK', siCountry: 'Kosovo' },
  Kuwait: { siCode: 'KW', siCountry: 'Kuwait' },
  Kyrgyzstan: { siCode: 'KG', siCountry: 'Kyrgyzstan' },
  Lao: { siCode: 'LA', siCountry: 'Lao' },
  Latvia: { siCode: 'LV', siCountry: 'Latvia' },
  Lebanon: { siCode: 'LB', siCountry: 'Lebanon' },
  Lesotho: { siCode: 'LS', siCountry: 'Lesotho' },
  Liberia: { siCode: 'LR', siCountry: 'Liberia' },
  'Libyan Arab Jamahiriya': { siCode: 'LY', siCountry: 'Libyan Arab Jamahiriya' },
  Liechtenstein: { siCode: 'LI', siCountry: 'Liechtenstein' },
  Lithuania: { siCode: 'LT', siCountry: 'Lithuania' },
  Luxembourg: { siCode: 'LU', siCountry: 'Luxembourg' },
  Macao: { siCode: 'MO', siCountry: 'Macao' },
  Macedonia: { siCode: 'MK', siCountry: 'Macedonia' },
  Madagascar: { siCode: 'MG', siCountry: 'Madagascar' },
  Malawi: { siCode: 'MW', siCountry: 'Malawi' },
  Malaysia: { siCode: 'MY', siCountry: 'Malaysia' },
  Maldives: { siCode: 'MV', siCountry: 'Maldives' },
  Mali: { siCode: 'ML', siCountry: 'Mali' },
  Malta: { siCode: 'MT', siCountry: 'Malta' },
  'Marshall Islands': { siCode: 'MH', siCountry: 'Marshall Islands' },
  Martinique: { siCode: 'MQ', siCountry: 'Martinique' },
  Mauritania: { siCode: 'MR', siCountry: 'Mauritania' },
  Mauritius: { siCode: 'MU', siCountry: 'Mauritius' },
  Mayotte: { siCode: 'YT', siCountry: 'Mayotte' },
  Mexico: { siCode: 'MX', siCountry: 'Mexico' },
  Micronesia: { siCode: 'FM', siCountry: 'Micronesia' },
  'Moldova, Republic of': { siCode: 'MD', siCountry: 'Moldova, Republic of' },
  Monaco: { siCode: 'MC', siCountry: 'Monaco' },
  Mongolia: { siCode: 'MN', siCountry: 'Mongolia' },
  Montenegro: { siCode: 'ME', siCountry: 'Montenegro' },
  Montserrat: { siCode: 'MS', siCountry: 'Montserrat' },
  Morocco: { siCode: 'MA', siCountry: 'Morocco' },
  Mozambique: { siCode: 'MZ', siCountry: 'Mozambique' },
  Myanmar: { siCode: 'MM', siCountry: 'Myanmar' },
  Namibia: { siCode: 'NA', siCountry: 'Namibia' },
  Nauru: { siCode: 'NR', siCountry: 'Nauru' },
  Nepal: { siCode: 'NP', siCountry: 'Nepal' },
  Netherlands: { siCode: 'NL', siCountry: 'Netherlands' },
  'Netherlands Antilles': { siCode: 'AN', siCountry: 'Netherlands Antilles' },
  'New Caledonia': { siCode: 'NC', siCountry: 'New Caledonia' },
  'New Zealand': { siCode: 'NZ', siCountry: 'New Zealand' },
  Nicaragua: { siCode: 'NI', siCountry: 'Nicaragua' },
  Niger: { siCode: 'NE', siCountry: 'Niger' },
  Nigeria: { siCode: 'NG', siCountry: 'Nigeria' },
  Niue: { siCode: 'NU', siCountry: 'Niue' },
  'Norfolk Island': { siCode: 'NF', siCountry: 'Norfolk Island' },
  'Northern Mariana Islands': { siCode: 'MP', siCountry: 'Northern Mariana Islands' },
  Norway: { siCode: 'NO', siCountry: 'Norway' },
  Oman: { siCode: 'OM', siCountry: 'Oman' },
  Pakistan: { siCode: 'PK', siCountry: 'Pakistan' },
  Palau: { siCode: 'PW', siCountry: 'Palau' },
  'Palestinian Territory, Occupied': { siCode: 'PS', siCountry: 'Palestinian Territory, Occupied' },
  Panama: { siCode: 'PA', siCountry: 'Panama' },
  'Papua New Guinea': { siCode: 'PG', siCountry: 'Papua New Guinea' },
  Paraguay: { siCode: 'PY', siCountry: 'Paraguay' },
  Peru: { siCode: 'PE', siCountry: 'Peru' },
  Philippines: { siCode: 'PH', siCountry: 'Philippines' },
  Pitcairn: { siCode: 'PN', siCountry: 'Pitcairn' },
  Poland: { siCode: 'PL', siCountry: 'Poland' },
  Portugal: { siCode: 'PT', siCountry: 'Portugal' },
  'Puerto Rico': { siCode: 'PR', siCountry: 'Puerto Rico' },
  Qatar: { siCode: 'QA', siCountry: 'Qatar' },
  Reunion: { siCode: 'RE', siCountry: 'Reunion' },
  Romania: { siCode: 'RO', siCountry: 'Romania' },
  'Russian Federation': { siCode: 'RU', siCountry: 'Russian Federation' },
  Rwanda: { siCode: 'RW', siCountry: 'Rwanda' },
  'Saint Barthelemy': { siCode: 'BL', siCountry: 'Saint Barthelemy' },
  'Saint Helena': { siCode: 'SH', siCountry: 'Saint Helena' },
  'Saint Kitts and Nevis': { siCode: 'KN', siCountry: 'Saint Kitts and Nevis' },
  'Saint Lucia': { siCode: 'LC', siCountry: 'Saint Lucia' },
  'Saint Martin': { siCode: 'MF', siCountry: 'Saint Martin' },
  'Saint Pierre and Miquelon': { siCode: 'PM', siCountry: 'Saint Pierre and Miquelon' },
  'Saint Vincent and the Grenadines': { siCode: 'VC', siCountry: 'Saint Vincent and the Grenadines' },
  Samoa: { siCode: 'WS', siCountry: 'Samoa' },
  'San Marino': { siCode: 'SM', siCountry: 'San Marino' },
  'Sao Tome and Principe': { siCode: 'ST', siCountry: 'Sao Tome and Principe' },
  'Saudi Arabia': { siCode: 'SA', siCountry: 'Saudi Arabia' },
  Senegal: { siCode: 'SN', siCountry: 'Senegal' },
  Serbia: { siCode: 'RS', siCountry: 'Serbia' },
  Seychelles: { siCode: 'SC', siCountry: 'Seychelles' },
  'Sierra Leone': { siCode: 'SL', siCountry: 'Sierra Leone' },
  Singapore: { siCode: 'SG', siCountry: 'Singapore' },
  'Sint Maarten': { siCode: 'SX', siCountry: 'Sint Maarten' },
  Slovakia: { siCode: 'SK', siCountry: 'Slovakia' },
  Slovenia: { siCode: 'SI', siCountry: 'Slovenia' },
  'Solomon Islands': { siCode: 'SB', siCountry: 'Solomon Islands' },
  Somalia: { siCode: 'SO', siCountry: 'Somalia' },
  'South Africa': { siCode: 'ZA', siCountry: 'South Africa' },
  'S.Georgia & S.Sandwich Is': { siCode: 'GS', siCountry: 'S. Georgia & S. Sandwich Is.' },
  Spain: { siCode: 'ES', siCountry: 'Spain' },
  'Sri Lanka': { siCode: 'LK', siCountry: 'Sri Lanka' },
  Sudan: { siCode: 'SD', siCountry: 'Sudan' },
  'South Sudan': { siCode: 'SS', siCountry: 'South Sudan' },
  Suriname: { siCode: 'SR', siCountry: 'Suriname' },
  'Svalbard and Jan Mayen': { siCode: 'SJ', siCountry: 'Svalbard and Jan Mayen' },
  Swaziland: { siCode: 'SZ', siCountry: 'Swaziland' },
  Sweden: { siCode: 'SE', siCountry: 'Sweden' },
  Switzerland: { siCode: 'CH', siCountry: 'Switzerland' },
  'Syrian Arab Republic': { siCode: 'SY', siCountry: 'Syrian Arab Republic' },
  Taiwan: { siCode: 'TW', siCountry: 'Taiwan' },
  Tajikistan: { siCode: 'TJ', siCountry: 'Tajikistan' },
  'Tanzania, United Republic of': { siCode: 'TZ', siCountry: 'Tanzania, United Republic of' },
  Thailand: { siCode: 'TH', siCountry: 'Thailand' },
  'Timor-Leste': { siCode: 'TL', siCountry: 'Timor-Leste' },
  Togo: { siCode: 'TG', siCountry: 'Togo' },
  Tokelau: { siCode: 'TK', siCountry: 'Tokelau' },
  Tonga: { siCode: 'TO', siCountry: 'Tonga' },
  'Trinidad and Tobago': { siCode: 'TT', siCountry: 'Trinidad and Tobago' },
  Tunisia: { siCode: 'TN', siCountry: 'Tunisia' },
  Turkey: { siCode: 'TR', siCountry: 'Turkey' },
  Turkmenistan: { siCode: 'TM', siCountry: 'Turkmenistan' },
  'Turks and Caicos Islands': { siCode: 'TC', siCountry: 'Turks and Caicos Islands' },
  Tuvalu: { siCode: 'TV', siCountry: 'Tuvalu' },
  Uganda: { siCode: 'UG', siCountry: 'Uganda' },
  Ukraine: { siCode: 'UA', siCountry: 'Ukraine' },
  'United Arab Emirates': { siCode: 'AE', siCountry: 'United Arab Emirates' },
  'United Kingdom': { siCode: 'GB', siCountry: 'United Kingdom' },
  'US Minor Outlying Islands': { siCode: 'UM', siCountry: 'US Minor Outlying Islands' },
  Uruguay: { siCode: 'UY', siCountry: 'Uruguay' },
  Uzbekistan: { siCode: 'UZ', siCountry: 'Uzbekistan' },
  Vanuatu: { siCode: 'VU', siCountry: 'Vanuatu' },
  'Vatican City State': { siCode: 'VA', siCountry: 'Vatican City State' },
  Venezuela: { siCode: 'VE', siCountry: 'Venezuela' },
  Vietnam: { siCode: 'VN', siCountry: 'Vietnam' },
  'Virgin Islands, British': { siCode: 'VG', siCountry: 'Virgin Islands, British' },
  'Virgin Islands, U.S.': { siCode: 'VI', siCountry: 'Virgin Islands, U.S.' },
  'Wallis and Futuna': { siCode: 'WF', siCountry: 'Wallis and Futuna' },
  'Western Sahara': { siCode: 'EH', siCountry: 'Western Sahara' },
  Yemen: { siCode: 'YE', siCountry: 'Yemen' },
  Zambia: { siCode: 'ZM', siCountry: 'Zambia' },
  Zimbabwe: { siCode: 'ZW', siCountry: 'Zimbabwe' },
};

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const countryCol = db.collection('countries');
    return Promise.map(Object.keys(countriesSiInfo), countryName =>
      countryCol.updateOne({
        name: countryName,
      }, { $set: countriesSiInfo[countryName] }),
    );
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
