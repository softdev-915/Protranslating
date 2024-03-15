import _ from 'lodash';
import IpUploadedFile from './ip-uploaded-file.vue';

const FILE_TYPE_WHITELIST = ['doc', 'docx', 'doc', 'pdf', 'gmp', 'gif', 'png', 'jpeg', 'jpg', 'tif', 'tiff', 'txt', 'wpd', 'tex', 'rtf', 'odt'];

export default {
  props: {
    required: {
      type: Boolean,
      default: false,
    },
    'data-e2e-type': {
      type: String,
      default: '',
    },
  },
  components: {
    IpUploadedFile,
  },
  data() {
    return {
      isDragOver: false,
      filelist: [],
    };
  },
  methods: {
    onChange() {
      const files = _.filter(this.$refs.file.files, (file) => {
        const ext = file.name.split('.').pop();
        return FILE_TYPE_WHITELIST.includes(ext);
      });
      this.filelist = this.filelist.concat(files);
      this.$emit('file-upload', this.filelist);
    },
    dragover(event) {
      event.preventDefault();
      this.isDragOver = true;
    },
    dragleave(event) {
      event.preventDefault();
      this.isDragOver = false;
    },
    drop(event) {
      event.preventDefault();
      this.$refs.file.files = event.dataTransfer.files;
      this.onChange();
      this.isDragOver = false;
    },
    getFileInfo(file) {
      return {
        name: file.name,
        size: file.size,
        objectUrl: URL.createObjectURL(file),
        ext: file.name.split('.').pop(),
      };
    },
    onFileRemove(name) {
      this.filelist = _.filter(this.filelist, (f) => f.name !== name);
      this.$emit('file-upload', this.filelist);
    },
  },
};
