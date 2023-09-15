const _ = require('lodash');
const Promise = require('bluebird');
const archiver = require('archiver');
const path = require('path');
const { Types: { ObjectId }, isValidObjectId } = require('mongoose');
const AxiosBasedApi = require('../../axios-based-api');
const { RestError, fileContentDisposition } = require('../../../components/api-response');
const { buildFormDataWithHeaders } = require('../../../utils/http');
const { toUserFullName } = require('../../../utils/user');

const RESOURCE_TYPE_SR = 'sr';
const RESOURCE_TYPE_TB = 'tb';
const RESOURCE_TYPE_TM = 'tm';

class PcSettingsApi extends AxiosBasedApi {
  constructor({
    user, logger, configuration, mock, sessionID,
  }) {
    const headers = {
      'x-session-id': sessionID,
    };
    const { PC_BASE_URL } = configuration.environment;
    super(logger, {
      user, configuration, baseUrl: PC_BASE_URL, headers,
    });
    this.mock = mock;
    this.configuration = configuration;
  }

  get _keepActiveTmSegments() {
    if (this.environmentName !== 'PROD') {
      return !this.mock;
    }
    return true;
  }

  async list({
    lspId = this.lspId, type, companyId = null, srcLang, tgtLang,
  }) {
    const model = this._getDescriptorModel(type);
    let descriptors;
    if (type === RESOURCE_TYPE_TM) {
      descriptors = await this._listTm(lspId, companyId, { srcLang, tgtLang });
    } else if (type === RESOURCE_TYPE_TB) {
      descriptors = await this._listTb(lspId, companyId);
    } else {
      descriptors = await model.find({
        lspId,
        companyId,
      }, null, { sort: 'createdAt' });
    }
    return { descriptors, total: descriptors.length };
  }

  async importResource({
    type,
    language,
    srcLang,
    tgtLang,
    isReviewedByClient,
    companyId = null,
    filename,
    file,
  }) {
    const { name } = path.parse(filename);
    const descriptor = await this.createResourceDescriptor({
      type,
      lspId: this.lspId,
      name,
      companyId,
      language,
      srcLang,
      tgtLang,
      isReviewedByClient,
      file,
      filename,
    });
    if (type === RESOURCE_TYPE_TM) {
      const { name: tmName, _id: tmId } = descriptor;
      await this._importTmx(
        {
          file, filename, tmName, srcLang, tgtLang, companyId, tmId, descriptor,
        },
      );
    } else if (type === RESOURCE_TYPE_SR) {
      const { _id: srId } = descriptor;
      await this._importSrx(
        {
          file, filename, srId, language, companyId, descriptor,
        },
      );
    } else if (type === RESOURCE_TYPE_TB) {
      const { name: tbName, _id: tbId } = descriptor;
      await this._importTbx(
        {
          tbName, tbId, descriptor, srcLang, tgtLang, file, filename, companyId,
        },
      );
    } else {
      await descriptor.remove();
      const message = 'Unsupported resource type';
      this.logger.error(message);
      throw new RestError(400, { message });
    }
    return descriptor;
  }

  async updateResource({
    type, resourceId, file, filename, isReviewedByClient,
  }) {
    const descriptor = await this.findDescriptor(type, { _id: resourceId });
    const { name } = path.parse(filename);
    if (type === RESOURCE_TYPE_TM) {
      const {
        srcLang, tgtLang, companyId, _id: tmId,
      } = descriptor;
      await this._assertCanDeleteTm(descriptor);
      await this._importTmx(
        {
          file, filename, tmName: name, srcLang, tgtLang, companyId, tmId,
        },
      );
      Object.assign(descriptor, { name });
    } else if (type === RESOURCE_TYPE_SR) {
      const { companyId, _id: srId, language } = descriptor;
      await this._importSrx(
        {
          file, filename, srId, language, companyId,
        },
      );
      Object.assign(descriptor, { name });
    } else {
      const {
        companyId, _id: tbId, srcLang, tgtLang,
      } = descriptor;
      await this._importTbx(
        {
          tbName: name, tbId, descriptor, srcLang, tgtLang, file, filename, companyId,
        },
      );
      Object.assign(descriptor, { name, isReviewedByClient });
    }
    Object.assign(descriptor, { deleted: false });
    return descriptor.save();
  }

