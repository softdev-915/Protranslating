
import moment from 'moment';

export const defaultUserNoteDetails = () => ({
  subject: '',
  comments: '',
  tags: [],
  isInvoice: false,
  invoiceNo: '',
});

export const defaultFeedbackDetails = () => ({
  internalDepartments: [],
  requests: [],
  company: {
    id: null,
    name: '',
    hierarchy: '',
  },
  nonComplianceClientComplaintCategory: '',
  status: '',
  car: '',
  documents: [],
  escalated: false,
  incidentDate: moment().format('MM-DD-YYYY'),
});

export const defaultEmailDetails = () => ({
  from: '',
  to: [],
  cc: [],
  bcc: [],
  internalDepartments: [],
  requests: [],
  opportunities: null,
  company: null,
  textBody: null,
  htmlBody: null,
  embeddedAttachments: [],
  scheduledAt: null,
  isQuote: false,
  isQuoteSent: false,
  isInvoice: false,
  isImported: false,
  invoiceNo: '',
  emailTemplate: '',
});

export const defaultActivity = () => ({
  activityType: '',
  activityCreatedBy: '',
  dateSent: moment(),
  users: [],
  subject: '',
  body: '',
  comments: '',
  tags: [],
  feedbackDetails: defaultFeedbackDetails(),
  userNoteDetails: defaultUserNoteDetails(),
  emailDetails: defaultEmailDetails(),
  deleted: false,
  readDate: null,
});
