import _ from 'lodash';
import moment from 'moment';
import FlatPickr from 'vue-flatpickr-component';
import { FMT } from './dynamic-utc-range-consts';

const FLATPICK_DATE_FORMAT = 'Z';
const toUtc = (ctx, func) => function (d) {
  const fmt = _.get(ctx, 'props.config.fmt', FMT);
  if (d.length > 0) {
    const dateArr = d.split(' to ');
    if (dateArr.length === 1) {
      const utcDate = moment(dateArr[0]).utc().format(fmt);
      _.get(ctx, func)(utcDate);
    } else if (dateArr.length === 2) {
      const utcDateFrom = moment(dateArr[0]).utc().format(fmt);
      const utcDateTo = moment(dateArr[1]).endOf('day').utc().format(fmt);
      _.get(ctx, func)(`${utcDateFrom},${utcDateTo}`);
    } else {
      _.get(ctx, func)('');
    }
  }
};

const overrideListener = (data, ctx, listenerName, overrideWith) => {
  const listenerPath = `listeners.${listenerName}`;
  const listener = _.get(ctx, listenerPath);
  if (listener) {
    _.set(data, `on.${listenerName}`, overrideWith(ctx, listenerPath));
  }
};

export default {
  functional: true,
  render(h, ctx) {
    const props = { ...ctx.props };
    _.set(props, 'config.mode', 'range');
    _.set(props, 'config.dateFormat', FLATPICK_DATE_FORMAT);
    const val = _.get(props, 'value');
    if (val && val.indexOf(',') !== -1) {
      const fmt = _.get(props, 'config.fmt', FMT);
      props.value = _.map(val.split(','), (v) => moment.utc(v).format(fmt));
    }
    const data = {
      attrs: ctx.data.attrs,
      props,
    };
    if (ctx.listeners) {
      if (ctx.listeners.input) {
        overrideListener(data, ctx, 'input', toUtc);
      }
      if (ctx.listeners.change) {
        overrideListener(data, ctx, 'change', toUtc);
      }
    }
    return h(FlatPickr, data);
  },
};
