const _ = require('lodash');
const moment = require('moment');
const apiResponse = require('../../../components/api-response');
const fileUtils = require('../../../utils/file');
const requestUtils = require('../../../utils/request');
const ActivityVersionableDocument = require('../../../utils/document/activity-versionable-document');
const { splitRole, getRoles, hasRole } = require('../../../utils/roles');

const RestError = apiResponse.RestError;
const requiredTagsRolesMap = {
  create: {
    ALL: {
      'Feedback Received': 'ACTIVITY-FR_CREATE_ALL',
      'Escalation 1': 'ACTIVITY-VES1_CREATE_ALL',
      'Escalation 2': 'ACTIVITY-VES2_CREATE_ALL',
      'Escalation Termination': 'ACTIVITY-VES-T_CREATE_ALL',
      'Escalation Bypass': 'ACTIVITY-VES-B_CREATE_ALL',
      'Non-Conformance': 'ACTIVITY-NC-CC_CREATE_ALL',
      'Client Complaint': 'ACTIVITY-NC-CC_CREATE_ALL',
      'Competence Audit': 'ACTIVITY-CA_CREATE_ALL',
    },
    OWN: {
      'Feedback Received': 'ACTIVITY-FR_CREATE_OWN',
      'Escalation 1': 'ACTIVITY-VES1_CREATE_OWN',
      'Escalation 2': 'ACTIVITY-VES2_CREATE_OWN',
      'Escalation Termination': 'ACTIVITY-VES-T_CREATE_OWN',
      'Escalation Bypass': 'ACTIVITY-VES-B_CREATE_OWN',
      'Non-Conformance': 'ACTIVITY-NC-CC_CREATE_OWN',
      'Client Complaint': 'ACTIVITY-NC-CC_CREATE_OWN',
      'Competence Audit': 'ACTIVITY-CA_CREATE_OWN',
    },
  },
  read: {
    ALL: {
      'Feedback Received': 'ACTIVITY-FR_READ_ALL',
      'Escalation 1': 'ACTIVITY-VES1_READ_ALL',
      'Escalation 2': 'ACTIVITY-VES2_READ_ALL',
      'Escalation Termination': 'ACTIVITY-VES-T_READ_ALL',
      'Escalation Bypass': 'ACTIVITY-VES-B_READ_ALL',
      'Non-Conformance': 'ACTIVITY-NC-CC_READ_ALL',
      'Client Complaint': 'ACTIVITY-NC-CC_READ_ALL',
      'Competence Audit': 'ACTIVITY-CA_READ_ALL',
    },
    OWN: {
      'Feedback Received': 'ACTIVITY-FR_READ_OWN',
      'Escalation 1': 'ACTIVITY-VES1_READ_OWN',
      'Escalation 2': 'ACTIVITY-VES2_READ_OWN',
      'Escalation Termination': 'ACTIVITY-VES-T_READ_OWN',
      'Escalation Bypass': 'ACTIVITY-VES-B_READ_OWN',
      'Non-Conformance': 'ACTIVITY-NC-CC_READ_OWN',
      'Client Complaint': 'ACTIVITY-NC-CC_READ_OWN',
      'Competence Audit': 'ACTIVITY-CA_READ_OWN',
    },
    DEPARTMENT: {
      'Non-Conformance': 'ACTIVITY-NC-CC_READ_DEPARTMENT',
      'Client Complaint': 'ACTIVITY-NC-CC_READ_DEPARTMENT',
    },
  },
  update: {
    ALL: {
      'Feedback Received': 'ACTIVITY-VES-FR_UPDATE_ALL',
      'Escalation 1': 'ACTIVITY-VES1_UPDATE_ALL',
      'Escalation 2': 'ACTIVITY-VES2_UPDATE_ALL',
      'Escalation Termination': 'ACTIVITY-VES-T_UPDATE_ALL',
      'Escalation Bypass': 'ACTIVITY-VES-B_UPDATE_ALL',
      'Non-Conformance': 'ACTIVITY-NC-CC_UPDATE_ALL',
      'Client Complaint': 'ACTIVITY-NC-CC_UPDATE_ALL',
      'Competence Audit': 'ACTIVITY-CA_UPDATE_ALL',
    },
    OWN: {
      'Feedback Received': 'ACTIVITY-VES-FR_UPDATE_OWN',
      'Escalation 1': 'ACTIVITY-VES1_UPDATE_OWN',
      'Escalation 2': 'ACTIVITY-VES2_UPDATE_OWN',
      'Escalation Termination': 'ACTIVITY-VES-T_UPDATE_OWN',
      'Escalation Bypass': 'ACTIVITY-VES-B_UPDATE_OWN',
      'Non-Conformance': 'ACTIVITY-NC-CC_UPDATE_OWN',
      'Client Complaint': 'ACTIVITY-NC-CC_UPDATE_OWN',
      'Competence Audit': 'ACTIVITY-CA_UPDATE_OWN',
    },
    DEPARTMENT: {
      'Non-Conformance': 'ACTIVITY-NC-CC_UPDATE_DEPARTMENT',
      'Client Complaint': 'ACTIVITY-NC-CC_UPDATE_DEPARTMENT',
    },
  },
};

