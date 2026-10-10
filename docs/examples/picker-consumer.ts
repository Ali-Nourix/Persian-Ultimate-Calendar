import { Plugin, MarkdownView, Notice } from "obsidian";
import type { CalendarPluginApi } from "../../src/api";

/** Example consumer; isolate Obsidian's internal registry behind one adapter. */
function getCalendarApi(app: Plugin["app"]): CalendarPluginApi | undefined {
  const host = app as unknown as {
    plugins?: { plugins?: Record<string, { api?: CalendarPluginApi }> };
  };
  return host.plugins?.plugins?.["persian-ultimate-calendar"]?.api;
}

export default class CalendarConsumerExample extends Plugin {
  onload(): void {
    this.addCommand({
      id: "insert-picked-jalali-date",
      name: "درج تاریخ از تقویم فارسی",
      editorCallback: async (editor) => {
        const api = getCalendarApi(this.app);
        if (!api || typeof api.pickDate !== "function") {
          new Notice("پلاگین Persian Ultimate Calendar را نصب و فعال کنید.");
          return;
        }
        try {
          const result = await api.pickDate({
            title: "تاریخ یادداشت را انتخاب کنید",
            outputFormat: "moment-format",
            format: "jYYYY/jMM/jDD",
          });
          if (!result) return; // Cancellation is normal; do not insert "null".
          const current = this.app.workspace.getActiveViewOfType(MarkdownView);
          if (current?.editor !== editor) {
            new Notice("یادداشت فعال تغییر کرده است؛ درج تاریخ لغو شد.");
            return;
          }
          if (typeof result.value === "string")
            editor.replaceSelection(result.value);
        } catch {
          // Defensive guard for older/future implementations of the provider.
          new Notice("انتخاب تاریخ ناموفق بود.");
        }
      },
    });
  }
}
