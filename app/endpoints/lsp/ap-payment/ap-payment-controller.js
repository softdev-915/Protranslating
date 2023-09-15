const _ = require('lodash');
const apiResponse = require('../../../components/api-response');
const requestUtils = require('../../../utils/request');
const ApPaymentAPI = require('./ap-payment-api');
const BillAPI = require('../bill/bill-api');
const BillAdjustmentAPI = require('../bill-adjustment/bill-adjustment-api');
const UserAPI = require('../user/user-api');
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');
const configuration = require('../../../components/configuration');
const SiConnectorAPI = require('../../../connectors/si/si-connector-api');
const defaultController = require('../../../utils/default-controller');

const { sendResponse, RestError, streamFile } = apiResponse;
const AP_PAYMENT_POSTED_STATUS = 'posted';
const BILL_ADJUSTMENT_TYPE_CREDIT_MEMO = 'Credit Memo';
const ID_PREFIX_BILL_ADJUSTMENT = 'BA_';
const ID_PREFIX_BILL = 'B_';
const VENDOR_DEBIT_MEMO_AVAILABLE_PATH = 'vendorDetails.debitMemoAvailable';
const AP_TO_BILL_ADJUSTMENT_FIELD_RELATIONS = { no: 'adjustmentNo', billNo: 'referenceBillNo' };
const AP_TO_BILL_FIELD_RELATIONS = { billNo: 'no' };
const getAccountPayableFilters = (req) => {
  const filters = _.get(req, 'query.params.filter', _.get(req, 'query.filter'));
  let originalFilter = filters;
  if (_.isString(filters)) {
    originalFilter = JSON.parse(filters);
  }
  const commonFilter = { __tz: _.get(req, 'headers.lms-tz', 0) };
  const billAdjustmentPaginationFilter = {};
  const billPaginationFilter = {};
  Object.keys(originalFilter).forEach((param) => {
    const billAdjustmentField = _.get(AP_TO_BILL_ADJUSTMENT_FIELD_RELATIONS, param, param);
    billAdjustmentPaginationFilter[billAdjustmentField] = originalFilter[param];
    const billField = _.get(AP_TO_BILL_FIELD_RELATIONS, param, param);
    billPaginationFilter[billField] = originalFilter[param];
  });
  billAdjustmentPaginationFilter.type = BILL_ADJUSTMENT_TYPE_CREDIT_MEMO;
  const billAdjustmentFilter = { ...commonFilter, paginationParams: { filter: JSON.stringify(billAdjustmentPaginationFilter) } };
  const billFilter = { ...commonFilter, paginationParams: { filter: JSON.stringify(billPaginationFilter) } };
  return { billAdjustmentFilter, billFilter };
};
const controller = defaultController(ApPaymentAPI, 'apPayment', { enableAttachmentsHandling: true });
const accountPayableList = async (req) => {
  const user = requestUtils.getUserFromSession(req);
  const apiOptions = {
    log: req.$logger, configuration, user, mock: _.get(req, 'flags.mock', false),
  };
  const billAdjustmentApi = new BillAdjustmentAPI(apiOptions);
  const paginableBillAdjustmentApiDecorator = new PaginableAPIDecorator(billAdjustmentApi, req);
  const billApi = new BillAPI(apiOptions);
  const paginableBillApiDecorator = new PaginableAPIDecorator(billApi, req);
  const userApi = new UserAPI(req.$logger, apiOptions);
  let accountsPayable = [];
  const { billAdjustmentFilter, billFilter } = getAccountPayableFilters(req);
  const billAdjustments = await paginableBillAdjustmentApiDecorator.list(billAdjustmentFilter);
  const billAdjustmentVendorsIds = _.get(billAdjustments, 'list', []).map((billAdjustment) => _.get(billAdjustment, 'vendor._id', billAdjustment.vendor));
  const billAdjustmentVendors = await userApi.findByIds(billAdjustmentVendorsIds);
  accountsPayable = _.get(billAdjustments, 'list', []).map((billAdjustment) => {
    const vendorId = _.get(billAdjustment, 'vendor._id', billAdjustment.vendor);
    const vendor = billAdjustmentVendors.find((v) => vendorId.equals(v._id));
    return {
      _id: ID_PREFIX_BILL_ADJUSTMENT + billAdjustment._id,
      no: billAdjustment.adjustmentNo,
      billNo: billAdjustment.referenceBillNo,
      vendorId,
      vendorName: billAdjustment.vendorName,
      status: billAdjustment.status,
      creditsAvailable: _.get(vendor, VENDOR_DEBIT_MEMO_AVAILABLE_PATH, 0),
      billBalance: +billAdjustment.adjustmentBalance,
      appliedToType: 'billAdjustment',
    };
  });
  const bills = await paginableBillApiDecorator.list(billFilter);
  const billVendorsIds = _.get(bills, 'list', []).map((bill) => bill.vendor);
  const billVendors = await userApi.findByIds(billVendorsIds);
  const apBills = _.get(bills, 'list', []).map((bill) => {
    const vendor = billVendors.find((v) => bill.vendor.equals(v._id));
    let vendorName = _.get(vendor, 'vendorDetails.vendorCompany');
    if (_.isEmpty(vendorName) && !_.isNil(vendor)) {
      vendorName = `${vendor.firstName} ${vendor.lastName}`;
    }
    const {
      status,
      balance,
      dueDate,
      createdAt,
      updatedAt,
      deletedAt,
      restoredAt,
      createdBy,
      updatedBy,
      deletedBy,
      restoredBy,
      vendorPaymentMethodName: paymentMethod,
    } = bill;
    return {
      _id: `${ID_PREFIX_BILL}${bill._id}`,
      no: bill.no,
      paymentMethod,
      vendorId: vendor._id,
      vendorName,
      status,
      creditsAvailable: _.get(vendor, VENDOR_DEBIT_MEMO_AVAILABLE_PATH, 0),
      billBalance: +balance,
      dueDate,
      appliedToType: 'bill',
      createdAt,
      updatedAt,
      deletedAt,
      restoredAt,
      createdBy,
      updatedBy,
      deletedBy,
      restoredBy,
    };
  });
  accountsPayable = accountsPayable.concat(apBills);
  return accountsPayable;
};

