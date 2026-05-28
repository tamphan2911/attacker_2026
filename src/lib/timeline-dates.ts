import type { Locale } from "@/types/site";

export interface TimelineDateRange {
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
}

export const timelineTimePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export function normalizeTimelineTime(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed && timelineTimePattern.test(trimmed) ? trimmed : undefined;
}

function buildVietnamDateTime(date: string, time: string, milliseconds = 0) {
  const timeWithSeconds = time.length === 5 ? `${time}:00` : time;
  return new Date(`${date}T${timeWithSeconds}.${String(milliseconds).padStart(3, "0")}+07:00`);
}

export function getTimelineStartDateTime(item: TimelineDateRange) {
  return buildVietnamDateTime(item.startDate, normalizeTimelineTime(item.startTime) ?? "00:00:00", 0);
}

export function getTimelineEndDateTime(item: TimelineDateRange) {
  return buildVietnamDateTime(item.endDate, normalizeTimelineTime(item.endTime) ?? "23:59:59", 999);
}

export function compareTimelineDateRanges(left: TimelineDateRange, right: TimelineDateRange) {
  const startDifference = getTimelineStartDateTime(left).getTime() - getTimelineStartDateTime(right).getTime();
  if (startDifference !== 0) {
    return startDifference;
  }

  return getTimelineEndDateTime(left).getTime() - getTimelineEndDateTime(right).getTime();
}

function formatTimeLabel(time: string) {
  return time;
}

function formatDateWithOptionalTime(locale: Locale, date: string, time?: string) {
  const formattedDate = new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(`${date}T00:00:00+07:00`));
  const normalizedTime = normalizeTimelineTime(time);

  return normalizedTime ? `${formattedDate}, ${formatTimeLabel(normalizedTime)}` : formattedDate;
}

export function formatTimelineDateRangeLabel(
  locale: Locale,
  startDate: string,
  endDate: string,
  startTime?: string,
  endTime?: string,
) {
  const normalizedStartTime = normalizeTimelineTime(startTime);
  const normalizedEndTime = normalizeTimelineTime(endTime);

  if (startDate === endDate) {
    const formattedDate = formatDateWithOptionalTime(locale, startDate);

    if (normalizedStartTime && normalizedEndTime) {
      return normalizedStartTime === normalizedEndTime
        ? `${formattedDate}, ${normalizedStartTime}`
        : `${formattedDate}, ${normalizedStartTime} - ${normalizedEndTime}`;
    }

    if (normalizedStartTime) {
      return locale === "vi"
        ? `${formattedDate}, từ ${normalizedStartTime}`
        : `${formattedDate}, from ${normalizedStartTime}`;
    }

    if (normalizedEndTime) {
      return locale === "vi"
        ? `${formattedDate}, đến ${normalizedEndTime}`
        : `${formattedDate}, until ${normalizedEndTime}`;
    }

    return formattedDate;
  }

  const formattedStart = formatDateWithOptionalTime(locale, startDate, normalizedStartTime);
  const formattedEnd = formatDateWithOptionalTime(locale, endDate, normalizedEndTime);

  return `${formattedStart} - ${formattedEnd}`;
}
