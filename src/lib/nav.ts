import {
  Bell,
  ClipboardList,
  Command,
  Crosshair,
  Gauge,
  LayoutDashboard,
  MapPinned,
  MonitorSmartphone,
  Route,
  UserRoundCog,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
};

export const navItems: NavItem[] = [
  { href: "/", label: "Overview", icon: LayoutDashboard, description: "Fleet status at a glance" },
  { href: "/live", label: "Live Map", icon: MapPinned, description: "Real-time vehicle positions" },
  { href: "/devices", label: "Devices", icon: MonitorSmartphone, description: "Manage vehicles & terminals" },
  { href: "/playback", label: "Playback", icon: Route, description: "Replay historical trips" },
  { href: "/geofences", label: "Geofences", icon: Crosshair, description: "Draw & manage fences" },
  { href: "/alarms", label: "Alarms", icon: Bell, description: "Safety & event alerts" },
  { href: "/reports", label: "Reports", icon: ClipboardList, description: "Mileage, trips, parking" },
  { href: "/commands", label: "Commands", icon: Command, description: "Remote device control" },
  { href: "/diagnostics", label: "Diagnostics", icon: Gauge, description: "Device & OBD health" },
  { href: "/accounts", label: "Accounts", icon: UserRoundCog, description: "Sub-accounts & groups" },
];

export function activeNavItem(pathname: string) {
  // Longest matching prefix wins so /devices doesn't match "/".
  return (
    [...navItems]
      .filter((item) => (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)))
      .sort((a, b) => b.href.length - a.href.length)[0] ?? navItems[0]
  );
}
