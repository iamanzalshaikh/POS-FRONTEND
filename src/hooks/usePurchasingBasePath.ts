import { useLocation } from "react-router-dom";

/** Store-admin vs accountant purchasing routes share the same pages under different prefixes. */
export function usePurchasingBasePath(): string {
  const { pathname } = useLocation();
  return pathname.startsWith("/accountant") ? "/accountant/purchasing" : "/store-admin/purchasing";
}
