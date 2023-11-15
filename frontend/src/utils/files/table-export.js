/* eslint-disable prefer-destructuring */
/* global XLSX */
/* eslint-disable import/no-extraneous-dependencies, import/no-unresolved, no-bitwise */
import { saveAs } from 'file-saver';

const borderStyle = {
  style: 'thin',
  color: {
    rgb: 'FF6A6E74',
  },
};

const minColumnWidth = (column) => {
  const columnWidth = column.length * 20;
  return columnWidth < 200 ? 200 : columnWidth;
};

const createCell = (R, C, value, property, formatters) => {
  const header = R === 0;
  let v;
  if (header) {
    v = value[C];
  } else {
    v = typeof property === 'string' ? value[property] : property(value);
  }
  const cell = {
    v,
    s: {
      border: {
        top: borderStyle,
        right: borderStyle,
        bottom: borderStyle,
        left: borderStyle,
      },
      alignment: {
        wrapText: true,
        vertical: 'top',
        horizontal: 'left',
      },
    },
  };
  let format = null;
  if (formatters) {
    format = formatters[property];
  }
  if (format) {
    if (format.format && !header) {
      cell.v = format.format(cell.v, value);
    }
    if (typeof format === 'function') {
      format = format(cell.v, value);
    }
    // _.extend(cell.s, format);
    cell.s = { ...cell.s, ...format };
  }
  if (header) {
    cell.s.fill = {
      fgColor: {
        rgb: 'FF51738C',
      },
    };
    cell.s.font = {
      bold: true,
      color: {
        rgb: 'FFFFFFFF',
      },
    };
    cell.s.alignment = {
      wrapText: true,
      horizontal: 'center',
      vertical: 'center',
    };
  } else if (cell['s.numFmt']) {
    cell.v = parseFloat(cell.v) || 0;
  }

  if (cell.v == null) {
    cell.v = '';
  }
  if (typeof cell.v === 'number') {
    cell.t = 'n';
  } else if (typeof cell.v === 'boolean') {
    cell.t = 'b';
  } else if (cell.v instanceof Date) {
    cell.t = 'n';
    cell.z = XLSX.SSF._table[14];
  } else {
    cell.t = 's';
  }
  cell.w = cell.v;
  cell.h = cell.v;
  return cell;
};

const prepareWorkbook = (s) => {
  const buf = new ArrayBuffer(s.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i !== s.length; ++i) {
    view[i] = s.charCodeAt(i) & 0xFF;
  }
  return buf;
};

export default class TableExport {
  constructor(options, formatters) {
    this.options = options;
    this.formatters = formatters;
    this.workbook = {
      SheetNames: [],
      Sheets: {},
    };

    this.options = options || {
      bookType: 'xlsx',
      bookSST: false,
      type: 'binary',
    };
  }

  createRows(data, properties, range, formatters, ws, subitems) {
    data.forEach((value, R) => {
      properties.forEach((property, C) => {
        if (range.s.r > R) range.s.r = R;
        if (range.s.c > C) range.s.c = C;
        if (range.e.r < R) range.e.r = R;
        if (range.e.c < C) range.e.c = C;
        const cell = createCell(R, C, value, property, formatters);
        const cellRef = XLSX.utils.encode_cell({
          c: C,
          r: R,
        });
        ws[cellRef] = cell;
      });
      if (subitems && subitems.property) {
        const subData = value[subitems.property];
        if (subitems && subData && subData.length > 0) {
          const subProperties = subitems.columns.map((c) => c.property);
          this.createRows(subData, subProperties, range, formatters, ws, subitems);
        }
      }
    });
  }

  prepareData(columns, data, formatters, subitems) {
    const properties = columns.map((c) => c.property);
    const titles = columns.map((c) => c.title);
    const wscols = columns.map((col) => ({ wpx: minColumnWidth(col.property) }));
    const ws = {};
    const range = {
      s: {
        c: 0,
        r: 0,
      },
      e: {
        c: 0,
        r: 0,
      },
    };
    const copyData = data.map((r) => ({ ...r }));
    copyData.unshift(titles);
    this.createRows(copyData, properties, range, formatters, ws, subitems);
    if (range.s.c < 10000000) {
      ws['!ref'] = XLSX.utils.encode_range(range);
      ws['!cols'] = wscols;
    }
    return ws;
  }

  addSheet(sheetName, columns, data) {
    this.workbook.SheetNames.push(sheetName);
    this.workbook.Sheets[sheetName] = this.prepareData(columns, data,
      this.formatters, this.options.subitems);
  }

  save(fileName) {
    const wbout = XLSX.write(this.workbook, this.options);
    const blob = new Blob([prepareWorkbook(wbout)], {
      type: 'application/octet-stream',
    });
    saveAs(blob, fileName);
  }
}
