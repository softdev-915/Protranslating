import _ from 'lodash';
import { mapActions, mapGetters } from 'vuex';
import { hotkeySaveMixin } from './hotkey-save-mixin';

export const entityEditMixin = {
  inject: ['$validator'],
  props: {
    entityId: {
      type: String,
    },
  },
  mixins: [hotkeySaveMixin],
  data() {
    return {
      httpRequesting: false,
      isEntityRetrieved: false,
      saving: false,
      saved: false,
      onRouteChangeTrigger: true,
      showErrorOnRetrieve: true,
    };
  },
  beforeRouteLeave(to, from, next) {
    const toPath = to.path.split('/');
    const fromPath = from.path.split('/');
    const toBasePath = toPath[1];
    const fromBasePath = fromPath[1];
    // The application should only save the state when the view
    // changes to another child view. If this is the case the first part
    // of the URL matches. If not it means that the application is going
    // to a completely new view.
    const isSiblingRoute = toBasePath !== null && fromBasePath !== null
      && toBasePath === fromBasePath;
    if (isSiblingRoute) {
      // if it is a sibling route, clear all the obsolete form state
      // meaning the form states that should be forgotten.
      this.clearObsoleteFormState({ path: to.path });
      if (toPath[toPath.length - 1] === '') {
        // If toPath ends with an empty string (to.path ends with '/'), remove
        // that element
        toPath.splice(toPath.length - 1, 1);
      }
      const createPath = fromPath.length ? fromPath[fromPath.length - 1] : '';
      const gridPath = toPath.length ? toPath[toPath.length - 1] : '';
      let isPreviousRouteCreate = false;
      if (typeof createPath === 'string') {
        isPreviousRouteCreate = createPath.match(/create/);
      }
      let isNextRouteGrid = false;
      if (typeof gridPath === 'string' && fromPath.length > 1) {
        const entityRegex = new RegExp(`${fromPath[fromPath.length - 2]}`);
        isNextRouteGrid = gridPath.match(entityRegex) && toPath.length === fromPath.length - 1;
      }
      if (isPreviousRouteCreate && isNextRouteGrid) {
        // If the view is changing from a creation to a grid page, delete data
        // if from.path is .../entityN/create and if to.path is .../entityN,
        // making sure that only entityN is taken into account, comparing the
        // lengths of toPath and fromPath
        this.clearObsoleteFormState({ path: from.path });
      } else if (this._pickFormData) {
        // The next view is a sibling of the current one. The state of the form
        // will be saved if the component implements _pickFormData method.
        const formDataToSave = this._pickFormData();
        this.saveFormState({
          key: fromBasePath,
          id: this.formId,
          path: from.path,
          data: formDataToSave,
        });
      }
    } else {
      // the application is navigating to another unrelated view.
      // clear all forms data for that route family
      this.clearFormFamilyState({ key: fromBasePath });
    }
    next();
  },
  created() {
    // this life cycle hook kicks in whenever the component is created.
    // If the component is replaced by itself, it will not trigger this
    // life cycle hook but rather the $route watcher, for instance
    // navigating from /companies/:entityId/details to /companies/:entityId/manage
    // WILL NOT trigger this life cycle hook.
    this._initialize(this.entityId);
  },
  destroyed() {
    document.onkeydown = () => true;
  },
  watch: {
    // this watcher kicks in whenever the component is replaced.
    // If the component is newly created, it will not trigger this
    // watcher but rather the created life cycle hook, for instance
    // navigating from /companies/:entityId/details to /companies/:entityId/manage
    // WILL trigger watcher, but navigating from /users to /companies/:entityId/details
    // WILL NOT trigger this watcher.
    $route: function (to) {
      if (this.onRouteChangeTrigger) {
        if (to.params && to.params.entityId) {
          this._initialize(to.params.entityId);
        } else {
          this._initialize();
        }
      }
    },
  },
  computed: {
    ...mapGetters('form', ['formState']),
    formKey() {
      return this.$route.path.split('/')[1];
    },
    formId() {
      if (this.entityId) {
        return this.entityId;
      }
      return this.$route.path;
    },
    cancelText() {
      return this.canEdit && !this.saved ? 'Cancel' : 'Exit';
    },
    canSaveForm() {
      if (this.isNew) {
        return this.canCreate;
      }
      return this.canEdit;
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    ...mapActions('form', ['saveFormState', 'clearObsoleteFormState', 'clearFormFamilyState']),
    _initialize(entityId) {
      this.isEntityRetrieved = false;
      if (entityId) {
        this.httpRequesting = true;
        const service = this._service();
        service.get(entityId).then((response) => {
          this._handleRetrieve(response);
          // Check if the form has a previous state.
          const previousFormState = this.formState(this.formKey, this.formId);
          if (previousFormState) {
            Object.assign(this, previousFormState.data);
          }
          this.isEntityRetrieved = true;
        }).catch((err) => {
          if (this.showErrorOnRetrieve) {
            const notification = {
              title: 'Error',
              message: `Could not retrieve ${this.entityName}`,
              state: 'danger',
              response: err,
            };
            this.pushNotification(notification);
          }
        })
          .finally(() => {
            this.httpRequesting = false;
          });
      } else {
        const previousFormState = this.formState(this.formKey, this.$route.path);
        if (previousFormState) {
          if (this._assignPreviousFormState) {
            this._assignPreviousFormState(previousFormState.data);
          } else {
            Object.assign(this, previousFormState.data);
          }
        } else if (this._clear) {
          this._clear();
        }
        this.isEntityRetrieved = true;
      }
    },
    _save(entity, options = {}) {
      if (document.saving) return;
      const { successCreateMessage = `successfully created ${this.entityName}` } = options;
      const { successEditMessage = `successfully edited ${this.entityName}` } = options;
      this.httpRequesting = true;
      this.saving = true;
      document.saving = true;
      const id = _.isFunction(this._getEntityId) ? this._getEntityId() : entity._id;
      if (!_.isEmpty(id)) {
        return this._service().edit(entity).then((response) => {
          this.saved = true;
          this.httpRequesting = false;
          this.saving = false;
          document.saving = false;
          if (this._handleEditResponse) {
            this._handleEditResponse(response);
          }
          const notification = {
            title: 'Success',
            message: successEditMessage,
            state: 'success',
          };
          this.pushNotification(notification);
          return true;
        }).catch((err) => {
          this.httpRequesting = false;
          this.saving = false;
          document.saving = false;
          const message = _.get(err, 'status.message', `could not edit ${this.entityName}`);
          if (this._editErrorHandlers) {
            const errorHandler = this._editErrorHandlers(err);
            if (errorHandler) {
              if (!errorHandler()) {
                return;
              }
            }
          }
          // If ERR 409 Conflict catch
          if (err.status && err.status.code && err.status.code === 409
            && err.status.data && err.status.message && err.status.message.indexOf('You tried to edit an old record') !== -1) {
            // Refresh the visible item
            if (this._refreshEntity) {
              this._refreshEntity(err.status.data);
            }
            const conflictNotification = {
              title: `${this.entityName} update failed`,
              message: err.status.message,
              state: 'warning',
              response: err,
            };
            this.pushNotification(conflictNotification);
          } else {
            const notification = {
              title: 'Error',
              message,
              state: 'danger',
              response: err,
            };
            this.pushNotification(notification);
          }
        });
      }
      return this._service().create(entity).then((response) => {
        this.saved = true;
        this.httpRequesting = false;
        this.saving = false;
        document.saving = false;
        this._handleCreate(response);
        const notification = {
          title: 'Success',
          message: successCreateMessage,
          state: 'success',
        };
        this.pushNotification(notification);
        return true;
      }).catch((err) => {
        this.httpRequesting = false;
        this.saving = false;
        document.saving = false;
        const notification = {
          title: 'Error',
          message: _.get(err, 'status.message', `could not create ${this.entityName}`),
          state: 'danger',
          response: err,
        };
        this.pushNotification(notification);
        return false;
      });
    },
    close() {
      this.$emit('section-navigate-previous');
    },
  },
};
