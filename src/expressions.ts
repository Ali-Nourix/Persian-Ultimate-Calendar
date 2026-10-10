import type { CalendarEvent } from "./events";
import * as Dates from "./dates";
const {
  g2j,
  isJalaliLeap,
  g2h,
  getDaysInJalaliMonth,
  getDayOfYear,
  getDaysInJalaliYear,
} = Dates;
import {
  PERSIAN_MONTHS,
  PERSIAN_MONTHS_EN,
  WEEK_DAYS,
  WEEK_DAYS_FULL,
  SEASONS,
  ZODIAC_SIGNS,
  PERSIAN_ZODIAC,
  HIJRI_MONTHS,
} from "./constants";
export function calculateValue(
  keyword: string,
  getTodayEvents: (jy: number, jm: number, jd: number) => CalendarEvent[],
): string | number | null {
  const now = new Date();
  const j = g2j(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const h = g2h(now.getFullYear(), now.getMonth() + 1, now.getDate());

  const isLeap = isJalaliLeap(j.jy);
  const daysInYear = getDaysInJalaliYear(j.jy);
  const daysInMonth = getDaysInJalaliMonth(j.jy, j.jm);
  const dayOfYear = getDayOfYear(j.jy, j.jm, j.jd);

  const dayOfWeek = (now.getDay() + 1) % 7;
  const weekOfYear = Math.ceil(dayOfYear / 7);
  const season = Math.floor((j.jm - 1) / 3);
  const monthInSeason = (j.jm - 1) % 3;
  const dayOfSeason = monthInSeason * (j.jm <= 6 ? 31 : 30) + j.jd;

  const events = getTodayEvents(j.jy, j.jm, j.jd);
  const allEventsStr = events.map((e) => e.title).join(" | ");
  const hasHoliday = events.some((e) => e.isHoliday);

  let daysToNowruz: number;
  if (j.jm === 1 && j.jd === 1) {
    daysToNowruz = 0;
  } else {
    daysToNowruz = daysInYear - dayOfYear + 1;
  }

  switch (keyword) {
    case "ساعت":
      return now.toLocaleTimeString("fa-IR");
    case "ساعت_en":
      return now.toLocaleTimeString("en-US", { hour12: false });
    case "ساعت_۱۲":
      return now.toLocaleTimeString("fa-IR", { hour12: true });
    case "ساعت_عدد":
      return now.getHours();
    case "ساعت_۲رقم":
      return String(now.getHours()).padStart(2, "0");
    case "دقیقه":
      return now.getMinutes();
    case "دقیقه_۲رقم":
      return String(now.getMinutes()).padStart(2, "0");
    case "ثانیه":
      return now.getSeconds();
    case "ثانیه_۲رقم":
      return String(now.getSeconds()).padStart(2, "0");
    case "میلی_ثانیه":
      return now.getMilliseconds();
    case "timestamp":
      return now.getTime();
    case "timestamp_unix":
      return Math.floor(now.getTime() / 1000);
    case "زمان_کوتاه":
      return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    case "زمان_کامل":
      return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
    case "تاریخ_کامل":
      return `${WEEK_DAYS_FULL[dayOfWeek]} ${j.jd} ${PERSIAN_MONTHS[j.jm - 1]} ${j.jy}`;
    case "تاریخ_خط_تیره":
      return `${j.jy}-${String(j.jm).padStart(2, "0")}-${String(j.jd).padStart(2, "0")}`;
    case "تاریخ_اسلش":
    case "تاریخ":
      return `${j.jy}/${String(j.jm).padStart(2, "0")}/${String(j.jd).padStart(2, "0")}`;
    case "تاریخ_نقطه":
      return `${j.jy}.${String(j.jm).padStart(2, "0")}.${String(j.jd).padStart(2, "0")}`;
    case "تاریخ_حروفی":
      return `${j.jd} ${PERSIAN_MONTHS[j.jm - 1]} ${j.jy}`;
    case "تاریخ_کوتاه":
      return `${j.jd}/${j.jm}`;
    case "تاریخ_ساعت":
      return `${j.jy}/${String(j.jm).padStart(2, "0")}/${String(j.jd).padStart(2, "0")} - ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    case "سال":
    case "سال_شمسی":
      return j.jy;
    case "سال_میلادی":
      return now.getFullYear();
    case "سال_قمری":
      return h.hy;
    case "سال_کبیسه":
      return isLeap ? "بله" : "خیر";
    case "سال_کبیسه_میلادی":
      const gy = now.getFullYear();
      return (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? "بله" : "خیر";
    case "روز_سال":
      return dayOfYear;
    case "روز_باقی_سال":
      return daysInYear - dayOfYear;
    case "کل_روز_سال":
      return daysInYear;
    case "ماه":
    case "نام_ماه":
      return PERSIAN_MONTHS[j.jm - 1];
    case "نام_ماه_en":
      return PERSIAN_MONTHS_EN[j.jm - 1];
    case "شماره_ماه":
      return j.jm;
    case "شماره_ماه_۲رقم":
      return String(j.jm).padStart(2, "0");
    case "ماه_قمری":
    case "نام_ماه_قمری":
      return HIJRI_MONTHS[h.hm - 1];
    case "شماره_ماه_قمری":
      return h.hm;
    case "ماه_میلادی":
    case "نام_ماه_میلادی":
      return now.toLocaleDateString("en-US", { month: "long" });
    case "شماره_ماه_میلادی":
      return now.getMonth() + 1;
    case "روز_ماه":
    case "تعداد_روز_ماه":
      return daysInMonth;
    case "روز_باقی_ماه":
      return daysInMonth - j.jd;
    case "روز":
    case "نام_روز":
      return WEEK_DAYS_FULL[dayOfWeek];
    case "نام_روز_کوتاه":
      return WEEK_DAYS[dayOfWeek];
    case "نام_روز_en":
      return now.toLocaleDateString("en-US", { weekday: "long" });
    case "شماره_روز":
      return j.jd;
    case "شماره_روز_۲رقم":
      return String(j.jd).padStart(2, "0");
    case "شماره_روز_هفته":
      return dayOfWeek + 1;
    case "شماره_روز_میلادی":
      return now.getDate();
    case "شماره_روز_قمری":
      return h.hd;
    case "شماره_روز_سال":
      return dayOfYear;
    case "هفته":
    case "هفته_سال":
      return weekOfYear;
    case "هفته_ماه":
      return Math.ceil(j.jd / 7);
    case "آخر_هفته":
      return dayOfWeek === 5 || dayOfWeek === 6 ? "بله" : "خیر";
    case "روز_کاری":
      return dayOfWeek >= 0 && dayOfWeek <= 4 ? "بله" : "خیر";
    case "روز_باقی_هفته":
      return 6 - dayOfWeek;
    case "فصل":
      return SEASONS[season];
    case "شماره_فصل":
      return season + 1;
    case "روز_فصل":
      return dayOfSeason;
    case "روز_باقی_فصل":
      const totalDaysInSeason =
        j.jm <= 6 ? 93 : j.jm <= 9 ? 93 : isLeap ? 90 : 89;
      return totalDaysInSeason - dayOfSeason;
    case "برج":
      return ZODIAC_SIGNS[j.jm - 1];
    case "برج_فارسی":
      return PERSIAN_ZODIAC[j.jm - 1];
    case "تا_پایان_سال_روز":
    case "تا_آخر_سال_روز":
      return daysInYear - dayOfYear;
    case "تا_پایان_سال_هفته":
    case "تا_آخر_سال_هفته":
      return Math.floor((daysInYear - dayOfYear) / 7);
    case "تا_پایان_سال_ماه":
    case "تا_آخر_سال_ماه":
      return 12 - j.jm;
    case "تا_پایان_ماه_روز":
    case "تا_آخر_ماه_روز":
      return daysInMonth - j.jd;
    case "تا_پایان_ماه_ساعت":
    case "تا_آخر_ماه_ساعت":
      return (daysInMonth - j.jd) * 24 + (24 - now.getHours());
    case "تا_پایان_هفته_روز":
    case "تا_آخر_هفته_روز":
      return 6 - dayOfWeek;
    case "تا_پایان_روز_ساعت":
      return 24 - now.getHours();
    case "تا_پایان_روز_دقیقه":
      return (24 - now.getHours()) * 60 - now.getMinutes();
    case "تا_نوروز":
    case "تا_نوروز_روز":
      return daysToNowruz;
    case "تا_نوروز_هفته":
      return Math.floor(daysToNowruz / 7);
    case "از_آغاز_سال_روز":
    case "از_اول_سال_روز":
      return dayOfYear;
    case "از_آغاز_سال_هفته":
    case "از_اول_سال_هفته":
      return Math.floor(dayOfYear / 7);
    case "از_آغاز_ماه_روز":
    case "از_اول_ماه_روز":
      return j.jd;
    case "از_آغاز_فصل_روز":
    case "از_اول_فصل_روز":
      return dayOfSeason;
    case "از_آغاز_روز_ساعت":
      return now.getHours();
    case "از_آغاز_روز_دقیقه":
      return now.getHours() * 60 + now.getMinutes();
    case "درصد_سال":
      return `${((dayOfYear / daysInYear) * 100).toFixed(1)}%`;
    case "درصد_سال_عدد":
      return ((dayOfYear / daysInYear) * 100).toFixed(1);
    case "درصد_ماه":
      return `${((j.jd / daysInMonth) * 100).toFixed(1)}%`;
    case "درصد_ماه_عدد":
      return ((j.jd / daysInMonth) * 100).toFixed(1);
    case "درصد_هفته":
      return `${(((dayOfWeek + 1) / 7) * 100).toFixed(1)}%`;
    case "درصد_هفته_عدد":
      return (((dayOfWeek + 1) / 7) * 100).toFixed(1);
    case "درصد_فصل":
      const seasonTotal = j.jm <= 6 ? 93 : j.jm <= 9 ? 93 : isLeap ? 90 : 89;
      return `${((dayOfSeason / seasonTotal) * 100).toFixed(1)}%`;
    case "درصد_روز":
      const minutesPassed = now.getHours() * 60 + now.getMinutes();
      return `${((minutesPassed / 1440) * 100).toFixed(1)}%`;
    case "درصد_روز_عدد":
      const minPassed = now.getHours() * 60 + now.getMinutes();
      return ((minPassed / 1440) * 100).toFixed(1);
    case "پیشرفت_سال":
      return createProgressBar(dayOfYear / daysInYear);
    case "پیشرفت_ماه":
      return createProgressBar(j.jd / daysInMonth);
    case "پیشرفت_هفته":
      return createProgressBar((dayOfWeek + 1) / 7);
    case "پیشرفت_فصل":
      const seasonDays = j.jm <= 6 ? 93 : j.jm <= 9 ? 93 : isLeap ? 90 : 89;
      return createProgressBar(dayOfSeason / seasonDays);
    case "پیشرفت_روز":
      const dayMinutes = now.getHours() * 60 + now.getMinutes();
      return createProgressBar(dayMinutes / 1440);
    case "مناسبت":
    case "مناسبت_امروز":
      return allEventsStr || "بدون مناسبت";
    case "مناسبت_اول":
      return events.length > 0 ? events[0].title : "بدون مناسبت";
    case "تعطیل":
    case "تعطیل_امروز":
      return hasHoliday || dayOfWeek === 6 ? "بله" : "خیر";
    case "تعداد_مناسبت":
      return events.length;
    case "نوع_روز":
      if (dayOfWeek === 6) return "جمعه";
      if (dayOfWeek === 5) return "پنجشنبه";
      if (hasHoliday) return "تعطیل رسمی";
      return "روز کاری";
    case "تاریخ_میلادی":
      return `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")}`;
    case "تاریخ_میلادی_کامل":
      return now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    case "تاریخ_میلادی_حروفی":
      return `${now.getDate()} ${now.toLocaleDateString("en-US", { month: "long" })} ${now.getFullYear()}`;
    case "تاریخ_قمری":
      return `${h.hy}/${String(h.hm).padStart(2, "0")}/${String(h.hd).padStart(2, "0")}`;
    case "تاریخ_قمری_کامل":
      return `${h.hd} ${HIJRI_MONTHS[h.hm - 1]} ${h.hy}`;
    case "تاریخ_قمری_حروفی":
      return `${h.hd} ${HIJRI_MONTHS[h.hm - 1]} ${h.hy} هجری قمری`;
    case "نیم_سال":
      return j.jm <= 6 ? "اول" : "دوم";
    case "سه_ماهه":
    case "فصل_مالی":
      return `Q${Math.ceil(j.jm / 3)}`;
    case "دهه_ماه":
      return j.jd <= 10 ? "اول" : j.jd <= 20 ? "دوم" : "سوم";
    case "قرن_شمسی":
      return Math.ceil(j.jy / 100);
    case "دهه_شمسی":
      return Math.floor(j.jy / 10) * 10 + "ها";
    case "قرن_میلادی":
      return Math.ceil(now.getFullYear() / 100);
    case "فصل_emoji":
      const seasonEmojis = ["🌸", "☀️", "🍂", "❄️"];
      return seasonEmojis[season];
    case "روز_شب_emoji":
      const hour = now.getHours();
      if (hour >= 5 && hour < 12) return "🌅";
      if (hour >= 12 && hour < 17) return "☀️";
      if (hour >= 17 && hour < 20) return "🌆";
      return "🌙";
    case "ماه_emoji":
      const monthEmojis = [
        "🌷",
        "🌺",
        "🌻",
        "🌞",
        "🍇",
        "🍂",
        "🍁",
        "🌧️",
        "❄️",
        "⛄",
        "🌨️",
        "🌸",
      ];
      return monthEmojis[j.jm - 1];
    case "روز_هفته_emoji":
      const dayEmojis = ["📅", "📆", "📋", "📊", "📈", "🎉", "🕌"];
      return dayEmojis[dayOfWeek];
    case "تعطیل_emoji":
      return hasHoliday || dayOfWeek === 6 ? "🔴" : "🟢";
    case "امضا_تاریخ":
      return `📅 ${j.jd} ${PERSIAN_MONTHS[j.jm - 1]} ${j.jy} | ⏰ ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    case "وضعیت_کامل":
      return `${WEEK_DAYS_FULL[dayOfWeek]} ${j.jd} ${PERSIAN_MONTHS[j.jm - 1]} | هفته ${weekOfYear} | ${SEASONS[season]}`;
    case "تایمر_روز":
      const remaining = (24 - now.getHours()) * 60 - now.getMinutes();
      const rHours = Math.floor(remaining / 60);
      const rMins = remaining % 60;
      return `${rHours}:${String(rMins).padStart(2, "0")} تا پایان روز`;

    default:
      return null;
  }
}

function createProgressBar(percentage: number): string {
  const filled = Math.round(percentage * 10);
  const empty = 10 - filled;
  return (
    "█".repeat(filled) +
    "░".repeat(empty) +
    ` ${(percentage * 100).toFixed(0)}%`
  );
}
