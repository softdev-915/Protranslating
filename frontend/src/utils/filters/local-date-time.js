import moment from 'moment';

const localDateTime = (date, format, convert, localTimeZone = false) => {
  if (!date) {
    return null;
  }
  const { timeZone } = new Intl.DateTimeFormat().resolvedOptions();
  if (convert === false) {
    const formattedDate = moment.utc(date).format(format);
    if (localTimeZone) {
      return `${formattedDate} ${timeZone}`;
    }
    return formattedDate;
  }
  if (moment.isMoment(date)) {
    const dateMoment = date.local();
    if (dateMoment.isValid()) {
      if (localTimeZone) {
        return `${dateMoment.format(format)} ${timeZone}`;
      }
      return dateMoment.format(format);
    }
  }
  return moment.utc(date).local().format(format);
};

export default localDateTime;