  async updateResourceName({ type, resourceId, name }) {
    const descriptor = await this.findDescriptor(type, { _id: resourceId });
    Object.assign(descriptor, { name });
    try {
      await descriptor.save();
    } catch (err) {
      throw new RestError(400, {
        message: err.message,
      });
    }
    return descriptor;
  }

  deleteResources({ type, resourceIds, companyId = null }) {
    if (type === RESOURCE_TYPE_TM) {
      return Promise.mapSeries(resourceIds, async (tmId) => {
        const descriptor = await this.findDescriptor(type, { _id: tmId });
        await this._assertCanDeleteTm(descriptor);
        const endpoint = this._buildExternalUrl({
          lspId: this.lspId, companyId, descriptorId: tmId, entityType: RESOURCE_TYPE_TM,
        });
        const url = new URL(endpoint, this.baseUrl);
        url.searchParams.append('keepActiveTmSegments', this._keepActiveTmSegments);
        const finalUrl = url.pathname + url.search;
        await this.delete(finalUrl);
        await descriptor.delete();
      });
    } if (type === RESOURCE_TYPE_TB) {
      return Promise.mapSeries(resourceIds, async (tbId) => {
        const descriptor = await this.findDescriptor(type, { _id: tbId });
        const url = this._buildExternalUrl({
          lspId: this.lspId, companyId, descriptorId: tbId, entityType: RESOURCE_TYPE_TB,
        });
        await this.delete(url);
        await descriptor.delete();
      });
    }
    return Promise.mapSeries(resourceIds, async (resourceId) => {
      const descriptor = await this.findDescriptor(type, { _id: resourceId });
      let url = `/api/portalcat/lsp/${this.lspId}`;
      if (!_.isNil(companyId)) {
        url += `/company/${companyId}`;
      }
      url += `/${type}/${resourceId}`;
      await this.delete(url);
      await descriptor.delete();
    });
  }

  async streamResource(res, { type, resourceId, companyId }) {
    const descriptor = await this.findDescriptor(type, { _id: resourceId });
    let resourceName;
    let url;
    if (type === RESOURCE_TYPE_TM) {
      resourceName = this._buildTmxName(descriptor.name);
      url = this._buildExternalUrl({
        lspId: this.lspId, companyId, descriptorId: resourceId, entityType: RESOURCE_TYPE_TM,
      });
    } else if (type === RESOURCE_TYPE_SR) {
      resourceName = this._buildSrxName(descriptor.name);
      url = `/api/portalcat/lsp/${this.lspId}`;
      if (!_.isNil(companyId)) {
        url += `/company/${companyId}`;
      }
      url += `/sr/${resourceId}`;
    } else if (type === RESOURCE_TYPE_TB) {
      resourceName = this._buildTbxName(descriptor.name);
      url = this._buildExternalUrl({
        lspId: this.lspId, companyId, descriptorId: resourceId, entityType: RESOURCE_TYPE_TB,
      });
    }
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', fileContentDisposition(resourceName));
    try {
      const response = await this.get(url, { responseType: 'stream' });
      response.data.pipe(res);
    } catch (err) {
      this.logger.error(`Exporting ${type} with ID ${resourceId} failed: ${err.message}`);
      throw new RestError(err.code || 500, { message: err.message });
    }
  }

