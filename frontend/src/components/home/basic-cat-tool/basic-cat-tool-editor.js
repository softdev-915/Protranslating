
import _ from 'lodash';
import { mapActions } from 'vuex';
import RichTextEditor from '../../rich-text-editor/rich-text-editor.vue';
import BasicCATTranslationService from '../../../services/basic-cat-translation-service';

const basicCatService = new BasicCATTranslationService();
const newTranslation = () => ({
  _id: null,
  request: null,
  document: null,
  readDate: null,
  language: {
    isoCode: null,
  },
  translation: '',
});

export default {
  components: {
    RichTextEditor,
  },
  props: {
    request: {
      type: Object,
      required: true,
    },
    document: Object,
    language: String,
    idleBeforeSave: {
      type: Number,
      default: 5000,
    },
  },
  data() {
    return {
      translation: newTranslation(),
      isLoading: false,
      isSaving: false,
      saveTimeout: null,
    };
  },
  created() {
    if (this.request && this.document) {
      this._loadTranslation();
    }
  },
  watch: {
    document(newVal, oldValue) {
      if (oldValue) {
        // if old value is truthy it means we switched from a document to another
        // we need to save the current document's state
        this.save().then(() => {
          if (newVal) {
            this._loadTranslation();
          } else {
            this._cleanTranslation();
          }
        });
      } else {
        this._loadTranslation();
      }
    },
    wordCount(newWordCount) {
      this.$emit('word-count-changed', newWordCount);
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    startTimeout() {
      if (this.saveTimeout) {
        window.clearTimeout(this.saveTimeout);
      }
      this.saveTimeout = setTimeout(() => {
        this.save();
      }, this.idleBeforeSave);
    },
    save() {
      if (!this.isSaving) {
        this.isSaving = true;
        // make a request to store the translation
        this._saveTranslation({
          request: this.request._id,
          language: this.language,
          document: this.document._id,
          translation: this.translation,
        })
          .then((translation) => {
            this.isSaving = false;
            this.translation._id = translation._id;
            this.translation.readDate = translation.readDate;
          }).catch((err) => {
            const statusCode = _.get(err, 'status.code');
            if (statusCode === 409) {
            // if 409 we know that save button must remain disabled,
            // so we don't set isSaving to false
              this.pushNotification({
                title: 'Translation could not be updated',
                message: 'A newer varsion of the translation has been found, please refresh the page knowing that your changes WILL BE LOST',
                state: 'warning',
                response: err,
              });
            } else {
              this.pushNotification({
                title: 'Error',
                message: 'Could not save translation',
                state: 'danger',
                response: err,
              });
              this.isSaving = false;
            }
          });
      }
    },
    _loadTranslation() {
      this.isLoading = true;
      this.translation.document = this.document._id;
      this._retrieveTranslation({
        request: this.request._id,
        language: this.language,
        document: this.document._id,
      }).then((translationResponse) => {
        // const [fileResponse, translationResponse] = data;
        this.isLoading = false;
        this.$emit('editor-status', 'ready');
        return translationResponse.data.translation;
      }).catch((err) => {
        this.isLoading = false;
        this.$emit('editor-status', 'error');
        const statusCode = _.get(err, 'status.code');
        if (statusCode === 404) {
          // 404 means no translation found, so a new one is being created
          return this._buildTranslation();
        }
        this.pushNotification({
          title: 'Error',
          message: `Could not download file ${this.document.name}`,
          state: 'danger',
          response: err,
        });
      }).then((translation) => {
        if (translation) {
          this.translation = translation;
        }
      });
    },
    _retrieveTranslation(translation) {
      return basicCatService.get(translation);
    },
    _saveTranslation(translation) {
      this.$emit('editor-status', 'saving');
      return basicCatService.edit(translation).then((response) => {
        this.$emit('editor-status', 'ready');
        return response.data;
      });
    },
    _buildTranslation() {
      const translation = newTranslation();
      translation.language = { isoCode: this.language };
      translation.request = this.request._id;
      translation.document = this.document._id;
      return translation;
    },
  },
  computed: {
    wordCount() {
      if (this.translation.translation) {
        return this.translation.translation.split(' ').filter((w) => w).length;
      }
      return 0;
    },
  },
};
