import moment from 'moment';

export const secondsToTimeLeftLegend = (_seconds) => {
  let seconds = parseInt(_seconds, 10);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds - (hours * 3600)) / 60);
  seconds = seconds - (hours * 3600) - (minutes * 60);
  if (hours) {
    if (minutes) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    return `${hours}h ${seconds}s`;
  }
  if (minutes) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
};

export const formatDate = (date, format = 'MM-DD-YYYY HH:mm') => {
  if (date.match('Z')) {
    return moment(date, 'YYYY-MM-DDTHH:mm:ssZ').format(format);
  }
  return date;
};

