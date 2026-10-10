class Plugin {
  constructor() {
    this.app = { workspace: { on: () => () => {} } };
    this.saved = null;
    this.data = null;
  }
  async loadData() {
    return this.data;
  }
  async saveData(data) {
    this.saved = data;
  }
  registerView() {}
  addRibbonIcon() {}
  addSettingTab() {}
  registerEvent() {}
  registerInterval() {}
  registerMarkdownPostProcessor() {}
  addCommand() {}
}
class HostClass {}
module.exports = {
  Plugin,
  ItemView: HostClass,
  Modal: HostClass,
  PluginSettingTab: HostClass,
  Setting: HostClass,
  TFile: HostClass,
  Notice: HostClass,
  normalizePath: (value) => value,
  setIcon: () => {},
  requestUrl: async () => ({ status: 200, json: [] }),
};
