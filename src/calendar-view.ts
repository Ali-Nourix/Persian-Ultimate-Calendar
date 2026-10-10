import {
  ItemView,
  WorkspaceLeaf,
  TFile,
  normalizePath,
  setIcon,
  Notice,
} from "obsidian";
import type PersianCalendarPlugin from "../main";
import {
  VIEW_TYPE_CALENDAR,
  PERSIAN_MONTHS,
  WEEK_DAYS,
  WEEK_DAYS_FULL,
  SEASONS,
} from "./constants";
import { g2j, j2g, getDaysInJalaliMonth, g2h } from "./dates";
export class CalendarView extends ItemView {
  plugin: PersianCalendarPlugin;
  currentYear: number;
  currentMonth: number;
  selectedDay: { y: number; m: number; d: number } | null = null;
  private gridEl: HTMLElement | null = null;
  private footerEl: HTMLElement | null = null;
  private dayCells: Map<number, HTMLElement> = new Map();

  constructor(leaf: WorkspaceLeaf, plugin: PersianCalendarPlugin) {
    super(leaf);
    this.plugin = plugin;
    const today = new Date();
    const j = g2j(today.getFullYear(), today.getMonth() + 1, today.getDate());
    this.currentYear = j.jy;
    this.currentMonth = j.jm;
    this.selectedDay = { y: j.jy, m: j.jm, d: j.jd };
  }

  getViewType() {
    return VIEW_TYPE_CALENDAR;
  }
  getDisplayText() {
    return "تقویم هوشمند";
  }
  getIcon() {
    return "calendar-days";
  }

