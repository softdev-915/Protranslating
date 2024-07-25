import moment from 'moment';

export const FMT = 'YYYY-MM-DDTHH:mm:ssZ';

export const RANGES = {
  today: {
    name: 'Today',
    factory: () => moment().format(FMT),
  },
  tomorrow: {
    name: 'Tomorrow',
    factory: () => [moment().startOf('day').add(1, 'days').format(FMT), moment().add(1, 'days').endOf('day').format(FMT)],
  },
  yesterday: {
    name: 'Yesterday',
    factory: () => [moment().startOf('day').add(-1, 'days').format(FMT), moment().add(-1, 'days').endOf('day').format(FMT)],
  },
  twoDaysFromNow: {
    name: '2 Days From Now',
    factory: () => [moment().startOf('day').add(2, 'days').format(FMT), moment().add(2, 'days').endOf('day').format(FMT)],
  },
  threeDaysFromNow: {
    name: '3 Days From Now',
    factory: () => [moment().startOf('day').add(3, 'days').format(FMT), moment().add(3, 'days').endOf('day').format(FMT)],
  },
  fourDaysFromNow: {
    name: '4 Days From Now',
    factory: () => [moment().startOf('day').add(4, 'days').format(FMT), moment().add(4, 'days').endOf('day').format(FMT)],
  },
  previousSevenDays: {
    name: 'Previous 7 days',
    factory: () => [moment().startOf('day').add(-7, 'days').format(FMT), moment().endOf('day').format(FMT)],
  },
  previousThirtyDays: {
    name: 'Previous 30 days',
    factory: () => [moment().startOf('day').add(-30, 'days').format(FMT), moment().endOf('day').format(FMT)],
  },
  nextThirtyDays: {
    name: 'Next 30 days',
    factory: () => [moment().startOf('day').format(FMT), moment().add(30, 'days').endOf('day').format(FMT)],
  },
  lastYear: {
    name: 'Last Year',
    factory: () => [moment().startOf('year').add(-1, 'years').format(FMT), moment().add(-1, 'years').endOf('year').format(FMT)],
  },
  thisYear: {
    name: 'This Year',
    factory: () => [moment().startOf('year').format(FMT), moment().endOf('year').format(FMT)],
  },
  yearToDate: {
    name: 'Year to Date (YTD)',
    factory: () => [moment().startOf('year').format(FMT), moment().endOf('day').format(FMT)],
  },
  thisMonth: {
    name: 'This Month',
    factory: () => [moment().startOf('month').format(FMT), moment().endOf('month').format(FMT)],
  },
};
