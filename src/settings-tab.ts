import { App, PluginSettingTab, Setting } from "obsidian";
import type PersianCalendarPlugin from "../main";
import { g2j } from "./dates";
export class PersianCalendarSettingTab extends PluginSettingTab {
  plugin: PersianCalendarPlugin;

  constructor(app: App, plugin: PersianCalendarPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "⚙️ تنظیمات تقویم فارسی" });

    new Setting(containerEl)
      .setName("پوشه یادداشت‌ها")
      .setDesc("پوشه‌ای که یادداشت‌های روزانه در آن ذخیره می‌شوند")
      .addText((t) =>
        t
          .setPlaceholder("Journal")
          .setValue(this.plugin.settings.noteFolder)
          .onChange(async (v) => {
            this.plugin.settings.noteFolder = v;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("فرمت نام فایل روزانه")
      .setDesc("YYYY=سال، MM=ماه، DD=روز")
      .addText((t) =>
        t
          .setPlaceholder("YYYY-MM-DD")
          .setValue(this.plugin.settings.noteNameFormat)
          .onChange(async (v) => {
            this.plugin.settings.noteNameFormat = v;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl).setName("فرمت نام فایل ماهانه").addText((t) =>
      t
        .setPlaceholder("YYYY-MM")
        .setValue(this.plugin.settings.monthNoteFormat)
        .onChange(async (v) => {
          this.plugin.settings.monthNoteFormat = v;
          await this.plugin.saveSettings();
        }),
    );

    new Setting(containerEl).setName("فرمت نام فایل سالانه").addText((t) =>
      t
        .setPlaceholder("YYYY")
        .setValue(this.plugin.settings.yearNoteFormat)
        .onChange(async (v) => {
          this.plugin.settings.yearNoteFormat = v;
          await this.plugin.saveSettings();
        }),
    );

    new Setting(containerEl)
      .setName("نمایش تعطیلات و مناسبت‌ها")
      .setDesc("دریافت مناسبت‌ها از اینترنت")
      .addToggle((t) =>
        t.setValue(this.plugin.settings.showHolidays).onChange(async (v) => {
          this.plugin.settings.showHolidays = v;
          await this.plugin.saveSettings();
        }),
      );

    containerEl.createEl("h3", { text: "مدیریت کش رویدادها" });

    const cacheInfo = this.plugin.getCacheInfo();

    const cacheInfoDiv = containerEl.createDiv({
      cls: "persian-cal-cache-info",
    });
    cacheInfoDiv.innerHTML = `
            <div style="background: var(--background-secondary); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span>📦 تعداد ماه‌های کش شده:</span>
                    <strong>${cacheInfo.totalMonths} ماه</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span>📅 تاریخ انقضا:</span>
                    <strong>${cacheInfo.expiryDate}</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>💾 حجم کش:</span>
                    <strong>${cacheInfo.size}</strong>
                </div>
            </div>
        `;

    new Setting(containerEl)
      .setName("🔄 آپدیت کش")
      .setDesc("دریافت مجدد رویدادها برای 1 سال گذشته و 2 سال آینده (37 ماه)")
      .addButton((btn) =>
        btn
          .setButtonText("آپدیت کش")
          .setCta()
          .onClick(async () => {
            btn.setButtonText("در حال آپدیت...");
            btn.setDisabled(true);

            const now = new Date();
            const j = g2j(now.getFullYear(), now.getMonth() + 1, now.getDate());

            const success = await this.plugin.updateFullCache(j.jy, j.jm);

            btn.setButtonText(
              success ? "✓ آپدیت شد" : "به‌روزرسانی ناقص؛ دوباره تلاش کنید",
            );
            setTimeout(() => {
              btn.setButtonText("آپدیت کش");
              btn.setDisabled(false);
              this.display();
            }, 2000);
          }),
      );

    new Setting(containerEl)
      .setName("🗑️ پاک کردن کش")
      .setDesc("حذف تمام داده‌های کش شده (برای رفع مشکلات احتمالی)")
      .addButton((btn) =>
        btn
          .setButtonText("پاک کردن")
          .setWarning()
          .onClick(async () => {
            if (confirm("آیا مطمئن هستید که می‌خواهید کش را پاک کنید؟")) {
              await this.plugin.clearCache();
              btn.setButtonText("✓ پاک شد");
              setTimeout(() => {
                btn.setButtonText("پاک کردن");
                this.display();
              }, 2000);
            }
          }),
      );

    containerEl.createEl("h3", { text: "📖 راهنمای سریع" });
    const helpDiv = containerEl.createDiv({ cls: "persian-cal-help" });
    helpDiv.innerHTML = `
            <div class="help-section">
                <h4>نحوه استفاده از عبارات</h4>
                <p><strong>استاتیک:</strong> <code>{تاریخ}</code> → مقدار ثابت</p>
                <p><strong>داینامیک:</strong> <code>{#ساعت}</code> → آپدیت خودکار</p>
            </div>
            
            <div class="help-section">
                <h4>دستورات</h4>
                <ul>
                    <li><code>Ctrl/Cmd + P</code> → جستجوی "راهنمای عبارات"</li>
                    <li><code>Ctrl/Cmd + P</code> → جستجوی "درج تاریخ"</li>
                </ul>
            </div>
            
            <div class="help-section">
                <h4>مثال‌ها</h4>
                <ul>
                    <li><code>{تاریخ_کامل}</code> → ${this.plugin.calculateValue("تاریخ_کامل")}</li>
                    <li><code>{پیشرفت_سال}</code> → ${this.plugin.calculateValue("پیشرفت_سال")}</li>
                    <li><code>{تا_نوروز}</code> → ${this.plugin.calculateValue("تا_نوروز")} روز</li>
                </ul>
            </div>
        `;
  }
}
