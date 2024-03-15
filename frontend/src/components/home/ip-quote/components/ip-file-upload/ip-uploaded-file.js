import { formatFileSize } from '../../../../../utils/files/index';

const IMAGE_EXTENSIONS = ['jpg', 'png', 'gmp', 'gif', 'jpeg', 'tif', 'tiff'];
const DOC_EXTENSIONS = ['doc', 'docx'];
export default {
  props: {
    file: {
      type: Object,
      required: true,
    },
    showControls: {
      type: Boolean,
      default: true,
    },
  },
  created() {
    const fileSizeInfo = formatFileSize(this.file.size);
    this.fileSize = `${fileSizeInfo.size} ${fileSizeInfo.unit}`;
    this.fileTypeIconClassesMap = {
      pdf: 'fa-file-pdf-o',
      doc: 'fa-file-word',
      docx: 'fa-file-word',
      jpg: 'fa-file-image-o',
      png: 'fa-file-image-o',
      gmp: 'fa-file-image-o',
      gif: 'fa-file-image-o',
      jpeg: 'fa-file-image-o',
      txt: 'fa-file-text-o',
      tif: 'fa-file-text-o',
      tiff: 'fa-file-text-o',
      wpd: 'fa-file-text-o',
      tex: 'fa-file-text-o',
      rtf: 'fa-file-text-o',
      odt: 'fa-file-text-o',
    };
  },
  methods: {
    removeFile() {
      this.$emit('remove-file', this.file.name);
    },
    getIconClassName(extension) {
      if (IMAGE_EXTENSIONS.includes(extension)) return 'img';
      if (DOC_EXTENSIONS.includes(extension)) return 'doc';
      if (extension === 'pdf') return 'pdf';
      return 'text';
    },
  },
};
