import _ from 'lodash';

export default {
  props: {
    data: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      headCols: ['Type', 'Segments', 'Words', 'Characters (no spaces)', 'Characters (with spaces)', 'Percent'],
      cols: ['numSegments', 'numWords', 'numCharsNoSpaces', 'numCharsWithSpaces', 'percent'],
      rows: [
        { label: 'Total repetitions', key: 'repetitions' },
        { label: '101%', key: 'match101' },
        { label: '100%', key: 'match100' },
        { label: '95-99%', key: 'match95to99' },
        { label: '85-94%', key: 'match85to94' },
        { label: '75-84%', key: 'match75to84' },
        { label: 'No match', key: 'noMatch' },
        { label: 'Total', key: 'totals' },
      ],
    };
  },
  computed: {
    statistics() {
      return this.rows.map(row =>
        [row.label, ...this.cols.map(col => this.data.statistics[row.key][col])]
      );
    },
  },
  methods: {
    roundNumber(value) {
      if (_.isNaN(Number(value))) {
        return value;
      }
      return _.round(value, 2);
    },
  },
};
