/* global $ */

export default {
  data() {
    return {
      summernote: null,
    };
  },
  props: {
    content: String,
    value: String,
    disabled: Boolean,
    placeholder: {
      type: String,
      default: 'Insert text here ...',
    },
    options: {
      type: Object,
      required: false,
      default: () => ({}),
    },
    toolbar: {
      type: [Boolean, Array],
      required: false,
      default: () => ([
        ['style', ['style']],
        ['font', ['bold', 'italic', 'underline', 'clear']],
        ['fontname', ['fontname']],
        ['color', ['color']],
        ['para', ['ul', 'ol', 'paragraph']],
        ['height', ['height']],
        ['table', ['table']],
        ['insert', ['link', 'picture', 'hr']],
        ['view', ['fullscreen', 'codeview']],
      ]),
    },
  },
  mounted() {
    this.initialize();
  },
  beforeDestroy() {
    this.summernote.summernote('destroy');
    this.summernote = null;
  },
  methods: {
    initialize() {
      if (this.$el) {
        const self = this;
        const textEditorElement = this.$refs.textEditor;
        const configuration = {
          disableDragAndDrop: true,
          disableResizeEditor: false,
          height: this.options.height || 100,
          placeholder: this.placeholder,
          tableClassName: function () {
            this.style = this.style || {};
            this.style.border = 1;
            this.style.borderCollapse = 'collapse';
            this.style.width = '100%';
            const tds = this.querySelectorAll('td');
            tds.forEach((td) => {
              td.style = td.style || {};
              td.style.border = '1px solid black';
            });
          },
          callbacks: {
            onChange: function (contents) {
              self._onContentChange(contents);
            },
            onChangeCodeview: function (contents) {
              self._onContentChange(contents);
            },
            onInit: function () {
              if (self.options && self.options.openCodeViewOnInit) {
                $('div.note-editor button.btn-codeview').click();
                // Remove button so user can't access normal view
                $('div.note-editor button.btn-codeview').remove();
              }
            },
          },
          toolbar: self.toolbar,
        };
        if (this.options.customFonts) {
          configuration.fontNames = this.options.customFonts;
          configuration.fontNamesIgnoreCheck = this.options.customFonts;
          configuration.addDefaultFonts = false;
        }
        this.summernote = $(textEditorElement).summernote(configuration);
        // set editor content
        if (self.value || self.content) {
          this.summernote.summernote('code', self.value || self.content);
        }
        // set custom default font if specified
        if (this.options.defaultFont) {
          $(textEditorElement).summernote('fontName', this.options.defaultFont);
        }
        // set enabled disabled
        if (this.summernote && typeof this.disabled === 'boolean') {
          if (this.disabled) {
            this.summernote.summernote('disable');
          } else {
            this.summernote.summernote('enable');
          }
        }
        self.$emit('ready', this.summernote);
      }
    },
    _onContentChange(newContent) {
      this._content = newContent;
      this.$emit('input', newContent);
    },
  },
  watch: {
    disabled: function (state) {
      if (this.summernote && typeof state === 'boolean') {
        if (state) {
          this.summernote.summernote('disable');
        } else {
          this.summernote.summernote('enable');
        }
      }
    },
    content: function (newVal) {
      if (this.summernote) {
        if (!!newVal && newVal !== this._content) {
          this._content = newVal;
          this.summernote.summernote('code', newVal);
        } else if (!newVal) {
          this.summernote.summernote('code', '');
        }
      }
    },
    value: function (newVal) {
      if (this.summernote) {
        if (newVal !== this._content) {
          this._content = newVal;
          this.summernote.summernote('code', newVal);
        } else if (!newVal) {
          this.summernote.summernote('code', '');
        }
      }
    },
  },
};
