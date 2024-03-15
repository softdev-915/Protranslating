<template>
  <div>
    <table
      class="table table-sm pts-data-table table-stacked table-bordered table-hover table-striped"
      :class="{'blur-loading': isLoading}">
      <thead class="hidden-xs-down">
        <tr role="row">
          <th ref="th" v-for="(col, idx) in visibleColumns" :key="idx" :class="{'w-25': col === 'Filename'}">
            <span>{{ col }}</span>
          </th>
        </tr>
      </thead>
      <tbody data-e2e-type="request-files-container">
        <tr
          role="row"
          v-for="(doc,index) in documents"
          v-if="shouldShowInternalFiles[index]"
          :class="{'blur-loading': doc.uploading}"
          data-e2e-type="request-file"
          :key="index">
          <td v-if="referenceVisible">
            <b class="hidden-sm-up">Reference:</b>
            <input
              type="checkbox"
              data-e2e-type="document-reference-checkbox"
              value="true"
              :disabled="!canEdit"
              :checked="doc.isReference"
              @change="markReference($event, index)">
          </td>
          <td v-if="hasInternalCheckbox">
            <b class="hidden-sm-up">Internal:</b>
            <input
              type="checkbox"
              data-e2e-type="document-internal-checkbox"
              value="true"
              :disabled="!canEdit || internalCheckboxDisabled[index]"
              :checked="doc.isInternal"
              @change="markInternal($event, index)">
          </td>
          <td v-if="hasPortalCatCheckbox">
            <b class="hidden-sm-up">Translate in PortalCAT</b>
            <i
                v-if="isCatImportRunning"
                title="Checking the Import status"
                class="fas fa-spinner fa-pulse fa-fw"
            ></i>
            <i
                v-else-if="importedCatFiles.includes(doc._id)"
                data-e2e-type="document-portal-cat-indicator"
                title="Already imported to PortalCAT"
                class="fas fa-globe"
            ></i>
            <input
                v-else
                type="checkbox"
                data-e2e-type="document-portal-cat-checkbox"
                value="true"
                :checked="doc.isPortalCat"
                :disabled="isPortalCatCheckboxDisabled(doc)"
                @change="markDocumentAsPortalCat($event, index)">
          </td>
          <td v-if="isAutoScanWorkflow">
            <b class="hidden-sm-up">Translated:</b>
            <input
              type="checkbox"
              data-e2e-type="document-translated-checkbox"
              :data-e2e-indeterminate="getIsTranslatedIndeterminate(doc)"
              :disabled="true"
              :indeterminate.prop="getIsTranslatedIndeterminate(doc)"
              :checked="getIsTranslatedValue(doc)"
            >
          </td>
          <td v-if="filenameVisible" data-e2e-type="request-file-filename">
            <b class="hidden-sm-up">Filename:</b>
            {{doc.name}}
          </td>
          <td v-if="isOCRAvailable" data-e2e-type="request-file-download-ocr">
            <b class="hidden-sm-up">OCRed files:</b>
            <iframe-download
              :ref="`download_ocr_${doc._id}`"
              @download-finished="onDownloadFinished(doc)"
              @download-error="onIframeDownloadError($event)">
            </iframe-download>
            <a
              v-if="getIsOCRReady(doc)"
              :href="`/get-file?noIframe=true&url=${getDocumentOcrUrl(doc)}`"
              class="download-button-link"
              :ref="`download_ocr_link_${doc._id}`">
              <i
                @click="downloadOCRZip($event, doc)"
                v-if="!isDownloadingDocument(doc) && !doc.failed && !doc.isNew && !doc.deletedByRetentionPolicyAt"
                data-e2e-type="request-file-download-ocr-icon"
                class="pts-clickable fas fa-chain">
              </i>
            </a>
          </td>
          <td v-if="createdAtVisible">
            <b class="hidden-sm-up">Created At:</b>
            <span v-if="doc.createdAt">{{doc.createdAt | localDateTime('YYYY-MM-DD HH:mm')}}</span>
          </td>
          <td v-if="deletedAtVisible">
            <b class="hidden-sm-up">Deleted At:</b>
            <span
              v-if="doc.deletedByRetentionPolicyAt">
              {{doc.deletedByRetentionPolicyAt | localDateTime('YYYY-MM-DD HH:mm')}}
            </span>
          </td>
          <td v-if="deletedByVisible">
            <b class="hidden-sm-up">Deleted By:</b>
            {{(!doc.deletedByRetentionPolicyAt) ? '' : 'system'}}
          </td>
          <td v-if="retentionTimeVisible">
            <b class="hidden-sm-up">Retention Time:</b>
            {{retentionTotalTime(doc)}}
          </td>
          <td v-if="sizeVisible" data-e2e-type="request-file-size">
            <b class="hidden-sm-up">Size:</b>
            {{doc.size | virtualSize}}
          </td>
          <td v-if="downloadVisible" data-e2e-type="request-file-download">
            <b class="hidden-sm-up">Download:</b>
            <iframe-download
              :ref="`iframe_doc_${doc._id}`"
              @download-finished="onDownloadFinished(doc)"
              @download-error="onIframeDownloadError($event)">
            </iframe-download>
            <a
              :href="`/get-file?noIframe=true&url=${getDocumentUrl(doc)}`"
              class="download-button-link"
              :ref="`download_link_${doc._id}`">
              <i
                @click="downloadDocument($event, doc)"
                v-if="!isDownloadingDocument(doc) && !doc.failed && !doc.isNew && !doc.deletedByRetentionPolicyAt"
                data-e2e-type="request-file-download-icon"
                class="pts-clickable fas fa-solid fa-download">
              </i>
            </a>
            <i
              v-show="isDownloadingDocument(doc)"
              data-e2e-type="request-file-download-spinner"
              class="fas fa-spinner fa-pulse fa-fw">
            </i>
          </td>
          <td v-else></td>
          <td v-if="removeVisible">
            <b class="hidden-sm-up">Remove:</b>
            <i v-show="doc.uploading" class="fas fa-spinner fa-pulse fa-fw"></i>
            <i
              v-show="!doc.uploading && !doc.failed && !doc.deletedByRetentionPolicyAt && shouldAllowDeleteInternalFiles[index] && !doc.isRemovedFromPortalCat && !doc.isPortalCat"
              @click="deleteDocument(doc, index)"
              class="pts-clickable fa-solid fa-trash"
              data-e2e-type="request-file-delete-button">
            </i>
            <i v-show="doc.failed" class="fas fa-exclamation-triangle"></i>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script src="./request-files.js"></script>
<style scoped lang="scss" src="./request-files.scss"></style>
