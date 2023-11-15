const imageRegexp = (/.+\.(gif|jpg|jpeg|tiff|png)$/i);
const pdfRegexp = (/.+\.pdf$/i);

export const isImage = (name) => imageRegexp.test(name);

export const isPDF = (name) => pdfRegexp.test(name);

export const getFileWithExtension = (name) => ((/[.]/.exec(name)) ? /[^.]+$/.exec(name) : undefined);

export const formatFileSize = (sizeInBites, units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']) => {
  let l = 0;
  let size = parseInt(sizeInBites, 10) || 0;

  while (size >= 1024 && ++l) {
    size /= 1024;
  }
  // include a decimal point and a tenths-place digit if presenting
  // less than ten of KB or greater units
  return {
    size: size.toFixed(size < 10 && l > 0 ? 1 : 0),
    unit: units[l],
  };
};
