import TableExport from '../files/table-export';

const exportData = (fileName, dataColumns, list) => {
  const options = {
    bookType: 'xlsx',
    bookSST: false,
    type: 'binary',
  };
  const workbook = new TableExport(options);
  const columns = dataColumns.filter((c) => c.type !== 'component')
    .map((c) => ({ property: c.val ? c.val : c.prop, title: c.name }));
  workbook.addSheet('Default', columns, list);
  workbook.save(fileName);
};

export default exportData;
