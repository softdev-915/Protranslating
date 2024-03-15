<template>
  <div class="container-fluid pr-4 pl-2">
    <div class="row p-0">
      <div class="col-6 px-0">
        <div class="row p-0">
          <div class="col-12">
            <div
              :style="previewContainerStyles"
              class="preview-container align-items-center"
              ref="preview-container"
            >
              <div v-if="!showPreview">
                <div
                  :style="invalidTemplateContainerStyles"
                  class="invalid-template-container d-flex flex-column align-items-center justify-content-center"
                  ref="invalid-template-container"
                  data-e2e-type="preview-invalid-template-container"
                >
                  <div class="text-center">
                    <svg width="74" height="65" viewBox="0 0 74 65" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M49.417 36.0833L45.7503 32.4167C47.1948 28.4722 46.4448 25.1944 43.5003 22.5833C40.5559 19.9722 37.3614 19.3056 33.917 20.5833L30.2503 16.9167C31.1948 16.3056 32.2503 15.8611 33.417 15.5833C34.5837 15.3056 35.7781 15.1667 37.0003 15.1667C40.9448 15.1667 44.292 16.5417 47.042 19.2917C49.792 22.0417 51.167 25.3889 51.167 29.3333C51.167 30.5556 51.0142 31.7639 50.7087 32.9583C50.4031 34.1528 49.9725 35.1944 49.417 36.0833ZM60.167 46.8333L56.8337 43.5C59.5559 41.5 61.9309 39.2639 63.9587 36.7917C65.9864 34.3194 67.4725 31.8333 68.417 29.3333C65.6392 23.1667 61.4725 18.2917 55.917 14.7083C50.3614 11.125 44.3337 9.33333 37.8337 9.33333C35.5003 9.33333 33.1114 9.55556 30.667 10C28.2225 10.4444 26.3059 10.9722 24.917 11.5833L21.0837 7.66667C23.0281 6.77778 25.5142 6 28.542 5.33333C31.5698 4.66667 34.5281 4.33333 37.417 4.33333C44.917 4.33333 51.8337 6.38889 58.167 10.5C64.5003 14.6111 69.3337 20.1389 72.667 27.0833C72.8337 27.3611 72.9448 27.6944 73.0003 28.0833C73.0559 28.4722 73.0837 28.8889 73.0837 29.3333C73.0837 29.7778 73.0559 30.2083 73.0003 30.625C72.9448 31.0417 72.8337 31.3889 72.667 31.6667C71.2226 34.7222 69.4448 37.5278 67.3337 40.0833C65.2226 42.6389 62.8337 44.8889 60.167 46.8333ZM63.167 63.8333L51.0003 51.9167C49.0559 52.6944 46.8614 53.2917 44.417 53.7083C41.9725 54.125 39.5003 54.3333 37.0003 54.3333C29.3337 54.3333 22.3059 52.2778 15.917 48.1667C9.5281 44.0556 4.66699 38.5278 1.33366 31.5833C1.16699 31.25 1.05588 30.9028 1.00033 30.5417C0.94477 30.1806 0.916992 29.7778 0.916992 29.3333C0.916992 28.8889 0.958659 28.4583 1.04199 28.0417C1.12533 27.625 1.22255 27.2778 1.33366 27C2.50033 24.5 3.98644 22.0694 5.79199 19.7083C7.59755 17.3472 9.72255 15.1111 12.167 13L3.41699 4.25C2.91699 3.75 2.66699 3.16667 2.66699 2.5C2.66699 1.83333 2.91699 1.25 3.41699 0.75C3.91699 0.25 4.51421 0 5.20866 0C5.9031 0 6.50033 0.25 7.00033 0.75L66.667 60.4167C67.1114 60.8611 67.3337 61.4028 67.3337 62.0417C67.3337 62.6806 67.1114 63.25 66.667 63.75C66.2225 64.3056 65.6531 64.5833 64.9587 64.5833C64.2642 64.5833 63.667 64.3333 63.167 63.8333ZM15.5837 16.5C13.5281 18 11.542 19.9722 9.62533 22.4167C7.70866 24.8611 6.33366 27.1667 5.50033 29.3333C8.33366 35.5 12.5975 40.375 18.292 43.9583C23.9864 47.5417 30.4448 49.3333 37.667 49.3333C39.5003 49.3333 41.3059 49.2222 43.0837 49C44.8614 48.7778 46.1948 48.4444 47.0837 48L41.7503 42.6667C41.1392 42.9444 40.3892 43.1528 39.5003 43.2917C38.6114 43.4306 37.7781 43.5 37.0003 43.5C33.1114 43.5 29.7781 42.1389 27.0003 39.4167C24.2225 36.6944 22.8337 33.3333 22.8337 29.3333C22.8337 28.5 22.9031 27.6667 23.042 26.8333C23.1809 26 23.3892 25.25 23.667 24.5833L15.5837 16.5Z" fill="#A0A1A3"/>
                    </svg>
                  </div>
                  <div class="title text-center" data-e2e-type="preview-invalid-template-title">
                    Preview is not available
                  </div>
                  <div v-if="notAvailablePreviewDescription !== ''" class="description text-center" data-e2e-type="preview-invalid-template-desc">
                    {{ notAvailablePreviewDescription }}
                  </div>
                </div>
              </div>
              <document-page-container
                v-else
                ref="preview-document-container"
                :template-block-id="templateBlockId"
                :style="previewDocumentContainerStyles"
                :page-templates="pageTemplates"
                :page-margin-value="reportPrintableMarginsValue"
                :footer-title="footerContent"
                :current-page-number="currentPage"
                data-e2e-type-preview-page="report-preview-page"
                data-e2e-type-page-content="report-preview-page-content"
                data-e2e-type-footer="report-preview-footer"
                data-e2e-type-footer-page-count="footer-page-count"
              />
              <document-page-container
                ref="virtual-document-container"
                class="virtual-document-container"
                :template-block-id="templateBlockId"
                :page-templates="['']"
                :page-margin-value="reportPrintableMarginsValue"
                :footer-title="footerContent"
                :current-page-number="1"
              />
            </div>
            <div v-if="showPreview" class="preview-document-pagination-wrapper text-center">
              <div class="btn-group preview-document-pagination" role="group" aria-label="Document pagination group">
                <button
                  @click="clickPreviousPage"
                  :disabled="!isPreviousPageAvailable"
                  type="button"
                  class="btn"
                  data-e2e-type="preview-pagination-previous"
                >
                  <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path :opacity="isPreviousPageAvailable ? 1 : 0.64" d="M4.18848 9.22899L0.521484 5.56199C0.438151 5.47933 0.375485 5.38933 0.333485 5.29199C0.292151 5.19466 0.271484 5.09733 0.271484 4.99999C0.271484 4.90266 0.292151 4.80533 0.333485 4.70799C0.375485 4.61066 0.438151 4.52066 0.521484 4.43799L4.18848 0.770992C4.34115 0.618326 4.50082 0.541992 4.66748 0.541992C4.83415 0.541992 4.99382 0.618326 5.14648 0.770992C5.29915 0.923659 5.37548 1.08333 5.37548 1.24999C5.37548 1.41666 5.29915 1.57633 5.14648 1.72899L1.87548 4.99999L5.14648 8.27099C5.29915 8.42366 5.37548 8.58333 5.37548 8.74999C5.37548 8.91666 5.29915 9.07633 5.14648 9.22899C4.99382 9.38166 4.83415 9.45799 4.66748 9.45799C4.50082 9.45799 4.34115 9.38166 4.18848 9.22899Z" fill="white"/>
                  </svg>
                </button>
                <button
                  disabled="true"
                  type="button"
                  class="btn preview-document-pagination-count"
                  data-e2e-type="preview-pagination-page"
                >
                  {{ `${currentPage}/${pageCount}` }}
                </button>
                <button
                  @click="clickNextPage"
                  :disabled="!isNextPageAvailable"
                  type="button"
                  class="btn"
                  data-e2e-type="preview-pagination-next"
                  >
                  <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path :opacity="isNextPageAvailable ? 1 : 0.64" d="M0.354 9.22899C0.201333 9.07633 0.125 8.91666 0.125 8.74999C0.125 8.58333 0.201333 8.42366 0.354 8.27099L3.625 4.99999L0.354 1.72899C0.201333 1.57633 0.125 1.41666 0.125 1.24999C0.125 1.08333 0.201333 0.923659 0.354 0.770992C0.506667 0.618326 0.666333 0.541992 0.833 0.541992C0.999667 0.541992 1.15933 0.618326 1.312 0.770992L4.979 4.43799C5.06233 4.52066 5.125 4.61066 5.167 4.70799C5.20833 4.80533 5.229 4.90266 5.229 4.99999C5.229 5.09733 5.20833 5.19466 5.167 5.29199C5.125 5.38933 5.06233 5.47933 4.979 5.56199L1.312 9.22899C1.15933 9.38166 0.999667 9.45799 0.833 9.45799C0.666333 9.45799 0.506667 9.38166 0.354 9.22899Z" fill="white"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-6 noprint pr-0">
        <div class="d-flex flex-column pr-2 template-options py-4" :style="templateOptionsStyles">
          <div class="row align-items-center">
            <slot name="template-selectors" />
          </div>
          <div class="row align-items-center">
            <slot name="service-delivery-type-selectors" />
          </div>
          <template v-if="showPreview">
            <margins-select
              v-model="marginsData"
              ref="margins-select"
            />
            <custom-field-list
              v-if="templateCustomFieldTypes.length > 0"
              :label="templateCustomFieldsLabel"
              :custom-field-types="templateCustomFieldTypes"
              :custom-field-values.sync="templateCustomFieldValuesSync"
              :need-save.sync="needSaveTemplateCustomFieldsSync"
              :should-show-save-changes-button="allowSavingCustomFieldsToTemplate"
              :hidden-fields="hiddenFields"
              :hideable-fields="hideableFields"
              @set-hidden-fields="$emit('set-hidden-fields', $event)"
              @are-valid-custom-fields="setValidTemplateCustomFields"
              data-e2e-type="template-custom-fields"
            />
            <custom-field-list
              v-if="emailCustomFieldTypes.length > 0"
              :label="emailCustomFieldsLabel"
              :custom-field-types="emailCustomFieldTypes"
              :custom-field-values.sync="emailCustomFieldValuesSync"
              :need-save.sync="needSaveEmailCustomFieldsSync"
              :should-show-save-changes-button="allowSavingEmailCustomFieldsToTemplate"
              :hidden-fields="hiddenFields"
              :hideable-fields="hideableFields"
              @set-hidden-fields="$emit('set-hidden-fields', $event)"
              @are-valid-custom-fields="setValidEmailCustomFields"
              data-e2e-type="email-custom-fields"
            />
          </template>
        </div>
        <div class="row report-preview-actions">
          <div class="col-4 btn-toolbar justify-content-start document-form-actions">
            <slot name="document-form-actions" />
          </div>
          <div class="col-8 btn-toolbar justify-content-end page-form-actions">
            <slot name="page-form-actions" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script src="./report-preview.js"></script>
<style lang="scss" src="./report-preview.scss"></style>
