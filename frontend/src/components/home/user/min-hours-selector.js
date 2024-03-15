import _ from 'lodash';
import { BasicSelect } from '../../search-select';

const getHours = () => {
  const arr = [];
  const min = 0;
  const max = 8;
  for (let i = min; i <= max; i++) {
    arr.push({ text: `${i}`, value: i });
  }
  return arr;
};

export default {
  functional: true,
  render(h, ctx) {
    const context = { ...ctx };
    const hours = _.get(context, 'props.value');
    const inputHandler = _.get(ctx, 'data.on.input', () => {});
    _.set(context, 'attrs', ctx.data.attrs);
    _.set(context, 'props.options', getHours());
    _.set(context, 'on.select', (e) => {
      inputHandler(_.get(e, 'value', null));
    });
    const value = {
      text: '',
      value: null,
    };
    if (hours !== null) {
      value.text = hours;
      value.value = hours;
    }
    const dataE2EType = _.get(ctx, 'props.dataE2eType');
    if (dataE2EType) {
      _.set(context, 'attrs[data-e2e-type]', dataE2EType);
    }
    _.set(context, 'props.selectedOption', value);
    return h(BasicSelect, context);
  },
};
