const { Types: { ObjectId } } = require('mongoose');
const moment = require('moment');

const company1Id = new ObjectId();
const englishLang = {
  _id: new ObjectId(),
  name: 'English',
  isoCode: 'ENG',
  cultureCode: 'ENG',
};
const spanishLang = {
  _id: new ObjectId(),
  name: 'Spanish',
  isoCode: 'SPA',
  cultureCode: 'SPA',
};
const contactId = new ObjectId();
const provider1Id = new ObjectId();
const provider2Id = new ObjectId();
const competenceLevel1Id = new ObjectId();

const generateTestData = () => ({
  Ability: [{
    _id: new ObjectId(),
    name: 'Translation',
    languageCombination: false,
    catTool: false,
    competenceLevelRequired: false,
  }, {
    _id: new ObjectId(),
    name: 'Edition',
    languageCombination: false,
    catTool: false,
    competenceLevelRequired: false,
  }],
  CompetenceLevel: [{
    _id: competenceLevel1Id,
    name: 'task-test-competence-level-1',
  }],
  Company: [{
    _id: company1Id,
    name: 'task-test-company-1',
  }],
  Language: [englishLang, spanishLang],
  Request: [{
    _id: new ObjectId(),
    no: '1',
    competenceLevels: [competenceLevel1Id],
    company: company1Id,
    contact: contactId,
    srcLang: englishLang,
    tgtLangs: [spanishLang],
    status: 'approved',
    workflows: [{
      _id: new ObjectId(),
      language: spanishLang,
      workflowDueDate: moment.utc().add(60, 'days'),
      tasks: [{
        _id: new ObjectId(),
        ability: 'Translation',
        providerTasks: [{
          provider: provider1Id,
          taskDueDate: moment.utc().add(30, 'days'),
          status: 'inProgress',
          files: [],
          notes: '',
          quantity: [],
        }],
      }, {
        _id: new ObjectId(),
        ability: 'Edition',
        providerTasks: [{
          provider: provider2Id,
          taskDueDate: moment.utc().add(30, 'days'),
          status: 'notStarted',
          files: [],
          notes: '',
          quantity: [],
        }, {
          provider: provider2Id,
          taskDueDate: moment.utc().add(30, 'days'),
          status: 'notStarted',
          files: [],
          notes: '',
          quantity: [],
        }],
      }],
    }, {
      _id: new ObjectId(),
      language: spanishLang,
      workflowDueDate: moment.utc().add(60, 'days'),
      tasks: [{
        _id: new ObjectId(),
        ability: 'Translation',
        providerTasks: [{
          provider: provider2Id,
          taskDueDate: moment.utc().add(30, 'days'),
          status: 'inProgress',
          files: [],
          notes: '',
          quantity: [],
        }],
      }, {
        _id: new ObjectId(),
        ability: 'Edition',
        providerTasks: [{
          provider: provider2Id,
          taskDueDate: moment.utc().add(30, 'days'),
          status: 'notStarted',
          files: [],
          notes: '',
          quantity: [],
        }],
      }],
    }, {
      _id: new ObjectId(),
      language: spanishLang,
      workflowDueDate: moment.utc().add(60, 'days'),
      tasks: [{
        _id: new ObjectId(),
        ability: 'Translation',
        providerTasks: [{
          provider: null,
          taskDueDate: moment.utc().add(30, 'days'),
          status: 'inProgress',
          files: [],
          notes: '',
          quantity: [],
        }, {
          provider: provider2Id,
          taskDueDate: moment.utc().add(30, 'days'),
          status: 'notStarted',
          files: [],
          notes: '',
          quantity: [],
        }],
      }, {
        _id: new ObjectId(),
        ability: 'Edition',
        providerTasks: [{
          provider: null,
          taskDueDate: moment.utc().add(30, 'days'),
          status: 'notStarted',
          files: [],
          notes: '',
          quantity: [],
        }],
      }],
    }],
  }, {
    _id: new ObjectId(),
    no: '2',
    competenceLevels: [competenceLevel1Id],
    company: company1Id,
    contact: contactId,
    srcLang: englishLang,
    tgtLangs: [spanishLang],
    status: 'To be processed',
    workflows: [{
      _id: new ObjectId(),
      language: spanishLang,
      workflowDueDate: moment.utc().add(60, 'days'),
      tasks: [{
        _id: new ObjectId(),
        ability: 'Translation',
        providerTasks: [{
          provider: provider2Id,
          taskDueDate: moment.utc().add(30, 'days'),
          status: 'inProgress',
          files: [],
          notes: '',
          quantity: [],
        }],
      }, {
        _id: new ObjectId(),
        ability: 'Edition',
        providerTasks: [{
          provider: provider2Id,
          taskDueDate: moment.utc().add(30, 'days'),
          status: 'notStarted',
          files: [],
          notes: '',
          quantity: [],
        }],
      }],
    }, {
      _id: new ObjectId(),
      language: spanishLang,
      workflowDueDate: moment.utc().add(60, 'days'),
      tasks: [{
        _id: new ObjectId(),
        ability: 'Translation',
        providerTasks: [{
          provider: provider2Id,
          taskDueDate: moment.utc().add(30, 'days'),
          status: 'inProgress',
          files: [],
          notes: '',
          quantity: [],
        }],
      }, {
        _id: new ObjectId(),
        ability: 'Edition',
        providerTasks: [{
          provider: provider2Id,
          taskDueDate: moment.utc().add(30, 'days'),
          status: 'notStarted',
          files: [],
          notes: '',
          quantity: [],
        }],
      }],
    }, {
      _id: new ObjectId(),
      language: spanishLang,
      workflowDueDate: moment.utc().add(60, 'days'),
      tasks: [{
        _id: new ObjectId(),
        ability: 'Translation',
        providerTasks: [{
          provider: null,
          taskDueDate: moment.utc().add(30, 'days'),
          status: 'inProgress',
          files: [],
          notes: '',
          quantity: [],
        }],
      }, {
        _id: new ObjectId(),
        ability: 'Edition',
        providerTasks: [{
          provider: null,
          taskDueDate: moment.utc().add(30, 'days'),
          status: 'notStarted',
          files: [],
          notes: '',
          quantity: [],
        }],
      }],
    }],
  }, {
    _id: new ObjectId(),
    no: '3',
    competenceLevels: [competenceLevel1Id],
    company: company1Id,
    contact: contactId,
    srcLang: englishLang,
    tgtLangs: [spanishLang],
    status: 'To be processed',
    workflows: [{
      _id: new ObjectId(),
      language: spanishLang,
      workflowDueDate: moment.utc().add(60, 'days'),
      tasks: [{
        _id: new ObjectId(),
        ability: 'Translation',
        providerTasks: [{
          provider: provider1Id,
          taskDueDate: moment.utc().add(30, 'days'),
          status: 'inProgress',
          files: [],
          notes: '',
          quantity: [],
        }],
      }],
    }, {
      _id: new ObjectId(),
      language: spanishLang,
      workflowDueDate: moment.utc().add(60, 'days'),
      tasks: [{
        _id: new ObjectId(),
        ability: 'Edition',
        providerTasks: [{
          provider: provider1Id,
          taskDueDate: moment.utc().add(30, 'days'),
          status: 'inProgress',
          files: [],
          notes: '',
          quantity: [],
        }],
      }],
    }, {
      _id: new ObjectId(),
      language: spanishLang,
      workflowDueDate: moment.utc().add(60, 'days'),
      tasks: [{
        _id: new ObjectId(),
        ability: 'Edition',
        providerTasks: [{
          provider: provider1Id,
          taskDueDate: moment.utc().add(30, 'days'),
          status: 'inProgress',
          files: [],
          notes: '',
          quantity: [],
        }],
      }],
    }],
  }, {
    _id: new ObjectId(),
    no: '4',
    competenceLevels: [competenceLevel1Id],
    company: company1Id,
    contact: contactId,
    srcLang: englishLang,
    tgtLangs: [spanishLang],
    status: 'To be processed',
    workflows: [{
      _id: new ObjectId(),
      language: spanishLang,
      workflowDueDate: moment.utc().add(60, 'days'),
      tasks: [{
        _id: new ObjectId(),
        ability: 'Translation',
        providerTasks: [{
          provider: provider2Id,
          taskDueDate: moment.utc().add(30, 'days'),
          status: 'inProgress',
          files: [],
          notes: '',
          quantity: [],
        }],
      }],
    }],
  }],
  User: [{
    _id: contactId,
    firstName: 'Contact 1',
    middleName: 'Contact 1',
    lastName: 'Contact 1',
    email: 'contact1@sample.com',
    type: 'Contact',
  }, {
    _id: provider1Id,
    firstName: 'Provider 1',
    middleName: 'Provider 1',
    lastName: 'Provider 1',
    email: 'provider1@sample.com',
    type: 'Vendor',
    abilities: ['Translation', 'Edition'],
    languageCombinations: ['English - Spanish', 'Spanish - English'],
    vendorDetails: {
      competenceLevels: [competenceLevel1Id],
    },
  }, {
    _id: provider2Id,
    firstName: 'Provider 2',
    middleName: 'Provider 2',
    lastName: 'Provider 2',
    email: 'provider2@sample.com',
    type: 'Vendor',
    abilities: ['Translation', 'Edition'],
    languageCombinations: ['English - Spanish', 'Spanish - English'],
    vendorDetails: {
      competenceLevels: [competenceLevel1Id],
    },
  }],
});

module.exports = {
  company1Id,
  contactId,
  provider1Id,
  provider2Id,
  competenceLevel1Id,
  generateTestData,
};
