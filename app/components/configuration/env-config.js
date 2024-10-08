const getenv = require('getenv');

const NODE_ENV = getenv('NODE_ENV');
const IS_DEV = NODE_ENV === 'DEV';
const IS_PROD = NODE_ENV === 'PROD';
const IS_UNIT = NODE_ENV === 'UNIT';
const config = () => ({
  IS_DEV,
  IS_PROD,
  IS_UNIT,
  CRYPTO_KEY_PATH: getenv('CRYPTO_KEY_PATH'),
  AUDIT_TRAIL_FULL_RESPONSE: getenv.bool('AUDIT_TRAIL_FULL_RESPONSE'),
  NODE_LOGS_PATH: getenv('NODE_LOGS_PATH'),
  NODE_LOGS_FILTER: getenv.array('NODE_LOGS_FILTER', 'string'),
  NODE_LOGS_LEVEL: getenv('NODE_LOGS_LEVEL'),
  RAW_BODY_PAYLOAD_LIMIT: getenv('RAW_BODY_PAYLOAD_LIMIT'),
  MONGODB_LMS_CONNECTION_STRING: getenv('MONGODB_LMS_CONNECTION_STRING'),
  MONGODB_LMS_AUTH_CONNECTION_STRING: getenv('MONGODB_LMS_AUTH_CONNECTION_STRING'),
  MONGODB_LMS_AUDIT_CONNECTION_STRING: getenv('MONGODB_LMS_AUDIT_CONNECTION_STRING'),
  LMS_SECONDARY_CONNECTION_STRING: getenv('LMS_SECONDARY_CONNECTION_STRING'),
  LMS_FILES_PATH: getenv('LMS_FILES_PATH'),
  LMS_KEY: getenv('LMS_KEY'),
  LMS_CRT: getenv('LMS_CRT'),
  HTTP_HOST: getenv('HTTP_HOST'),
  HTTP_PORT: getenv.int('HTTP_PORT'),
  HTTPS_ON: getenv.bool('HTTPS_ON'),
  SESSION_TIMEOUT: getenv.int('SESSION_TIMEOUT'),
  AWS_S3_KEY: getenv('AWS_S3_KEY'),
  AWS_S3_SECRET: getenv('AWS_S3_SECRET'),
  AWS_S3_BUCKET: getenv('AWS_S3_BUCKET'),
  GCS_KEY_FILE: getenv('GCS_KEY_FILE'),
  GCS_BUCKET: getenv('GCS_BUCKET'),
  LMS_BACKUP_AUDIT_PREFIX: getenv('LMS_BACKUP_AUDIT_PREFIX'),
  LMS_BACKUP_AUDIT_CONNECTION_STRING: getenv('LMS_BACKUP_AUDIT_CONNECTION_STRING'),
  LMS_BACKUP_AUDIT_COLLECTIONS: getenv('LMS_BACKUP_AUDIT_COLLECTIONS'),
  LMS_BACKUP_NOTIFICATION_PATH: getenv('LMS_BACKUP_NOTIFICATION_PATH'),
  LMS_BACKUP_NOTIFICATION_PREFIX: getenv('LMS_BACKUP_NOTIFICATION_PREFIX'),
  LMS_BACKUP_NOTIFICATION_CONNECTION_STRING: getenv('LMS_BACKUP_NOTIFICATION_CONNECTION_STRING'),
  LMS_BACKUP_NOTIFICATION_COLLECTIONS: getenv('LMS_BACKUP_NOTIFICATION_COLLECTIONS'),
  USE_SECURE_COOKIES: getenv('USE_SECURE_COOKIES'),
  S3_START_MULTIPART_COPY_AT_BYTES: getenv.int('S3_START_MULTIPART_COPY_AT_BYTES'),
  ARCHIVE_FILES_IN_AWS: getenv.bool('ARCHIVE_FILES_IN_AWS'),
  PC_BASE_URL: getenv('PC_BASE_URL'),
  MIGRATIONS_DISABLED: getenv.bool('MIGRATIONS_DISABLED'),
  SESSION_WITH_2FA_TIMEOUT: getenv.int('SESSION_WITH_2FA_TIMEOUT'),
  HOTP_MOCK_VALUE: getenv('HOTP_MOCK_VALUE'),
  ENTITY_NUMBER_STARTS_AT: getenv.int('ENTITY_NUMBER_STARTS_AT'),
  CQ_MAX_EXECUTION_MINUTES: getenv.int('CQ_MAX_EXECUTION_MINUTES'),
  PAYMENT_WRITE_PARALLEL_OPERATIONS_NUMBER: getenv.int('PAYMENT_WRITE_PARALLEL_OPERATIONS_NUMBER'),
  BILLS_TO_PROCESS_NUMBER_FOR_VENDOR_BALANCE_UPDATE: getenv.int('BILLS_TO_PROCESS_NUMBER_FOR_VENDOR_BALANCE_UPDATE'),
  AR_INVOICE_TOTAL_NUMBER_OF_BATCH_ENTRIES: getenv.int('AR_INVOICE_TOTAL_NUMBER_OF_BATCH_ENTRIES'),
  AP_PAYMENT_TOTAL_NUMBER_OF_BATCH_ENTRIES: getenv.int('AP_PAYMENT_TOTAL_NUMBER_OF_BATCH_ENTRIES'),
  PWD_SALT_ROUND: getenv.int('PWD_SALT_ROUND'),
  LOG_AUDIT_TRAILS: getenv.bool('LOG_AUDIT_TRAILS'),
  IMPORT_MODULE_ENTITIES: getenv.array('IMPORT_MODULE_ENTITIES'),
  PORTALMT_BASE_URL: getenv('PORTALMT_BASE_URL'),
  HEAP_SNAPSHOT_MEM_LOWER_LIMIT_GB: getenv.float('HEAP_SNAPSHOT_MEM_LOWER_LIMIT_GB'),
  HEAP_SNAPSHOT_MEM_UPPER_LIMIT_GB: getenv.float('HEAP_SNAPSHOT_MEM_UPPER_LIMIT_GB'),
  MEMORY_CHECK_INTERVAL_MS: getenv.int('MEMORY_CHECK_INTERVAL_MS'),
  HEAPDUMP_AFTER_TIME: getenv('HEAPDUMP_AFTER_TIME'),
  HEAPDUMP_BEFORE_TIME: getenv('HEAPDUMP_BEFORE_TIME'),
  BILL_PROVIDER_TASKS_BATCH_SIZE: getenv.int('BILL_PROVIDER_TASKS_BATCH_SIZE'),
});

