<template>
  <b-modal
    size="lg"
    hide-header-close
    ref="workflowAssignModal"
    id="workflowAssignModal"
    :class="{'segments-assign-modal': step === 'assigningSegments'}"
    :closeOnBackdrop="false">
    <div
      v-if="step === 'assigningSegments'"
      slot="modal-header"
      class="segments-assign-modal-header"
      :class="{'blur-loading': loading}"
    >
      <div class="container-fluid pts-font-bold">
        <div class="row">
          <div class="col-9">Assigned:</div>
          <div class="col-3">Unassigned:</div>
        </div>
        <div class="row">
          <div class="col-9">
            <div
              data-e2e-type="assigned-segments-range-for-selected-doc"
              class="segments-range">{{assignedSegmentsRangeForSelectedDoc}}</div>
          </div>
          <div class="col-3">
            <div
              data-e2e-type="unassigned-segments-range-for-selected-doc"
              class="segments-range">{{unassignedSegmentsRangeForSelectedDoc}}</div>
          </div>
        </div>
      </div>
    </div>
    <div
      slot="default"
      :class="{'blur-loading': loading, 'segments-assign-modal-body': step === 'assigningSegments'}"
      data-e2e-type="workflow-assign-modal"
    >
      <div class="container-fluid">
        <div class="col-12">
            <div class="row">
                <div class="col-12">
                    <table v-if="step === 'pickingFile'" class="table table-stacked table-sm pts-data-table table-bordered">
                        <thead class="hidden-xs-down">
                            <tr role="row">
                                <th v-for="c in activeColumns" :key="c">
                                    <span>{{ c }}</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr role="row"
                                v-for="(doc, index) in documentsPopulated"
                                :key="index"
                                data-e2e-type="workflow-assign-modal-pick-file">
                                <td
                                    data-e2e-type="workflow-assign-modal-file-name">
                                    <b class="hidden-sm-up">{{ activeColumns[0] }}: </b>{{doc.name}}
                                </td>
                                <td
                                    data-e2e-type="workflow-assign-modal-doc-size">
                                    <b class="hidden-sm-up">{{ activeColumns[1] }}: </b>{{getAssignedWordsFromTotal(doc)}}
                                </td>
                                <td
                                    data-e2e-type="workflow-assign-modal-assigned-segments">
                                    <b class="hidden-sm-up">{{ activeColumns[2] }}: </b>{{getAssignedSegments(doc)}}
                                </td>
                                <td
                                    data-e2e-type="workflow-assign-modal-assigned-percentage">
                                    <b class="hidden-sm-up">{{ activeColumns[3] }}: </b>{{getAssignedPercentage(doc)}}
                                </td>
                                <td
                                    data-e2e-type="workflow-assign-modal-unassigned-segments">
                                    <b class="hidden-sm-up">{{ activeColumns[4] }}: </b>{{getUnassignedSegments(doc)}}
                                </td>
                                <td
                                    data-e2e-type="workflow-assign-modal-actions"
                                    class="workflow-assign-modal-actions"
                                    v-if="canEditAssignees">
                                    <div class="d-flex justify-content-center">
                                        <i
                                            @click="assignWholeFile(index)"
                                            class="fas fa-circle py-2 px-3"
                                            :class="{'assigned-segemnt-icon': areAllSegmentsAssignedToCurrentUser(index)}"
                                            title="Assign whole file"></i>
                                        <i @click.stop="goToAssignSegmentsStep(index)" class="fas fa-adjust py-2 px-3" title="Select segments and assign"></i>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <table
                        v-else-if="step === 'assigningSegments'"
                        class="table table-stacked table-sm pts-data-table table-bordered"
                        data-e2e-type="workflow-assign-modal-assigning-segments">
                        <tbody>
                            <tr
                                v-if="assignSegmentsStepDoc"
                                role="row"
                                v-for="(segment, index) in assignSegmentsStepDoc.segments"
                                :key="index"
                                @click="selectRow($event, segment)"
                                data-e2e-type="workflow-assign-modal-segments"
                                class="workflow-assign-modal-segments"
                                :class="{'segment-row-selected': isSegmentSelected(segment)}">
                                <td
                                    data-e2e-type="workflow-assign-modal-segment-index"
                                    class="workflow-assign-modal-segment-index">
                                    <div>
                                        <span>{{index + 1}}</span>
                                    </div>
                                </td>
                                <td
                                    data-e2e-type="workflow-assign-modal-segment-icon"
                                    class="workflow-assign-modal-segment-index"
                                    :class="{'segment-index-selected': isSegmentSelected(segment)}">
                                    <div>
                                        <span v-if="isSegmentSelected(segment)">{{index + 1}}</span>
                                         <i
                                            v-else-if="isSegmentAssignedToAnyUser(segment)"
                                            class="fas fa-user py-2 px-3"
                                            :class="{'assigned-segemnt-icon': isSegmentAssignedToCurrentUser(segment)}"
                                         ></i>
                                    </div>
                                </td>
                                <td
                                    data-e2e-type="workflow-assign-modal-segment-content">{{segment.source.text}}</td>
                                <div class="worfklow-assign-modal-segments-pop-up" v-if="segmentPopupId === segment.originalId">
                                  <div class="segments-pop-up-options" v-if="segmentPopupStep === 'select-option'">
                                    <div
                                      data-e2e-type="calculate-per-word-button"
                                      @click="enableCalculatePerWordMode">Calculate per word</div>
                                    <div
                                      data-e2e-type="select-end-of-file-button"
                                      @click="selectEndOfFile">Select the end of the file</div>
                                  </div>
                                  <div class="segments-pop-up-calculate-per-word" v-if="segmentPopupStep === 'calculate-per-word'">
                                    <div class="top">
                                        <span>Number of words in the range</span>
                                        <input
                                            data-e2e-type="workflow-assign-modal-segment-assign-popup-words-range-input"
                                            type="number"
                                            v-model="wordsCount">
                                    </div>
                                    <div class="bottom mt-3">
                                        <span
                                            data-e2e-type="workflow-assign-modal-segment-assign-popup-words-range-cancel"
                                            class="mr-2"
                                            @click="segmentPopupId = null">Cancel</span>
                                        <span
                                            data-e2e-type="workflow-assign-modal-segment-assign-popup-words-range-continue"
                                            @click="goToFinalStepOnPopup">Continue</span>
                                    </div>
                                  </div>
                                  <div class="segments-pop-up-assign" v-if="segmentPopupStep === 'assign'">
                                    <div class="top">
                                        <span
                                            data-e2e-type="workflow-assign-modal-segment-assign-popup-words-range-summary">{{segmentsToAssignRangeLabel}} {{segmentsToAssignRange}} ({{wordsCount}} words)</span>
                                        <br>
                                        <span>Total words: {{wordsCount}}</span>
                                    </div>
                                    <div class="bottom mt-3">
                                        <span
                                            data-e2e-type="workflow-assign-modal-segment-assign-popup-words-range-back"
                                            class="mr-2"
                                            @click="segmentPopupStep = 'calculate-per-word'">Back</span>
                                        <span
                                            data-e2e-type="workflow-assign-modal-segment-assign-popup-words-range-assign"
                                            @click="assignSegments">Assign</span>
                                    </div>
                                  </div>
                                </div>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      </div>
    </div>
    <div slot="modal-footer" :class="{'assigning-segments-mode': step === 'assigningSegments'}">
      <div v-if="step === 'assigningSegments'">
        <span>Select range</span>
        <i
          data-e2e-type="select-range-toggle"
          class="fas pts-clickable"
          :class="waitingToSelectEndOfRange ? 'fa-toggle-on active' : 'fa-toggle-off'"
          @click="toggleSelectRange">
        </i>
      </div>
      <div>
        <button
          v-show="!loading && step === 'assigningSegments' && assignedSegmentsFinalIds.length"
          class="btn btn-primary mr-2"
          data-e2e-type="workflow-assign-modal-save"
          @click="saveAssignments">Save assignments
        </button>
        <button
          v-show="!loading && step === 'assigningSegments'"
          class="btn btn-secondary"
          data-e2e-type="workflow-assign-modal-back"
          @click="step = 'pickingFile'">Back
        </button>
        <button
          v-show="!loading && step === 'pickingFile'"
          class="btn btn-secondary"
          data-e2e-type="workflow-assign-modal-close"
          @click="closeAssignModal()">Close
        </button>
        <span class="pull-right saving-spinner" v-show="loading">
          <i class="fas fa-spinner fa-pulse fa-fw"></i>
        </span>
      </div>
    </div>
  </b-modal>
</template>

<script src="./workflow-assign-modal.js"></script>
<style lang="scss" src="./workflow-assign-modal.scss"></style>
