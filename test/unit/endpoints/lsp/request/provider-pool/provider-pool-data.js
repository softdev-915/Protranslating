const moment = require('moment');
const { Types: { ObjectId } } = require('mongoose');
const { environment } = require('../../../../../../app/components/configuration');

const env = environment;
const emailConnectionString = env.EMAIL_CONNECTION_STRING;
const lspId = new ObjectId();
const userId = new ObjectId();
const provider1Id = new ObjectId();
const provider2Id = new ObjectId();
const competenceLevel1Id = new ObjectId();
const competenceLevel2Id = new ObjectId();
const competenceLevel3Id = new ObjectId();
const companyId = new ObjectId();
const requestNoWorkflowId = new ObjectId();
const request1Id = new ObjectId();
const workflow11Id = new ObjectId();
const task11Id = new ObjectId();
const task12Id = new ObjectId();
const request2Id = new ObjectId();
const workflow21Id = new ObjectId();
const task21Id = new ObjectId();
const task22Id = new ObjectId();
const request3Id = new ObjectId();
const workflow31Id = new ObjectId();
const task31Id = new ObjectId();
const task32Id = new ObjectId();
const providerTask121Id = new ObjectId();
const providerTask122Id = new ObjectId();
const providerTask123Id = new ObjectId();
const providerTask211Id = new ObjectId();
const providerTask221Id = new ObjectId();
const providerTask222Id = new ObjectId();
const providerTask223Id = new ObjectId();
const providerTask311Id = new ObjectId();
const providerTask321Id = new ObjectId();
const providerTask322Id = new ObjectId();
const providerTask323Id = new ObjectId();

