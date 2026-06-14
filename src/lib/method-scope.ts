/**
 * Tracksolid scopes some methods to an account, but the parameter name differs
 * between method families (`target` vs `account`). This maps method → param name
 * so the proxy route can inject the signed-in account automatically.
 */
export const accountParamByMethod: Record<string, string> = {
  "jimi.user.child.list": "target",
  "jimi.user.device.list": "target",
  "jimi.device.group.list": "target",
  "jimi.user.device.location.list": "target",
  "jimi.open.platform.fence.list": "account",
  "jimi.open.platform.fence.create": "account",
  "jimi.open.platform.fence.delete": "account",
  "jimi.open.platform.fence.duration": "account",
  "jimi.open.platform.report.trips": "account",
  "jimi.open.platform.report.parking": "account",
  "jimi.open.platform.dlt.report": "account",
  "jimi.open.device.rfid.list": "account",
};