const mockUnitTestConfig = () => ({
  IS_UNIT: true,
  CRYPTO_KEY_PATH: 'CRYPTO_KEY_PATH',
  AUDIT_TRAIL_FULL_RESPONSE: false,
  LMS_FILES_PATH: 'LMS_FILES_PATH',
  NODE_LOGS_PATH: '',
  NODE_LOGS_FILTER: 'password,creditCard,emailDetails',
  NODE_LOGS_LEVEL: 'silly',
  EMAIL_CONNECTION_STRING: 'smtp://user:password@host:port',
  MONGODB_LMS_CONNECTION_STRING: 'MONGODB_LMS_CONNECTION_STRING',
  MONGODB_LMS_AUTH_CONNECTION_STRING: 'MONGODB_LMS_AUTH_CONNECTION_STRING',
  MONGODB_LMS_AUDIT_CONNECTION_STRING: 'MONGODB_LMS_AUDIT_CONNECTION_STRING',
  LMS_SECONDARY_CONNECTION_STRING: 'LMS_SECONDARY_CONNECTION_STRING',
  SESSION_TIMEOUT: 20,
  HTTP_HOST: 'localhost',
  HTTP_PORT: '8000',
  LMS_KEY: 'LMS_KEY',
  LMS_CRT: 'LMS_CRT',
  AWS_S3_KEY: 'AWS_S3_KEY',
  AWS_S3_SECRET: 'AWS_S3_SECRET',
  AWS_S3_BUCKET: 'AWS_S3_BUCKET',
  FORGOT_PASSWORD_FROM: 'system@biglanguage.com',
});

module.exports = IS_UNIT ? mockUnitTestConfig() : config();