  async onOpen() {
    await this.plugin.fetchMonthEvents(this.currentYear, this.currentMonth);
    this.renderFull();
  }
  async renderFull() {
    const container = this.contentEl;
    container.empty();
    this.dayCells.clear();

    const wrapper = container.createDiv({ cls: "persian-cal-container" });

    const today = new Date();
    const jToday = g2j(
      today.getFullYear(),
      today.getMonth() + 1,
      today.getDate(),
    );
    const topHeader = wrapper.createDiv({ cls: "persian-cal-header-top" });
    const todayInfo = topHeader.createSpan({ cls: "persian-cal-today-info" });
    todayInfo.textContent = `امروز: ${WEEK_DAYS_FULL[(today.getDay() + 1) % 7]} ${jToday.jd} ${PERSIAN_MONTHS[jToday.jm - 1]}`;

    const todayBtn = topHeader.createEl("button", {
      cls: "persian-cal-today-btn",
      text: "برو به امروز",
    });
    todayBtn.onclick = async () => {
      this.currentYear = jToday.jy;
      this.currentMonth = jToday.jm;
      this.selectedDay = { y: jToday.jy, m: jToday.jm, d: jToday.jd };
      await this.plugin.fetchMonthEvents(this.currentYear, this.currentMonth);
      this.renderFull();
    };
    const controls = wrapper.createDiv({ cls: "persian-cal-controls" });

    const prevBtn = controls.createEl("button", { cls: "persian-cal-btn" });
    setIcon(prevBtn, "chevron-right");
    prevBtn.onclick = () => this.changeMonth(-1);

    const titleBox = controls.createDiv({ cls: "persian-cal-title" });
    const monthSpan = titleBox.createSpan({
      cls: "persian-cal-title-part persian-cal-title-month",
      text: PERSIAN_MONTHS[this.currentMonth - 1],
    });
    monthSpan.onclick = () =>
      this.openNote(this.currentYear, this.currentMonth, null);

    const yearSpan = titleBox.createSpan({
      cls: "persian-cal-title-part persian-cal-title-year",
      text: String(this.currentYear),
    });
    yearSpan.onclick = () => this.openNote(this.currentYear, null, null);

    const nextBtn = controls.createEl("button", { cls: "persian-cal-btn" });
    setIcon(nextBtn, "chevron-left");
    nextBtn.onclick = () => this.changeMonth(1);
    const weekHeader = wrapper.createDiv({ cls: "persian-cal-weekdays" });
    WEEK_DAYS.forEach((d, idx) => {
      const dayEl = weekHeader.createDiv({ text: d });
      if (idx === 6) dayEl.addClass("is-friday");
    });
    this.gridEl = wrapper.createDiv({ cls: "persian-cal-grid" });
    this.renderGrid(jToday);
    this.footerEl = wrapper.createDiv({ cls: "persian-cal-footer" });
    this.updateFooter();
    const infoBox = wrapper.createDiv({ cls: "persian-cal-info-box" });
    const h = g2h(today.getFullYear(), today.getMonth() + 1, today.getDate());
    infoBox.innerHTML = `
            <div class="info-row"><span>📅 میلادی:</span> <span>${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, "0")}/${String(today.getDate()).padStart(2, "0")}</span></div>
            <div class="info-row"><span>🌙 قمری:</span> <span>${h.hy}/${String(h.hm).padStart(2, "0")}/${String(h.hd).padStart(2, "0")}</span></div>
            <div class="info-row"><span>🌸 فصل:</span> <span>${SEASONS[Math.floor((jToday.jm - 1) / 3)]}</span></div>
        `;
  }
  private renderGrid(jToday: { jy: number; jm: number; jd: number }) {
    if (!this.gridEl) return;

    this.gridEl.empty();
    this.dayCells.clear();

    const gOfFirstJ = j2g(this.currentYear, this.currentMonth, 1);
    let startDayOfWeek = (gOfFirstJ.getDay() + 1) % 7;
    const daysInMonth = getDaysInJalaliMonth(
      this.currentYear,
      this.currentMonth,
    );

    const monthEvents = this.plugin.getMonthEvents(
      this.currentYear,
      this.currentMonth,
    );
    for (let i = 0; i < startDayOfWeek; i++) {
      this.gridEl.createDiv({ cls: "persian-cal-day empty" });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const cell = this.gridEl.createEl("button", {
        cls: "persian-cal-day",
        attr: {
          "aria-label": `${d} ${PERSIAN_MONTHS[this.currentMonth - 1]} ${this.currentYear}`,
        },
      });
      this.dayCells.set(d, cell);

      const dayEvents = monthEvents[d] || [];
      const hasHoliday = dayEvents.some((e) => e.isHoliday);
      const currentGridIndex = startDayOfWeek + (d - 1);
      const isFriday = currentGridIndex % 7 === 6;
      if (
        this.currentYear === jToday.jy &&
        this.currentMonth === jToday.jm &&
        d === jToday.jd
      ) {
        cell.addClass("is-today");
      }
      if (
        this.selectedDay &&
        this.selectedDay.y === this.currentYear &&
        this.selectedDay.m === this.currentMonth &&
        this.selectedDay.d === d
      ) {
        cell.addClass("is-selected");
      }
      if (isFriday || hasHoliday) {
        cell.addClass("is-holiday");
      }
      if (dayEvents.length > 0) {
        cell.addClass("has-event");
      }

      cell.createDiv({ cls: "persian-cal-day-main", text: String(d) });

      const gDate = new Date(gOfFirstJ);
      gDate.setDate(gOfFirstJ.getDate() + (d - 1));
      cell.createDiv({
        cls: "persian-cal-day-secondary",
        text: String(gDate.getDate()),
      });

      const dot = cell.createDiv({ cls: "event-dot" });
      if (hasHoliday) dot.addClass("holiday-dot");
      const dayNum = d;
      cell.onclick = () => {
        this.selectDay(dayNum);
      };

      cell.ondblclick = () => {
        void this.openNote(this.currentYear, this.currentMonth, dayNum).catch(
          () => new Notice("ساخت یادداشت ناموفق بود؛ مسیر را بررسی کنید."),
        );
      };

      if (dayEvents.length > 0) {
        cell.setAttribute("title", dayEvents.map((e) => e.title).join("\n"));
      }
    }
  }
  private selectDay(day: number) {
    if (
      this.selectedDay &&
      this.selectedDay.y === this.currentYear &&
      this.selectedDay.m === this.currentMonth
    ) {
      const prevCell = this.dayCells.get(this.selectedDay.d);
      if (prevCell) {
        prevCell.removeClass("is-selected");
      }
    }
    this.selectedDay = { y: this.currentYear, m: this.currentMonth, d: day };
    const newCell = this.dayCells.get(day);
    if (newCell) {
      newCell.addClass("is-selected");
    }
    this.updateFooter();
  }
  private updateFooter() {
    if (!this.footerEl) return;

    this.footerEl.empty();

    if (
      this.selectedDay &&
      this.selectedDay.y === this.currentYear &&
      this.selectedDay.m === this.currentMonth
    ) {
      const monthEvents = this.plugin.getMonthEvents(
        this.currentYear,
        this.currentMonth,
      );
      const selDayEvents = monthEvents[this.selectedDay.d] || [];

      if (selDayEvents.length > 0) {
        const eventsList = this.footerEl.createDiv({
          cls: "persian-cal-events-list",
        });
        selDayEvents.forEach((evt) => {
          const evtEl = eventsList.createDiv({ cls: "persian-cal-event-item" });
          if (evt.isHoliday) evtEl.addClass("is-holiday-event");
          evtEl.setText(evt.title);
        });
      } else {
        this.footerEl.createDiv({
          cls: "persian-cal-no-event",
          text: "رویدادی برای این روز ثبت نشده",
        });
      }

      const noteBtn = this.footerEl.createEl("button", {
        cls: "persian-cal-note-btn",
        text: "📝 یادداشت روزانه",
      });
      noteBtn.onclick = () =>
        this.openNote(this.currentYear, this.currentMonth, this.selectedDay!.d);
    } else {
      this.footerEl.createDiv({
        cls: "persian-cal-no-event",
        text: "روزی را انتخاب کنید",
      });
    }
  }