  async streamResourcesZip(res, { type, resourceIds, companyId }) {
    const archiveZip = archiver('zip');
    let zipFileName;
    if (type === RESOURCE_TYPE_TM) {
      zipFileName = 'TMX-files.zip';
    } else if (type === RESOURCE_TYPE_SR) {
      zipFileName = 'SRX-files.zip';
    } else if (type === RESOURCE_TYPE_TB) {
      zipFileName = 'TBX-files.zip';
    }
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', fileContentDisposition(zipFileName));
    archiveZip.pipe(res);
    await Promise.mapSeries(resourceIds, async (resourceId) => {
      const descriptor = await this.findDescriptor(type, { _id: resourceId });
      let resourceName;
      let url;
      if (type === RESOURCE_TYPE_TM) {
        resourceName = this._buildTmxName(descriptor.name);
        url = this._buildExternalUrl({
          lspId: this.lspId, companyId, descriptorId: resourceId, entityType: RESOURCE_TYPE_TM,
        });
      } else if (type === RESOURCE_TYPE_SR) {
        resourceName = this._buildSrxName(descriptor.name);
        url = `/api/portalcat/lsp/${this.lspId}`;
        if (!_.isNil(companyId)) {
          url += `/company/${companyId}`;
        }
        url += `/sr/${resourceId}`;
      } else if (type === RESOURCE_TYPE_TB) {
        resourceName = this._buildTbxName(descriptor.name);
        url = this._buildExternalUrl({
          lspId: this.lspId, companyId, descriptorId: resourceId, entityType: RESOURCE_TYPE_TB,
        });
      }
      try {
        const response = await this.get(url, { responseType: 'stream' });
        archiveZip.append(response.data, { name: resourceName });
      } catch (err) {
        this.logger.error(`Exporting ${type} with ID ${resourceId} failed: ${err.message}`);
      }
    });
    archiveZip.finalize();
  }

  async createResourceDescriptor({ type, ...resourceInfo }) {
    const Model = this._getDescriptorModel(type);
    const newDescriptor = new Model(resourceInfo);
    try {
      await newDescriptor.save();
    } catch (err) {
      if (!err.message.match(/.*duplicate key*./)) {
        throw err;
      }
      let message = `${type.toUpperCase()} for ${_.get(newDescriptor, 'srcLang.name')} - ${_.get(newDescriptor, 'tgtLang.name')} language combination already exists`;
      if (type === RESOURCE_TYPE_SR) {
        message = `SR for ${_.get(newDescriptor, 'language.name')} language already exists`;
      }
      let query = _.omit(resourceInfo, ['file', 'filename', 'name', 'isReviewedByClient']);
      query = {
        ..._.omit(query, ['language', 'srcLang', 'tgtLang']),
        'language.isoCode': _.get(query, 'language.isoCode'),
        'language.name': _.get(query, 'language.name'),
        'srcLang.isoCode': _.get(query, 'srcLang.isoCode'),
        'srcLang.name': _.get(query, 'srcLang.name'),
        'tgtLang.isoCode': _.get(query, 'tgtLang.isoCode'),
        'tgtLang.name': _.get(query, 'tgtLang.name'),
      };
      const descriptor = await this.findDescriptor(type, _.omitBy(query, _.isUndefined));
      if (descriptor.deleted) {
        return this.updateResource({
          type,
          resourceId: descriptor._id,
          file: resourceInfo.file,
          filename: resourceInfo.filename,
          isReviewedByClient: resourceInfo.isReviewedByClient,
        });
      }
      throw new RestError(409, {
        message,
        data: { resourceId: descriptor._id },
      });
    }
    return newDescriptor;
  }

  async findDescriptor(type, query) {
    const descriptor = await this._getDescriptorModel(type).findOneWithDeleted(query);
    if (_.isNil(descriptor)) {
      throw new RestError(404, { message: `${type.toUpperCase()} descriptor not found` });
    }
    return descriptor;
  }

  async _assertCanDeleteTm(descriptor) {
    const { NODE_ENV } = this.configuration.environment;
    if (this.mock && NODE_ENV !== 'PROD') {
      return;
    }
    const requests = await this._getTmDependantRequests(descriptor);
    if (requests.length > 0) {
      const requestNumbers = requests.map(({ no }) => no);
      throw new RestError(400, {
        message: `This translation memory is being used by ${requestNumbers}. Memories that are currently in use cannot be deleted.`,
      });
    }
  }

