const moment = require('moment');
const { expect } = require('chai');
const forEach = require('mocha-each');

require('mocha');

const { buildDateQuery } = require('../../../../../../app/components/database/mongo/query/date');

const FAIL_CASES = [
  [400, '"null" is not a valid date query', null],
  [400, '"undefined" is not a valid date query', undefined],
  [400, '"undefined" is not a valid date query'],
  [400, '"Tue Sep 17 1991 01:04:30 GMT+0000" is not a valid date query. Expected string but got object', moment.utc('1991-09-17T01:04:30Z')],
  [400, /".*" is not a valid date query\. Expected string but got object/, new Date(1991, 8, 17)],
  [400, '"0" is not a valid date query. Expected string but got number', 0],
  [400, '"[object Object]" is not a valid date query. Expected string but got object', {}],
  [400, '"null" is not a valid utc offset (in minutes)', '1991-09-17', null],
  [400, '"undefined" is not a valid utc offset (in minutes)', '1991-09-17'],
  [400, '"undefined" is not a valid utc offset (in minutes)', '1991-09-17', undefined],
  [400, '"NaN" is not a valid utc offset (in minutes). It must be a number', '1991-09-17', NaN],
  [400, '"asd" is not a valid date', 'asd', 0],
  [400, '"1991-09-17 " is not a valid date', '1991-09-17 ', 0],
  [400, '"1991-09-17" is not a valid ISO 8601 date', '1991-09-17,1991-09-18', 0],
  [400, '"1991-09-18" is not a valid ISO 8601 date', '1991-09-17T01:03:30Z,1991-09-18', 0],
  [400, '"1991-09-17T01:67:30Z" is not a valid ISO 8601 date', '1991-09-17T01:67:30Z,1991-09-18T01:03:30Z', 0],
  [400, '"1991-09-18T01:67:30Z" is not a valid ISO 8601 date', '1991-09-17T01:00:30Z,1991-09-18T01:67:30Z', 0],
  [400, '"1991-09-17T01:00:30Z " is not a valid ISO 8601 date', '1991-09-17T01:00:30Z ,1991-09-18T01:00:30Z', 0],
  [400, '" 1991-09-18T01:00:30Z" is not a valid ISO 8601 date', '1991-09-17T01:00:30Z, 1991-09-18T01:00:30Z', 0],
  [400, '"1991-09-18T01:00:30Z" is after "1991-09-17T01:00:30Z"', '1991-09-18T01:00:30Z,1991-09-17T01:00:30Z', 0],
];

