const COLUMN_PROP = 'selected';

export default {
  props: {
    rowSelectionTitle: {
      type: String,
    },
    sort: {
      type: String,
    },
    canSort: {
      type: Boolean,
      default: true,
    },
    loading: {
      type: Boolean,
    },
  },
  created() {
    this.columnProp = COLUMN_PROP;
  },
  computed: {
    sortDesc() {
      return this.sort === `-${this.columnProp}`;
    },
    sortAsc() {
      return this.sort === this.columnProp;
    },
  },
  methods: {
    fireSort() {
      if (this.canSort) {
        let sortCol = this.columnProp;
        if (this.sort === this.columnProp) {
          sortCol = `-${this.columnProp}`;
        }
        this.$emit('grid-sort', sortCol);
      }
    },
  },
};
