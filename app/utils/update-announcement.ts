export type UpdateAnnouncementSection = {
  title: string;
  items: string[];
};

export type UpdateAnnouncementConfig = {
  date: string;
  sections: UpdateAnnouncementSection[];
  note?: string;
};

export type PublicUpdateAnnouncement = UpdateAnnouncementConfig & {
  hash: string;
};

function formatAnnouncementDate(now: Date) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseItems(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(cleanText).filter(Boolean);
}

export function parseUpdateAnnouncementJson(
  value: string | undefined,
  now = new Date(),
): UpdateAnnouncementConfig | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  try {
    const input = JSON.parse(value) as {
      enabled?: boolean;
      date?: unknown;
      sections?: unknown;
      items?: unknown;
      note?: unknown;
    };

    if (input.enabled === false) {
      return undefined;
    }

    const sections = Array.isArray(input.sections)
      ? input.sections
          .map((section) => {
            if (!section || typeof section !== "object") {
              return undefined;
            }

            const source = section as { title?: unknown; items?: unknown };
            const title = cleanText(source.title) || "更新";
            const items = parseItems(source.items);

            return items.length > 0 ? { title, items } : undefined;
          })
          .filter(Boolean)
      : [];

    const rootItems = parseItems(input.items);
    if (rootItems.length > 0) {
      sections.unshift({ title: "更新", items: rootItems });
    }

    if (sections.length === 0) {
      return undefined;
    }

    const note = cleanText(input.note);

    return {
      date: cleanText(input.date) || formatAnnouncementDate(now),
      sections: sections as UpdateAnnouncementSection[],
      ...(note ? { note } : {}),
    };
  } catch (error) {
    console.warn("[Update Announcement] invalid WEBUI_ANNOUNCEMENT_JSON", error);
    return undefined;
  }
}
