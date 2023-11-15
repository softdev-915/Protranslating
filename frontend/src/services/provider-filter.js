/* eslint-disable max-classes-per-file */
const filterByPropAndValue = (prop, value) => prop.filter((v) => {
  if (v) {
    return v.toLowerCase() === value.toLowerCase();
  }
  return false;
});

class ProviderFilter {
  constructor(list) {
    this.list = list || [];
  }

  filter(prop, value) {
    if (prop && value) {
      const filteredList = this.list.filter((u) => {
        if (u[prop]) {
          return filterByPropAndValue(u[prop], value).length ? u : null;
        }
        return null;
      });
      this.list = filteredList;
    }
    return this.list;
  }

  getList() {
    return this.list;
  }
}

export default class ProviderFilterFacade {
  constructor(list) {
    this.list = list;
  }

  filter(list, params) {
    const providerFilter = new ProviderFilter(list);

    if (list && list.length && params && params.ability) {
      providerFilter.filter('abilities', params.ability);
      if (params.requireLanguageCombination) {
        providerFilter.filter('languageCombinations', params.language);
      }
      if (params.competenceLevelRequired) {
        providerFilter.filter('competenceLevels', params.competenceLevels);
      }

      if (params.requireCatTool) {
        providerFilter.filter('catTools', params.catTool);
      }
    }
    return providerFilter.getList();
  }
}
