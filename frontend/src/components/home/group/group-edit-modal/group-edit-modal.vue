<template>
  <div class="pts-grid-edit-modal">
    <b-modal size="lg" hide-header-close ref="modal">
      <div slot="modal-header">
        <template v-if="isNew">Create new group</template>
        <template v-if="!isNew && canEdit">Editing {{group.name}}</template>
        <template v-if="!isNew && !canEdit">Details for group "{{group.name}}"</template>
      </div>
      <div slot="default">
            <b-breadcrumb :items="navigationBreadcrumb" v-if="showBreadcrumb" @click="navigateBack"></b-breadcrumb>
        <div class="container-fluid" v-show="this.managing === null">
          <div class="row align-items-center">
            <div class="col-12 col-md-2">Name</div>
            <div class="col-12 col-md-10">
              <input type="text" :disabled="!canEdit" class="form-control" :class="{'form-control-danger': !isValidName}" v-model.trim="group.name">
            </div>
          </div>
          <div class="row align-items-center">
            <div class="col-12 col-md-2">Roles</div>
            <div class="col-8 col-md-8 pts-grid-edit-text checkbox-modal-window">
              <template v-for="role in group.roles">
                {{role}}
              </template>
            </div>
            <div class="col-4 col-md-2 mobile-align-right" v-if="canEdit">
              <i class="fas fa-spin fa-circle-o-notch" v-show="loadingRoles"></i>
              <button class="btn btn-primary" v-show="!loadingRoles" @click="manage('roles')">Manage</button>
            </div>
          </div>
          <div class="row align-items-center" v-show="!isNew && canEdit">
            <div class="col-12 col-md-2">
              <label>Inactive</label>
            </div>
            <div class="col-12 col-md-10 checkbox-container">
              <input type="checkbox" class="form-control pts-clickable" v-model.trim="group.deleted" value="true" >
            </div>
          </div>
        </div>
        <!-- ROLE MANAGEMENT -->
        <div class="container-fluid" v-show="managing === 'roles'">
          <div class="row align-items-center">
            <div class="col-12 col-md-4 checkbox-modal-window" v-for="role in roles" :key="role">
              <label class="pts-clickable"><input type="checkbox" v-model="group.roles" :value="role">{{role}}</label>
            </div>
          </div>
        </div>
      </div>
      <div slot="modal-footer" class="form-actions">
        <button class="btn btn-secondary pull-right" @click="close">{{cancelText}}</button>
        <button class="btn btn-primary pull-right mr-2" :disabled="!isValid" @click="save" v-if="canEdit">Save</button>
      </div>
    </b-modal>
  </div>
</template>

<script src="./group-edit-modal.js">
</script>

<style scoped lang="scss" src="./group-edit-modal.scss"></style>
