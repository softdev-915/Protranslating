<template>
  <div class="preview-document-container">
    <div class="preview-page-wrapper">
      <div
        class="preview-document-template-container"
        ref="preview-document-template-container"
        :id="templateBlockId"
      >
        <template v-for="(pageTemplate, pageIndex) in pageTemplates">
          <div
            v-show="pageIndex + 1 === currentPageNumber"
            class="document-preview-page"
            :style="{ padding: pageMarginValue }"
            :class="`preview-page-${pageIndex + 1}`"
            :data-e2e-type="dataE2eTypePreviewPage"
          >
            <div
              v-html="pageTemplate"
              class="document-preview-page-content"
              ref="document-preview-page-content"
              :data-e2e-type="dataE2eTypePageContent"
            ></div>
          </div>
        </template>
      </div>
      <div class="report-preview-footer-container row p-0 mb-2 mx-3">
        <div :data-e2e-type="dataE2eTypeFooter" class="text-left p-0">{{ footerTitle }}</div>
        <div :data-e2e-type="dataE2eTypeFooterPageCount" class="text-right p-0 text-nowrap">{{ `${currentPageNumber} / ${pageCount}` }}</div>
      </div>
    </div>
  </div>
</template>
<script src="./document-page-container.js"></script>
