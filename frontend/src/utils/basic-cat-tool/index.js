import { isImage, isPDF } from '../files';

export const fileSupported = (name) => isImage(name) || isPDF(name);
