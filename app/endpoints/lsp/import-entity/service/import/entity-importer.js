const _ = require('lodash');
const Promise = require('bluebird');
const { Types: { ObjectId } } = require('mongoose');
const { parse } = require('fast-csv');
const bcrypt = require('bcrypt');
const { validObjectId, areObjectIdsEqual } = require('../../../../../utils/schema');
const XlsxFile = require('../../../../../components/xlsx/xlsx-file');
const UserFileImporter = require('./file-import-strategy/user-file-importer');
const OpportunityFileImporter = require('./file-import-strategy/opportunity-file-importer');
const { flattenObject } = require('../../../../../utils/object');
const { MIMETYPE_XLSX, MIMETYPE_CSV } = require('../../../../../utils/file');
const { getWordsFromCamelCase } = require('../../../../../utils/string');
const configuration = require('../../../../../components/configuration');
const Cache = require('../../../../../components/cache/cache');

const FIELD_TYPE_ARRAY = 'Array';
const FIELD_TYPE_OBJECT_ID = 'ObjectId';
const COLUMN_TYPE_IMPORT_LINK = '__importFileLink__';
const COLUMN_TYPE_REQUIRE_FILE = '__fileRequired__';
const COLUMN_VALUE_EMPTY = '__empty__';
const POSSIBLE_LSP_REFS = ['lsp._id', 'lspId', 'lsp'];
const FILE_IMPORT_STRATEGIES = {
  User: UserFileImporter,
  Opportunity: OpportunityFileImporter,
};
const CRYPT_FIELDS = {
  LmsAuth: ['password'],
};
const IMPORT_CSV_BATCH_SIZE = 10;
const envConfig = configuration.environment;
const IMMUTABLE_FIELDS = ['siConnector'];

class EntityImporter {
  constructor(schema, file, schemaFields, user) {
    this.schema = schema;
    this.file = file;
    this.schemaFields = schemaFields;
    this.user = user;
    this.lspId = new ObjectId(this.user.lsp._id);
    this.xlsx = new XlsxFile();
    this.cachedGetFieldInfo = new Cache(this.getFieldInfo, this);
    this.objectsToImport = [];
  }

  getFileImportStrategy(schemaName) {
    return _.has(FILE_IMPORT_STRATEGIES, schemaName)
      ? new FILE_IMPORT_STRATEGIES[schemaName](this.user, this.schema)
      : null;
  }

  getFieldInfo(fieldPath) {
    if (_.isEmpty(fieldPath)) {
      return null;
    }
    let result = _.cloneDeep(this.schemaFields);
    const fullPath = [];
    const pathParts = fieldPath.split('.');
    let skipIteration = false;
    pathParts.every((pathPart, i) => {
      const isArrayIndex = /^\d+$/.test(pathPart);
      if (isArrayIndex) {
        fullPath.push(pathPart);
        return true;
      }
      if (skipIteration) {
        skipIteration = false;
        return true;
      }
      if (!_.isEmpty(result.fields)) {
        result = result.fields;
      }
      if (!Array.isArray(result)) {
        return false;
      }
      result = result.find(({ name }) => {
        const isNestedPathCheck = name.includes('.') && !_.isEmpty(pathParts[i + 1]);
        const fieldToSearch = isNestedPathCheck ? [pathPart, pathParts[i + 1]].join('.') : pathPart;
        const wordsToSearch = getWordsFromCamelCase(fieldToSearch);
        const wordsInField = getWordsFromCamelCase(name);
        return wordsToSearch.length === wordsInField.length
          && new RegExp(`^${wordsToSearch.map((word) => `${word}.*`).join('')}`, 'i').test(name);
      });
      if (_.isEmpty(result)) {
        return false;
      }
      if (result.name.includes('.')) {
        skipIteration = true;
      }
      fullPath.push(result.name);
      return true;
    });
    if (_.isObject(result)) {
      result.fullPath = fullPath.join('.');
    }
    return result;
  }

  findParentObject(schemaName, parentId) {
    const _parentId = parentId && parentId.toString();
    return this.objectsToImport.find(({ _id, externalId }) => {
      const _externalId = externalId && externalId.toString();
      const id = _id && _id.toString();
      return areObjectIdsEqual(id, _parentId)
        || (!_.isEmpty(_externalId) && _externalId === _parentId);
    });
  }

