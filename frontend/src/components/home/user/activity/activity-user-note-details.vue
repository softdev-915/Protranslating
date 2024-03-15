<template>
    <div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2" ><span class="pts-required-field">* </span>Subject</div>
          <div class="col-12 col-md-10" v-if="canCreateOrEdit" :class="{'has-danger': !isValidSubject}">
            <input type="text" data-e2e-type="subject" name="subject" class="form-control" :class="{'form-control-danger': errors.has('subject')}" v-model="activity.subject" v-validate="'required'">
          <div class="form-control-feedback" v-show="!isValidSubject" >Subject field is required.</div>
          </div>
          <div class="col-12 col-md-10" :class="{'has-danger': !isValidSubject}" v-else>
            {{activity.subject}}
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2">
            <span class="pts-required-field">*</span>Comments
          </div>
          <div class="col-12 col-md-10 multiselect-container" v-if="canCreateOrEdit" data-e2e-type="comments-container" :class="{'has-danger': !areValidComments}">
            <rich-text-editor
              v-model.trim="activity.comments"
              placeholder="Comments"
              data-e2e-type="rich-text-editor">
            </rich-text-editor>
            <div class="form-control-feedback" v-show="!areValidComments" >Comments field must contain less then 100 characters.</div>
          </div>
          <div class="col-12 col-md-10" v-else v-html="activity.comments">
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2"><span class="pts-required-field">* </span>Tags</div>
          <div class="col-12 col-md-8" :class="{'has-danger': !isValidTags}">
            <activity-tags-selector
              v-model="activity.tags"
              :disabled='!canCreateOrEdit'>
            </activity-tags-selector>
            <div class="form-control-feedback" v-show="!isValidTags">Select at least one tag.</div>
          </div>
        </div>
        <div class="row align-items-center" v-if="activity.userNoteDetails.isInvoice">
          <div class="col-12 col-md-2">Invoice Number</div>
          <div class="col-12 col-md-8">
            <input
              type="text"
              class="form-control"
              data-e2e-type="invoiceNo"
              readonly
              :value="activity.userNoteDetails.invoiceNo"
            >
          </div>
        </div>
    </div>
</template>

<script src="./activity-user-note-details.js"></script>
