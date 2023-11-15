const strCompare = (x, y) => {
  x = x || '';
  y = y || '';
  if (x.toLowerCase() !== y.toLowerCase()) {
    x = x.toLowerCase();
    y = y.toLowerCase();
  }
  if (x > y) {
    return 1;
  }
  return (x < y ? -1 : 0);
};

const stripHtml = (html) => {
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};
const htmlCompare = (x, y) => strCompare(stripHtml(x).result, stripHtml(y).result);
const numberCompare = (a, b) => {
  if (a < b) return 1;
  if (a > b) return -1;
  return 0;
};

const sortFunctionFactory = (direction, type) => {
  if (type === 'html') {
    if (direction === 'desc') {
      return (a, b) => htmlCompare(b, a);
    }
    return (a, b) => htmlCompare(a, b);
  }
  if (type === 'string') {
    if (direction === 'desc') {
      return (a, b) => strCompare(b, a);
    }
    return (a, b) => strCompare(a, b);
  }
  if (direction === 'desc') {
    return (a, b) => numberCompare(b, a);
  }
  return (a, b) => numberCompare(a, b);
};
const _isReservedKey = (k) => k === 'q' || k === 'page' || k === 'sort' || k === 'limit';
const matchAndEliminateToken = (text, tokens) => {
  let i = 0;
  while (i < tokens.length) {
    const t = tokens[i];
    if (text.toLowerCase().indexOf(t) !== -1) {
      tokens.splice(i, 1);
    } else {
      i++;
    }
  }
};

const _filterByQuery = (filteredList, activeColumns, query) => {
  const q = query.toLowerCase().trim();
  const tokens = q.split(' ');
  const len = activeColumns.length;
  if (tokens.length) {
    return filteredList.filter((item) => {
      const tokensMatched = tokens.slice(0);
      for (let i = 0; i < len; i++) {
        let checkIfDone = false;
        const c = activeColumns[i];
        let valueToFilter = '';
        try {
          valueToFilter = c.val ? c.val(item) : item[c.prop];
        } catch (e) {
          // leave the field as blank
        }
        if (Array.isArray(valueToFilter)) {
          valueToFilter.forEach((v) => v
            && matchAndEliminateToken(v.toString(), tokensMatched));
          checkIfDone = true;
        } else if (valueToFilter !== null && valueToFilter !== undefined) {
          matchAndEliminateToken(valueToFilter.toString(), tokensMatched);
          checkIfDone = true;
        }
        if (checkIfDone && tokensMatched.length === 0) {
          return true;
        }
      }
      // if all filters failed, filter out this item
      return false;
    });
  }
  return filteredList;
};

const genAliasFunction = (col, alias) => {
  if (col.alias) {
    const type = typeof col.alias;
    if (type === 'object') {
      return col.alias[alias] || null;
    } if (type === 'string' && col.alias === alias) {
      return (item, value) => item[col.prop] === value;
    }
  }
  return null;
};

const _filterByAlias = (list, activeColumns, query) => {
  const keys = Object.keys(query).filter((k) => !_isReservedKey(k));
  let filteredList = list;
  if (keys.length) {
    const allFiltersFun = keys.map((k) => ({
      key: k,
      funcs: activeColumns.map((c) => genAliasFunction(c, k)).filter((f) => f !== null),
    })).filter((f) => f.funcs.length > 0);
    const len = allFiltersFun.length;
    filteredList = filteredList.filter((item) => {
      for (let i = 0; i < len; i++) {
        const { key, funcs } = allFiltersFun[i];
        const funcsLen = funcs.length;
        for (let j = 0; j < funcsLen; j++) {
          const fun = funcs[j];
          if (!fun(item, query[key])) {
            return false;
          }
        }
      }
      // if all filters passed, include this item
      return true;
    });
  }
  return filteredList;
};

const filterWithQuery = (listData, query, activeColumns) => {
  if (!listData.list) {
    return [];
  }
  let filteredList = listData.list.slice(0);
  let page = 0;
  if (query) {
    if (query.q) {
      filteredList = _filterByQuery(filteredList, activeColumns, query.q);
    } else {
      // only if no query, filter by alias
      filteredList = _filterByAlias(filteredList, activeColumns, query);
    }
  }
  if (query && query.sort) {
    let type;
    const sortArr = query.sort.split('-');
    let prop = sortArr[0];
    let val = (i) => i[prop];
    let sortDirection = 'asc';
    if (sortArr.length > 1) {
      // eslint-disable-next-line prefer-destructuring
      prop = sortArr[1];
      sortDirection = 'desc';
    }
    const len = filteredList.length;
    if (len) {
      const columnsToFilter = activeColumns.filter((c) => c.prop === prop);
      if (columnsToFilter.length > 0) {
        // If the column has a val property, use that instead of the object's property
        const columnToFilter = columnsToFilter[0];
        if (columnToFilter.val) {
          try {
            val = (i) => columnToFilter.val(i);
          } catch (e) {
            // nothing to do
          }
        }
        type = columnToFilter.type;
        // if type could not be determined by the column definition we must
        // search for one valid value and check extract the type
        if (type !== 'string' && type !== 'number' && type !== 'date') {
          // try to detect the column type
          // we must seek a value because the first one might be null
          for (let i = 0; i < len; i++) {
            const varValue = val(filteredList[i]);
            type = varValue === null || varValue === undefined ? null : typeof varValue;
            if (type && type !== 'undefined') {
              break;
            }
          }
        }
        // Special case
        if (columnToFilter.type === 'html') {
          type = 'html';
        }
      }
      const sortFunc = sortFunctionFactory(sortDirection, type);
      filteredList.sort((item1, item2) => sortFunc(val(item1), val(item2)));
    }
  }
  if (query && query.page) {
    page = query.page - 1;
  }
  let limit = 10;
  const total = filteredList.length;
  if (query && query.limit) {
    limit = query.limit;
  }
  const first = limit * page;
  const last = first + limit;
  filteredList = filteredList.slice(first, last);
  return { list: filteredList, total };
};

const cleanNulls = (obj) => {
  const keys = Object.keys(obj);
  keys.forEach((k) => {
    if (obj[k] === null) {
      delete obj[k];
    }
  });
  return obj;
};

const parseQuery = (query) => {
  const clone = cleanNulls({ ...query });
  if (clone.page) {
    clone.page = parseInt(clone.page, 10);
  }
  if (clone.limit) {
    clone.limit = parseInt(clone.limit, 10);
  }
  return clone;
};

export {
  filterWithQuery,
  parseQuery,
};
