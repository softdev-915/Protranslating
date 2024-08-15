/* global window */
import _ from 'lodash';
import Promise from 'bluebird';
import { mapActions } from 'vuex';
import PortalCatService from '../../../../services/portalcat-service';
import { successNotification } from '../../../../utils/notifications';

const portalCatService = new PortalCatService();
const ASSIGNEE_TYPES = {
  Translation: 'translator',
  Editing: 'editor',
  PEMT: 'editor',
  QA: 'qaEditor',
};

export default {
  props: {
    request: {
      type: Object,
    },
    assignSegmentsEvenlyModalData: {
      type: Object,
    },
    workflowImportedFiles: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      loading: false,
    };
  },
  watch: {
    assignSegmentsEvenlyModalData(modalData) {
      if (modalData && _.isNil(modalData.loading)) {
        this.$refs.workflowAssignSegmentsEvenlyModal.show();
        window.addEventListener('keydown', this.onKeydown);
      } else {
        window.removeEventListener('keydown', this.onKeydown);
        this.$refs.workflowAssignSegmentsEvenlyModal.hide();
      }
    },
  },
  computed: {
    providerName() {
      return _.get(this, 'assignSegmentsEvenlyModalData.onlyProviderName', '');
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onKeydown(event) {
      if (event.code === 'Escape') {
        this.$emit('close-modal');
      }
    },
    async assignSegmentsEvenly() {
      this.loading = true;
      const workflow = this.request.workflows
        .find(w => w._id === this.assignSegmentsEvenlyModalData.workflowId);
      const task = workflow.tasks.find(t => t._id === this.assignSegmentsEvenlyModalData.taskId);
      const providerIds = task.providerTasks.map(t => _.get(t, 'provider._id', ''));
      const segments = [];
      await Promise.each(this.workflowImportedFiles, async (file) => {
        const fileSegments = await portalCatService
          .getFileSegments(this.request._id, {
            workflowId: this.assignSegmentsEvenlyModalData.workflowId,
            fileId: file._id,
          });
        segments.push(...fileSegments.data.segments);
      });
      let totalWordsCount = 0;
      segments.forEach((segment) => {
        const wordsProperty = segment.customProperties.find(prop => prop.name === 'TotalWordCount');
        const segmentWordCount = Number(_.get(wordsProperty, 'value', 0));
        segment.wordCount = segmentWordCount;
        totalWordsCount += segmentWordCount;
      });
      const segmentsPerProvider = {};
      let remainingWordsCount = totalWordsCount;
      providerIds.forEach((providerId, providerIndex) => {
        let allowedWordsCountPerProvider;
        let currentProviderWordsCount = 0;
        if (providerIndex === providerIds.length - 1) {
          allowedWordsCountPerProvider = remainingWordsCount;
        } else {
          allowedWordsCountPerProvider =
            Math.ceil(remainingWordsCount / (providerIds.length - providerIndex));
        }
        for (let i = 0; i < segments.length; i++) {
          const segment = segments[i];
          if (_.has(segmentsPerProvider, providerId)) {
            segmentsPerProvider[providerId].push(segment);
          } else {
            segmentsPerProvider[providerId] = [segment];
          }
          currentProviderWordsCount += segment.wordCount;
          if (currentProviderWordsCount >= allowedWordsCountPerProvider) {
            remainingWordsCount -= currentProviderWordsCount;
            segments.splice(0, i + 1);
            return;
          }
        }
      });
      const segmentsForCurrentProviderGrouped = [];
      Object.entries(segmentsPerProvider).forEach(([providerId, segmentsForCurrentProvider]) => {
        segmentsForCurrentProvider.forEach((segment) => {
          const segmentInGroup = segmentsForCurrentProviderGrouped
            .find(s => s.fileId === segment.fileId && s.providerId === providerId);
          if (_.isNil(segmentInGroup)) {
            segmentsForCurrentProviderGrouped.push({
              fileId: segment.fileId,
              segments: [segment.originalId],
              providerId,
              userType: ASSIGNEE_TYPES[task.ability],
            });
          } else {
            segmentInGroup.segments.push(segment.originalId);
          }
        });
      });

      await Promise.mapSeries(segmentsForCurrentProviderGrouped, async (currentSegmentsGroup) => {
        await portalCatService.assignFileSegmentsToUser(
          this.request._id,
          {
            workflowId: this.assignSegmentsEvenlyModalData.workflowId,
            fileId: currentSegmentsGroup.fileId,
            segmentsIds: currentSegmentsGroup.segments,
            users: [{
              userId: currentSegmentsGroup.providerId,
              userType: currentSegmentsGroup.userType,
            }],
          },
        );
      });
      this.pushNotification(successNotification('Segments have been assigned successfully'));
      task.allSegmentsAssignedToOneProvider = false;
      this.$emit('save-workflow', this.assignSegmentsEvenlyModalData.workflowIndex);
      this.$emit('close-modal');
      this.loading = false;
    },
  },
};