  _getTmDependantRequests(descriptor) {
    const {
      companyId,
      srcLang: { isoCode: srcIsoCode },
      tgtLang: { isoCode: tgtIsoCode },
    } = descriptor;
    return this.schema.Request.find({
      $or: [
        {
          lspId: this.lspId,
          'company._id': companyId,
          catTool: /portalcat/i,
          status: {
            $in: [
              'On Hold',
              'In progress',
              'Waiting for approval',
              'Waiting for Quote',
            ],
          },
          'languageCombinations.srcLangs.isoCode': srcIsoCode,
          'languageCombinations.tgtLangs.isoCode': tgtIsoCode,
        },
        {
          lspId: this.lspId,
          'company._id': companyId,
          catTool: /portalcat/i,
          'languageCombinations.srcLangs.isoCode': srcIsoCode,
          'languageCombinations.tgtLangs.isoCode': tgtIsoCode,
          'workflows.tasks.providerTasks.status': 'inProgress',
        },
      ],
    }, 'no', { lean: true });
  }

  _getDescriptorModel(type) {
    let model;
    switch (type) {
      case RESOURCE_TYPE_SR:
        model = this.schema.PortalcatSrDescriptor;
        break;
      case RESOURCE_TYPE_TB:
        model = this.schema.PortalcatTbDescriptor;
        break;
      default:
        model = this.schema.PortalcatTmDescriptor;
    }
    return model;
  }

  async _importTmx({
    file, filename, tmName, srcLang, tgtLang, companyId, tmId, descriptor,
  }) {
    if (_.isNil(file)) {
      return;
    }
    const { formData, headers } = buildFormDataWithHeaders({
      tmName,
      srcLang: srcLang.isoCode,
      tgtLang: tgtLang.isoCode,
      file: { value: file, options: filename },
    });
    const url = this._buildExternalUrl({
      lspId: this.lspId, companyId, descriptorId: tmId, entityType: RESOURCE_TYPE_TM,
    });
    try {
      await this.put(url, formData, { headers });
    } catch (err) {
      this.logger.error(`Error importing TM: ${err.message}`);
      if (!_.isNil(descriptor)) {
        await descriptor.remove();
      }
      throw err;
    }
  }

  async _importTbx({
    tbName, tbId, descriptor, srcLang, tgtLang, file, filename, companyId,
  }) {
    if (_.isNil(file)) {
      return;
    }
    const { formData, headers } = buildFormDataWithHeaders({
      tbName,
      srcLang: srcLang.isoCode,
      tgtLang: tgtLang.isoCode,
      file: { value: file, options: filename },
    });
    const url = this._buildExternalUrl({
      lspId: this.lspId, companyId, descriptorId: tbId, entityType: RESOURCE_TYPE_TB,
    });
    try {
      await this.post(url, formData, {
        headers,
      });
    } catch (err) {
      this.logger.error(`Error importing TB: ${err.message}`);
      if (!_.isNil(descriptor)) {
        await descriptor.remove();
      }
      throw err;
    }
  }

  async _importSrx({
    file, filename, language, companyId, srId, descriptor,
  }) {
    if (_.isNil(file)) {
      return;
    }
    const { formData, headers } = buildFormDataWithHeaders({
      lang: language.isoCode,
      file: { value: file, options: filename },
    });
    let url = `/api/portalcat/lsp/${this.lspId}`;
    if (!_.isNil(companyId)) {
      url += `/company/${companyId}`;
    }
    url += `/sr/${srId}`;
    try {
      await this.post(url, formData, { headers });
    } catch (err) {
      this.logger.error(`Error importing SR: ${err.message}`);
      if (!_.isNil(descriptor)) {
        await descriptor.remove();
      }
      throw err;
    }
  }

  _buildTmxName(descriptorName) {
    const { name } = path.parse(descriptorName);
    return `${name}.tmx`;
  }

