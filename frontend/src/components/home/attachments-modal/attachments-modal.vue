<template>
  <div>
    <button
      class="btn fas fa-server"
      data-e2e-type="attachments-show-btn"
      type="button" @click="show"
      :class="{ 'btn-primary': !areAttachmentsEmpty }"
    />
    <a href="#" class="d-none" ref="downloadLink" />
    <b-modal size="lg" hide-header-close ref="modal" @close="hide" class="advances-files-modal">
      <div slot="modal-header" class="d-flex w-100 align-items-center">
        <h6>Attachments</h6>
        <button
          v-if="canUpdate"
          type="button"
          class="btn btn-primary ml-auto"
          data-e2e-type="upload-file-btn"
          @click="showFilePicker">
          Upload file
        </button>
        <form ref="fileInputForm">
          <input
            type="file"
            name="file"
            class="d-none"
            data-e2e-type="attachments-upload-input"
            ref="fileInput"
            @change="attach">
        </form>
      </div>
      <div slot="default">
        <div class="container-fluid">
          <table
            data-e2e-type="attachments-table"
            class="table table-sm table-stacked table-bordered table-striped"
            :class="{'blur-loading': isLoading }">
            <thead class="hidden-xs-down">
              <tr>
                <th>Filename</th>
                <th>Created at</th>
                <th>Updated at</th>
                <th>Size</th>
                <th v-if="canDownload">Download</th>
                <th v-if="canUpdate">Remove</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="doc of value" :key="doc._id">
                <td data-e2e-type="attachments-file-filename">
                  <b class="hidden-sm-up">Filename:</b>
                  {{ doc.name }}
                </td>
                <td>
                  <b class="hidden-sm-up">Created At:</b>
                  <span v-if="doc.createdAt">{{ doc.createdAt | localDateTime('MM-DD-YYYY HH:mm') }}</span>
                </td>
                <td>
                  <b class="hidden-sm-up">Created At:</b>
                  <span v-if="doc.updatedAt">{{ doc.updatedAt | localDateTime('MM-DD-YYYY HH:mm') }}</span>
                </td>
                <td>
                  <b class="hidden-sm-up">Size:</b>
                  {{doc.size | virtualSize}}
                </td>
                <td v-if="canDownload">
                  <b class="hidden-sm-up">Download:</b>
                  <i
                    v-if="isDocumentDownloading(doc._id)"
                    data-e2e-type="attachments-file-download-spinner"
                    class="fas fa-spinner fa-pulse fa-fw"/>
                  <i
                    v-else
                    class="pts-clickable fas fa-download"
                    data-e2e-type="attachments-file-download-btn"
                    @click="downloadAttachment(doc._id)"/>
                </td>
                <td v-if="canUpdate">
                  <b class="hidden-sm-up">Remove:</b>
                  <i
                    class="pts-clickable fa-solid fa-trash"
                    data-e2e-type="attachments-file-remove-btn"
                    @click="detach(doc._id)"/>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div slot="modal-footer">
        <button class="btn btn-secondary" @click.prevent="hide">Close</button>
      </div>
    </b-modal>
  </div>
</template>

<script src="./attachments-modal.js"></script>
<style lang="scss" src="./attachments-modal.scss"></style>
