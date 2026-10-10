import { Plugin, Editor, requestUrl } from "obsidian";
import type {
  CalendarPluginApi,
  PickDateOptions,
  PickedDateResult,
} from "./src/api";
import { readSettings, PersianCalendarSettings } from "./src/settings";
import { EventStore, CacheSnapshot } from "./src/events";
import { CalendarView } from "./src/calendar-view";
import { DatePickerModal } from "./src/date-picker";
import { ExpressionHelperModal } from "./src/expression-modal";
import { PersianCalendarSettingTab } from "./src/settings-tab";
import { calculateValue } from "./src/expressions";
import {
  expressionReplacement,
  refreshLiveExpressions,
} from "./src/live-expressions";
import { todayJalali } from "./src/dates";
import { VIEW_TYPE_CALENDAR } from "./src/constants";
export type {
  CalendarPluginApi,
  PickDateOptions,
  PickedDateResult,
} from "./src/api";

export default class PersianCalendarPlugin extends Plugin {
  settings!: PersianCalendarSettings;
  api!: CalendarPluginApi;
  isFetchingCache = false;
  private events!: EventStore;
  private pickers = new Set<DatePickerModal>();
  private writeQueue: Promise<void> = Promise.resolve();
  private unloaded = false;
  private dynamicTimer: number | null = null;
  async onload() {
    const data = await this.loadData();
    this.settings = readSettings(data?.settings ?? data);
    this.events = new EventStore(
      async (url) => {
        const response = await requestUrl({
          url,
          method: "GET",
          headers: { Accept: "application/json" },
        });
        if (response.status !== 200)
          throw new Error(`Events HTTP ${response.status}`);
        return response.json as unknown;
      },
      (snapshot) => this.persist(snapshot),
    );
    this.events.restore(data?.cache);
    this.api = { pickDate: this.pickDate.bind(this) };
    this.registerView(
      VIEW_TYPE_CALENDAR,
      (leaf) => new CalendarView(leaf, this),
    );
    this.addRibbonIcon(
      "calendar-days",
      "تقویم فارسی",
      () => void this.activateView(),
    );
    this.addSettingTab(new PersianCalendarSettingTab(this.app, this));
    this.registerEvent(
      this.app.workspace.on("editor-change", (editor) =>
        this.handleSmartText(editor),
      ),
    );
    this.configureLiveUpdates();
    this.registerMarkdownPostProcessor((element) => {
      if (this.settings.dynamicExpressions)
        refreshLiveExpressions(element, (key) => this.calculateValue(key));
    });
    this.addCommand({
      id: "open-persian-calendar",
      name: "باز کردن تقویم فارسی",
      callback: () => void this.activateView(),
    });
    this.addCommand({
      id: "insert-persian-date",
      name: "درج تاریخ شمسی",
      editorCallback: (editor) => {
        const j = todayJalali();
        editor.replaceSelection(
          `${j.jy}/${String(j.jm).padStart(2, "0")}/${String(j.jd).padStart(2, "0")}`,
        );
      },
    });
    this.addCommand({
      id: "insert-full-persian-date",
      name: "درج تاریخ کامل شمسی",
      editorCallback: (editor) => {
        const value = this.calculateValue("تاریخ_کامل");
        if (value !== null) editor.replaceSelection(String(value));
      },
    });
    this.addCommand({
      id: "open-expression-helper",
      name: "راهنمای عبارات داینامیک",
      callback: () => new ExpressionHelperModal(this.app, this).open(),
    });
    // Network work must not block registration or opening the picker.
    if (this.settings.showHolidays && this.events.expired())
      void this.updateFullCache(todayJalali().jy, todayJalali().jm).catch(
        (error) =>
          console.warn("[Persian Calendar] Cache refresh failed", error),
      );
  }
  private persist(snapshot: CacheSnapshot): Promise<void> {
    if (this.unloaded) return Promise.resolve();
    const data = JSON.parse(
      JSON.stringify({ settings: this.settings, cache: snapshot }),
    );
    const write = this.writeQueue.then(() => this.saveData(data));
    this.writeQueue = write.catch(() => {});
    return write;
  }
  async saveSettings() {
    await this.persist(this.events.snapshot);
  }
  async pickDate(
    options: PickDateOptions = {},
  ): Promise<PickedDateResult | null> {
    if (this.unloaded) return null;
    let modal: DatePickerModal | undefined;
    try {
      modal = new DatePickerModal(this.app, options);
      this.pickers.add(modal);
      modal.open();
      return await modal.result;
    } catch (error) {
      console.warn("[Persian Calendar] Date picker failed", error);
      modal?.close();
      return null;
    } finally {
      if (modal) this.pickers.delete(modal);
    }
  }
  onunload() {
    this.unloaded = true;
    if (this.dynamicTimer !== null) window.clearInterval(this.dynamicTimer);
    this.dynamicTimer = null;
    for (const modal of this.pickers) modal.close();
    this.pickers.clear();
  }
  async activateView() {
    const workspace = this.app.workspace;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE_CALENDAR)[0];
    if (!leaf) {
      const candidate = workspace.getRightLeaf(false);
      if (!candidate) return;
      leaf = candidate;
      await leaf.setViewState({ type: VIEW_TYPE_CALENDAR, active: true });
    }
    await workspace.revealLeaf(leaf);
  }
  handleSmartText(editor: Editor) {
    const cursor = editor.getCursor(),
      line = editor.getLine(cursor.line);
    const matches = line.matchAll(/\{(#?)([^{}]+)\}/g);
    for (const match of matches) {
      const index = match.index ?? 0;
      const end = index + match[0].length;
      if (cursor.ch !== end) continue;
      const value = this.calculateValue(match[2]);
      if (value === null) return;
      const dynamic = match[1] === "#";
      if (
        dynamic
          ? !this.settings.dynamicExpressions
          : !this.settings.staticExpressions
      )
        return;
      const text = expressionReplacement(match[2], dynamic, value);
      if (text === null) return;
      editor.replaceRange(
        text,
        { line: cursor.line, ch: index },
        { line: cursor.line, ch: end },
      );
      return;
    }
  }
  configureLiveUpdates() {
    if (this.dynamicTimer !== null) window.clearInterval(this.dynamicTimer);
    this.dynamicTimer = null;
    if (this.settings.dynamicExpressions && !this.unloaded) {
      this.dynamicTimer = window.setInterval(
        () => this.updateDynamicTags(),
        this.settings.dynamicUpdateInterval,
      );
      this.registerInterval(this.dynamicTimer);
    }
  }
  updateDynamicTags() {
    if (!this.settings.dynamicExpressions || this.unloaded) return;
    refreshLiveExpressions(document, (key) => this.calculateValue(key));
  }
  calculateValue(keyword: string) {
    return calculateValue(
      keyword,
      (y, m, d) => this.getMonthEvents(y, m)[d] ?? [],
    );
  }
  getMonthEvents(y: number, m: number) {
    return this.settings.showHolidays ? this.events.get(y, m) : {};
  }
  async fetchMonthEvents(y: number, m: number) {
    if (this.settings.showHolidays) await this.events.fetch(y, m);
  }
  async updateFullCache(y: number, m: number): Promise<boolean> {
    if (this.isFetchingCache || !this.settings.showHolidays) return false;
    this.isFetchingCache = true;
    try {
      return await this.events.refresh(
        y,
        m,
        () => this.settings.showHolidays && !this.unloaded,
      );
    } finally {
      this.isFetchingCache = false;
    }
  }
  async clearCache() {
    await this.events.clear();
  }
  getCacheInfo() {
    const cache = this.events.snapshot,
      expiry = Date.parse(cache.expires);
    return {
      totalMonths: Object.keys(cache.months).length,
      expiryDate: Number.isFinite(expiry)
        ? new Date(expiry).toLocaleDateString("fa-IR")
        : "تنظیم نشده",
      size: `${(new Blob([JSON.stringify(cache.months)]).size / 1024).toFixed(2)} KB`,
    };
  }
}