  cryptFields(schemaName, entity) {
    _.get(CRYPT_FIELDS, schemaName, []).forEach((field) => {
      if (!_.isEmpty(entity[field])) {
        entity[field] = bcrypt.hashSync(entity[field], envConfig.PWD_SALT_ROUND);
      }
    });
  }

  async placeSheetToObjects(schemaName, fieldInfo, sheetEntries) {
    if (schemaName === fieldInfo.fullPath) {
      this.objectsToImport = await Promise.map(sheetEntries, (entity) => {
        this.cryptFields(schemaName, entity);
        this.setLspRefsToEntity(schemaName, entity);
        if (!validObjectId(entity._id)) {
          entity.externalId = `${entity._id}`;
          entity._id = '';
        }
        return entity;
      });
      return;
    }
    const key = fieldInfo.fullPath.replace(`${schemaName}.`, '');
    const parentIdPath = `${schemaName}._id`;
    if (fieldInfo.type !== FIELD_TYPE_ARRAY) {
      await Promise.map(sheetEntries, (entry) => {
        const parent = this.findParentObject(schemaName, _.get(entry, parentIdPath));
        _.set(parent, key, _.omit(entry, [schemaName]));
      });
      return;
    }
    const groupedEntries = _.groupBy(sheetEntries, parentIdPath);
    await Promise.each(Object.entries(groupedEntries), async ([parentId, group]) => {
      const parent = this.findParentObject(schemaName, parentId);
      const parentVal = _.get(parent, key, []);
      group = await Promise.mapSeries(group, async (entry) => {
        const fileData = await this.getFileData(schemaName, entry);
        return Object.assign(
          _.omit(entry, [COLUMN_TYPE_IMPORT_LINK, COLUMN_TYPE_REQUIRE_FILE]),
          fileData,
        );
      });
      _.set(parent, key, [...parentVal, ...group]);
    });
  }

  async getFileData(schemaName, entry) {
    const fileImportStrategy = this.getFileImportStrategy(schemaName);
    let result = {};
    if (!_.isNil(entry[COLUMN_TYPE_IMPORT_LINK])) {
      result = await fileImportStrategy.getFileDataByUrl(entry[COLUMN_TYPE_IMPORT_LINK]);
    } else if (!_.isNil(entry[COLUMN_TYPE_REQUIRE_FILE]) && entry[COLUMN_TYPE_REQUIRE_FILE]) {
      result = await fileImportStrategy.getLocalFileData();
    }
    return result;
  }

  getExternalIdReferences(schemaName, idFields) {
    const references = {};
    this.objectsToImport.forEach((entity) => {
      idFields.forEach(({ ref, fullPath }) => {
        const schemaRef = ref || schemaName;
        if (_.isEmpty(references[schemaRef])) {
          references[schemaRef] = [];
        }
        const value = _.get(entity, fullPath.replace(`${schemaName}.`, ''));
        const values = Array.isArray(value) ? value : [value];
        values.forEach((val) => {
          if (!_.isEmpty(val) && !validObjectId(val)) {
            references[schemaRef].push(val);
          }
        });
      });
    });
    return references;
  }

  getIdFields(schemaName) {
    const paths = _.uniq(_.flatten(this.objectsToImport.map((entity) => Object.keys(flattenObject(entity, schemaName)))));
    return paths.map((path) => {
      const info = this.cachedGetFieldInfo.callSync(path) || {};
      return !_.isEmpty(info.ref) || info.type === FIELD_TYPE_OBJECT_ID ? info : null;
    }).filter(_.isObject);
  }

  async getRefRecords(schemaName, idFields) {
    const references = this.getExternalIdReferences(schemaName, idFields);
    const records = await Promise.map(Object.entries(references), ([schemaRef, externalIdList]) => {
      const model = this.schema[schemaRef];
      const query = {
        externalId: { $in: externalIdList },
      };
      const lspRef = this.getLspRefField(schemaRef);
      if (!_.isEmpty(lspRef)) {
        query[lspRef] = this.lspId;
      }
      const fields = '_id externalId';
      if (_.isFunction(model.findWithDeleted)) {
        return model.findWithDeleted(query, fields).lean();
      }
      return model.find(query, fields).lean();
    });
    return _.filter(_.flatten(records));
  }

