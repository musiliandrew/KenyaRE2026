import type { UserRole } from "@/contexts/AuthContext";

export interface RolePermissions {
  canPricePolicies: boolean;
  canViewEP: boolean;
  canViewVulnerability: boolean;
  canViewModelParams: boolean;
  canViewMap: boolean;
  canViewHotspots: boolean;
  canRunStressTests: boolean;
  canSetSublimits: boolean;
  canAuditDrainage: boolean;
  canViewTreaty: boolean;
  canExportBrief: boolean;
  canViewAllAssumptions: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  underwriter: {
    canPricePolicies: true,
    canViewEP: true,
    canViewVulnerability: true,
    canViewModelParams: true,
    canViewMap: true,
    canViewHotspots: true,
    canRunStressTests: false,
    canSetSublimits: false,
    canAuditDrainage: false,
    canViewTreaty: false,
    canExportBrief: true,
    canViewAllAssumptions: true,
  },
  risk_analyst: {
    canPricePolicies: false,
    canViewEP: true,
    canViewVulnerability: true,
    canViewModelParams: true,
    canViewMap: true,
    canViewHotspots: true,
    canRunStressTests: true,
    canSetSublimits: false,
    canAuditDrainage: true,
    canViewTreaty: false,
    canExportBrief: true,
    canViewAllAssumptions: true,
  },
  portfolio_manager: {
    canPricePolicies: false,
    canViewEP: true,
    canViewVulnerability: true,
    canViewModelParams: true,
    canViewMap: true,
    canViewHotspots: true,
    canRunStressTests: true,
    canSetSublimits: true,
    canAuditDrainage: false,
    canViewTreaty: false,
    canExportBrief: true,
    canViewAllAssumptions: true,
  },
  county_disaster: {
    canPricePolicies: false,
    canViewEP: false,
    canViewVulnerability: false,
    canViewModelParams: false,
    canViewMap: true,
    canViewHotspots: true,
    canRunStressTests: false,
    canSetSublimits: false,
    canAuditDrainage: true,
    canViewTreaty: false,
    canExportBrief: false,
    canViewAllAssumptions: false,
  },
  cedant_broker: {
    canPricePolicies: false,
    canViewEP: true,
    canViewVulnerability: false,
    canViewModelParams: false,
    canViewMap: true,
    canViewHotspots: false,
    canRunStressTests: true,
    canSetSublimits: false,
    canAuditDrainage: true,
    canViewTreaty: true,
    canExportBrief: true,
    canViewAllAssumptions: true,
  },
  judge: {
    canPricePolicies: true,
    canViewEP: true,
    canViewVulnerability: true,
    canViewModelParams: true,
    canViewMap: true,
    canViewHotspots: true,
    canRunStressTests: true,
    canSetSublimits: true,
    canAuditDrainage: true,
    canViewTreaty: true,
    canExportBrief: true,
    canViewAllAssumptions: true,
  },
  guest: {
    canPricePolicies: true,
    canViewEP: true,
    canViewVulnerability: true,
    canViewModelParams: true,
    canViewMap: true,
    canViewHotspots: true,
    canRunStressTests: true,
    canSetSublimits: true,
    canAuditDrainage: true,
    canViewTreaty: true,
    canExportBrief: true,
    canViewAllAssumptions: true,
  },
};

export function hasPermission(role: UserRole, permission: keyof RolePermissions): boolean {
  return ROLE_PERMISSIONS[role][permission];
}

export function getFilteredMenuItems(role: UserRole) {
  const permissions = ROLE_PERMISSIONS[role];
  return {
    underwriter: [
      { label: "Price Policy (AI NLP)", action: "policy", enabled: permissions.canPricePolicies },
      { label: "Single Risk Lookup", action: "lookup", enabled: permissions.canViewMap },
      { label: "Rate & Deductible Calc", action: "rate", enabled: permissions.canPricePolicies },
    ],
    risk_analyst: [
      { label: "Exceedance Curve (EP)", action: "ep", enabled: permissions.canViewEP },
      { label: "JRC Vulnerability S-Curves", action: "vuln", enabled: permissions.canViewVulnerability },
      { label: "AAL & Model Parameters", action: "params", enabled: permissions.canViewModelParams },
      { label: "DEM vs AI Model Variance", action: "compare", enabled: permissions.canAuditDrainage },
    ],
    portfolio_manager: [
      { label: "3D Spatial Accumulation", action: "map", enabled: permissions.canViewMap },
      { label: "1-in-100 Yr PML Stress Test", action: "stress", enabled: permissions.canRunStressTests },
      { label: "Informal Stock Sub-Limits", action: "sublimit", enabled: permissions.canSetSublimits },
      { label: "Permanent Masonry Assets", action: "masonry", enabled: permissions.canViewMap },
    ],
    county_disaster: [
      { label: "24 Official Hotspots Map", action: "hotspots", enabled: permissions.canViewHotspots },
      { label: "Drainage Bottleneck Audit", action: "drainage", enabled: permissions.canAuditDrainage },
      { label: "Informal Riverway Zones", action: "riverway", enabled: permissions.canViewMap },
    ],
    cedant_broker: [
      { label: "XOL Treaty Attachment (1-in-10y)", action: "treaty", enabled: permissions.canViewTreaty },
      { label: "Reinsurance Placement Brief", action: "brief", enabled: permissions.canExportBrief },
      { label: "Solvency Buffer (+KES 115M)", action: "solvency", enabled: permissions.canAuditDrainage },
    ],
    judge: [
      { label: "Full Model Access", action: "full", enabled: true },
      { label: "Review All Assumptions", action: "assumptions", enabled: true },
      { label: "Audit AI Layer", action: "ai", enabled: true },
    ],
    guest: [
      { label: "Full Model Access", action: "full", enabled: true },
      { label: "Review All Assumptions", action: "assumptions", enabled: true },
      { label: "Audit AI Layer", action: "ai", enabled: true },
    ],
  };
}