  async changeMonth(delta: number) {
    this.currentMonth += delta;
    if (this.currentMonth > 12) {
      this.currentMonth = 1;
      this.currentYear++;
    } else if (this.currentMonth < 1) {
      this.currentMonth = 12;
      this.currentYear--;
    }
    await this.plugin.fetchMonthEvents(this.currentYear, this.currentMonth);
    this.renderFull();
  }

  async openNote(y: number, m: number | null, d: number | null) {
    const { noteFolder, noteNameFormat, monthNoteFormat, yearNoteFormat } =
      this.plugin.settings;
    let fileName = "",
      dateStr = "",
      templateContent = "";

    if (d !== null && m !== null) {
      const mStr = String(m).padStart(2, "0");
      const dStr = String(d).padStart(2, "0");
      fileName = noteNameFormat
        .replace(/YYYY/g, String(y))
        .replace(/MM/g, mStr)
        .replace(/DD/g, dStr);
      dateStr = `${y}/${mStr}/${dStr}`;
      const gDate = j2g(y, m, d);
      const weekDay = WEEK_DAYS_FULL[(gDate.getDay() + 1) % 7];
      templateContent = `---
date: ${dateStr}
gregorian: ${gDate.getFullYear()}/${String(gDate.getMonth() + 1).padStart(2, "0")}/${String(gDate.getDate()).padStart(2, "0")}
weekday: ${weekDay}
month: ${PERSIAN_MONTHS[m - 1]}
season: ${SEASONS[Math.floor((m - 1) / 3)]}
tags: [daily-note]
---

# ${weekDay} ${d} ${PERSIAN_MONTHS[m - 1]} ${y}

## 📝 یادداشت‌ها

## ✅ کارها

## 💡 ایده‌ها

`;
    } else if (m !== null) {
      const mStr = String(m).padStart(2, "0");
      fileName = monthNoteFormat
        .replace(/YYYY/g, String(y))
        .replace(/MM/g, mStr);
      dateStr = `${y}/${mStr}`;
      templateContent = `---
date: ${dateStr}
month: ${PERSIAN_MONTHS[m - 1]}
year: ${y}
season: ${SEASONS[Math.floor((m - 1) / 3)]}
tags: [monthly-note]
---

# ${PERSIAN_MONTHS[m - 1]} ${y}

## 🎯 اهداف ماه

## 📊 خلاصه

`;
    } else {
      fileName = yearNoteFormat.replace(/YYYY/g, String(y));
      dateStr = `${y}`;
      templateContent = `---
date: ${dateStr}
year: ${y}
tags: [yearly-note]
---

# سال ${y}

## 🎯 اهداف سال

## 📊 خلاصه سال

`;
    }

    const folderPath = normalizePath(noteFolder.trim() || "Journal");
    if (
      folderPath.split("/").includes("..") ||
      fileName.includes("/") ||
      fileName.includes("\\") ||
      !fileName.trim()
    ) {
      new Notice("پوشه یا نام فایل نامعتبر است.");
      return;
    }
    if (!(await this.plugin.app.vault.adapter.exists(folderPath))) {
      await this.plugin.app.vault.createFolder(folderPath);
    }

    const filePath = normalizePath(`${folderPath}/${fileName}.md`);
    let file = this.plugin.app.vault.getAbstractFileByPath(filePath);

    if (!file) {
      file = await this.plugin.app.vault.create(filePath, templateContent);
    }

    if (file instanceof TFile) {
      await this.plugin.app.workspace.getLeaf(false).openFile(file);
    }
  }
}
