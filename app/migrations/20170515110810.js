const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const abilities = [
  { name: 'Adaptation', language: 1, catTool: 0 },
  { name: 'Alignment', language: 1, catTool: 1 },
  { name: 'Certification', language: 0, catTool: 0 },
  { name: 'Change of tone', language: 1, catTool: 0 },
  { name: 'Client Feedback', language: 0, catTool: 0 },
  { name: 'Coding', language: 1, catTool: 0 },
  { name: 'Comment Cleaning', language: 1, catTool: 0 },
  { name: 'Conference calls', language: 1, catTool: 0 },
  { name: 'Consecutive Interpretation', language: 1, catTool: 0 },
  { name: 'Consulting', language: 1, catTool: 0 },
  { name: 'Copy / Paste', language: 1, catTool: 1 },
  { name: 'Corrections', language: 1, catTool: 0 },
  { name: 'Create Purchase Orders', language: 0, catTool: 0 },
  { name: 'Declension update', language: 1, catTool: 1 },
  { name: 'Editing', language: 1, catTool: 1 },
  { name: 'Episode Time Stamping', language: 1, catTool: 0 },
  { name: 'Final Files Prep', language: 0, catTool: 0 },
  { name: 'Formatting', language: 0, catTool: 0 },
  { name: 'Glossary Creation', language: 1, catTool: 0 },
  { name: 'Glossary Update', language: 1, catTool: 0 },
  { name: 'Image Transcription', language: 1, catTool: 0 },
  { name: 'Machine translation human editing', language: 1, catTool: 0 },
  { name: 'Memory Update', language: 1, catTool: 1 },
  { name: 'Misalignments (no preview: browser version)', language: 1, catTool: 1 },
  { name: 'Preflight', language: 0, catTool: 0 },
  { name: 'Project Management', language: 0, catTool: 0 },
  { name: 'Proofreading', language: 1, catTool: 0 },
  { name: 'QA Formatting', language: 1, catTool: 0 },
  { name: 'QA Full', language: 1, catTool: 0 },
  { name: 'QA Full memoQ', language: 1, catTool: 1 },
  { name: 'QA IC', language: 1, catTool: 1 },
  { name: 'QA Partial memoQ', language: 1, catTool: 1 },
  { name: 'QA Purge', language: 1, catTool: 1 },
  { name: 'QA Sampling', language: 1, catTool: 1 },
  { name: 'Reference Materials Review', language: 1, catTool: 0 },
  { name: 'Reflow', language: 0, catTool: 0 },
  { name: 'Rejected Pages', language: 1, catTool: 1 },
  { name: 'Research', language: 1, catTool: 0 },
  { name: 'Review of Active Images', language: 1, catTool: 0 },
  { name: 'SEO Glossary', language: 1, catTool: 0 },
  { name: 'Simultaneous Interpretation', language: 1, catTool: 0 },
  { name: 'Subtitling', language: 0, catTool: 0 },
  { name: 'TG creation', language: 1, catTool: 0 },
  { name: 'TG Update', language: 1, catTool: 0 },
  { name: 'Transcription', language: 1, catTool: 0 },
  { name: 'Translation', language: 1, catTool: 1 },
  { name: 'Translation Review', language: 1, catTool: 0 },
  { name: 'TR Formatting', language: 1, catTool: 0 },
  { name: 'Validation and Delivery', language: 0, catTool: 0 },
  { name: 'Validation of Corrections', language: 1, catTool: 0 },
  { name: 'Voice Over', language: 1, catTool: 0 },
];

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const abilitiesCollection = db.collection('abilities');
    return abilitiesCollection.insertMany(abilities);
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