const TEST_CASES = [
  ['today', {
    $gte: moment.utc().startOf('day'),
    $lte: moment.utc().endOf('day'),
  }, 0],
  ['yesterday', {
    $gte: moment.utc().subtract(1, 'days').startOf('day'),
    $lte: moment.utc().subtract(1, 'days').endOf('day'),
  }, 0],
  ['tomorrow', {
    $gte: moment.utc().add(1, 'day').startOf('day'),
    $lte: moment.utc().add(1, 'day').endOf('day'),
  }, 0],
  ['twoDaysFromNow', {
    $gte: moment.utc().startOf('day').add(2, 'days'),
    $lte: moment.utc().endOf('day').add(2, 'days'),
  }, 0],
  ['threeDaysFromNow', {
    $gte: moment.utc().startOf('day').add(3, 'days'),
    $lte: moment.utc().endOf('day').add(3, 'days'),
  }, 0],
  ['fourDaysFromNow', {
    $gte: moment.utc().startOf('day').add(4, 'days'),
    $lte: moment.utc().endOf('day').add(4, 'days'),
  }, 0],
  ['previousSevenDays', {
    $gte: moment.utc().startOf('day').subtract(7, 'days'),
    $lte: moment.utc().endOf('day'),
  }, 0],
  ['previousThirtyDays', {
    $gte: moment.utc().startOf('day').add(-30, 'days'),
    $lte: moment.utc().endOf('day'),
  }, 0],
  ['nextThirtyDays', {
    $gte: moment.utc().startOf('day'),
    $lte: moment.utc().endOf('day').add(30, 'days'),
  }, 0],
  ['thisYear', {
    $gte: moment.utc().startOf('year'),
    $lte: moment.utc().endOf('year'),
  }, 0],
  ['yearToDate', {
    $gte: moment.utc().startOf('year'),
    $lte: moment.utc().endOf('day'),
  }, 0],
  ['lastYear', {
    $gte: moment.utc().startOf('year').add(-1, 'years'),
    $lte: moment.utc().endOf('year').add(-1, 'years'),
  }, 0],
  // with utf offset in minutes
  ['today with utfOffsetMinutes=-180', {
    $gte: moment.utc().add(-180, 'minutes').startOf('day').subtract(-180, 'minutes'),
    $lte: moment.utc().add(-180, 'minutes').endOf('day').subtract(-180, 'minutes'),
  }, -180],
  ['tomorrow with utfOffsetMinutes=-180', {
    $gte: moment.utc().add(-180, 'minutes').add(1, 'day').startOf('day')
      .subtract(-180, 'minutes'),
    $lte: moment.utc().add(-180, 'minutes').add(1, 'day').endOf('day')
      .subtract(-180, 'minutes'),
  }, -180],
  ['twoDaysFromNow with utfOffsetMinutes=-180', {
    $gte: moment.utc().add(-180, 'minutes').startOf('day').add(2, 'days')
      .subtract(-180, 'minutes'),
    $lte: moment.utc().add(-180, 'minutes').endOf('day').add(2, 'days')
      .subtract(-180, 'minutes'),
  }, -180],
  ['threeDaysFromNow with utfOffsetMinutes=-180', {
    $gte: moment.utc().add(-180, 'minutes').startOf('day').add(3, 'days')
      .subtract(-180, 'minutes'),
    $lte: moment.utc().add(-180, 'minutes').endOf('day').add(3, 'days')
      .subtract(-180, 'minutes'),
  }, -180],
  ['fourDaysFromNow with utfOffsetMinutes=-180', {
    $gte: moment.utc().add(-180, 'minutes').startOf('day').add(4, 'days')
      .subtract(-180, 'minutes'),
    $lte: moment.utc().add(-180, 'minutes').endOf('day').add(4, 'days')
      .subtract(-180, 'minutes'),
  }, -180],
  ['previousThirtyDays with utfOffsetMinutes=-180', {
    $gte: moment.utc().add(-180, 'minutes').startOf('day').add(-30, 'days')
      .subtract(-180, 'minutes'),
    $lte: moment.utc().add(-180, 'minutes').endOf('day').subtract(-180, 'minutes'),
  }, -180],
  ['nextThirtyDays with utfOffsetMinutes=-180', {
    $gte: moment.utc().add(-180, 'minutes').startOf('day').subtract(-180, 'minutes'),
    $lte: moment.utc().add(-180, 'minutes').endOf('day').add(30, 'days')
      .subtract(-180, 'minutes'),
  }, -180],
  ['thisYear with utfOffsetMinutes=-180', {
    $gte: moment.utc().add(-180, 'minutes').startOf('year').subtract(-180, 'minutes'),
    $lte: moment.utc().add(-180, 'minutes').endOf('year').subtract(-180, 'minutes'),
  }, -180],
  ['yearToDate with utfOffsetMinutes=-180', {
    $gte: moment.utc().add(-180, 'minutes').startOf('year').subtract(-180, 'minutes'),
    $lte: moment.utc().add(-180, 'minutes').endOf('day').subtract(-180, 'minutes'),
  }, -180],
  ['lastYear with utfOffsetMinutes=-180', {
    $gte: moment.utc().add(-180, 'minutes').startOf('year').add(-1, 'years')
      .subtract(-180, 'minutes'),
    $lte: moment.utc().add(-180, 'minutes').endOf('year').add(-1, 'years')
      .subtract(-180, 'minutes'),
  }, -180],
  ['lastYear with utfOffsetMinutes=-180', {
    $gte: moment.utc().add(-180, 'minutes').startOf('year').add(-1, 'years')
      .subtract(-180, 'minutes'),
    $lte: moment.utc().add(-180, 'minutes').endOf('year').add(-1, 'years')
      .subtract(-180, 'minutes'),
  }, -180],
  ['1991-09-17T00:00:00Z,1991-09-17T01:00:00Z', {
    $gte: moment.utc('1991-09-17T00:00:00Z', 'YYYY-MM-DDTHH:mm:ssZ', true),
    $lte: moment.utc('1991-09-17T01:00:00Z', 'YYYY-MM-DDTHH:mm:ssZ', true),
  }, 0],
  ['1991-09-17T00:00:00Z,1991-09-29T00:00:00Z', {
    $gte: moment.utc('1991-09-17T00:00:00Z', 'YYYY-MM-DDTHH:mm:ssZ', true),
    $lte: moment.utc('1991-09-29T00:00:00Z', 'YYYY-MM-DDTHH:mm:ssZ', true),
  }, 0],
  ['1991-09-17T00:00:00Z,1991-09-17T01:00:00Z with utfOffsetMinutes=-180', {
    $gte: moment.utc('1991-09-17T00:00:00Z', 'YYYY-MM-DDTHH:mm:ssZ', true),
    $lte: moment.utc('1991-09-17T01:00:00Z', 'YYYY-MM-DDTHH:mm:ssZ', true),
  }, -180],
  ['1991-09-17T00:00:00Z,1991-09-29T00:00:00Z with utfOffsetMinutes=-180', {
    $gte: moment.utc('1991-09-17T00:00:00Z', 'YYYY-MM-DDTHH:mm:ssZ', true),
    $lte: moment.utc('1991-09-29T00:00:00Z', 'YYYY-MM-DDTHH:mm:ssZ', true),
  }, -180],
];

describe('buildDateQuery', () => {
  forEach(FAIL_CASES)
    .it('Should fail to build a date query condition with code %d and message "%s"', async (code, message, filterValue, utcOffsetInMinutes) => {
      let errorThrown = null;
      try {
        buildDateQuery(filterValue, utcOffsetInMinutes);
      } catch (e) {
        errorThrown = e;
      }
      expect(errorThrown).to.exist;
      expect(errorThrown.code).to.equal(code);
      if (message instanceof RegExp) {
        expect(message.test(errorThrown.message)).to.be.true;
      } else {
        expect(errorThrown.message).to.equal(message);
      }
    });

  forEach(TEST_CASES)
    .it('Should correctly generate the query condition %s', async (conditionDescription, query, utcOffsetInMinutes) => {
      const value = conditionDescription.split(' ')[0];
      const dateQueryCondition = buildDateQuery(value, utcOffsetInMinutes);
      expect(dateQueryCondition).to.exist;
      expect(dateQueryCondition.$gte).to.exist;
      expect(dateQueryCondition.$lte).to.exist;
      expect(dateQueryCondition.$gte.isSame(query.$gte)).to.be.true;
      expect(dateQueryCondition.$lte.isSame(query.$lte)).to.be.true;
    });
});

