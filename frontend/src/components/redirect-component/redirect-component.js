export default {
  props: {
    componentName: String,
  },
  mounted() {
    this.$router
      .push({ name: this.componentName, query: this.$route.query })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.log(error);
      });
  },
};