module.exports = {
  lspId,
  userId,
  provider1Id,
  provider2Id,
  competenceLevel1Id,
  competenceLevel2Id,
  competenceLevel3Id,
  companyId,
  requestNoWorkflowId,
  request1Id,
  workflow11Id,
  task11Id,
  task12Id,
  request2Id,
  workflow21Id,
  task21Id,
  task22Id,
  request3Id,
  workflow31Id,
  task31Id,
  task32Id,
  providerTask121Id,
  providerTask122Id,
  providerTask123Id,
  providerTask211Id,
  providerTask221Id,
  providerTask222Id,
  providerTask223Id,
  providerTask311Id,
  providerTask321Id,
  providerTask322Id,
  providerTask323Id,
  db: {
    Lsp: [{
      _id: lspId,
      name: 'test',
      emailConnectionString,
      pcSettings: { mtThreshold: 0 },
    }],
    Ability: [{
      lspId,
      name: 'Edition',
      languageCombination: true,
      competenceLevelRequired: true,
    }, {
      lspId,
      name: 'Translation',
      languageCombination: true,
      competenceLevelRequired: false,
    }, {
      lspId,
      name: 'Magical thinking',
      languageCombination: true,
      competenceLevelRequired: false,
    }],
    Language: [{
      name: 'English',
      isoCode: 'ENG',
      cultureCode: 'ENG',
    }, {
      name: 'Spanish',
      isoCode: 'SPA',
      cultureCode: 'SPA',
    }, {
      name: 'French',
      isoCode: 'FRE',
      cultureCode: 'FRE',
    }, {
      name: 'Icelandic',
      isoCode: 'ICE',
      cultureCode: 'ICE',
    }],
    Company: [{
      lspId,
      _id: companyId,
      name: 'Company 1',
    }],
    CompetenceLevel: [{
      lspId,
      _id: competenceLevel1Id,
      name: 'Competence Level 1',
    }, {
      lspId,
      _id: competenceLevel2Id,
      name: 'Competence Level 2',
    }, {
      lspId,
      _id: competenceLevel3Id,
      name: 'Competence Level 3',
    }],
    Request: [{
      lspId,
      _id: requestNoWorkflowId,
      competenceLevels: [],
      no: '0',
      title: 'valid',
      company: {
        _id: companyId,
      },
      comments: 'Test comments',
      srcLang: {
        name: 'English',
        isoCode: 'ENG',
        cultureCode: 'ENG',
      },
      tgtLangs: [{
        name: 'Spanish',
        isoCode: 'SPA',
        cultureCode: 'SPA',
      }],
      documents: [{
        name: 'valid-1-1.txt',
        isReference: false,
        final: false,
      }],
      updatedAt: moment.utc('2018-01-01 00:00:00.000Z'),
      workflows: [],
    }, {
      lspId,
      _id: request1Id,
      competenceLevels: [],
      no: '1',
      title: 'valid',
      company: {
        _id: companyId,
      },
      comments: 'Test comments',
      srcLang: {
        name: 'English',
        isoCode: 'ENG',
        cultureCode: 'ENG',
      },
      tgtLangs: [{
        name: 'Spanish',
        isoCode: 'SPA',
        cultureCode: 'SPA',
      }],
      documents: [{
        name: 'valid-1-1.txt',
        isReference: false,
        final: false,
      }],
      updatedAt: moment.utc('2018-01-01 00:00:00.000Z'),
      workflows: [{
        _id: workflow11Id,
        language: {
          name: 'Spanish',
          isoCode: 'SPA',
          cultureCode: 'SPA',
        },
        tasks: [{
          _id: task12Id,
          ability: 'Translation',
          providerTasks: [{
            _id: providerTask121Id,
            taskDueDate: moment.utc(),
            files: [],
          }, {
            _id: providerTask122Id,
            taskDueDate: moment.utc(),
            files: [],
          }, {
            _id: providerTask123Id,
            taskDueDate: moment.utc(),
            files: [],
          }],
        }],
      }],
    }, {
      lspId,
      _id: request2Id,
      competenceLevels: [{ _id: competenceLevel1Id }],
      no: '2',
      title: 'valid',
      company: {
        _id: companyId,
      },
      comments: 'Test comments',
      srcLang: {
        name: 'English',
        isoCode: 'ENG',
        cultureCode: 'ENG',
      },
      tgtLangs: [{
        name: 'Spanish',
        isoCode: 'SPA',
        cultureCode: 'SPA',
      }],
      documents: [{
        name: 'valid-1-1.txt',
        isReference: false,
        final: false,
      }],
      updatedAt: moment.utc('2018-01-01 00:00:00.000Z'),
      workflows: [{
        _id: workflow21Id,
        language: {
          name: 'Spanish',
          isoCode: 'SPA',
          cultureCode: 'SPA',
        },
        tasks: [{
          _id: task21Id,
          ability: 'Edition',
          providerTasks: [{
            _id: providerTask211Id,
            taskDueDate: moment.utc(),
            files: [],
          }],
        }, {
          _id: task22Id,
          ability: 'Translation',
          providerTasks: [{
            _id: providerTask221Id,
            taskDueDate: moment.utc(),
            files: [],
          }, {
            _id: providerTask222Id,
            taskDueDate: moment.utc(),
            files: [],
          }, {
            _id: providerTask223Id,
            taskDueDate: moment.utc(),
            files: [],
          }],
        }],
      }],
    }, {
      lspId,
      _id: request3Id,
      competenceLevels: [{ _id: competenceLevel1Id }],
      no: '3',
      title: 'valid',
      company: {
        _id: companyId,
      },
      comments: 'Test comments',
      srcLang: {
        name: 'English',
        isoCode: 'ENG',
        cultureCode: 'ENG',
      },
      tgtLangs: [{
        name: 'Spanish',
        isoCode: 'SPA',
        cultureCode: 'SPA',
      }],
      documents: [{
        name: 'valid-1-1.txt',
        isReference: false,
        final: false,
      }],
      updatedAt: moment.utc('2018-01-01 00:00:00.000Z'),
      workflows: [{
        _id: workflow31Id,
        language: {
          name: 'Spanish',
          isoCode: 'SPA',
          cultureCode: 'SPA',
        },
        tasks: [{
          _id: task31Id,
          ability: 'Edition',
          providerTasks: [{
            _id: providerTask311Id,
            taskDueDate: moment.utc(),
            files: [],
          }],
        }, {
          _id: task32Id,
          ability: 'Translation',
          providerTasks: [{
            _id: providerTask321Id,
            taskDueDate: moment.utc(),
            files: [],
          }, {
            _id: providerTask322Id,
            taskDueDate: moment.utc(),
            files: [],
          }, {
            _id: providerTask323Id,
            taskDueDate: moment.utc(),
            files: [],
          }],
        }],
      }],
    }],
    User: [{
      _id: userId,
      firstName: 'Provider',
      lastName: 'Pool',
      email: 'provider-pool-creator@sample.com',
      lsp: lspId,
      type: 'Staff',
      roles: ['WORKFLOW_CREATE_ALL', 'REQUEST_CREATE_ALL', 'COMPANY_READ_ALL', 'USER_READ_ALL'],
      deleted: false,
      abilities: [],
      languageCombinations: [],
      terminated: false,
      staffDetails: {
        approvalMethod: 'Grandfathered',
      },
    }, {
      _id: provider1Id,
      firstName: 'Provider',
      lastName: '1',
      email: 'provider1@sample.com',
      lsp: lspId,
      type: 'Staff',
      roles: ['WORKFLOW_CREATE_ALL'],
      deleted: false,
      terminated: false,
      languageCombinations: ['English - Spanish', 'Spanish - English', 'English - Bulgarian', 'Bulgarian - English'],
      abilities: ['Translation', 'Edition', 'Magical thinking'],
      staffDetails: {
        competenceLevels: [competenceLevel1Id, competenceLevel3Id],
        approvalMethod: 'Grandfathered',
      },
    }, {
      _id: provider2Id,
      firstName: 'Provider',
      lastName: '2',
      email: 'provider2@sample.com',
      lsp: lspId,
      type: 'Staff',
      roles: ['WORKFLOW_CREATE_ALL'],
      deleted: false,
      terminated: false,
      languageCombinations: ['English - Spanish', 'Spanish - English', 'ENG-FRE', 'FRE-ENG', 'FRE-SPA', 'SPA-FRE'],
      abilities: ['Translation', 'Edition', 'Magical thinking'],
      staffDetails: {
        competenceLevels: [],
        approvalMethod: 'Grandfathered',
      },
    }],
    Scheduler: [{
      name: 'provider-availability-email',
      every: '1 minutes',
      lspId,
      options: {
        lockLifetime: 10000,
        priority: 'highest',
      },
      email: {
        from: 'support@protranslating.com',
        template: '<h4 style="line-height: 1;"><b><span style="font-family: &quot;Helvetica Neue&quot;;">Available for service</span></b></h4><p><br></p><p>Are you available to perform a service for Protranslating?</p><p><br></p><p>Request Number: {{providerPool.requestNo}}</p><p>Request Title: {{providerPool.requestTitle}}</p><p>Service Name: {{providerPoolLine.ability}}</p><p>Language pair: {{providerPool.srcLang.name}} - {{providerPoolLine.tgtLang.name}}</p>{{#if providerPool.requestCatTool}}<p>Cat Tool: {{providerPool.requestCatTool}}</p>{{/if}}{{#if providerPool.requestProjectManagers.length}}<p>Project Manager(s): {{#each providerPool.requestProjectManagers}} {{ username this }} {{/each}}</p>{{/if}}<p>Task Due Date: {{toTimezone providerPoolLine.taskDueDate \'America/New_York\' \'YYYY-MM-DD hh:mm A z\'}}</p><p><br></p><p>Let us know by clicking on the link below:</p><p><br></p><p><a href="{{path}}/provider-pools/{{providerPool.request}}" target="_blank" rel="noopener">Go to task details<br></p>',
        subject: 'Service availability: {{request.no}}',
        variables: {
          user: {
            _id: 'projectManagerId',
            email: 'provider-email@sample.com',
            firstName: 'First',
            middleName: 'Middle',
            lastName: 'Last',
          },
          path: 'https://portal.protranslating.com/',
          providerPool: {
            _id: 'providerPoolId',
            request: 'requestId',
            requestNo: 'R180101-1',
            requestTitle: 'A cool document to translate',
            requestCatTool: 'MemoQ',
            requestProjectManagers: {
              _id: 'projectManagerId',
              firstName: 'First',
              middleName: 'Middle',
              lastName: 'Last',
            },
          },
          providerPoolLine: {
            tgtLang: 'Spanish',
            ability: 'Translation',
            taskDueDate: moment.utc().toDate(),
          },
        },
      },
    }],
  },
};