const activityDocumentList = (activityId, rawFiles, fileStorageFacade) => {
  const files = ActivityVersionableDocument.buildFromArray(rawFiles);

  if (!files.length) {
    throw new RestError(404, { message: 'No documents available to download' });
  }
  return files.map((f) => {
    const fsf = fileStorageFacade.activityFeedbackDocument(f, f._id);
    fsf.__file__name__ = f.name;
    fsf.cloudKey = fsf.path;
    const ext = fileUtils.getExtension(f.name);
    const nonRenamedDocument = fileStorageFacade.nonRenamedActivityFeedbackDocument(
      _.toString(activityId),
      f,
      ext,
      _.toString(f._id),
    );
    fsf.path = nonRenamedDocument.path;
    return fsf;
  });
};

const getRequiredRolesBasedOnTags = (tagsInserted, tagsRolesMap) => {
  const requiredRoles = [];

  _.forEach(tagsInserted, (tag) => {
    if (tagsRolesMap[tag] && !requiredRoles.includes(tag)) {
      requiredRoles.push(tagsRolesMap[tag]);
    }
  });
  return requiredRoles;
};

const getEmailRequiredRoles = (tagsInserted, accessType) => {
  const tagsInsertedClone = [...tagsInserted];
  const feedbackRoles = {
    all: [],
    own: [],
    department: [],
  };
  const competenceRoles = {
    all: [],
    own: [],
    department: [],
  };
  const arrayWithCopmetenceTag = [];
  const competenceTagIndex = tagsInsertedClone.indexOf('Competence Audit');
  if (competenceTagIndex !== -1) {
    arrayWithCopmetenceTag.push(tagsInsertedClone.splice(competenceTagIndex, 1));
  }

  if (accessType.match(/^(create|read|update)$/)) {
    feedbackRoles.all = getRequiredRolesBasedOnTags(
      tagsInsertedClone, requiredTagsRolesMap[accessType].ALL);

    competenceRoles.all = getRequiredRolesBasedOnTags(
      arrayWithCopmetenceTag, requiredTagsRolesMap[accessType].ALL);

    feedbackRoles.own = getRequiredRolesBasedOnTags(
      tagsInsertedClone, requiredTagsRolesMap[accessType].OWN);

    competenceRoles.own = getRequiredRolesBasedOnTags(
      arrayWithCopmetenceTag, requiredTagsRolesMap[accessType].OWN);

    if (requiredTagsRolesMap[accessType].DEPARTMENT) {
      feedbackRoles.department = getRequiredRolesBasedOnTags(
        tagsInsertedClone, requiredTagsRolesMap[accessType].DEPARTMENT);
    }
  }
  return { feedback: feedbackRoles, competence: competenceRoles };
};

