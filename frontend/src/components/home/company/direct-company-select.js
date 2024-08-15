import _ from 'lodash';
import CompanyService from '../../../services/company-service';
import ReferenceableAjaxBasicSelect from '../../form/referenceable-ajax-basic-select';

// Add non inherited props from mixins
const MixinProps = _.get(ReferenceableAjaxBasicSelect, 'mixins', []).filter((m) => m.props).reduce((acc, cur) => ({ ...acc, ...cur.props }), {});
const VueSearchSelectInheritedProps = Object.assign(ReferenceableAjaxBasicSelect.props, MixinProps);
const CUSTOM_PROPS = ['roles-required', 'rolesRequired', 'entity', 'options'];
const companyService = new CompanyService();

export default {
  functional: true,
  props: {
    ..._.omit(VueSearchSelectInheritedProps, CUSTOM_PROPS),
  },
  render(h, ctx) {
    const context = { ...ctx };
    const inputHandler = _.get(ctx, 'data.on.input', () => {});
    _.set(context, 'attrs', ctx.data.attrs);
    _.set(context, 'props.rolesRequired', ['COMPANY_READ_ALL']);
    _.set(context, 'props.entity', 'Company');
    _.set(context, 'props.retrieve', (params) => {
      const allLevelsParams = { ...params, level: 'all' };
      return companyService.search(allLevelsParams);
    });
    _.set(context, 'on.input', (e) => {
      inputHandler(e);
    });
    return h(ReferenceableAjaxBasicSelect, context);
  },
};
