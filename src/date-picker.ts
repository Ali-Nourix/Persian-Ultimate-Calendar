import { App, Modal, setIcon } from "obsidian";
import { PERSIAN_MONTHS, WEEK_DAYS, WEEK_DAYS_FULL } from "./constants";
import { j2g, getDaysInJalaliMonth, parseDate, todayJalali } from "./dates";
import { buildResult, dateBounds, isWithinBounds } from "./api";
import type { JalaliDate, PickDateOptions, PickedDateResult } from "./api";

export class DatePickerModal extends Modal {
  private current: JalaliDate;
  private selected: JalaliDate | null;
  private bounds: ReturnType<typeof dateBounds>;
  private grid!: HTMLElement;
  private monthTitle!: HTMLElement;
  private selectButton!: HTMLButtonElement;
  private resolver!: (result: PickedDateResult | null) => void;
  private settled = false;
  readonly result: Promise<PickedDateResult | null>;
  constructor(
    app: App,
    private options: PickDateOptions = {},
  ) {
    super(app);
    this.bounds = dateBounds(options);
    let initial = parseDate(options.initialDate) ?? todayJalali();
    if (!isWithinBounds(initial, this.bounds))
      initial = this.bounds.min ?? this.bounds.max ?? initial;
    this.current = { ...initial };
    this.selected = isWithinBounds(initial, this.bounds) ? initial : null;
    this.result = new Promise((resolve) => {
      this.resolver = resolve;
    });
  }
  onOpen() {
    const root = this.contentEl;
    root.empty();
    root.addClass("persian-date-picker-modal");
    root.dir = "rtl";
    root.createEl("h2", { text: this.options.title ?? "انتخاب تاریخ" });
    const header = root.createDiv({ cls: "persian-cal-header-top" });
    const today = todayJalali();
    const weekday =
      WEEK_DAYS_FULL[(j2g(today.jy, today.jm, today.jd).getDay() + 1) % 7];
    header.createSpan({
      cls: "persian-cal-today-info",
      text: `امروز: ${weekday} ${today.jd} ${PERSIAN_MONTHS[today.jm - 1]}`,
    });
    const todayButton = header.createEl("button", {
      cls: "persian-cal-today-btn",
      text: "برو به امروز",
    });
    todayButton.disabled = !isWithinBounds(today, this.bounds);
    todayButton.onclick = () => {
      this.current = { ...today };
      this.selected = { ...today };
      this.render();
    };
    const controls = root.createDiv({ cls: "persian-cal-controls" });
    const previous = controls.createEl("button", {
      cls: "persian-cal-btn",
      attr: { "aria-label": "ماه قبل" },
    });
    setIcon(previous, "chevron-right");
    previous.onclick = () => this.changeMonth(-1);
    this.monthTitle = controls.createDiv({
      cls: "persian-cal-title",
      attr: { "aria-live": "polite" },
    });
    const next = controls.createEl("button", {
      cls: "persian-cal-btn",
      attr: { "aria-label": "ماه بعد" },
    });
    setIcon(next, "chevron-left");
    next.onclick = () => this.changeMonth(1);
    const week = root.createDiv({ cls: "persian-cal-weekdays" });
    WEEK_DAYS.forEach((day, i) =>
      week.createDiv({ text: day, cls: i === 6 ? "is-friday" : "" }),
    );
    this.grid = root.createDiv({
      cls: "persian-cal-grid",
      attr: { "aria-label": "روزهای ماه" },
    });
    const buttons = root.createDiv({ cls: "modal-button-container" });
    const cancel = buttons.createEl("button", { text: "لغو" });
    cancel.onclick = () => this.close();
    this.selectButton = buttons.createEl("button", {
      text: "انتخاب",
      cls: "mod-cta",
    });
    this.selectButton.onclick = () => this.confirm();
    this.render();
  }
  private changeMonth(delta: number) {
    const index = this.current.jy * 12 + this.current.jm - 1 + delta;
    const year = Math.floor(index / 12);
    if (year < 1 || year > 3177) return;
    this.current = { jy: year, jm: (index % 12) + 1, jd: 1 };
    this.render();
  }
  private render() {
    this.monthTitle.textContent = `${PERSIAN_MONTHS[this.current.jm - 1]} ${this.current.jy}`;
    this.grid.empty();
    const first = j2g(this.current.jy, this.current.jm, 1);
    const offset = (first.getDay() + 1) % 7;
    const today = todayJalali();
    for (let i = 0; i < offset; i++)
      this.grid.createDiv({
        cls: "persian-cal-day empty",
        attr: { "aria-hidden": "true" },
      });
    for (
      let day = 1;
      day <= getDaysInJalaliMonth(this.current.jy, this.current.jm);
      day++
    ) {
      const date = { ...this.current, jd: day };
      const selected =
        this.selected?.jy === date.jy &&
        this.selected?.jm === date.jm &&
        this.selected?.jd === day;
      const cell = this.grid.createEl("button", {
        cls: "persian-cal-day",
        text: String(day),
        attr: {
          "aria-label": `${day} ${PERSIAN_MONTHS[date.jm - 1]} ${date.jy}`,
          "aria-pressed": String(selected),
        },
      });
      cell.disabled = !isWithinBounds(date, this.bounds);
      if (selected) cell.addClass("is-selected");
      if (today.jy === date.jy && today.jm === date.jm && today.jd === day)
        cell.addClass("is-today");
      if ((offset + day - 1) % 7 === 6) cell.addClass("is-friday");
      cell.onclick = () => {
        this.selected = date;
        this.render();
        (
          this.grid.querySelector('[aria-pressed="true"]') as HTMLElement | null
        )?.focus();
      };
      cell.ondblclick = () => {
        this.selected = date;
        this.confirm();
      };
    }
    this.selectButton.disabled = !this.selected;
  }
  private confirm() {
    if (!this.selected || !isWithinBounds(this.selected, this.bounds)) return;
    this.finish(buildResult(this.selected, this.options));
    this.close();
  }
  private finish(value: PickedDateResult | null) {
    if (this.settled) return;
    this.settled = true;
    this.resolver(value);
  }
  onClose() {
    this.finish(null);
    this.contentEl.empty();
  }
}
