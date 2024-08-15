/* eslint-disable no-restricted-syntax */
import _ from 'lodash';
import parse from 'emailjs-mime-parser';
import { mapActions } from 'vuex';
import {
  clear, dropFile, dragover, dragstart, dragend,
} from '../../../../utils/dragndrop';

const ATTACHMENTS_LIMIT = 20;
const bodyContentTypes = ['text/plain', 'text/html'];
const requiredHeaders = ['from', 'subject', 'date'];
const parseAddressHeader = (header) => {
  if (Array.isArray(header)) {
    return _.flatMap(header, (h) => {
      if (Array.isArray(h.value)) {
        return h.value
          .filter((v) => v.address)
          .map((v) => v.address);
      }
      return [];
    });
  }
  return [];
};

export default {
  mounted() {
    this._addEvents();
  },
  data() {
    return {
      body: [],
      attachments: [],
      inlineContents: [],
      parsing: false,
      dragging: false,
    };
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    ...mapActions('eml', ['setEmlUpload']),

    onFileDropped(file) {
      if (!this.parsing) {
        this.readFile(file);
      }
    },

    onFileInputChanged(evt) {
      const files = _.get(evt, 'target.files', []);
      if (files && files.length > 0) {
        this.readFile(files[0]);
      }
      _.set(evt, 'target.value', '');
    },

    readFile(file) {
      const fr = new FileReader();

      this.parsing = true;

      fr.onload = () => {
        const mimeTree = parse(fr.result);

        this.setUpload(mimeTree);

        this.parsing = false;
      };
      fr.readAsText(file);
    },

    setUpload(mimeTree) {
      const { headers } = mimeTree;

      this._clear();

      if (this.$route.name === 'activity-edition') {
        const notification = {
          title: 'Error',
          message: 'Can\'t edit existing activity by dropping en eml file.',
          state: 'warning',
        };
        return this.pushNotification(notification);
      }

      const jsonEml = {
        to: parseAddressHeader(headers.to),
        cc: parseAddressHeader(headers.cc),
        bcc: parseAddressHeader(headers.bcc),
        date: _.get(headers, 'date[0].value', ''),
        subject: _.get(headers, 'subject[0].value', ''),
        from: _.get(headers, 'from[0].value[0].address', ''),
      };
      for (const field of Object.keys(jsonEml)) {
        if (requiredHeaders.includes(field)
          && jsonEml[field].length === 0) {
          return this.missingHeaderError(field);
        }
      }
      if (!jsonEml.to && !jsonEml.cc && !jsonEml.bcc) {
        return this.missingHeaderError('to/cc/bcc');
      }

      try {
        this.parseMimeTree(mimeTree);
      } catch (e) {
        return this.invalidFileError(e.message);
      }

      const htmlContent = this.body.find((b) => b.contentType === 'text/html');
      const textContent = this.body.find((b) => b.contentType === 'text/plain');
      if (!htmlContent && !textContent) {
        return this.missingHeaderError('body');
      }

      jsonEml.textBody = textContent ? textContent.value : null;
      jsonEml.htmlBody = htmlContent ? this._insertInlineContent(htmlContent.value) : null;
      jsonEml.attachments = this.attachments;
      this.$router.push({ name: 'activity-creation' }).catch((err) => { console.log(err); });
      this.setEmlUpload(jsonEml);
    },

    parseMimeTree(mimeNode) {
      const charset = _.get(mimeNode, 'charset', 'utf-8');
      const contentType = _.get(mimeNode, 'contentType.value', '');
      const contentDispositionHeader = _.get(mimeNode, 'headers.content-disposition', []);
      const inlineDisposition = contentDispositionHeader.find((v) => v.value === 'inline');
      const attachmentDisposition = contentDispositionHeader.find((v) => v.value === 'attachment');
      const attachmentParams = attachmentDisposition ? attachmentDisposition.params : null;

      if (mimeNode.childNodes.length > 0) {
        mimeNode.childNodes.forEach(this.parseMimeTree);
      } else if (attachmentParams) {
        this.attachments.push({
          name: attachmentParams.filename,
          value: _.get(mimeNode, 'content', new Uint8Array()),
          contentType: contentType,
          lastModified: attachmentParams['modification-date'],
        });
      } else if (bodyContentTypes.includes(contentType)) {
        this.body.push({
          contentType: contentType,
          value: new TextDecoder(charset).decode(_.get(mimeNode, 'content', new Uint8Array())),
        });
      } else if (inlineDisposition) {
        this.inlineContents.push(mimeNode);
      }

      if (this.attachments.length > ATTACHMENTS_LIMIT) {
        const exception = {
          message: `Eml file contains more than ${ATTACHMENTS_LIMIT} attachments`,
        };
        throw exception;
      }
    },

    missingHeaderError(missingHeader) {
      this.invalidFileError('Please select a valid eml file', missingHeader);
    },

    invalidFileError(message, missingField = undefined) {
      if (missingField) {
        /* eslint-disable no-console */
        console.warn(`Eml file is missing ${missingField} header.`);
      }
      const notification = {
        title: 'File is invalid',
        message: message,
        state: 'warning',
      };
      this.pushNotification(notification);
    },

    _insertInlineContent(html) {
      this.inlineContents.forEach((node) => {
        const contentType = _.get(node, 'contentType.value', '');
        const base64Content = btoa(String.fromCharCode(...node.content));
        const encoding = _.get(node, 'contentTransferEncoding.value', '');
        const contentIdHeader = _.get(node, 'headers.content-id', []);
        const contentIds = contentIdHeader.map((contentId) => {
          const value = _.get(contentId, 'value', '');
          return `cid:${value.slice(1, -1)}`;
        });

        if (contentType && contentIds && encoding === 'base64') {
          const base64StringValue = `data:${contentType};${encoding}, ${base64Content}`;
          contentIds.forEach((contentId) => {
            html = html.replace(new RegExp(contentId, 'g'), base64StringValue);
          });
        }
      });
      return html;
    },

    _onDrop(evt) {
      const files = _.get(evt, 'dataTransfer.files', []);

      evt.stopPropagation();
      evt.preventDefault();

      if (files.length > 1) {
        const notification = {
          title: 'Error',
          message: 'Can\'t upload multiple files',
          state: 'warning',
        };
        this.pushNotification(notification);

        clear.call(this);
      } else {
        dropFile.call(this, evt);
      }
    },

    _clear() {
      this.body = [];
      this.attachments = [];
      this.inlineContents = [];
    },

    _addEvents() {
      const { dropzone } = this.$refs;

      dropzone.addEventListener('dragover', dragover.bind(this));
      dropzone.addEventListener('dragstart', dragstart.bind(this), false);
      dropzone.addEventListener('dragend', dragend.bind(this), false);
      dropzone.addEventListener('dragexit', clear.bind(this));
      dropzone.addEventListener('dragleave', clear.bind(this));
      dropzone.addEventListener('drop', this._onDrop.bind(this));
    },
  },
};
