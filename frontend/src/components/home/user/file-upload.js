import _ from 'lodash';
import SimpleBasicSelect from '../../form/simple-basic-select.vue';

const ALLOWED_FILE_TYPES = [
  'Agreement/Disclosure',
  'CV/Resume/Certification',
  'Technical Evaluation',
  'Tax Form',
  'Audit/Escalation Form',
  'Change of Information',
  'Other',
];
// To make sure event.target.files from a file upload <input> is an array or is
// array-like, check if value isArray or is instanceof FileList
const isArrayOrFileList = (arr) => Array.isArray(arr) || arr instanceof FileList;
const buildInintialState = () => ({
  documents: [],
  file: null,
  fileType: '',
  fileToUpload: {},
});

export default {
  components: { SimpleBasicSelect },
  props: {
    value: {
      type: Array,
    },
    userId: {
      type: String,
    },
    draggedFile: {
      // Receives a value instanceof File, check that type is object
      validator: (value) => _.isObject(value),
    },
  },
  data() {
    return buildInintialState();
  },
  watch: {
    draggedFile: function (newFile) {
      if (newFile) {
        this.file = newFile;
      }
    },
    fileType() {
      if (this.file) {
        this._setFileToUpload();
      }
    },
  },
  computed: {
    isValidFileType: function () {
      return _.get(this, 'fileType', '') !== '';
    },
    isValid: function () {
      return this.isValidFileType && !_.isEmpty(this.fileToUpload);
    },
    documentNames() {
      if (this.files) {
        return this.files.map((d) => d.name);
      }
      return [];
    },
  },
  created() {
    this.fileTypes = ALLOWED_FILE_TYPES;
  },
  methods: {
    show() {
      this.$refs.uploadUserDocument.show();
    },
    hide() {
      this.$refs.uploadUserDocument.hide();
    },
    cancel() {
      this._resetState();
      this.hide();
    },
    _resetState() {
      this.file = null;
      this.fileToUpload = {};
      this.fileType = '';
    },
    fireUploadPrompt(event) {
      event.preventDefault();
      this.$refs.fileUploadInput.click(event);
    },
    _setFileToUpload() {
      const { file } = this;
      file.fileType = _.get(this, 'fileType', '');
      const formData = new FormData();
      formData.append('file', file, file.name);
      this.fileToUpload = {
        formData,
        file,
      };
      this.$refs.fileUploadInput.value = null;
    },
    onFileSelect(event) {
      const files = _.get(event, 'target.files');
      if (files && isArrayOrFileList(files) && files.length) {
        // eslint-disable-next-line prefer-destructuring
        this.file = files[0];
        this._setFileToUpload();
      }
    },
    emitUpload() {
      this.$emit('upload-document', this.fileToUpload);
      this._resetState();
      this.hide();
    },
  },
};
