import _ from 'lodash';
import { getProgressByTask } from '../../../../../utils/workflow/workflow-helpers';
import PortalCatStoreMixin from '../../mixins/pc-store-mixin';

const PIPELINE_TYPE_IMPORT = 'import';

export default {
  mixins: [
    PortalCatStoreMixin,
  ],
  computed: {
    activeDocumentName() {
      return _.get(this.documentById(this.activeDocument), 'name', '');
    },
    hasImportPipelineError() {
      return !_.isNil(this.pipelineErrorByType(PIPELINE_TYPE_IMPORT));
    },
    arePipelinesEmpty() {
      return _.isEmpty(this.pipelines);
    },
    ability() {
      return _.get(this, 'task.ability', '');
    },
    totalWordsCount() {
      return _.get(this, 'requestProgress.numWordsTotal', 'NA');
    },
    activeDocumentProgress() {
      return _.get(this, `requestProgress.${this.activeDocument}`);
    },
    activeDocumentWordsCount() {
      return _.get(this, 'activeDocumentProgress.numWordsTotal', 'NA');
    },
    taskWordsProgressCount() {
      const progress = getProgressByTask(this.ability, this.activeDocumentProgress);
      return _.defaultTo(progress, 'NA');
    },
  },
};