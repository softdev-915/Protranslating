const { Types: { ObjectId } } = require('mongoose');
const Promise = require('bluebird');
const { JSDOM } = require('jsdom');
const _ = require('lodash');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const removeStyleBlock = (htmlDocument) => {
  let wasChanged = false;
  const styleBlockList = htmlDocument.getElementsByTagName('style');
  for (let i = 0; i < styleBlockList.length; i++) {
    styleBlockList[0].remove();
    wasChanged = true;
  }
  return wasChanged;
};

const updateMainContainer = (htmlDocument) => {
  let wasChanged = false;
  const containerList = htmlDocument.querySelectorAll('.container');
  if (containerList.length === 0) {
    return wasChanged;
  }
  containerList.forEach((container) => {
    container.classList.replace('container', 'container-fluid');
    container.classList.remove('m-3');
    wasChanged = true;
  });
  return wasChanged;
};

const fixBlueTotalBox = (templateEntity, htmlDocument) => {
  let wasChanged = false;
  if (templateEntity.type === 'Quote') {
    return wasChanged;
  }
  const querySelector = templateEntity.type === 'Invoice'
    ? '.invoice-total-box'
    : '.bill-total-box';
  const invoiceTotalBoxes = htmlDocument.querySelectorAll(querySelector);
  if (invoiceTotalBoxes.length === 0) {
    return wasChanged;
  }
  invoiceTotalBoxes.forEach((invoiceTotalBox) => {
    if (!invoiceTotalBox.classList.contains('offset-8')) {
      return;
    }
    const newElement = htmlDocument.createElement('div');
    newElement.className = 'col-8 p-0';
    const parentInvoiceTotalBox = invoiceTotalBox.parentElement;
    parentInvoiceTotalBox.insertBefore(newElement, invoiceTotalBox);
    invoiceTotalBox.classList.remove('offset-8');
    wasChanged = true;
  });
  return wasChanged;
};

const fixTotalTableHeader = (templateEntity, htmlDocument) => {
  let wasChanged = false;
  if (templateEntity.type === 'Quote') {
    return wasChanged;
  }
  const tableHeaders = htmlDocument.querySelectorAll('.col-2.offset-8.local-header.text-right');
  if (tableHeaders.length === 0) {
    return wasChanged;
  }
  tableHeaders.forEach((tableHeader) => {
    if (!tableHeader.textContent.includes('Total')) {
      return;
    }
    const tableHeaderContent = tableHeader.textContent.trim();
    const tableValueElement = tableHeader.nextElementSibling;
    if (_.isNil(tableValueElement)) {
      return;
    }
    const amountPlaceholder = templateEntity.type === 'Invoice'
      ? 'invoice.accounting.amount'
      : 'bill.totalAmount';
    const tableValueContent = tableValueElement.textContent.replace(/\s+/g, ' ').trim();
    if (!tableValueContent.includes(amountPlaceholder)) {
      return;
    }
    const parentRowElement = tableHeader.parentElement;
    const nextRowElement = parentRowElement.nextElementSibling;
    const nextRowElementCols = nextRowElement.getElementsByClassName('col-6');
    if (nextRowElementCols.length < 2) {
      return;
    }
    const targetColElement = nextRowElementCols[1];
    const newRowElement = htmlDocument.createElement('div');
    newRowElement.className = 'row text-right pr-3 mt-1';
    const newTotalHeaderElement = htmlDocument.createElement('div');
    newTotalHeaderElement.className = 'col-6 text-right local-header p-0';
    newTotalHeaderElement.textContent = tableHeaderContent;
    const newTotalValueElement = htmlDocument.createElement('div');
    newTotalValueElement.className = 'col-6 text-right local-header p-0';
    newTotalValueElement.textContent = tableValueContent;
    newRowElement.appendChild(newTotalHeaderElement);
    newRowElement.appendChild(newTotalValueElement);
    targetColElement.insertBefore(newRowElement, targetColElement.firstChild);
    parentRowElement.remove();
    wasChanged = true;
  });
  return wasChanged;
};

const fixTextRightPadding = (htmlDocument) => {
  let wasChanged = false;
  const textRightBlocks = htmlDocument.querySelectorAll('.text-right');
  textRightBlocks.forEach((textRightBlock) => {
    if (
      !textRightBlock.classList.contains('col-6')
      && !textRightBlock.classList.contains('col-4')
      && (textRightBlock.classList.contains('p-0') || textRightBlock.classList.contains('pr-0'))
    ) {
      return;
    }
    textRightBlock.classList.add('pr-0');
    wasChanged = true;
  });
  return wasChanged;
};

const updateTemplateEntities = async (templatesDb, templateEntities) => {
  if (templateEntities.length === 0) {
    return;
  }
  const operations = templateEntities.map((updatedTemplateEntity) => ({
    updateOne: {
      filter: {
        _id: new ObjectId(updatedTemplateEntity._id),
        lspId: new ObjectId(updatedTemplateEntity.lspId),
      },
      update: { $set: { template: updatedTemplateEntity.template } },
      upsert: false,
    },
  }));
  return templatesDb.bulkWrite(operations);
};

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  const templatesDb = db.collection('templates');
  const templateEntities = await templatesDb.find({ type: { $in: ['Quote', 'Invoice', 'Bill'] } }).toArray();
  const updatedTemplateEntities = [];
  await Promise.mapSeries(templateEntities, (templateEntity) => {
    const htmlDocument = new JSDOM(templateEntity.template).window.document;
    const isRemovedStyleBlock = removeStyleBlock(htmlDocument);
    const isUpdatedStyleBlock = updateMainContainer(htmlDocument);
    const isFixedBlueTotalBox = fixBlueTotalBox(templateEntity, htmlDocument);
    const isFixedTotalTableHeader = fixTotalTableHeader(templateEntity, htmlDocument);
    const isFixedTextRightPadding = fixTextRightPadding(htmlDocument);
    if (
      isRemovedStyleBlock
      || isUpdatedStyleBlock
      || isFixedBlueTotalBox
      || isFixedTotalTableHeader
      || isFixedTextRightPadding
    ) {
      templateEntity.template = htmlDocument.body.innerHTML;
      updatedTemplateEntities.push(templateEntity);
    }
  });
  return updateTemplateEntities(templatesDb, updatedTemplateEntities);
};

if (require.main === module) {
  migration()
    .then(() => process.exit(0))
    .catch((err) => { throw err; });
} else {
  module.exports = migration;
}
