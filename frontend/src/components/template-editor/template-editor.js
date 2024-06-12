/* global document */
import Handlebars from 'handlebars/dist/handlebars';
import sanitizeHtml from 'sanitize-html';
import RichTextEditor from '../rich-text-editor/rich-text-editor.vue';
import VariablesReference from './variables-reference/variables-reference.vue';
import loadHelpers from '../../utils/handlebars';

loadHelpers(Handlebars);

let templateTimeout;
const runTemplate = (template, variables) => {
  const compiledTemplate = Handlebars.compile(template);
  return compiledTemplate(variables);
};

const SANITIZE_OPTIONS = {
  allowedTags: ['style', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
    'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div', 'span',
    'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'img', 'br', 'hr'],
  allowedAttributes: {
    table: ['style', 'class', 'id'],
    th: ['style', 'class', 'colspan', 'data-e2e-type'],
    thead: ['class'],
    td: ['style', 'class', 'colspan', 'data-e2e-type'],
    style: ['type'],
    hr: ['class'],
    img: ['src'],
    div: ['class', 'id', 'data-e2e-type', 'style'],
    li: ['class', 'data-e2e-type'],
    ul: ['class'],
    span: ['style', 'class'],
    p: ['style', 'class'],
    h1: ['style', 'class'],
    h2: ['style', 'class'],
    h3: ['style', 'class'],
    h4: ['style', 'class'],
    h5: ['style', 'class'],
    h6: ['style', 'class'],
    pre: ['style', 'class'],
    a: ['href', 'rel', 'target', 'class'],
  },
  transformTags: {
    a: (tagName, attribs) => {
      // add noopener noreferrer to anchors
      const newAttribs = Object.assign({}, attribs, { rel: 'noopener noreferrer' });
      return {
        tagName: tagName,
        attribs: newAttribs,
      };
    },
  },
};

export default {
  props: {
    variables: {
      type: Object,
      default: () => {},
    },
    subject: {
      type: String,
      default: '',
    },
    value: {
      type: String,
      default: '',
    },
  },
  components: {
    VariablesReference,
    RichTextEditor,
  },
  data() {
    return {
      template: '',
      sanitizedTemplate: '',
      compiledSubject: '',
      templateError: null,
      subjectError: null,
    };
  },
  watch: {
    subject(newSubject) {
      if (newSubject) {
        try {
          this.subjectError = null;
          this.compiledSubject = runTemplate(this.subject, this.variables);
        } catch (e) {
          this.subjectError = e;
        }
      } else {
        this.compiledSubject = '';
      }
    },
    template(newTemplate) {
      if (newTemplate) {
        this.$emit('template-sanitizing', true);
        if (templateTimeout) {
          clearTimeout(templateTimeout);
        }
        if (this.sanitizedTemplate) {
          templateTimeout = setTimeout(() => {
            this._sanitizeTemplate();
            templateTimeout = null;
          }, 100);
        } else {
          this._sanitizeTemplate();
        }
      } else {
        this.sanitizedTemplate = '';
      }
    },
    sanitizedTemplate(newSanitizedTemplate) {
      this.$emit('input', newSanitizedTemplate);
      this.$emit('template-sanitizing', false);
    },
    value(newValue) {
      if (this.sanitizedTemplate !== newValue) {
        this.template = newValue;
      }
    },
    subjectError() {
      this._emitError();
    },
    templateError() {
      this._emitError();
    },
  },
  computed: {
    resolvedTemplate() {
      if (this.sanitizedTemplate || this.templateError) {
        try {
          return runTemplate(this.sanitizedTemplate, this.variables);
        } catch (e) {
          this.templateError = e;
        }
      }
      return '';
    },
  },
  methods: {
    _sanitizeTemplate() {
      const div = document.createElement('div');
      div.innerHTML = this.template;
      const scripts = div.getElementsByTagName('script');
      const len = scripts.length;
      if (len) {
        for (let i = 0; i < len; i++) {
          const s = scripts[i];
          s.parentNode.removeChild(s);
        }
      }
      this.sanitizedTemplate = sanitizeHtml(div.innerHTML, SANITIZE_OPTIONS);
      this.templateError = null;
    },
    _emitError() {
      const error = this.templateError || this.subjectError;
      this.$emit('template-error', error);
    },
  },
};