  async replaceExternalIds(schemaName, idFields, refRecords) {
    await Promise.map(this.objectsToImport, (entity) => {
      idFields.forEach(({ type, fullPath }) => {
        const prop = fullPath.replace(`${schemaName}.`, '');
        const value = _.get(entity, prop);
        const values = Array.isArray(value) ? value : [value];
        values.forEach((val, i) => {
          const refRecord = _.find(refRecords, { externalId: val });
          if (!_.isEmpty(refRecord)) {
            const path = type === FIELD_TYPE_ARRAY ? `${prop}.${i}` : prop;
            _.set(entity, path, refRecord._id);
          }
        });
      });
    });
  }

  filterEmptyRows(sheetData) {
    return sheetData.filter((row) => Object.values(row).some((val) => !_.isEmpty(_.trim(val))));
  }

  async adjustSheetValues(sheetName, sheetData) {
    const schemaName = sheetName.split('.')[0];
    await Promise.map(sheetData, (row) => Object.entries(row)
      .filter(([, val]) => !_.isNil(val))
      .forEach(([col, val]) => {
        if (_.isString(val)) {
          val = _.trim(val);
        }
        if (val === '') {
          delete row[col];
          return;
        }
        const fieldPath = col === `${schemaName}._id` ? col : `${sheetName}.${col}`;
        const info = this.cachedGetFieldInfo.callSync(fieldPath) || {};
        const isEmptyValue = val === COLUMN_VALUE_EMPTY;
        if (info.type === FIELD_TYPE_ARRAY) {
          val = !isEmptyValue ? val.split(',').map(_.trim) : [];
        } else if (isEmptyValue) {
          val = '';
        }
        row[col] = val;
      }));
  }

  async createNesting(sheetData) {
    await Promise.map(sheetData, (row) => Object.entries(row)
      .forEach(([column, value]) => {
        delete row[column];
        _.set(row, column, value);
      }));
  }

  setLspRefsToEntity(schemaName, entity) {
    POSSIBLE_LSP_REFS.every((lspRef) => {
      if (_.has(this.schema, `${schemaName}.schema.paths.${lspRef}`)) {
        _.set(entity, lspRef, this.lspId);
        return false;
      }
      return true;
    });
  }

  getLspRefField(schemaName) {
    return POSSIBLE_LSP_REFS.find((ref) => _.has(this.schema, `${schemaName}.schema.paths.${ref}`));
  }

  async saveToDb(schemaName, offset = 1) {
    const fileImport = this.getFileImportStrategy(schemaName);
    const idFields = this.getIdFields(schemaName);
    const refRecords = await this.getRefRecords(schemaName, idFields);
    await this.replaceExternalIds(schemaName, idFields, refRecords);
    await Promise.each(this.objectsToImport, async (entity, i) => {
      try {
        const record = await this.saveEntityToDB(schemaName, entity, fileImport);
        const newRefRecord = _.pick(record, ['_id', 'externalId']);
        if (_.isNil(_.find(refRecords, { externalId: newRefRecord.externalId }))) {
          refRecords.push(newRefRecord);
          await this.replaceExternalIds(schemaName, idFields, refRecords);
        }
      } catch (error) {
        if (!_.isNil(fileImport)) {
          await fileImport.onFailHook(entity);
        }
        throw new Error(`Import failed at the row #${offset + i} of entity "${schemaName}". Error: ${error}`);
      }
    });
    this.objectsToImport = [];
  }

  async saveImmutableFields(schemaName, entity) {
    const immutableFieldsData = _.pick(entity, IMMUTABLE_FIELDS);
    if (!_.isEmpty(immutableFieldsData)) {
      await this.schema[schemaName].findOneAndUpdate(
        { _id: entity._id },
        { $set: immutableFieldsData },
        { timeStamps: false },
      );
    }
  }

