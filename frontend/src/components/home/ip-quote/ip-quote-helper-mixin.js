
const QUOTE_MENU_ROUTE_NAME = 'ip-quote-dashboard';
const ORDER_MENU_ROUTE_NAME = 'ip-order-dashboard';
export default {
  methods: {
    decrementStep() {
      if (this.currentStep > 0) {
        this.currentStep -= 1;
      } else this.navigateToMenu();
    },
    navigateToMenu() {
      if (this.isOrder) this.$router.push({ name: ORDER_MENU_ROUTE_NAME });
      else this.$router.push({ name: QUOTE_MENU_ROUTE_NAME });
    },
  },
};
