/* global FormData, window */
import _ from 'lodash';
import Promise from 'bluebird';
import { mapActions, mapGetters } from 'vuex';
import PortalCatService from '../../../../services/portalcat-service';
import { hasRole } from '../../../../utils/user';
import { errorNotification, successNotification } from '../../../../utils/notifications';

const portalCatService = new PortalCatService();
const TASK_FILES_COLUMNS = [
  'Filename',
  'Assigned words',
  'Assigned segments',
  '%',
  'Unassigned ranges',
];
const ASSIGNEE_TYPES = {
  TRANSLATOR: 'translator',
  EDITOR: 'editor',
  QA_EDITOR: 'qaEditor',
};
const SEGMENT_ASSIGNEE_FIELDS = {
  [ASSIGNEE_TYPES.TRANSLATOR]: 'assignedToTranslator',
  [ASSIGNEE_TYPES.EDITOR]: 'assignedToEditor',
  [ASSIGNEE_TYPES.QA_EDITOR]: 'assignedToQaEditor',
};

export default {
  props: {
    request: Object,
    segmentsModalData: Object,
    workflowImportedFiles: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      loading: false,
      step: 'pickingFile',
      assignSegmentsStepDoc: null,
      selectedDocIndex: null,
      documentsPopulated: [],
      segmentPopupId: null,
      waitingToSelectEndOfRange: false,
      segmentPopupStep: '',
      wordsCount: 0,
      segmentsToAssign: [],
      assignedSegmentsFinal: [],
      segmentsToUnAssign: [],
    };
  },
  watch: {
    'segmentsModalData.workflowId': function (workflowId) {
      if (this.$refs.workflowAssignModal) {
        if (workflowId) {
          this.getPopulatedDocuments();
          this.$refs.workflowAssignModal.show();
          window.addEventListener('keydown', this.onKeydown);
        } else {
          this.$refs.workflowAssignModal.hide();
          window.removeEventListener('keydown', this.onKeydown);
        }
      }
    },
    step(newValue) {
      if (newValue === 'pickingFile') {
        this.waitingToSelectEndOfRange = false;
        this.selectedDocIndex = null;
      }
      this.assignedSegmentsFinal = [];
      this.segmentPopupId = null;
    },
    documentsPopulated(newDocs) {
      const doc = newDocs[this.selectedDocIndex];
      this.assignSegmentsStepDoc = _.isNil(doc) ? null : { ...doc };
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canEditAssignees() {
      return hasRole(this.userLogged, 'WORKFLOW_UPDATE_ALL');
    },
    activeColumns() {
      return this.canEditAssignees ? [...TASK_FILES_COLUMNS, 'Assign'] : TASK_FILES_COLUMNS;
    },
    segmentsToAssignRange() {
      const startRange = _.get(this.segmentsToAssign, '[0].position', 0);
      const endRange = _.get(this.segmentsToAssign, `[${this.segmentsToAssign.length - 1}].position`, 0);
      return startRange === endRange ? `${startRange}` : `${startRange} - ${endRange}`;
    },
    assignedSegmentsRangeForSelectedDoc() {
      if (_.isEmpty(this.assignSegmentsStepDoc)) {
        return '';
      }
      const { assignedWords } = this.getTotalWordsCount(this.assignSegmentsStepDoc);
      return assignedWords ? `${this.getAssignedSegments(this.assignSegmentsStepDoc)} (${assignedWords} words)` : 'No segments have been assigned';
    },
    unassignedSegmentsRangeForSelectedDoc() {
      if (_.isEmpty(this.assignSegmentsStepDoc)) {
        return '';
      }
      const { unassignedWords } = this.getTotalWordsCount(this.assignSegmentsStepDoc);
      return `${this.getUnassignedSegments(this.assignSegmentsStepDoc)} (${unassignedWords} words)`;
    },
    segmentsToAssignRangeLabel() {
      return this.segmentsToAssignRange.includes('-') ? 'Segments' : 'Segment';
    },
    segmentsToAssignIds() {
      return this.segmentsToAssign.map(s => s.originalId);
    },
    assignedSegmentsFinalIds() {
      return this.assignedSegmentsFinal.map(s => s.originalId);
    },
    allProviderTaskIds() {
      const providerTaskIds = [];
      const workflowId = _.get(this.segmentsModalData, 'workflowId');
      const currentWorkflow = this.request.workflows.find(w => w._id === workflowId);
      const getTaskIds = task => task.providerTasks.map(t => _.get(t, 'provider._id', ''));
      _.get(currentWorkflow, 'tasks', []).forEach(t => providerTaskIds.push(...getTaskIds(t)));
      return providerTaskIds;
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onKeydown(event) {
      if (event.code === 'Escape') {
        this.closeAssignModal();
      }
    },
    toggleSelectRange() {
      this.waitingToSelectEndOfRange = !this.waitingToSelectEndOfRange;
    },
    getAssignedField(segment) {
      const assigneeType = _.get(this.segmentsModalData, 'assigneeType');
      return _.get(segment, SEGMENT_ASSIGNEE_FIELDS[assigneeType], null);
    },
    async getPopulatedDocuments() {
      const { requestId } = this.$route.params;
      this.documentsPopulated = [];
      this.loading = true;
      const workflowId = _.get(this.segmentsModalData, 'workflowId');
      await Promise.mapSeries(this.workflowImportedFiles, async (file) => {
        const fileSegments = await portalCatService
          .getFileSegments(requestId, {
            workflowId,
            fileId: file._id,
          });
        const documentPopulated = { ...file, ...fileSegments.data };
        this.documentsPopulated.push(documentPopulated);
      });
      this.loading = false;
    },
    setAllSegmentsAssignedToOneProvider() {
      const allSegmentsProviderIds = this.documentsPopulated
        .map(doc => doc.segments.map(segment => _.get(segment, 'assignedToTranslator', null)))
        .flat(1)
        .filter(Boolean);
      const uniqueProviderIds = new Set(allSegmentsProviderIds);
      const allSegmentsAssignedToOneProvider = uniqueProviderIds.size === 1;
      const { workflowId, taskId } = this.segmentsModalData;
      const workflow = this.request.workflows
        .find(w => w._id === workflowId);
      const task = workflow.tasks.find(t => t._id === taskId);
      task.allSegmentsAssignedToOneProvider = allSegmentsAssignedToOneProvider;
      this.$emit('save-request');
    },
    getWordsCountFromSegment(segment) {
      const wordsProperty = segment.customProperties.find(prop => prop.name === 'TotalWordCount');
      return Number(_.get(wordsProperty, 'value', 0));
    },
    enableCalculatePerWordMode() {
      this.segmentPopupStep = 'calculate-per-word';
    },
    selectEndOfFile() {
      const { segments = [] } = this.assignSegmentsStepDoc;
      const selectedSegmentIndex = segments.findIndex(s => s.originalId === this.segmentPopupId);
      const segmentsToAssign = segments.slice(selectedSegmentIndex);
      const wordsCount = segmentsToAssign.reduce((count, s) => {
        count += this.getWordsCountFromSegment(s);
        return count;
      }, 0);
      this.wordsCount = wordsCount;
      this.segmentsToAssign = segmentsToAssign;
      this.segmentPopupStep = 'assign';
    },
    getTotalWordsCount(doc) {
      let totalWords = 0;
      let assignedWords = 0;
      let unassignedWords = 0;
      const segments = _.get(doc, 'segments', []);
      segments.forEach((s) => {
        const segementWordsCount = this.getWordsCountFromSegment(s);
        const field = this.getAssignedField(s);
        const providerId = _.get(this.segmentsModalData, 'providerId');
        if (field === providerId) {
          assignedWords += segementWordsCount;
        } else if (field === 'system') {
          unassignedWords += segementWordsCount;
        }
        totalWords += segementWordsCount;
      });
      return { assignedWords, totalWords, unassignedWords };
    },
    getAssignedWordsFromTotal(doc) {
      const { assignedWords, totalWords } = this.getTotalWordsCount(doc);
      return `${assignedWords} / ${totalWords}`;
    },
    getAssignedSegments(doc) {
      const assignedRanges = [];
      let rangeStart;
      const hasOnlyOneSegment = doc.segments.length === 1;
      const assignedToSingleSegment = this.getAssignedField(doc.segments[0]);
      const segmentAssignedToValidUser = doc.segments[0] && assignedToSingleSegment && assignedToSingleSegment !== 'system' && this.allProviderTaskIds.includes(assignedToSingleSegment);
      const providerId = _.get(this.segmentsModalData, 'providerId');
      if (
        hasOnlyOneSegment &&
        segmentAssignedToValidUser &&
        assignedToSingleSegment === providerId
      ) {
        return 1;
      }

      doc.segments.forEach((segment, index) => {
        const assignedTo = this.getAssignedField(segment);
        if (assignedTo === providerId && !rangeStart) {
          rangeStart = index + 1;
        } else if (
          (!assignedTo || assignedTo !== providerId
            || doc.segments.length === index + 1)
          && rangeStart) {
          if (rangeStart === index) {
            assignedRanges.push(`${rangeStart}`);
          } else {
            const rangeEnd = doc.segments.length === index + 1 ? index + 1 : index;
            assignedRanges.push(`${rangeStart} - ${rangeEnd}`);
          }
          rangeStart = null;
        }
      });
      if (rangeStart) {
        assignedRanges.push(`${rangeStart}`);
      }
      return assignedRanges.length ? assignedRanges.join(', ') : 'None';
    },
    getAssignedPercentage(doc) {
      const noSegments = !doc.segments || !doc.segments.length;
      const providerId = _.get(this.segmentsModalData, 'providerId');
      const numberOfSegmentsAssignedToCurrentUser = doc.segments
        .filter(seg =>
          this.getAssignedField(seg) &&
          this.getAssignedField(seg) === providerId).length;
      const numberOfSegments = doc.segments.length;
      return noSegments ? 'None' : `${Math.round((numberOfSegmentsAssignedToCurrentUser / numberOfSegments) * 100)}%`;
    },
    getUnassignedSegments(doc) {
      const unassignedRanges = [];
      let rangeStart;
      const hasOnlyOneSegment = doc.segments.length === 1;
      const segmentUnassigned = s => !this.getAssignedField(s) || this.getAssignedField(s) === 'system';
      const segmentAssigneeIdNotValid = s =>
        !this.allProviderTaskIds.includes(this.getAssignedField(s));
      if (hasOnlyOneSegment && (segmentUnassigned(doc.segments[0])
       || segmentAssigneeIdNotValid(doc.segments[0]))) {
        return 1;
      }

      doc.segments.forEach((segment, index) => {
        const assignedTo = this.getAssignedField(segment);
        const segmentAssignedToValidUser = assignedTo && assignedTo !== 'system' && this.allProviderTaskIds.includes(assignedTo);
        const isLastSegment = doc.segments.length === index + 1;
        if ((segmentUnassigned(segment) || segmentAssigneeIdNotValid(segment)) && !rangeStart) {
          rangeStart = index + 1;
        } else if ((segmentAssignedToValidUser || isLastSegment) && rangeStart) {
          if (rangeStart === index) {
            unassignedRanges.push(`${rangeStart}`);
          } else {
            const rangeEnd = isLastSegment ? index + 1 : index;
            unassignedRanges.push(`${rangeStart} - ${rangeEnd}`);
          }
          rangeStart = null;
        }
      });
      if (rangeStart) {
        unassignedRanges.push(`${rangeStart}`);
      }
      return unassignedRanges.length ? unassignedRanges.join(', ') : 'None';
    },
    areAllSegmentsAssignedToCurrentUser(i) {
      const providerId = _.get(this.segmentsModalData, 'providerId');
      return this.documentsPopulated[i].segments.length &&
       !this.documentsPopulated[i].segments.find(s => this.getAssignedField(s) !== providerId);
    },
    closeAssignModal() {
      this.documentsPopulated = [];
      setTimeout(() => {
        this.step = 'pickingFile';
      }, 200);
      this.$emit('close-modal');
    },
    selectRow(event, segment) {
      const oldSegmentPopupId = this.segmentPopupId;
      if (oldSegmentPopupId === segment.originalId) {
        return;
      }
      this.segmentPopupStep = 'select-option';
      this.segmentsToAssign = [];
      this.segmentPopupId = segment.originalId;
      const isRangeSelectEnabled = event.shiftKey || this.waitingToSelectEndOfRange;
      if (!isRangeSelectEnabled || _.isNil(oldSegmentPopupId)) {
        return;
      }
      let startSegmentId = null;
      let isRangeOver = false;
      let wordsCount = 0;
      const segmentsToAssign = [];
      this.assignSegmentsStepDoc.segments.forEach((s) => {
        const segmentId = s.originalId;
        if ((oldSegmentPopupId === segmentId
            || this.segmentPopupId === segmentId) && !startSegmentId) {
          startSegmentId = segmentId;
        }
        if (startSegmentId && !isRangeOver) {
          wordsCount += this.getWordsCountFromSegment(s);
          segmentsToAssign.push(s);
        }
        if ((oldSegmentPopupId === segmentId || this.segmentPopupId === segmentId) &&
          !_.isNil(startSegmentId) && startSegmentId !== segmentId) {
          isRangeOver = true;
        }
      });
      this.wordsCount = wordsCount;
      this.segmentsToAssign = segmentsToAssign;
      this.segmentPopupStep = 'assign';
    },
    async assignWholeFile(i) {
      if (this.loading) {
        return;
      }
      this.loading = true;

      const allSegments = this.documentsPopulated[i].segments;
      const { requestId } = this.$route.params;
      const segmentVendorIds = allSegments
        .map(s => this.getAssignedField(s))
        .filter(s => !!s);
      const { providerId, assigneeType, workflowId } = this.segmentsModalData;
      const wholeFileAssigned = _.isNil(segmentVendorIds
        .find(s => s !== providerId)) && segmentVendorIds.length > 0;
      try {
        await portalCatService.assignFileSegmentsToUser(
          requestId,
          {
            workflowId,
            fileId: this.documentsPopulated[i]._id,
            segmentsIds: allSegments.map(s => s.originalId),
            users: [{
              userId: wholeFileAssigned ? 'system' : providerId,
              userType: assigneeType,
            }],
          },
        );
        this.pushNotification(successNotification('Segments have been assigned successfully'));
        await this.getPopulatedDocuments();
        this.setAllSegmentsAssignedToOneProvider();
      } catch (err) {
        const message = _.get(err, 'status.message', 'Error assigning segments');
        this.pushNotification(errorNotification(message));
      }
      this.loading = false;
    },
    goToAssignSegmentsStep(i) {
      this.selectedDocIndex = i;
      this.assignSegmentsStepDoc = { ...this.documentsPopulated[i] };
      this.step = 'assigningSegments';
    },
    goToFinalStepOnPopup() {
      if (!(this.wordsCount > 0)) {
        return;
      }
      let startCount = false;
      let wordsCount = 0;
      const segmentsToAssign = [];
      this.assignSegmentsStepDoc.segments.forEach((segment) => {
        if (this.segmentPopupId === segment.originalId) {
          startCount = true;
        }
        if (startCount && wordsCount < this.wordsCount) {
          wordsCount += this.getWordsCountFromSegment(segment);
          segmentsToAssign.push(segment);
        }
      });
      this.wordsCount = wordsCount;
      this.segmentsToAssign = segmentsToAssign;
      this.segmentPopupStep = 'assign';
    },
    assignSegments() {
      const { providerId, assigneeType } = this.segmentsModalData;
      this.assignSegmentsStepDoc.segments.forEach((segment) => {
        if (this.getAssignedField(segment) === providerId) {
          segment[SEGMENT_ASSIGNEE_FIELDS[assigneeType]] = 'system';
          this.segmentsToUnAssign.push(segment.originalId);
        }
      });
      this.assignedSegmentsFinal = [...this.segmentsToAssign];
      setTimeout(() => {
        this.segmentPopupId = null;
        this.segmentsToAssign = [];
      }, 1);
    },
    isSegmentAssignedToCurrentUser(segment) {
      const providerId = _.get(this.segmentsModalData, 'providerId');
      return this.assignedSegmentsFinalIds
        .includes(segment.originalId) || this.getAssignedField(segment) === providerId;
    },
    isSegmentAssignedToAnyUser(segment) {
      const assignedField = this.getAssignedField(segment);
      return (!_.isNil(assignedField) && assignedField !== 'system' && this.allProviderTaskIds.includes(assignedField)) ||
        this.isSegmentAssignedToCurrentUser(segment);
    },
    isSegmentSelected(segment) {
      return this.segmentPopupId === segment.originalId ||
        this.segmentsToAssignIds.includes(segment.originalId);
    },
    async saveAssignments() {
      const { requestId } = this.$route.params;
      this.loading = true;
      try {
        const { workflowId, providerId, assigneeType } = this.segmentsModalData;
        if (this.segmentsToUnAssign.length) {
          await portalCatService.assignFileSegmentsToUser(
            requestId,
            {
              workflowId,
              fileId: this.assignSegmentsStepDoc._id,
              segmentsIds: this.segmentsToUnAssign,
              users: [{
                userId: 'system',
                userType: assigneeType,
              }],
            },
          );
          this.segmentsToUnAssign = [];
        }
        await portalCatService.assignFileSegmentsToUser(
          requestId,
          {
            workflowId,
            fileId: this.assignSegmentsStepDoc._id,
            segmentsIds: this.assignedSegmentsFinalIds,
            users: [{
              userId: providerId,
              userType: assigneeType,
            }],
          },
        );
        this.pushNotification(successNotification('Segments have been assigned successfully'));
        await this.getPopulatedDocuments();
        this.setAllSegmentsAssignedToOneProvider();
      } catch (err) {
        const message = _.get(err, 'status.message', 'Error assigning segments');
        this.pushNotification(errorNotification(message));
      }
      this.loading = false;
    },
  },
};
