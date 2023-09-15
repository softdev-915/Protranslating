
const extraPipelines = () => [
  { $addFields: { email: '$billTo.email' } },
  {
    $project: {
      email: 1,
      entityNo: 1,
      status: 1,
      createdAt: 1,
      updatedAt: 1,
    },
  },
];
const extraQueryParams = () => ['email'];
const PAYMENT_STATUSES = {
  DRAFTED: 'DRAFTED',
  FAILED: 'FAILED',
  TRANSMITTED: 'TRANSMITTED',
  AUTHORIZED: 'AUTHORIZED',
  DECLINED: 'DECLINED',
  CAPTURED: 'CAPTURED',
  NOT_FOUND: 'NOT FOUND',
};

const LOCAL_PAYMENT_STATUSES = {
  AUTHORIZED: PAYMENT_STATUSES.DRAFTED,
  DECLINED: PAYMENT_STATUSES.FAILED,
  PENDING: PAYMENT_STATUSES.DRAFTED,
  TRANSMITTED: PAYMENT_STATUSES.TRANSMITTED,
  FAILED: PAYMENT_STATUSES.FAILED,
};

module.exports = {
  PAYMENT_STATUSES,
  LOCAL_PAYMENT_STATUSES,
  extraPipelines,
  extraQueryParams,
};
