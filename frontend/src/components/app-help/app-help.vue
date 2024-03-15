<template>
  <div id="app-help-overlay" class="pts-overlay" v-show="help" @click="closeOnClick($event)">
    <div class="container app-help-main-container">
      <nav class="row g-0" aria-label="Help topics">
        <div class="col-12 col-md-2 app-help-list">
          <div class="input-group">
            <input type="text" aria-label="Filter help topics" class="form-control" v-model="search" placeholder="Filter topics">
            <span class="input-group-addon"><i class="fas fa-search"></i></span>
          </div>
          <ul class="list-group app-help-topics" data-e2e-type="app-help-items-list">
            <li class="list-group-item list-group-item-action help-topic-link pts-clickable"
              :data-e2e-type="view.route.name + '-item'"
              :class="{'active': view.route.name === selectedName}"
              v-for="(view,index) in views" :key="index"
              @click="selectIndex(index)">{{view.name}}</li>
          </ul>
        </div>
        <div class="col-12 col-md-10 app-help-loading" v-if="loading">
          <i class="fas fa-spin fa-circle-o-notch"></i>
        </div>
        <div class="col-12 col-md-10 app-help-content">
          <div class="app-help-search">
            <help-search v-if="!editing" ref="helpSearch"
            @app-help-topic-selected="selectedFromSearch($event)"
            @app-help-search="onKeywordSearch($event)"
            ></help-search>
          </div>
          <div class="container-fluid app-help-content-container" v-if="!loading">
            <div class="row" v-if="!editing">
              <div class="col-12">
                <div class="container app-help-free-html" data-e2e-type="app-help-content" v-html="helpHtml" v-if="helpHtml && helpHtml.length > 0"></div>
              </div>
            </div>
            <div class="row" v-if="editing">
              <div class="col-12" data-e2e-type="app-help-rich-text-editor">
                <div class="editor-container">
                  <rich-text-editor v-model="helpHtml" placeholder="Help text"></rich-text-editor>
                </div>
              </div>
            </div>
            <div class="row" v-if="selectedIndex !== -1">
              <div class="col-12 app-help-edit-buttons">
                <button v-if="canEdit" class="btn btn-primary pull-right" data-e2e-type="app-help-edit-button" @click="editing = true" v-show="!editing">Edit</button>
                <button v-if="canEdit" class="btn btn-primary pull-right" data-e2e-type="app-help-save-button" @click="update()" v-show="editing">Save</button>
                <span data-e2e-type="app-no-help" class="app-help-no-doc pull-right" v-if="helpHtml && helpHtml.length === 0 && !editing">No documentation available yet.</span>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </div>
  </div>
</template>

<script src="./app-help.js"></script>

<style scoped lang="scss" src="./app-help.scss"></style>