controller.accountPayableList = async (req, res) => {
  let accountsPayable = [];
  try {
    accountsPayable = await accountPayableList(req);
  } catch (error) {
    throw new RestError(500, error);
  }
  return sendResponse(res, 200, { list: accountsPayable, total: accountsPayable.length });
};

controller.accountPayableExport = async (req, res) => {
  const user = requestUtils.getUserFromSession(req);
  const api = new ApPaymentAPI(req.$logger, { user, configuration, flags: req.flags });
  let accountsPayable = [];
  try {
    req.query.limit = 1e6;
    accountsPayable = await accountPayableList(req);
    const file = await api.accountPayableListExport(accountsPayable);
    streamFile(res, file);
  } catch (err) {
    req.$logger.debug(`Failed to export account payable list for ap payment: ${err}`);
    throw new RestError(500, {
      message: `Failed to export account payable list for ap payment: ${err}`,
    });
  }
};

controller.create = async (req, res) => {
  const { NODE_ENV } = configuration.environment;
  const isProd = NODE_ENV === 'PROD';
  const user = requestUtils.getUserFromSession(req);
  const apPayment = _.get(req, 'swagger.params.data.value');
  apPayment.status = AP_PAYMENT_POSTED_STATUS;
  const api = new ApPaymentAPI(req.$logger, { user, configuration, flags: req.flags });
  const siAPI = new SiConnectorAPI(req.flags);
  try {
    delete apPayment._id;
    const newApPayments = await api.create(apPayment);
    await sendResponse(res, 200);
    try {
      const newApPaymentIds = newApPayments.map(({ _id }) => _id);
      const syncEntityOnCreation = _.get(req.flags, 'syncEntityOnCreation', true);
      if (syncEntityOnCreation || isProd) {
        await siAPI.syncApPayments({ _id: { $in: newApPaymentIds } });
      }
    } catch (e) {
      req.$logger.debug(`Failed to sync ap payments: ${e}`);
    }
  } catch (err) {
    req.$logger.debug(`Failed to create ap payments due to error: ${err}`);
    throw new RestError(500, {
      message: `Failed to create Ap payments: ${err}`,
    });
  }
};

controller.update = async (req, res) => {
  try {
    const user = requestUtils.getUserFromSession(req);
    const apPayment = _.get(req, 'swagger.params.data.value');
    const api = new ApPaymentAPI(req.$logger, { user, configuration, flags: req.flags });
    const siAPI = new SiConnectorAPI(req.flags);
    const updatedApPayment = await api.edit(apPayment);
    return sendResponse(res, 200, { apPayment: updatedApPayment })
      .then(() => siAPI.syncApPayments({ _id: updatedApPayment._id }));
  } catch (error) {
    req.$logger.debug('Failed to sync ap payment:', error);
    throw new RestError(500, error);
  }
};

controller.void = async (req, res) => {
  const id = _.get(req, 'swagger.params.id.value');
  const data = _.get(req, 'swagger.params.data.value');
  const user = requestUtils.getUserFromSession(req);
  const api = new ApPaymentAPI(req.$logger, { user, configuration, flags: req.flags });
  let apPayment;
  try {
    apPayment = await api.void(id, data);
  } catch (error) {
    req.$logger.debug(`Failed to void ap payment: ${JSON.stringify(error)}`);
    throw new RestError(500, error);
  }
  return sendResponse(res, 200, { apPayment });
};

module.exports = controller;
