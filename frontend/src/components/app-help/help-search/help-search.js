import DocumentationService from '../../../services/documentation-service';
import ContextualText from '../../contextual-text/contextual-text.vue';

const documentationService = new DocumentationService();

export default {
  components: {
    ContextualText,
  },
  created: function () {
    this.documentationService = documentationService;
  },
  data() {
    return {
      topics: [],
      search: '',
      searchDirty: false,
    };
  },
  methods: {
    performSearch() {
      this.$emit('app-help-search');
      this.documentationService.get(null, { keywords: this.search }).then((response) => {
        this.topics = response.data.documentation;
        this.searchDirty = true;
      });
    },
    selectTopic(topic) {
      this.clear();
      this.$emit('app-help-topic-selected', topic);
    },
    clear() {
      this.topics = [];
      this.searchDirty = false;
      this.search = '';
    },
  },
};
