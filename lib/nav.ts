/** True when `href` is the current section: "/properties" is active on "/properties/some-slug". */
export function isActivePath(pathname: string, href: string): boolean {
  const target = href.split("#")[0].split("?")[0];
  if (target === "/") return pathname === "/";
  return pathname === target || pathname.startsWith(`${target}/`);
}
