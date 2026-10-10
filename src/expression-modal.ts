import { Modal, App } from "obsidian";
import type PersianCalendarPlugin from "../main";
export class ExpressionHelperModal extends Modal {
  plugin: PersianCalendarPlugin;

  constructor(app: App, plugin: PersianCalendarPlugin) {
    super(app);
    this.plugin = plugin;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("persian-expression-modal");

    contentEl.createEl("h2", { text: "📖 راهنمای عبارات" });

    const info = contentEl.createDiv({ cls: "expression-info" });
    info.innerHTML = `
            <p><strong>استاتیک:</strong> <code>{کلمه}</code> → مقدار ثابت در لحظه تایپ</p>
            <p><strong>داینامیک:</strong> <code>{#کلمه}</code> → مقدار زنده و آپدیت خودکار</p>
            <p style="color: var(--text-muted); font-size: 0.85em;">💡 روی هر عبارت کلیک کنید تا کپی شود</p>
        `;

    const categories = [
      {
        name: "⏰ زمان",
        items: [
          { key: "ساعت", desc: "ساعت فارسی" },
          { key: "ساعت_en", desc: "ساعت انگلیسی" },
          { key: "ساعت_۱۲", desc: "ساعت ۱۲ ساعته" },
          { key: "ساعت_عدد", desc: "فقط عدد ساعت" },
          { key: "ساعت_۲رقم", desc: "ساعت دو رقمی" },
          { key: "دقیقه", desc: "دقیقه" },
          { key: "دقیقه_۲رقم", desc: "دقیقه دو رقمی" },
          { key: "ثانیه", desc: "ثانیه" },
          { key: "ثانیه_۲رقم", desc: "ثانیه دو رقمی" },
          { key: "زمان_کوتاه", desc: "HH:MM" },
          { key: "زمان_کامل", desc: "HH:MM:SS" },
          { key: "timestamp", desc: "تایم‌استمپ" },
        ],
      },
      {
        name: "📅 تاریخ شمسی",
        items: [
          { key: "تاریخ", desc: "1404/01/15" },
          { key: "تاریخ_کامل", desc: "شنبه ۱۵ فروردین ۱۴۰۴" },
          { key: "تاریخ_خط_تیره", desc: "1404-01-15" },
          { key: "تاریخ_اسلش", desc: "1404/01/15" },
          { key: "تاریخ_نقطه", desc: "1404.01.15" },
          { key: "تاریخ_حروفی", desc: "۱۵ فروردین ۱۴۰۴" },
          { key: "تاریخ_کوتاه", desc: "15/1" },
          { key: "تاریخ_ساعت", desc: "تاریخ و ساعت" },
        ],
      },
      {
        name: "📆 سال",
        items: [
          { key: "سال", desc: "سال شمسی" },
          { key: "سال_میلادی", desc: "سال میلادی" },
          { key: "سال_قمری", desc: "سال قمری" },
          { key: "سال_کبیسه", desc: "کبیسه بودن" },
          { key: "روز_سال", desc: "روز چندم سال" },
          { key: "روز_باقی_سال", desc: "روز باقی‌مانده" },
          { key: "کل_روز_سال", desc: "کل روزهای سال" },
        ],
      },
      {
        name: "🗓️ ماه",
        items: [
          { key: "ماه", desc: "نام ماه" },
          { key: "نام_ماه_en", desc: "نام انگلیسی" },
          { key: "شماره_ماه", desc: "شماره ماه" },
          { key: "شماره_ماه_۲رقم", desc: "شماره دو رقمی" },
          { key: "ماه_قمری", desc: "ماه قمری" },
          { key: "ماه_میلادی", desc: "ماه میلادی" },
          { key: "روز_ماه", desc: "تعداد روز ماه" },
          { key: "روز_باقی_ماه", desc: "روز باقی‌مانده" },
        ],
      },
      {
        name: "📌 روز",
        items: [
          { key: "روز", desc: "نام روز" },
          { key: "نام_روز_کوتاه", desc: "نام کوتاه" },
          { key: "نام_روز_en", desc: "نام انگلیسی" },
          { key: "شماره_روز", desc: "شماره روز ماه" },
          { key: "شماره_روز_۲رقم", desc: "شماره دو رقمی" },
          { key: "شماره_روز_هفته", desc: "۱ تا ۷" },
          { key: "شماره_روز_سال", desc: "روز چندم سال" },
        ],
      },
      {
        name: "📊 هفته و فصل",
        items: [
          { key: "هفته", desc: "هفته سال" },
          { key: "هفته_ماه", desc: "هفته ماه" },
          { key: "آخر_هفته", desc: "آخر هفته است؟" },
          { key: "روز_کاری", desc: "روز کاری است؟" },
          { key: "فصل", desc: "نام فصل" },
          { key: "شماره_فصل", desc: "۱ تا ۴" },
        ],
      },
      {
        name: "⏳ شمارش معکوس",
        items: [
          { key: "تا_پایان_سال_روز", desc: "روز تا پایان سال" },
          { key: "تا_پایان_ماه_روز", desc: "روز تا پایان ماه" },
          { key: "تا_پایان_هفته_روز", desc: "روز تا جمعه" },
          { key: "تا_پایان_روز_ساعت", desc: "ساعت تا پایان روز" },
          { key: "تا_نوروز", desc: "روز تا نوروز" },
        ],
      },
      {
        name: "📈 درصد و پیشرفت",
        items: [
          { key: "درصد_سال", desc: "درصد گذشته سال" },
          { key: "درصد_ماه", desc: "درصد گذشته ماه" },
          { key: "درصد_روز", desc: "درصد گذشته روز" },
          { key: "پیشرفت_سال", desc: "████░░░░░░ 40%" },
          { key: "پیشرفت_ماه", desc: "نوار پیشرفت ماه" },
          { key: "پیشرفت_روز", desc: "نوار پیشرفت روز" },
        ],
      },
      {
        name: "🎉 مناسبت",
        items: [
          { key: "مناسبت", desc: "مناسبت‌های امروز" },
          { key: "مناسبت_اول", desc: "اولین مناسبت" },
          { key: "تعطیل", desc: "تعطیل است؟" },
          { key: "تعداد_مناسبت", desc: "تعداد" },
          { key: "نوع_روز", desc: "نوع روز" },
        ],
      },
      {
        name: "🌍 میلادی و قمری",
        items: [
          { key: "تاریخ_میلادی", desc: "YYYY/MM/DD" },
          { key: "تاریخ_میلادی_کامل", desc: "تاریخ کامل" },
          { key: "تاریخ_قمری", desc: "YYYY/MM/DD" },
          { key: "تاریخ_قمری_کامل", desc: "حروفی" },
        ],
      },
      {
        name: "😀 Emoji و ترکیبی",
        items: [
          { key: "فصل_emoji", desc: "🌸☀️🍂❄️" },
          { key: "روز_شب_emoji", desc: "🌅☀️🌆🌙" },
          { key: "تعطیل_emoji", desc: "🔴/🟢" },
          { key: "امضا_تاریخ", desc: "📅 تاریخ | ⏰ ساعت" },
          { key: "وضعیت_کامل", desc: "روز + هفته + فصل" },
          { key: "تایمر_روز", desc: "زمان تا پایان روز" },
        ],
      },
    ];

    categories.forEach((cat) => {
      const section = contentEl.createDiv({ cls: "expression-category" });
      section.createEl("h3", { text: cat.name });
      const table = section.createEl("table", { cls: "expression-table" });

      cat.items.forEach((item) => {
        const row = table.createEl("tr");

        const staticCell = row.createEl("td");
        const staticChip = staticCell.createEl("span", {
          cls: "expression-chip static",
          text: `{${item.key}}`,
        });
        staticChip.onclick = () => {
          navigator.clipboard.writeText(`{${item.key}}`);
          staticChip.addClass("copied");
          setTimeout(() => staticChip.removeClass("copied"), 500);
        };

        const dynamicCell = row.createEl("td");
        const dynamicChip = dynamicCell.createEl("span", {
          cls: "expression-chip dynamic",
          text: `{#${item.key}}`,
        });
        dynamicChip.onclick = () => {
          navigator.clipboard.writeText(`{#${item.key}}`);
          dynamicChip.addClass("copied");
          setTimeout(() => dynamicChip.removeClass("copied"), 500);
        };

        const descCell = row.createEl("td", { cls: "desc-cell" });
        descCell.setText(item.desc);

        const previewCell = row.createEl("td", { cls: "preview-cell" });
        const val = this.plugin.calculateValue(item.key);
        previewCell.setText(val !== null ? String(val) : "-");
      });
    });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