  async saveEntityToDB(schemaName, entity, fileImport = null) {
    const isSearchByMongoId = validObjectId(entity._id);
    const query = _.pick(entity, [isSearchByMongoId ? '_id' : 'externalId']);
    const lspRefField = this.getLspRefField(schemaName);
    if (!_.isEmpty(lspRefField)) {
      query[lspRefField] = this.lspId;
    }
    let record;
    if (_.isFunction(this.schema[schemaName].findOneWithDeleted)) {
      record = await this.schema[schemaName].findOneWithDeleted(query);
    } else {
      record = await this.schema[schemaName].findOne(query);
    }
    if (_.isNil(record)) {
      if (isSearchByMongoId) {
        throw new Error(`No record to update by ID "${entity._id}"`);
      }
      record = new this.schema[schemaName]();
    }
    record.safeAssignAndOverwrite(entity);
    await record.save();
    entity._id = record._id;
    await this.saveImmutableFields(schemaName, entity);

    if (!_.isNil(fileImport)) {
      await fileImport.afterSaveHook(entity);
    }
    return record;
  }

  async prepareDataToSave(collection, data) {
    const fieldInfo = this.cachedGetFieldInfo.callSync(collection);
    const schemaName = fieldInfo.fullPath.split('.')[0];
    const sheetData = this.filterEmptyRows(data);
    await this.adjustSheetValues(fieldInfo.fullPath, sheetData);
    await this.createNesting(sheetData);
    await this.placeSheetToObjects(schemaName, fieldInfo, sheetData);
  }

  async importCsv() {
    const collection = this.file.originalname.split('.')[0];
    const fieldInfo = this.cachedGetFieldInfo.callSync(collection);
    if (_.isNil(fieldInfo)) {
      throw new Error(`Wrong file name. No such collection found to import "${collection}"`);
    }
    return new Promise((resolve, reject) => {
      let batch = [];
      let offset = 1;
      const stream = parse({
        headers: true, delimiter: ',', ignoreEmpty: true, trim: true,
      })
        .on('data', async (row) => {
          stream.pause();
          if (batch.length < IMPORT_CSV_BATCH_SIZE) {
            batch.push(row);
          } else {
            try {
              await this.prepareDataToSave(collection, batch);
              await this.saveToDb(collection, offset);
            } catch (error) {
              reject(error);
            }
            offset += batch.length;
            batch = [];
          }
          stream.resume();
        })
        .on('end', async () => {
          if (!_.isEmpty(batch)) {
            try {
              await this.prepareDataToSave(collection, batch);
              await this.saveToDb(collection, offset);
            } catch (error) {
              reject(error);
            }
          }
          resolve();
        })
        .on('error', reject);
      stream.write(this.file.buffer);
      stream.end();
    });
  }

  async importXlsx() {
    this.xlsx.createFromBuffer(this.file.buffer);
    await Promise.each(Object.entries(this.xlsx.getSheets()), async ([sheetName, sheet]) => {
      const fieldInfo = this.cachedGetFieldInfo.callSync(sheetName);
      if (_.isNil(fieldInfo)) {
        throw new Error(`Wrong sheet name. No such collection or field found to import "${sheetName}"`);
      }
      await this.prepareDataToSave(sheetName, sheet.getData());
      const schemaName = fieldInfo.fullPath.split('.')[0];
      let nextSchemaName = '';
      const nextSheet = this.xlsx.getNextSheetOf(sheet);
      if (!_.isEmpty(nextSheet)) {
        const nextSheetFieldInfo = this.cachedGetFieldInfo.callSync(nextSheet.getName());
        [nextSchemaName] = _.get(nextSheetFieldInfo, 'fullPath', '').split('.');
      }
      if (nextSchemaName !== schemaName) {
        await this.saveToDb(schemaName);
      }
    });
  }

  async import() {
    switch (this.file.mimetype) {
      case MIMETYPE_CSV:
        await this.importCsv();
        break;
      case MIMETYPE_XLSX:
        await this.importXlsx();
        break;
      default:
        throw new Error(`Wrong file format to parse. Expected "xlsx" or "csv" but got "${this.file.mimetype}"`);
    }
  }
}

module.exports = EntityImporter;
