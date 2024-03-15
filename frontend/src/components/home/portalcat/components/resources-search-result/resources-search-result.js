import _ from 'lodash';
import localDateTime from '../../../../../utils/filters/local-date-time';

const RESOURCE_TYPE_MT = 'mt';
const RESOURCE_TYPE_TM = 'tm';
const RESOURCE_TYPE_HT = 'ht';
const CUSTOM_PROPERTY_CHANGEDATE = 'changedate';
const CUSTOM_PROPERTY_CHANGEID = 'changeid';
const preventDefault = (event) => {
  event.preventDefault();
};

export default {
  props: {
    resource: {
      type: Object,
      required: true,
    },
    isMinimizable: Boolean,
  },
  data() {
    return {
      isMinimized: false,
    };
  },
  created() {
    if (this.isMinimizable) {
      this.isMinimized = true;
    }
    this.clicks = 0;
  },
  mounted() {
    if (!_.isNil(this.$refs.searchResult)) {
      this.$refs.searchResult.addEventListener('mousedown', preventDefault);
    }
  },
  destroyed() {
    if (!_.isNil(this.$refs.searchResult)) {
      this.$refs.searchResult.removeEventListener('mousedown', preventDefault);
    }
  },
  computed: {
    sourceText() {
      return _.get(this, 'resource.source.text', '');
    },
    targetText() {
      return _.get(this, 'resource.target.text', '');
    },
    resourceType() {
      return _.get(this, 'resource.origin', '');
    },
    isMt() {
      return this.resourceType.toLowerCase() === RESOURCE_TYPE_MT;
    },
    isTm() {
      return this.resourceType.toLowerCase() === RESOURCE_TYPE_TM;
    },
    isHt() {
      return this.resourceType.toLowerCase() === RESOURCE_TYPE_HT;
    },
    localChangeDate() {
      return localDateTime(this.customChangeDate, 'MM-DD-YYYY HH:mm');
    },
    tmName() {
      return _.get(this, 'resource.tmName', '');
    },
    ownerCompanyName() {
      return _.get(this, 'resource.company.name', '');
    },
    matchScore() {
      return _.get(this, 'resource.tmMatchInfo.score');
    },
    customProperties() {
      return _.defaultTo(
        _.get(this, 'resource.customProperties', []),
        [],
      );
    },
    customChangeDate() {
      const changeDate =
        this.customProperties.find(prop => prop.name === CUSTOM_PROPERTY_CHANGEDATE);
      return _.get(changeDate, 'value', '');
    },
    customChangeId() {
      const changeId =
        this.customProperties.find(prop => prop.name === CUSTOM_PROPERTY_CHANGEID);
      return _.get(changeId, 'value', '');
    },
  },
  methods: {
    onClick() {
      this.clicks++;
      if (this.clicks === 1) {
        this.timer = setTimeout(() => {
          this.clicks = 0;
          this.handleClick();
        }, 200);
      } else {
        clearTimeout(this.timer);
        this.clicks = 0;
        this.handleDblClick();
      }
    },
    handleClick() {
      if (this.isMinimizable) {
        this.isMinimized = !this.isMinimized;
      }
    },
    handleDblClick() {
      this.$emit('resource-apply');
    },
    onApplyResourceClick(event) {
      event.preventDefault();
      event.stopPropagation();
      this.$emit('resource-apply');
    },
  },
};