  _buildSrxName(descriptorName) {
    const { name } = path.parse(descriptorName);
    return `${name}.srx`;
  }

  _buildTbxName(descriptorName) {
    const { name } = path.parse(descriptorName);
    return `${name}.csv`;
  }

  async _listTm(lspId, companyId, { srcLang, tgtLang } = {}) {
    const model = this._getDescriptorModel(RESOURCE_TYPE_TM);
    const query = {
      lspId,
      companyId: new ObjectId(companyId),
      'srcLang.isoCode': srcLang,
      'tgtLang.isoCode': tgtLang,
    };
    const descriptors = await model.findWithDeleted(_.pickBy(query, _.identity));
    await this._convertEmailsToNames(lspId, descriptors);
    return Promise.mapSeries(descriptors, async (descriptor) => {
      let tmInfo = {
        numSegments: 0,
      };
      try {
        const tmUrl = this._buildExternalUrl({
          lspId, companyId, descriptorId: descriptor._id, entityType: RESOURCE_TYPE_TM,
        });
        const url = `${tmUrl}/info`;
        const response = await this.get(url);
        tmInfo = _.get(response, 'data.tmInfo', {});
        tmInfo.users = _.get(tmInfo, 'userIds', []);
        await this._populateUsers(tmInfo, ['users']);
      } catch (e) {
        this.logger.error(`Error retrieving info for TM ${descriptor._id}: ${e.message}`);
      }
      return { ...descriptor.toObject(), tmInfo };
    });
  }

  async _listTb(lspId, companyId) {
    const model = this._getDescriptorModel(RESOURCE_TYPE_TB);
    const descriptors = await model.findWithDeleted({
      lspId,
      companyId,
    }, null, { sort: 'createdAt' });
    await this._convertEmailsToNames(lspId, descriptors);
    return Promise.mapSeries(descriptors, async (descriptor) => {
      let tbInfo = {
        numEntries: 0,
      };
      try {
        const tbUrl = this._buildExternalUrl({
          lspId, companyId, descriptorId: descriptor._id, entityType: RESOURCE_TYPE_TB,
        });
        const url = `${tbUrl}/info`;
        const response = await this.get(url);
        tbInfo = _.get(response, 'data.tbInfo', {});
      } catch (e) {
        this.logger.error(`Error retrieving info for TB ${descriptor._id}: ${e.message}`);
      }
      return { ...descriptor.toObject(), tbInfo };
    });
  }

  _convertEmailsToNames(lspId, descriptors) {
    const fieldsToUpdate = ['createdBy', 'updatedBy', 'deletedBy'];
    return Promise.map(descriptors, async (descriptor) => {
      const users = await this.schema.User.findWithDeleted({
        lsp: lspId,
        email: { $in: fieldsToUpdate.map((fieldName) => descriptor[fieldName]) },
      }, 'email firstName lastName');
      fieldsToUpdate.forEach((fieldName) => {
        const user = users.find(({ email }) => email === descriptor[fieldName]);
        if (_.isNil(user)) {
          return;
        }
        descriptor[fieldName] = toUserFullName(user);
      });
    });
  }

  _populateUsers(entity, fields) {
    return Promise.map(fields, async (field) => {
      const isArray = Array.isArray(entity[field]);
      const ids = isArray ? entity[field] : [entity[field]];
      entity[field] = await Promise.map(ids, async (id) => {
        if (!isValidObjectId(id)) {
          return id;
        }
        const user = await this.schema.User.findById(id, ['_id', 'firstName', 'lastName']);
        if (_.isNil(user)) {
          return id;
        }
        return user;
      });
      entity[field] = isArray ? entity[field] : _.first(entity[field]);
    });
  }

  _buildExternalUrl({
    lspId, companyId, descriptorId, entityType,
  }) {
    return `/api/portalcat/lsp/${lspId}/company/${companyId}/${entityType}/${descriptorId}`;
  }
}

module.exports = PcSettingsApi;
