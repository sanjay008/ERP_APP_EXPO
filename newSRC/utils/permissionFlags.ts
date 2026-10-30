/** Same style as tickets: String(permissions?.slug?.action) === "1". Missing = 0. */
export function hasPermission(
  permissions: unknown,
  slug: string,
  action: "create" | "read" | "update" | "delete"
): boolean {
  const module = (permissions as Record<string, Record<string, unknown>> | null | undefined)?.[
    slug
  ];
  return String(module?.[action]) === "1";
}
