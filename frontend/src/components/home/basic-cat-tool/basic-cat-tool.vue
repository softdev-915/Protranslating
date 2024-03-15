<template>
    <div data-e2e-type="basic-cat-tool-container" class="preview-container p-0">
      <div class="preview-item left-panel" ref="west" :style="westStyles" data-e2e-type="basic-cat-tool-west-container">
        <div class="vertical-resizable-container h-100">
          <div class="resize-zone vertical-resize-zone h-100" ref="westColumnResizer">&nbsp;</div>
          <div class="pr-2" :class="{'preview': westComponent === 'preview'}">
            <div class="w-100 p-1 component-selector">
              <basic-cat-tool-component-selector :value="westComponent" :components="knownComponents" :right="false" @select-component="onWestSelect"></basic-cat-tool-component-selector>
            </div>
            <template v-if="westComponent === 'files'">
              <basic-cat-tool-files :request="request"></basic-cat-tool-files>
            </template>
            <template v-if="westComponent === 'preview'">
              <basic-cat-tool-preview :request="request" :document="document"></basic-cat-tool-preview>
            </template>
            <template v-if="westComponent === 'editor'">
              <basic-cat-tool-editor ref="editor" @word-count-changed="onWordCountChange" @editor-status="onEditorStatusChange" :request="request" :document="document" :language="language" v-if="isDocumentSelected"></basic-cat-tool-editor>
            </template>
          </div>
        </div>
      </div>
      <div class="preview-item w-100">
        <div class="container-fluid">
          <div class="row" ref="north" :style="northStyles" data-e2e-type="basic-cat-tool-north-container" :class="{'preview': northComponent === 'preview'}">
            <div class="w-100 p-1 component-selector">
              <basic-cat-tool-component-selector :value="northComponent" :components="knownComponents" :right="true" @select-component="onNorthSelect"></basic-cat-tool-component-selector>
            </div>
            <template v-if="northComponent === 'files'">
              <basic-cat-tool-files :request="request"></basic-cat-tool-files>
            </template>
            <template v-if="northComponent === 'preview'">
              <basic-cat-tool-preview :request="request" :document="document"></basic-cat-tool-preview>
            </template>
            <template v-if="northComponent === 'editor'">
              <basic-cat-tool-editor ref="editor" @word-count-changed="onWordCountChange" @editor-status="onEditorStatusChange" :request="request" :document="document" :language="language" v-if="isDocumentSelected"></basic-cat-tool-editor>
            </template>
          </div>
          <div class="row resize-zone horizontal-resize-zone pt-1 pb-1" ref="southColumnResizer" v-show="isDocumentSelected">
            <div class="col-12"></div>
          </div>
          <div class="row" :class="{'preview': southComponent === 'preview'}">
            <div class="col-12" data-e2e-type="basic-cat-tool-south-container">
              <div class="w-100 p-1 component-selector">
                <basic-cat-tool-component-selector :value="southComponent" :components="knownComponents" :right="true" @select-component="onSouthSelect"></basic-cat-tool-component-selector>
              </div>
              <template v-if="southComponent === 'files'">
                <basic-cat-tool-files :request="request"></basic-cat-tool-files>
              </template>
              <template v-if="southComponent === 'preview'">
                <basic-cat-tool-preview :request="request" :document="document"></basic-cat-tool-preview>
              </template>
              <template v-if="southComponent === 'editor'">
                <basic-cat-tool-editor ref="editor" @word-count-changed="onWordCountChange" @editor-status="onEditorStatusChange" :request="request" :document="document" :language="language" v-if="isDocumentSelected"></basic-cat-tool-editor>
              </template>
            </div>
          </div>
          <div class="row pt-1" v-if="isDocumentSelected">
            <div class="col-12">
              <span v-if="wordCount">Word Count: {{wordCount}}</span>
              <span><button class="btn btn-primary pull-right" :disabled="!canSave" @click="save()">Save</button></span>
            </div>
          </div>
        </div>
      </div>
    </div>
</template>

<script src="./basic-cat-tool.js"></script>
<style lang="scss" scoped src="./basic-cat-tool.scss"></style>
