const mongoose = require('mongoose');
const moment = require('moment');
const _ = require('lodash');
const Promise = require('bluebird');
const apiResponse = require('../../../components/api-response');
const AbstractRequestAPI = require('../request/abstract-request-api');
const ConcurrencyReadDateChecker = require('../../../utils/concurrency');
const { searchFactory } = require('../../../utils/pagination');
const { exportFactory } = require('../../../utils/pagination');
const ServerURLFactory = require('../../../components/application/server-url-factory');
const EmailQueue = require('../../../components/email/templates');
const { ACTIVITY_ATTACHMENT_STORAGE_GCS } = require('../../../components/email/email-consts');
const { CsvExport } = require('../../../utils/csvExporter');
const NotificationScheduler = require('../../../components/scheduler/notifications');
const CloudStorage = require('../../../components/cloud-storage');
const configuration = require('../../../components/configuration');
const VersionableFileStorage = require('../../../components/file-storage/versionable-file-storage-facade');
const FileStorageFacade = require('../../../components/file-storage');
const helper = require('./activity-api-helper');
const { validObjectId } = require('../../../utils/schema');
const { getRoles } = require('../../../utils/roles');
const ActivityDocumentAPI = require('./document/activity-document-api');

const { ObjectId } = mongoose.Types;
const { RestError } = apiResponse;
const ACTIVITY_FEEDBACK_TYPE = 'Feedback';
const REQUEST_WAITING_FOR_APPROVAL_STATUS = 'Waiting for approval';
const SCHEDULER_NAME_INVOICE = 'invoice-submission-notification';
const knownSchedulerTemplates = [
  'user-feedback-create-for-auditor',
  'user-feedback-update-for-auditor',
  'competence-audit-create',
  'competence-audit-update',
];
const ACTIVITY_FEEDBACK_CREATION_FOR_AUDITOR_EMAIL = 'user-feedback-create-for-auditor';
const ACTIVITY_FEEDBACK_UPDATION_FOR_AUDITOR_EMAIL = 'user-feedback-update-for-auditor';
const COMPETENCE_AUDIT_CREATION_EMAIL = 'competence-audit-create';
const COMPETENCE_AUDIT_UPDATION_EMAIL = 'competence-audit-update';
const ACTIVITY_FEEDBACK_UPDATION_FOR_AUDITOR_EMAIL_REQUIRED_STATUSES = [
  'onHold',
  'inProgress',
  'completed',
  'cancelled',
];

const ACTIVITY_COMPETENCE_UPDATION_FOR_AUDITOR_EMAIL_REQUIRED_STATUSES = [
  'reviewerAssigned',
  'formSent',
  'LMPendingReview',
  'LMSignOff',
  'reviewCompleted',
];

const ACTIVITY_TYPE_HEAP = {
  Feedback: 'feedbackDetails',
  'User Note': 'userNoteDetails',
  Email: 'emailDetails',
};

const STATUS_OPTIONS = {
  toBeProcessed: 'To Be Processed',
  onHold: 'On Hold',
  inProgress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  reviewerRequired: 'Reviewer Required',
  reviewerAssigned: 'Reviewer Assigned',
  formSent: 'Form Sent',
  LMPendingReview: 'LM Pending Review',
  LMSignOff: 'LM Sign Off',
  reviewCompleted: 'Review Completed',
  reviewVoid: 'Review Void',
};

const POPULATE_ACTIVITY_FIELDS = [
  {
    path: 'users',
    select: '_id firstName lastName email',
    options: { withDeleted: true },
  },
  {
    path: 'emailDetails.opportunities',
    select: '_id no',
  },
  {
    path: 'feedbackDetails.requests',
    select: '_id no status',
  },
  {
    path: 'emailDetails.requests',
    select: '_id no status',
  },
  {
    path: 'feedbackDetails.company',
    select: '_id name status',
  },
  {
    path: 'emailDetails.company',
    select: '_id name status',
  },
];
class ActivityApi extends AbstractRequestAPI {
  /**
   * @param {Object} logger
   * @param {Object} options optional object.
   * @param {Object} options.configuration configuration.
   * @param {Object} options.user user that is user api.
   */
  constructor(logger, options) {
    options.log = logger;
    super(options);
    this.emailQueue = new EmailQueue(this.logger, this.schema, this.configuration);
    this.configuration = _.get(options, 'configuration', configuration);
    this.FileStorageFacade = FileStorageFacade;
    this.VersionableFileStorage = VersionableFileStorage;
    this.cloudStorage = new CloudStorage(this.configuration, this.logger);
    this.serverURLFactory = new ServerURLFactory(this.configuration);
    this.serverUrl = this.serverURLFactory.buildServerURL();
    this.notificationScheduler = new NotificationScheduler('quote', this.configuration);
    this.notificationScheduler.schema = this.schema;
    this.notificationScheduler.logger = this.logger;
    const envConfig = configuration.environment;

    this.isTestEnvironment = envConfig.NODE_ENV !== 'PROD';
    const shouldMock = _.get(this.user, 'email', '').match('@sample.com') && this.isTestEnvironment;

    this.mockFlag = options.mock || shouldMock;
  }

