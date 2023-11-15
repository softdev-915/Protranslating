const _addNonStoredProps = (columns, defaultColumns) => {
  if (columns && columns.length) {
    columns.forEach((c) => {
      const defCol = defaultColumns.filter((df) => df.name === c.name);
      if (defCol && defCol.length) {
        const df = defCol[0];
        Object.assign(c, {
          type: df.type,
          prop: df.prop,
          val: df.val,
          disabled: df.disabled,
          componentName: df.componentName,
          cssCell: df.cssCell,
          hideHeaderFilter: df.hideHeaderFilter,
          alias: df.alias,
        });
      }
    });
  }
};

const missingColumns = (configuredColumns, defaultColumns) => {
  const defColsLen = defaultColumns.length;
  const confLen = configuredColumns.length;
  const missing = [];
  for (let i = 0; i < defColsLen; i++) {
    let isDefColumnPresent = false;
    for (let j = 0; j < confLen; j++) {
      if (configuredColumns[j].prop === defaultColumns[i].prop) {
        isDefColumnPresent = true;
        break;
      }
    }
    if (!isDefColumnPresent) {
      missing.push(defaultColumns[i]);
    }
  }
  return missing;
};

const findColumnIndex = (array, col) => {
  const len = array.length;
  for (let i = 0; i < len; i++) {
    if (array[i].prop === col.prop) {
      return i;
    }
  }
};

const mergeColumns = (configuredColumns, defaultColumns) => {
  let changesMade = false;
  _addNonStoredProps(configuredColumns.columns, defaultColumns);
  const newColumns = missingColumns(configuredColumns.columns, defaultColumns);
  const deletedColumns = missingColumns(defaultColumns, configuredColumns.columns);
  newColumns.forEach((col) => {
    changesMade = true;
    configuredColumns.columns.push(col);
  });
  deletedColumns.forEach((col) => {
    const index = findColumnIndex(configuredColumns, col);
    if (index >= 0) {
      changesMade = true;
      configuredColumns.columns.splice(index, 1);
    }
  });
  return changesMade;
};

export default mergeColumns;