const getRequiredTagsToFilterActivities = (roles) => {
  const requiredTags = {
    ALL: [],
    OWN: [],
    DEPARTMENT: [],
  };
  const filteredRoles = roles.filter(role => splitRole(role).accessType === 'READ');
  _.forEach(filteredRoles, (role) => {
    const splitedRoleScope = splitRole(role).scope;
    if (splitedRoleScope === 'OWN' || splitedRoleScope === 'ALL' || splitedRoleScope === 'DEPARTMENT') {
      const filteredTags = Object.entries(requiredTagsRolesMap.read[splitedRoleScope])
        .filter(entery => entery[1] === role)
        .map(entery => entery[0]);
      requiredTags[splitedRoleScope] = requiredTags[splitedRoleScope].concat(filteredTags);
    }
  });
  return requiredTags;
};

const canUpdateActivity = (roles, activityInDb, isOwner) => {
  if (activityInDb.activityType === 'Feedback') {
    if (!Array.isArray(activityInDb.tags)) {
      return false;
    }

    const neededTags = getRequiredTagsToFilterActivities(roles);
    return neededTags.ALL.some(tag => activityInDb.tags.includes(tag)) ||
      neededTags.DEPARTMENT.some(tag => activityInDb.tags.includes(tag)) ||
      neededTags.OWN.some(tag => activityInDb.tags.includes(tag) && isOwner);
  } else if (activityInDb.activityType === 'Email') {
    return roles.includes('ACTIVITY-EMAIL_UPDATE_ALL') || (roles.includes('ACTIVITY-EMAIL_UPDATE_OWN') && isOwner);
  }
  return roles.includes('ACTIVITY-USER-NOTE_UPDATE_ALL');
};

const getConditionStatementToReadActivities = (user) => {
  const or = [];
  const userRoles = getRoles(user);
  if (hasRole('ACTIVITY-EMAIL_READ_ALL', userRoles)) {
    or.push({
      activityType: { $eq: 'Email' },
    });
  } else if (hasRole('ACTIVITY-EMAIL_READ_OWN', userRoles)) {
    or.push({
      activityType: { $eq: 'Email' }, createdBy: user.email,
    });
  }
  if (hasRole('ACTIVITY-USER-NOTE_READ_ALL', userRoles)) {
    or.push({
      activityType: { $eq: 'User Note' },
    });
  }
  const { ALL, OWN, DEPARTMENT } = getRequiredTagsToFilterActivities(userRoles);
  if (!_.isEmpty(ALL)) {
    or.push({
      activityType: { $eq: 'Feedback' }, tags: { $in: ALL },
    });
  }
  if (!_.isEmpty(OWN)) {
    or.push({
      activityType: { $eq: 'Feedback' }, tags: { $in: OWN }, createdBy: user.email,
    });
  }
  const internalDepartments = _.get(user, 'staffDetails.internalDepartments');
  if (!_.isEmpty(DEPARTMENT) && !_.isEmpty(internalDepartments)) {
    or.push({
      activityType: { $eq: 'Feedback' },
      tags: { $in: DEPARTMENT },
      'feedbackDetails.internalDepartments': { $in: internalDepartments },
    });
  }
  return or;
};

const buildResponseDocument = (interceptorParams, uploadResponse, req) => {
  const { size, md5Hash } = _.get(uploadResponse, 'gcsFile.metadata');
  const { mimetype, encoding } = interceptorParams;
  const newDocument = {
    _id: uploadResponse.documentId,
    name: fileUtils.getFilename(_.get(uploadResponse.gcsFile, 'name')),
    mime: mimetype,
    size,
    md5Hash,
    encoding,
    cloudKey: _.get(uploadResponse.gcsFile, 'name'),
    ip: requestUtils.extractUserIp(req),
    user: _.get(this.user, '_id', null),
    createdBy: _.get(this, 'user.email'),
    createdAt: moment().utc().toDate(),
  };
  return newDocument;
};

module.exports = {
  activityDocumentList,
  getEmailRequiredRoles,
  getRequiredTagsToFilterActivities,
  canUpdateActivity,
  getConditionStatementToReadActivities,
  buildResponseDocument,
};