  async getQueryFilters(filters) {
    let query = {};

    if (filters && filters._id) {
      query._id = filters._id;
    }
    const SORT_ACTIVITY_FIELDS = _.get(filters, 'paginationParams.sort', { name: 1 });

    query.sort = SORT_ACTIVITY_FIELDS;
    query = await this.addQueryFilters(query);
    const pipeline = [
      {
        $addFields: {
          internalDepartments: {
            $switch: {
              branches: [
                { case: { $eq: ['$activityType', 'Feedback'] }, then: '$feedbackDetails.internalDepartments' },
                { case: { $eq: ['$activityType', 'Email'] }, then: '$emailDetails.internalDepartments' },
              ],
              default: undefined,
            },
          },
          requests: {
            $switch: {
              branches: [
                { case: { $eq: ['$activityType', 'Feedback'] }, then: '$feedbackDetails.requests' },
                { case: { $eq: ['$activityType', 'Email'] }, then: '$emailDetails.requests' },
              ],
              default: undefined,
            },
          },
          company: {
            $switch: {
              branches: [
                { case: { $eq: ['$activityType', 'Feedback'] }, then: '$feedbackDetails.company' },
                { case: { $eq: ['$activityType', 'Email'] }, then: '$emailDetails.company' },
              ],
              default: undefined,
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'users',
          foreignField: '_id',
          as: 'users',
        },
      },
      {
        $lookup: {
          from: 'internalDepartments',
          localField: 'internalDepartments',
          foreignField: '_id',
          as: 'internalDepartments',
        },
      },
      {
        $lookup: {
          from: 'requests',
          localField: 'requests',
          foreignField: '_id',
          as: 'requests',
        },
      },
      {
        $lookup: {
          from: 'companies',
          localField: 'company',
          foreignField: '_id',
          as: 'company',
        },
      },
      {
        $lookup: {
          from: 'opportunities',
          localField: 'emailDetails.opportunities',
          foreignField: '_id',
          as: 'opportunitiesNo',
        },
      },
      {
        $addFields: {
          files: {
            $map: {
              input: '$feedbackDetails.documents',
              as: 'fileVersions',
              in: { $arrayElemAt: ['$$fileVersions', 0] },
            },
          },
        },
      },
      {
        $addFields: {
          emailTextBody: '$emailDetails.textBody',
          companyStatus: '$company.status',
          invoiceNo: { $ifNull: ['$emailDetails.invoiceNo', '$userNoteDetails.invoiceNo'] },
          inactiveText: {
            $switch: {
              branches: [
                { case: { $eq: ['$deleted', true] }, then: 'true' },
                { case: { $eq: ['$deleted', false] }, then: 'false' },
              ],
              default: '',
            },
          },
          company: {
            $reduce: {
              input: '$company',
              initialValue: '',
              in: {
                $concat: ['$$value', '$$this.name'],
              },
            },
          },
          files: {
            $reduce: {
              input: '$files',
              initialValue: '',
              in: {
                $cond: {
                  if: {
                    $eq: [{ $indexOfArray: ['$files', '$$this'] }, 0],
                  },
                  then: { $concat: ['$$value', '$$this.name'] },
                  else: { $concat: ['$$value', ', ', '$$this.name'] },
                },
              },
            },
          },
          requests: {
            $reduce: {
              input: '$requests',
              initialValue: '',
              in: {
                $cond: {
                  if: {
                    $eq: [{ $indexOfArray: ['$requests', '$$this'] }, 0],
                  },
                  then: { $concat: ['$$value', '$$this.no'] },
                  else: { $concat: ['$$value', ', ', '$$this.no'] },
                },
              },
            },
          },
          internalDepartments: {
            $reduce: {
              input: '$internalDepartments',
              initialValue: '',
              in: {
                $cond: {
                  if: {
                    $eq: [{ $indexOfArray: ['$internalDepartments', '$$this'] }, 0],
                  },
                  then: { $concat: ['$$value', '$$this.name'] },
                  else: { $concat: ['$$value', ', ', '$$this.name'] },
                },
              },
            },
          },
          users: {
            $reduce: {
              input: '$users',
              initialValue: '',
              in: {
                $cond: {
                  if: {
                    $eq: [{ $indexOfArray: ['$users', '$$this'] }, 0],
                  },
                  then: { $concat: ['$$value', '$$this.firstName', ' ', '$$this.lastName'] },
                  else: { $concat: ['$$value', ', ', '$$this.firstName', ' ', '$$this.lastName'] },
                },
              },
            },
          },
          tags: {
            $reduce: {
              input: '$tags',
              initialValue: '',
              in: {
                $cond: {
                  if: {
                    $eq: [{ $indexOfArray: ['$tags', '$$this'] }, 0],
                  },
                  then: { $concat: ['$$value', '$$this'] },
                  else: { $concat: ['$$value', ', ', '$$this'] },
                },
              },
            },
          },
          fromText: '$emailDetails.from',
          toText: {
            $reduce: {
              input: '$emailDetails.to',
              initialValue: '',
              in: {
                $cond: {
                  if: {
                    $eq: [{ $indexOfArray: ['$emailDetails.to', '$$this'] }, 0],
                  },
                  then: { $concat: ['$$value', '$$this'] },
                  else: { $concat: ['$$value', ', ', '$$this'] },
                },
              },
            },
          },
          ccText: {
            $reduce: {
              input: '$emailDetails.cc',
              initialValue: '',
              in: {
                $cond: {
                  if: {
                    $eq: [{ $indexOfArray: ['$emailDetails.cc', '$$this'] }, 0],
                  },
                  then: { $concat: ['$$value', '$$this'] },
                  else: { $concat: ['$$value', ', ', '$$this'] },
                },
              },
            },
          },
          bccText: {
            $reduce: {
              input: '$emailDetails.bcc',
              initialValue: '',
              in: {
                $cond: {
                  if: {
                    $eq: [{ $indexOfArray: ['$emailDetails.bcc', '$$this'] }, 0],
                  },
                  then: { $concat: ['$$value', '$$this'] },
                  else: { $concat: ['$$value', ', ', '$$this'] },
                },
              },
            },
          },
          failedEmailsText: {
            $reduce: {
              input: '$emailDetails.failedEmails',
              initialValue: '',
              in: {
                $cond: {
                  if: {
                    $eq: [{ $indexOfArray: ['$failedEmails', '$$this'] }, 0],
                  },
                  then: { $concat: ['$$value', '$$this'] },
                  else: { $concat: ['$$value', ', ', '$$this'] },
                },
              },
            },
          },
          opportunityNumbersText: {
            $reduce: {
              input: '$opportunitiesNo',
              initialValue: '',
              in: {
                $cond: {
                  if: {
                    $eq: [{ $indexOfArray: ['$opportunitiesNo', '$$this'] }, 0],
                  },
                  then: { $concat: ['$$value', '$$this.no'] },
                  else: { $concat: ['$$value', ', ', '$$this.no'] },
                },
              },
            },
          },
          attachmentsText: {
            $reduce: {
              input: '$emailDetails.embeddedAttachments',
              initialValue: '',
              in: {
                $cond: {
                  if: {
                    $eq: [{ $indexOfArray: ['$emailDetails.embeddedAttachments', '$$this'] }, 0],
                  },
                  then: { $concat: ['$$value', '$$this.name'] },
                  else: { $concat: ['$$value', ', ', '$$this.name'] },
                },
              },
            },
          },
        },
      },
    ];

    const extraQueryParams = ['inactiveText', 'users', 'tags', 'internalDepartments', 'requests',
      'company', 'files', 'fromText', 'toText', 'ccText', 'bccText', 'opportunityNumbersText', 'failedEmailsText',
      'attachmentsText', 'emailTextBody', 'companyStatus', 'invoiceNo'];

    // Search all activities
    query = Object.assign(query, {
      lspId: this.lspId,
    }, _.get(filters, 'paginationParams', {}));
    return {
      query,
      pipeline,
      extraQueryParams,
    };
  }

  /**
   * Returns the added filters
   * @param {Object} filters filter the activitys returned.
   */
  async addQueryFilters(filters) {
    const clone = _.cloneDeep(filters);

    clone.$or = clone.$or || [];

    if (this.user) {
      const userRoles = getRoles(this.user);
      const { DEPARTMENT } = helper.getRequiredTagsToFilterActivities(userRoles);
      const user = !_.isEmpty(DEPARTMENT)
        ? await this.schema.User.findOneWithDeleted({ _id: this.user._id })
        : this.user;

      clone.$or = clone.$or.concat(helper.getConditionStatementToReadActivities(user));
    }
    if (!clone.$or.length) {
      delete clone.$or;
    }
    return clone;
  }

  /**
   * Returns the activity's list
   * @param {Object} activityFilters to filter the activitys returned.
   * @param {String} activityFilters.id the activity's id to filter.
   */
  async activityList(filters) {
    this.logger.debug(`User ${this.user.email} retrieved the activity list`);

    let list = [];
    const queryFilters = await this.getQueryFilters(filters);

    // Search specific activity
    if (filters._id) {
      try {
        list = await this.schema.Activity.findWithDeleted({
          _id: filters._id,
          lspId: this.lspId,
        }).populate(POPULATE_ACTIVITY_FIELDS);
        if (list.length) {
          const activity = list[0];
          const activeTypeDetails = _.get(ACTIVITY_TYPE_HEAP, activity.activityType, '');
          const company = _.get(list[0], `${activeTypeDetails}.company`, null);

          if (company) {
            _.set(activity, `${activeTypeDetails}.company.hierarchy`, company.hierarchy);
          }
        }
      } catch (e) {
        const message = e.message || e;
        const errorMessage = `Getting activity detail failed. Reason: ${message}`;

        this.logger.error(errorMessage);
      }
    } else {
      // Search all activities
      list = await searchFactory({
        model: this.schema.Activity,
        filters: queryFilters.query,
        extraPipelines: queryFilters.pipeline,
        extraQueryParams: queryFilters.extraQueryParams,
        utcOffsetInMinutes: filters.__tz,
      });
    }
    return {
      list,
      total: list.length,
    };
  }

  /**
   * Returns the activities list as a csv file
   * @param {Object} groupFilters to filter the groups returned.
   */
  async activityExport(filters) {
    this.logger.debug(`User ${this.user.email} retrieved an activity list export file`);
    const queryFilters = await this.getQueryFilters(filters);
    const cursor = await exportFactory(
      this.schema.Activity,
      queryFilters.query,
      queryFilters.pipeline,
      queryFilters.extraQueryParams,
      filters.__tz,
    );

    const csvExporter = new CsvExport(cursor, {
      schema: this.schema.Activity,
      lspId: this.lspId,
      configuration: this.configuration,
      logger: this.logger,
      filters: queryFilters,
    });
    return csvExporter.export();
  }

  async create(activity) {
    this.logger.debug(`User ${this.user.email} creating new activity`);
    if (this.isTestEnvironment) {
      activity.isMocked = this.mockFlag;
    }
    const defActivity = {
      lspId: this.lspId,
    };
    const newActivity = new this.schema.Activity(defActivity);
    const activeType = ACTIVITY_TYPE_HEAP[activity.activityType];

    if (activeType && activity.activityType === ACTIVITY_FEEDBACK_TYPE) {
      const company = _.get(activity[activeType], 'company', '');
      const activityStatus = _.get(activity, `${activeType}.status`);

      if (!activityStatus || !Object.keys(STATUS_OPTIONS).includes(activityStatus)) {
        throw new RestError(400, { message: 'status is not valid' });
      }

      if (!company.length) {
        delete activity[activeType].company;
      } else if (!validObjectId(company)) {
        throw new RestError(400, { message: 'company is not valid' });
      }

      const internalDepartments = _.get(activity[activeType], 'internalDepartments');

      if (!_.isArray(internalDepartments)) {
        delete activity[activeType].internalDepartments;
      } else {
        _.forEach(internalDepartments, (it) => {
          if (!validObjectId(it)) {
            throw new RestError(400, { message: 'internal departments is not valid' });
          }
        });
      }

      const requests = _.get(activity[activeType], 'requests');

      if (!_.isArray(requests)) {
        delete activity[activeType].requests;
      } else {
        _.forEach(requests, (r) => {
          if (!validObjectId(r)) {
            throw new RestError(400, { message: 'requests is not valid' });
          }
        });
      }
    }
    // Note: mongoose can assign [{_id:..., name: ..}, ...] to [ObjectId, ...]
    newActivity.safeAssign(_.omit(activity, ['users']));

    const users = _.get(activity, 'users', []);

    newActivity.users = users
      .filter((o) => o._id && validObjectId(o._id))
      .map((o) => o._id);
    const activityDocumentApi = new ActivityDocumentAPI(this.user, this.configuration, this.logger);

    await activityDocumentApi.ensureDocumentsUploaded(newActivity);
    const savedActivity = await newActivity.save();

    this.logger.debug(`New activity is saved to db: htmlBody value: ${_.get(savedActivity, 'emailDetails.htmlBody')}`);

    if (activeType && activity.activityType === ACTIVITY_FEEDBACK_TYPE) {
      if (!Array.isArray(savedActivity.feedbackDetails.internalDepartments)) {
        savedActivity.feedbackDetails.internalDepartments = [];
      }
      try {
        await this._processActivityNotifications(savedActivity, activity, 'create');
      } catch (e) {
        const message = e.message || e;

        this.logger.debug(`Error sending email: Error: ${message}`);
        // even if the email could not be sent, the request should not fail
      }
    }
    const savedActivityCompany = _.get(savedActivity, `${activeType}.company`);

    if (!_.isNil(savedActivityCompany)) {
      _.set(savedActivity, `${activeType}.company.hierarchy`, savedActivityCompany.hierarchy);
    }
    const populatedActivity = await this._populateAfterFinish(savedActivity);
    return populatedActivity;
  }

  async update(activity) {
    this.logger.debug(`User ${this.user.email} updating new activity`);

    const _id = new ObjectId(activity._id);
    const userRoles = getRoles(this.user);
    const activityInDb = await this.schema.Activity.findOneWithDeleted({
      lspId: this.lspId,
      _id,
    });

    if (!activityInDb) {
      throw new RestError(404, { message: 'Activity does not exist' });
    }
    const activeType = ACTIVITY_TYPE_HEAP[activity.activityType];
    const activityFeedbackInDbStatus = _.get(activityInDb, 'feedbackDetails.status', '');
    const activityFeedbackInDbEscalated = _.get(activityInDb, 'feedbackDetails.escalated');
    const canUpdateActivity = helper.canUpdateActivity(userRoles, activityInDb, this.checkIfUserOwnsActivity(activityInDb));

    if (!canUpdateActivity) {
      throw new RestError(403, { message: 'The user is not authorized to update this activity' });
    }

    const concurrencyReadDateChecker = new ConcurrencyReadDateChecker(this.user, this.logger, {
      entityName: 'activity',
    });
    await concurrencyReadDateChecker.failIfOldEntity(activityInDb);

    activityInDb.safeAssign(_.omit(activity, 'users'));

    const users = _.get(activity, 'users', []);

    activityInDb.users = users
      .filter((o) => o._id && validObjectId(o._id))
      .map((o) => o._id);
    activityInDb.markModified('users');

    if (activeType && activity.activityType === ACTIVITY_FEEDBACK_TYPE) {
      const activityStatus = _.get(activity, `${activeType}.status`);

      if (!activityStatus || !Object.keys(STATUS_OPTIONS).includes(activityStatus)) {
        throw new RestError(400, { message: 'status is not valid' });
      }
      activityInDb[activeType].status = activityStatus;

      if (!_.get(activity[activeType], 'nonComplianceClientComplaintCategory', '')) {
        activityInDb[activeType].nonComplianceClientComplaintCategory = undefined;
      }

      const company = _.get(activity[activeType], 'company', '');

      if (!company.length) {
        activityInDb[activeType].company = undefined;
      } else if (!validObjectId(company)) {
        throw new RestError(400, { message: 'company is not valid' });
      }

      const internalDepartments = _.get(activity[activeType], 'internalDepartments', []);

      if (!_.isArray(internalDepartments)) {
        throw new RestError(400, { message: 'internal departments is not valid' });
      } else {
        _.forEach(internalDepartments, (it) => {
          if (!validObjectId(it)) {
            throw new RestError(400, { message: 'internal departments is not valid' });
          }
        });
      }

      const requests = _.get(activity[activeType], 'requests');

      if (!_.isArray(requests)) {
        throw new RestError(400, { message: 'request numbers is not valid' });
      } else {
        _.forEach(requests, (r) => {
          if (!validObjectId(r)) {
            throw new RestError(400, { message: 'request numbers is not valid' });
          }
        });
      }
    }

    activityInDb.deleted = _.isBoolean(activity.deleted) ? activity.deleted : false;
    activityInDb.markModified(activeType);
    const savedActivity = await activityInDb.save();

    // sending notifications
    if (activeType && activity.activityType === ACTIVITY_FEEDBACK_TYPE) {
      if (activityFeedbackInDbStatus !== savedActivity.feedbackDetails.status) {
        if (ACTIVITY_FEEDBACK_UPDATION_FOR_AUDITOR_EMAIL_REQUIRED_STATUSES
          .includes(savedActivity.feedbackDetails.status)) {
          try {
            await this._processActivityNotifications(savedActivity, activity, 'update', 'feedback');
          } catch (e) {
            const message = e.message || e;

            this.logger.debug(`Error sending email: Error: ${message}`);
            // even if the email could not be sent, the request should not fail
          }
        }

        if (ACTIVITY_COMPETENCE_UPDATION_FOR_AUDITOR_EMAIL_REQUIRED_STATUSES
          .includes(savedActivity.feedbackDetails.status)) {
          try {
            await this._processActivityNotifications(savedActivity, activity, 'update', 'competence');
          } catch (e) {
            const message = e.message || e;

            this.logger.debug(`Error sending email: Error: ${message}`);
            // even if the email could not be sent, the request should not fail
          }
        }
      } else if (!activityFeedbackInDbEscalated && savedActivity.feedbackDetails.escalated) {
        try {
          await this._processActivityNotifications(savedActivity, activity, 'update', 'feedback');
        } catch (e) {
          const message = e.message || e;

          this.logger.debug(`Error sending email: Error: ${message}`);
          // even if the email could not be sent, the request should not fail
        }
      }
    }
    const savedActivityCompany = _.get(savedActivity, `${activeType}.company`);

    if (!_.isNil(savedActivityCompany)) {
      _.set(savedActivity, `${activeType}.company.hierarchy`, savedActivityCompany.hierarchy);
    }
    const populatedActivity = await this._populateAfterFinish(savedActivity);
    return populatedActivity;
  }

  async _processActivityNotifications(activityInDb, incomeActivity, action, notificationType = null) {
    this.logger.debug(`The server URL is ${this.serverUrl}`);

    if (action !== 'create' && action !== 'update') {
      throw new Error(`Unknown action type ${action}`);
    }

    const emailPromises = [];
    const tagsInsertedIndb = Array.isArray(activityInDb.tags) ? activityInDb.tags : [];
    const usersRequiredRolesToReceiveActivityNotification = helper.getEmailRequiredRoles(tagsInsertedIndb, 'read');
    const creatorRequiredRolesToReceiveActivityNotification = helper.getEmailRequiredRoles(tagsInsertedIndb, 'create');
    let updatorRequiredRolesToReceiveActivityNotification = {
      feedback: null,
      competence: null,
    };

    if (action === 'update') {
      updatorRequiredRolesToReceiveActivityNotification = helper.getEmailRequiredRoles(tagsInsertedIndb, 'update');
    }

    let usersToSendFeedbackNotification = [];
    let usersToSendCompetenceNotification = [];

    if (action === 'create' || notificationType === 'competence') {
      usersToSendCompetenceNotification = await this.schema.User
        .getUsersWhichMustReceiveActivityCreateUpdateNotificationLeaned(
          action,
          activityInDb,
          creatorRequiredRolesToReceiveActivityNotification.competence,
          usersRequiredRolesToReceiveActivityNotification.competence,
          updatorRequiredRolesToReceiveActivityNotification.competence,
        );
    }

    if (action === 'create' || notificationType === 'feedback') {
      usersToSendFeedbackNotification = await this.schema.User
        .getUsersWhichMustReceiveActivityCreateUpdateNotificationLeaned(
          action,
          activityInDb,
          creatorRequiredRolesToReceiveActivityNotification.feedback,
          usersRequiredRolesToReceiveActivityNotification.feedback,
          updatorRequiredRolesToReceiveActivityNotification.feedback,
        );
    }
    const activityToEmail = {
      _id: activityInDb._id,
      status: STATUS_OPTIONS[incomeActivity.feedbackDetails.status] || '',
      lspId: activityInDb.lspId || '',
      users: incomeActivity.users,
      createdBy: activityInDb.activityCreatedBy || '',
      createdAt: activityInDb.createdAt || '',
      updatedAt: activityInDb.updatedAt || '',
      updatedBy: activityInDb.updatedBy || '',
      subject: incomeActivity.subject || '',
      comments: incomeActivity.comments || '',
      tags: Array.isArray(incomeActivity.tags) ? incomeActivity.tags.join(',') : '',
    };
    const feedbackTemplateName = action === 'create' ? ACTIVITY_FEEDBACK_CREATION_FOR_AUDITOR_EMAIL : ACTIVITY_FEEDBACK_UPDATION_FOR_AUDITOR_EMAIL;

    if (Array.isArray(usersToSendFeedbackNotification)) {
      usersToSendFeedbackNotification.forEach((user) => {
        emailPromises.push(this._sendEmail(
          feedbackTemplateName,
          user,
          { activity: activityToEmail, path: this.serverUrl },
        ));
      });
    }

    const competenceTemplateName = action === 'create' ? COMPETENCE_AUDIT_CREATION_EMAIL : COMPETENCE_AUDIT_UPDATION_EMAIL;

    if (Array.isArray(usersToSendCompetenceNotification)) {
      usersToSendCompetenceNotification.forEach((user) => {
        emailPromises.push(this._sendEmail(
          competenceTemplateName,
          user,
          { activity: activityToEmail, path: this.serverUrl },
        ));
      });
    }
    await new Promise((resolve, reject) => {
      this.logger.debug('Sending new activity emails');
      Promise.all(emailPromises).then(resolve).catch(reject);
    });
  }

  async(documentId) {
    const fileStorageFacade = new this.FileStorageFacade(
      this.lspId,
      this.configuration,
      this.logger,
    );
    const file = fileStorageFacade.activityEmailDocument(documentId);
    return { file };
  }

  async zipFilesStream(user, activityToFind, documentIds, res) {
    const { lspId } = this;
    const query = {
      _id: activityToFind,
      lspId,
    };
    const activityInDb = await this.schema.Activity.findOne(query);

    if (!activityInDb) {
      this.logger.info(`Activity ${activityToFind} not found`);
      throw new RestError(404, { message: 'Activity not found' });
    }
    const activityDocuments = _.get(activityInDb, 'feedbackDetails.documents.length', 0)
      && activityInDb.feedbackDetails.documents.filter((docVersionsArray) => docVersionsArray.filter((d) => documentIds.includes(d._id.toString())).length);

    if (!activityDocuments || !activityDocuments.length) {
      this.logger.info(`Activity ${activityToFind}, request document ids ${documentIds} not mutch any document`);
      throw new RestError(400, { message: 'Activity ids not mutch any document' });
    }
    const versionableFileStorageFacade = new this.VersionableFileStorage(lspId, this.configuration, activityDocuments, this.logger);
    const files = helper.activityDocumentList(
      activityInDb._id,
      activityDocuments,
      versionableFileStorageFacade,
    );

    try {
      await this.cloudStorage.streamZipFile({
        res, files, zipFileName: `${activityInDb._id}.zip`, dbDocuments: activityDocuments,
      });
    } catch (err) {
      const message = _.get(err, 'message', err);

      this.logger.error(`Error writing zip file. Error: ${message}`);
      throw new RestError(500, { message: 'Error generating zip file', stack: err.stack });
    }
  }

  async _sendEmail(templateName, user, data) {
    if (!knownSchedulerTemplates.includes(templateName)) {
      return this.logger.debug(`Error sending activity ${templateName} emails: unknown template name`);
    }
    const emailContext = { activity: data.activity, path: data.path, user };

    try {
      await this.emailQueue.send({
        templateName,
        context: emailContext,
        lspId: this.lspId,
        mock: this.mockFlag,
      });
    } catch (e) {
      const message = e.message || e;

      this.logger.debug(`Error sending activity ${templateName} emails: ${message}`);
    }
  }

  async findOne(activity) {
    const activityId = activity;
    let activityInDb;

    if (_.isString(activityId)) {
      activityInDb = await this.schema.Activity.findOne({
        _id: new ObjectId(activityId),
        lspId: this.lspId,
      });
    } else {
      activityInDb = activity;
    }
    if (!_.isNil(activityInDb)) {
      this.logger.debug(`User ${this.user.email} retrieved an activity`);
      return activityInDb;
    }
    throw new RestError(404, {
      message: `Activity with id: ${activityId} was not found`,
    });
  }

  checkIfUserOwnsActivity(activity) {
    return activity.createdBy
      && activity.createdBy === this.user.email;
  }

  async _populateAfterFinish(activity) {
    const populatedActivity = await this.schema.Activity.populate(activity, POPULATE_ACTIVITY_FIELDS);
    const activeTypeDetails = _.get(ACTIVITY_TYPE_HEAP, activity.activityType, '');
    const company = _.get(populatedActivity, `${activeTypeDetails}.company`, null);

    if (company) {
      _.set(populatedActivity, `${activeTypeDetails}.company.hierarchy`);
    }
    return populatedActivity;
  }

  async _getActivityAttachment(activity, attachmentFilterName = null) {
    const activityAttachments = _.get(activity, 'emailDetails.embeddedAttachments', []);
    const message = `Activity with id ${activity._id} is missing the pdf file`;
    if (_.isEmpty(activityAttachments)) {
      this.logger.debug(message);
      throw new RestError(500, { message });
    }
    const activityDocument = _.isNil(attachmentFilterName)
      ? activityAttachments[0]
      : activityAttachments.find((a) => _.get(a, 'name', '').match(attachmentFilterName));
    if (_.isEmpty(activityDocument)) {
      this.logger.debug(message);
      throw new RestError(500, { message });
    }
    return {
      storage: ACTIVITY_ATTACHMENT_STORAGE_GCS,
      path: activityDocument.cloudKey,
      name: _.get(activityDocument, 'name', ''),
      size: _.get(activityDocument, 'size', 0),
    };
  }

  async sendInvoiceEmail(activityId) {
    const activity = await this.schema.Activity.findOne({ _id: new ObjectId(activityId) });
    if (_.isEmpty(activity)) {
      throw new RestError(404, { message: `Activity with id: ${activity._id} was not found` });
    }
    this.logger.debug(`Queueing email activity ${activityId}`);
    const { emailDetails, subject } = activity;
    const { to, cc, bcc } = emailDetails;
    const {
      from, scheduledAt, htmlBody, invoiceNo = [],
    } = emailDetails;
    const preparedCCEmails = cc.map((e) => [e]);
    const emailAddresses = _.compact([to, bcc, ...preparedCCEmails]);
    const invoice = await this.schema.ArInvoice.findOne({ lspId: this.lspId, no: invoiceNo }).select('contact').lean();

    if (_.isEmpty(invoice)) {
      throw new RestError(404, { message: `Invoice with number: ${invoiceNo} was not found` });
    }
    const context = { path: this.serverUrl, user: invoice.contact };
    const {
      path, storage, name, size,
    } = await this._getActivityAttachment(activity);
    const email = {
      context,
      templateName: SCHEDULER_NAME_INVOICE,
      useScheduler: false,
      modifications: null,
      from,
      recordId: activity._id,
      scheduledAt,
      attachment: [
        { data: htmlBody, alternative: true },
        {
          path, type: 'application/pdf', name, storage, size,
        },
      ],
      scheduler: {
        email: { subject, template: htmlBody, from },
      },
      mock: this.mockFlag,
      lspId: this.lspId,
    };
    const failedQueueEmails = [];
    await Promise.map(emailAddresses, async (emailAddress) => {
      if (_.isEmpty(emailAddress)) {
        return true;
      }
      email.to = emailAddress;
      const wasNotificationQueued = await this.emailQueue.send(email);
      if (!wasNotificationQueued) {
        failedQueueEmails.push(...emailAddress);
      }
    });
    this.logger.debug(`Activity email queued for invoice ${invoice._id}`);
    activity.emailDetails.scheduledAt = moment.utc();
    activity.emailDetails.failedQueuedEmails = failedQueueEmails;
    const savedActivity = await activity.save();
    return _.pick(savedActivity, 'emailDetails');
  }

  async sendQuote(activityId) {
    const activity = await this.findOne(activityId);
    const requestId = _.first(activity.emailDetails.requests);
    const projection = 'no title company contact documents turnaroundTime otherCC otherContact status isQuoteApproved';
    const requestQuery = { lspId: this.lspId, _id: new ObjectId(requestId) };
    const request = await this.schema.Request.findOne(requestQuery, projection);

    if (_.isNil(request)) {
      this.logger.debug(`Request with id ${requestId} was not found`);
      throw new RestError(404, { message: `Request ${requestId} not found` });
    }
    if (_.isNil(request.contact)) {
      this.logger.debug(`Request ${requestId} doesn't have a contact`);
      throw new RestError(500, { message: 'Quote could not be sent. Request does not have a contact' });
    }
    const emailSent = await this._sendQuotePendingApprovalEmails(request, activity);
    if (emailSent) {
      try {
        const update = { status: REQUEST_WAITING_FOR_APPROVAL_STATUS };
        if (!request.isQuoteApproved) {
          await this.schema.Request.updateOne(requestQuery, update);
        }
        const updatedActivity = await this.schema.Activity.findByIdAndUpdate({
          _id: new ObjectId(activityId),
        }, {
          $set: {
            dateSent: moment().utc().toDate(),
            'emailDetails.isQuoteSent': true,
            'emailDetails.scheduledAt': moment().utc().toDate(),
          },
        }, { lean: true, new: true });
        return updatedActivity;
      } catch (err) {
        const message = err.message || err;
        this.logger.debug(`Failed to update request status with id ${requestId} after sending the quote. Err: ${message}`);
        throw new RestError(500, { message: 'Quote Sent. Request status could not be updated' });
      }
    }
  }

  async _sendQuotePendingApprovalEmails(request, activity) {
    try {
      let addresses = [request.contact.email];
      if (!_.isEmpty(request.otherCC)) {
        addresses = addresses.concat(request.otherCC);
      }
      if (!_.isEmpty(_.get(request, 'otherContact.email'))) {
        addresses = addresses.concat(request.otherContact.email);
      }
      const {
        path, storage, name, size,
      } = await this._getActivityAttachment(activity, request.no);
      const attachment = [
        {
          data: activity.emailDetails.htmlBody,
          alternative: true,
        },
        {
          path,
          type: 'application/pdf',
          name,
          storage,
          size,
        },
      ];
      const emailContext = {
        request,
        finalDocuments: request.finalDocuments,
        path: this.serverUrl,
        user: request.contact,
      };
      const email = Object.assign(activity.emailDetails, {
        context: emailContext,
        templateName: 'quote',
        useScheduler: false,
        modifications: null,
        attachment,
        scheduler: {
          email: {
            subject: activity.subject,
            template: activity.emailDetails.htmlBody,
            from: activity.emailDetails.from,
          },
        },
        mock: false,
        lspId: this.lspId,
      });
      return Promise.mapSeries(addresses, async (emailAddress) => {
        const user = await this.schema.User.findOneWithDeleted({
          lsp: this.lspId, email: emailAddress,
        });

        email.context.user = user;
        const address = [{
          email: emailAddress,
          lastName: '',
          firstName: '',
        }];

        if (_.has(email, '_doc')) {
          email._doc.to = address;
        } else {
          email.to = address;
        }
        return this.emailQueue.send(email);
      })
        .then(() => {
          this.logger.debug(`All quote emails were send for request ${request._id}`);
          this.notificationScheduler.run({
            attrs: {
              data: {
                lspId: this.lspId,
              },
            },
          });
          return true;
        })
        .catch((err) => {
          this.logger.debug(`Error sending quote email for request ${request._id}. ${err}`);
          return false;
        });
    } catch (err) {
      this.logger.debug(`Error sending quote email for request ${request._id}. ${err}`);
      return false;
    }
  }
}

module.exports = ActivityApi;
