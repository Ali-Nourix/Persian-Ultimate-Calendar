import { App, Modal, PluginSettingTab, Setting, TextComponent } from "obsidian";
import type PersianCalendarPlugin from "../main";
import { todayJalali } from "./dates";
import {
  DEFAULT_SETTINGS,
  noteNamePreview,
  validNoteFolder,
  validNoteFormat,
} from "./settings";
import { ExpressionHelperModal } from "./expression-modal";

type Panel = "live" | "notes" | "events";
class ConfirmClearCacheModal extends Modal {
  private settled = false;
  private resolve!: (confirmed: boolean) => void;
  readonly result: Promise<boolean>;
  constructor(app: App) {
    super(app);
    this.result = new Promise((resolve) => {
      this.resolve = resolve;
    });
  }
  onOpen() {
    this.contentEl.dir = "rtl";
    this.contentEl.createEl("h2", { text: "پاک کردن کش مناسبت‌ها؟" });
    this.contentEl.createEl("p", {
      text: "فقط دادهٔ مناسبت‌های دریافت‌شده حذف می‌شود. یادداشت‌ها و تنظیمات شما دست‌نخورده می‌مانند.",
    });
    new Setting(this.contentEl)
      .addButton((button) =>
        button.setButtonText("انصراف").onClick(() => this.close()),
      )
      .addButton((button) =>
        button
          .setButtonText("پاک کردن کش")
          .setWarning()
          .onClick(() => {
            this.finish(true);
            this.close();
          }),
      );
  }
  private finish(confirmed: boolean) {
    if (!this.settled) {
      this.settled = true;
      this.resolve(confirmed);
    }
  }
  onClose() {
    this.finish(false);
    this.contentEl.empty();
  }
}
export class PersianCalendarSettingTab extends PluginSettingTab {
  private active: Panel = "live";
  private panelEl!: HTMLElement;
  private tabButtons = new Map<Panel, HTMLButtonElement>();
  private message!: HTMLElement;
  constructor(
    app: App,
    readonly plugin: PersianCalendarPlugin,
  ) {
    super(app, plugin);
  }
  display(): void {
    const root = this.containerEl;
    root.empty();
    root.addClass("persian-calendar-settings");
    root.dir = "rtl";
    const header = root.createDiv({ cls: "pc-settings-header" });
    header.createEl("h2", { text: "تقویم فارسی" });
    header.createEl("p", {
      text: "نمایش زنده، یادداشت‌ها و مناسبت‌ها — هرکدام با کنترل مستقل.",
    });
    const tabs = root.createDiv({
      cls: "pc-settings-tabs",
      attr: { role: "tablist", "aria-label": "بخش‌های تنظیمات" },
    });
    this.tabButtons.clear();
    const panels: Array<[Panel, string]> = [
      ["live", "عبارت‌های زنده"],
      ["notes", "یادداشت‌ها"],
      ["events", "مناسبت‌ها"],
    ];
    panels.forEach(([id, label], index) => {
      const button = tabs.createEl("button", {
        text: label,
        attr: {
          role: "tab",
          id: `pc-settings-tab-${id}`,
          "aria-controls": "pc-settings-panel",
        },
      });
      button.onclick = () => this.showPanel(id);
      button.onkeydown = (event) => {
        let next = index;
        if (event.key === "ArrowLeft") next = (index + 1) % panels.length;
        else if (event.key === "ArrowRight")
          next = (index + panels.length - 1) % panels.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = panels.length - 1;
        else return;
        event.preventDefault();
        this.showPanel(panels[next][0]);
        this.tabButtons.get(panels[next][0])?.focus();
      };
      this.tabButtons.set(id, button);
    });
    this.panelEl = root.createDiv({
      cls: "pc-settings-panel",
      attr: { role: "tabpanel", id: "pc-settings-panel" },
    });
    this.message = root.createDiv({
      cls: "pc-settings-message",
      attr: { role: "status", "aria-live": "polite" },
    });
    this.showPanel(this.active);
  }
  private showPanel(panel: Panel): void {
    this.active = panel;
    this.tabButtons.forEach((button, id) => {
      button.setAttribute("aria-selected", String(id === panel));
      button.tabIndex = id === panel ? 0 : -1;
    });
    this.panelEl.empty();
    this.panelEl.setAttribute("aria-labelledby", `pc-settings-tab-${panel}`);
    this.message.textContent = "";
    this.message.removeClass("is-error");
    if (panel === "live") this.livePanel();
    else if (panel === "notes") this.notesPanel();
    else this.eventsPanel();
  }
  private status(text: string, error = false) {
    this.message.textContent = text;
    this.message.toggleClass("is-error", error);
  }
  private async save(action: () => void = () => {}): Promise<boolean> {
    try {
      await this.plugin.saveSettings();
      action();
      this.status("تغییرات ذخیره شد.");
      return true;
    } catch {
      this.status(
        "ذخیره نشد؛ دسترسی نوشتن Vault را بررسی و دوباره تلاش کنید.",
        true,
      );
      return false;
    }
  }
  private intro(title: string, description: string) {
    this.panelEl.createEl("h3", { text: title });
    this.panelEl.createEl("p", {
      cls: "pc-settings-description",
      text: description,
    });
  }
  private livePanel() {
    this.intro(
      "یادداشت‌هایی که زنده می‌مانند",
      "عبارت را یک‌بار تایپ کنید؛ ساعت، تاریخ و پیشرفت بدون بازنویسی مداوم فایل تازه می‌شوند.",
    );
    const examples = this.panelEl.createDiv({ cls: "pc-live-examples" });
    for (const [key, label] of [
      ["ساعت", "ساعت فعلی"],
      ["درصد_سال", "درصد سال"],
      ["تا_نوروز", "روز تا نوروز"],
    ]) {
      const example = examples.createDiv({ cls: "pc-live-example" });
      example.createSpan({ cls: "pc-live-label", text: label });
      example.createEl("code", { text: `{#${key}}` });
      example.createSpan({
        cls: "persian-dynamic-tag",
        text: String(this.plugin.calculateValue(key) ?? "—"),
        attr: { "data-key": key, "aria-label": label },
      });
    }
    new Setting(this.panelEl)
      .setName("به‌روزرسانی عبارت‌های زنده")
      .setDesc(
        "روشن: {#عبارت} به مقدار زنده تبدیل می‌شود. خاموش: عبارت جدید تبدیل نمی‌شود و مقادیر رندرشده ثابت می‌مانند.",
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.dynamicExpressions)
          .onChange(async (enabled) => {
            const previous = this.plugin.settings.dynamicExpressions;
            this.plugin.settings.dynamicExpressions = enabled;
            if (await this.save(() => this.plugin.configureLiveUpdates())) {
              const interval = this.panelEl.querySelector("select");
              if (interval) interval.disabled = !enabled;
            } else {
              this.plugin.settings.dynamicExpressions = previous;
              toggle.setValue(previous);
            }
          }),
      );
    new Setting(this.panelEl)
      .setName("فاصلهٔ به‌روزرسانی")
      .setDesc(
        "۱ ثانیه برای ساعت؛ فاصلهٔ بیشتر برای یادداشت‌هایی با مقادیر روزانه. فقط عناصر رندرشده بررسی می‌شوند.",
      )
      .addDropdown((dropdown) =>
        dropdown
          .addOptions({
            "1000": "هر ۱ ثانیه",
            "5000": "هر ۵ ثانیه",
            "30000": "هر ۳۰ ثانیه",
            "60000": "هر ۶۰ ثانیه",
          })
          .setValue(String(this.plugin.settings.dynamicUpdateInterval))
          .setDisabled(!this.plugin.settings.dynamicExpressions)
          .onChange(async (value) => {
            const previous = this.plugin.settings.dynamicUpdateInterval;
            this.plugin.settings.dynamicUpdateInterval = Number(value);
            if (!(await this.save(() => this.plugin.configureLiveUpdates()))) {
              this.plugin.settings.dynamicUpdateInterval = previous;
              dropdown.setValue(String(previous));
            }
          }),
      );
    new Setting(this.panelEl)
      .setName("جایگزینی عبارت‌های ثابت")
      .setDesc(
        "{تاریخ} یا {ساعت} یک‌بار هنگام تایپ تبدیل می‌شود و بعد تغییر نمی‌کند.",
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.staticExpressions)
          .onChange(async (enabled) => {
            const previous = this.plugin.settings.staticExpressions;
            this.plugin.settings.staticExpressions = enabled;
            if (!(await this.save())) {
              this.plugin.settings.staticExpressions = previous;
              toggle.setValue(previous);
            }
          }),
      );
    const note = this.panelEl.createDiv({ cls: "pc-settings-callout" });
    note.createEl("strong", {
      text: "نمایش زنده، نه ویرایش خودکار همهٔ فایل‌ها",
    });
    note.createEl("p", {
      text: "Reading view نمایش مرجع است. در Source mode ممکن است span ذخیره‌شده را ببینید. نام عبارت باید شناخته‌شده باشد؛ {#تست} به‌خودی‌خود یک متغیر سفارشی نمی‌سازد.",
    });
    new Setting(this.panelEl)
      .setName("فهرست عبارت‌ها")
      .setDesc("نمونه‌های موجود را ببینید و عبارت ثابت یا زنده را کپی کنید.")
      .addButton((button) =>
        button
          .setButtonText("باز کردن راهنما")
          .onClick(() =>
            new ExpressionHelperModal(this.app, this.plugin).open(),
          ),
      );
  }
  private notesPanel() {
    this.intro(
      "یادداشت‌های دوره‌ای",
      "مقصد فایل و نام آن را مشخص کنید. فایل موجود باز می‌شود؛ متن آن بازنویسی نمی‌شود.",
    );
    new Setting(this.panelEl)
      .setName("پوشهٔ یادداشت‌ها")
      .setDesc(
        "مسیر نسبی داخل Vault؛ مثلاً Journal یا Notes/Journal. مسیر پنهان و .. مجاز نیست.",
      )
      .addText((text) =>
        text
          .setPlaceholder("Journal")
          .setValue(this.plugin.settings.noteFolder)
          .onChange(async (value) => {
            if (!validNoteFolder(value)) {
              text.inputEl.setAttribute("aria-invalid", "true");
              this.status(
                "پوشه نامعتبر است؛ مسیر نسبی و غیرپنهان وارد کنید.",
                true,
              );
              return;
            }
            text.inputEl.removeAttribute("aria-invalid");
            const previous = this.plugin.settings.noteFolder;
            this.plugin.settings.noteFolder = value.trim();
            if (!(await this.save()))
              this.plugin.settings.noteFolder = previous;
          }),
      );
    const formats: Array<
      ["noteNameFormat" | "monthNoteFormat" | "yearNoteFormat", string]
    > = [
      ["noteNameFormat", "نام فایل روزانه"],
      ["monthNoteFormat", "نام فایل ماهانه"],
      ["yearNoteFormat", "نام فایل سالانه"],
    ];
    const inputs = new Map<string, TextComponent>();
    for (const [key, label] of formats) {
      const setting = new Setting(this.panelEl)
        .setName(label)
        .setDesc(
          `نمونهٔ امروز: \u2066${noteNamePreview(this.plugin.settings[key])}\u2069`,
        );
      setting.addText((text) => {
        inputs.set(key, text);
        text
          .setPlaceholder(DEFAULT_SETTINGS[key])
          .setValue(this.plugin.settings[key])
          .onChange(async (value) => {
            if (!validNoteFormat(value)) {
              text.inputEl.setAttribute("aria-invalid", "true");
              this.status(
                "نام فایل خالی یا دارای نویسهٔ غیرمجاز است؛ مسیر را در تنظیم پوشه وارد کنید.",
                true,
              );
              return;
            }
            text.inputEl.removeAttribute("aria-invalid");
            setting.setDesc(
              `نمونهٔ امروز: \u2066${noteNamePreview(value.trim())}\u2069`,
            );
            const previous = this.plugin.settings[key];
            this.plugin.settings[key] = value.trim();
            if (!(await this.save())) this.plugin.settings[key] = previous;
          });
      });
    }
    this.panelEl.createEl("p", {
      cls: "pc-settings-description",
      text: "YYYY = سال شمسی، MM = ماه دو رقمی، DD = روز دو رقمی. پسوند .md خودکار اضافه می‌شود.",
    });
    new Setting(this.panelEl)
      .setName("بازگرداندن نام‌های پیش‌فرض")
      .setDesc(
        "فقط قالب نام فایل‌ها تغییر می‌کند؛ فایل‌های موجود جابه‌جا یا حذف نمی‌شوند.",
      )
      .addButton((button) =>
        button.setButtonText("بازگرداندن قالب‌ها").onClick(async () => {
          const previous = { ...this.plugin.settings };
          for (const [key] of formats)
            this.plugin.settings[key] = DEFAULT_SETTINGS[key];
          if (await this.save()) {
            for (const [key] of formats)
              inputs.get(key)?.setValue(DEFAULT_SETTINGS[key]);
            this.showPanel("notes");
          } else this.plugin.settings = previous;
        }),
      );
  }
  private eventsPanel() {
    this.intro(
      "مناسبت‌ها و دادهٔ آفلاین",
      "تقویم و API آفلاین‌اند. فقط دریافت مناسبت‌های جدید به اینترنت نیاز دارد.",
    );
    new Setting(this.panelEl)
      .setName("دریافت و نمایش مناسبت‌ها")
      .setDesc(
        "روشن: دریافت JSON از دو منبع عمومی. خاموش: دستهٔ بعدی شروع نمی‌شود؛ درخواست‌های در حال اجرا ممکن است تمام شوند. دادهٔ قبلی حذف نمی‌شود.",
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showHolidays)
          .onChange(async (enabled) => {
            const previous = this.plugin.settings.showHolidays;
            this.plugin.settings.showHolidays = enabled;
            if (await this.save()) this.showPanel("events");
            else {
              this.plugin.settings.showHolidays = previous;
              toggle.setValue(previous);
            }
          }),
      );
    const info = this.plugin.getCacheInfo();
    const stats = this.panelEl.createDiv({ cls: "pc-cache-stats" });
    for (const [label, value] of [
      ["ماه دریافت‌شده", String(info.totalMonths)],
      ["اعتبار تا", info.expiryDate],
      ["حجم محلی", `\u2066${info.size}\u2069`],
    ]) {
      const stat = stats.createDiv({ cls: "pc-cache-stat" });
      stat.createSpan({ text: label });
      stat.createEl("strong", { text: value });
    }
    const busy = this.plugin.isFetchingCache;
    this.panelEl.createEl("p", {
      cls: "pc-settings-description",
      text: busy
        ? "دریافت پس‌زمینه در حال انجام است؛ بعد از پایان، وضعیت را تازه کنید."
        : "بازهٔ دریافت: ۱۲ ماه گذشته + ماه جاری + ۲۴ ماه آینده. صحت و پوشش مناسبت‌ها تضمین نمی‌شود.",
    });
    new Setting(this.panelEl)
      .setName("دریافت تازهٔ مناسبت‌ها")
      .setDesc(
        "داده دوباره از شبکه دریافت می‌شود. در شکست کامل، اطلاعات آفلاین قبلی حفظ می‌شود.",
      )
      .addButton((button) =>
        button
          .setButtonText(busy ? "در حال دریافت…" : "به‌روزرسانی کش")
          .setCta()
          .setDisabled(busy || !this.plugin.settings.showHolidays)
          .onClick(async () => {
            button.setDisabled(true);
            button.setButtonText("در حال دریافت…");
            try {
              const date = todayJalali();
              const complete = await this.plugin.updateFullCache(
                date.jy,
                date.jm,
              );
              this.showPanel("events");
              this.status(
                complete
                  ? "دادهٔ مناسبت‌ها تازه شد."
                  : "دریافت ناقص بود؛ دادهٔ موجود حفظ شده و می‌توانید دوباره تلاش کنید.",
                !complete,
              );
            } catch {
              this.status(
                "دریافت یا ذخیره ناموفق بود؛ اینترنت و دسترسی Vault را بررسی کنید.",
                true,
              );
            } finally {
              button.setDisabled(false);
              button.setButtonText("به‌روزرسانی کش");
            }
          }),
      );
    new Setting(this.panelEl)
      .setName("تازه‌کردن وضعیت")
      .setDesc(
        "بدون درخواست شبکه، تعداد ماه‌ها و نتیجهٔ دریافت پس‌زمینه را دوباره بخوانید.",
      )
      .addButton((button) =>
        button
          .setButtonText("تازه‌کردن وضعیت")
          .onClick(() => this.showPanel("events")),
      );
    new Setting(this.panelEl)
      .setName("پاک کردن کش")
      .setDesc(
        "فقط مناسبت‌های ذخیره‌شده پاک می‌شوند. دریافت خودکار بعدی ممکن است دوباره آن‌ها را بارگیری کند.",
      )
      .addButton((button) =>
        button
          .setButtonText("پاک کردن…")
          .setWarning()
          .setDisabled(busy)
          .onClick(async () => {
            const modal = new ConfirmClearCacheModal(this.app);
            modal.open();
            if (!(await modal.result)) return;
            button.setDisabled(true);
            try {
              await this.plugin.clearCache();
              this.showPanel("events");
              this.status("کش پاک شد؛ یادداشت‌ها تغییر نکردند.");
            } catch {
              this.status("پاک‌کردن یا ذخیرهٔ کش ناموفق بود.", true);
            } finally {
              button.setDisabled(false);
            }
          }),
      );
  }
}
