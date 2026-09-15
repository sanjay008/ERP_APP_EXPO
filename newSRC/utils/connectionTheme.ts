/** Shared list/detail screen tokens — matches Home (Figma). */
export const LIST_UI = {
  screenPadding: 24,
  cardHeight: 70,
  cardRadius: 5,
  cardBorder: "#EEEEEE",
  cardGap: 12,
  cardPadding: 12,
  iconSize: 46,
  iconRadius: 3,
  iconTextGap: 12,
  listTop: 16,
  headerPaddingV: 16,
  pageBackground: "#FFFFFF",
  /** Fixed ID badge — same on Tasks, Work Orders, Tickets */
  idBoxSize: 46,
  idBoxBg: "#E8EFF5",
  idBoxMinSize: 46,
  surface: "#F7F9FB",
  border: "#EEEEEE",
  borderCard: "#EEEEEE",
  radiusButton: 8,
  radiusSearch: 5,
  radiusAvatar: 3,
  radiusDetailIcon: 3,
  buttonSize: 40,
  avatarSize: 52,
  searchHeight: 48,
  cardPaddingVertical: 12,
  cardPaddingHorizontal: 12,
  detailIconSize: 40,
} as const;

/** @deprecated Use LIST_UI — kept for existing imports. */
export const CONNECTION_UI = LIST_UI;
