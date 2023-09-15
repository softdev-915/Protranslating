const emptyGenericTransaction = () => ({
  breakdown: {
    name: '',
  },
  currency: {
    name: '',
  },
  translationUnit: {
    name: '',
  },
  totalAmount: 0,
  unitPrice: 0,
  minimumCharge: 0,
  quantity: 0,
});
const emptyProjectedCost = () => emptyGenericTransaction();
const emptyInvoice = () => {
  const invoice = Object.assign({}, emptyGenericTransaction(), {
    visible: false,
  });
  return invoice;
};

const emptyBillDetail = () => ({
  breakdown: {
    name: '',
  },
  currency: {
    name: '',
  },
  translationUnit: {
    name: '',
  },
  total: 0,
  unitPrice: 0,
  quantity: 0,
});

const emptyQuantity = () => ({
  amount: 0,
  units: '',
});

const emptyProviderTask = () => ({
  provider: null,
  status: 'notStarted',
  files: [],
  notes: '',
  total: 0,
  minCharge: 0,
  quantity: [emptyQuantity()],
  billDetails: [emptyBillDetail()],
});

const emptyInvoiceDetail = () => ({
  invoice: emptyInvoice(),
  projectedCost: emptyProjectedCost(),
});

const emptyTask = () => ({
  ability: null,
  description: '',
  minCharge: 0,
  includedInGroup: false,
  invoiceDetails: [emptyInvoiceDetail()],
  providerTasks: [emptyProviderTask()],
});

const emptyWorkflow = () => ({
  index: 0,
  deleted: false,
  srcLang: {
    name: '',
    isoCode: '',
  },
  tgtLang: {
    name: '',
    isoCode: '',
  },
  description: '',
  subtotal: 0,
  discount: 0,
  tasks: [emptyTask()],
  documents: [],
  useMt: false,
});

module.exports = {
  emptyWorkflow,
};
