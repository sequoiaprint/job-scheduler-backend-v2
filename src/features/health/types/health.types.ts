// TYPES: the health report returned by GET /health.

export type DependencyState = "up" | "down";

export interface HealthReport {
  status: "ok" | "degraded";
  database: DependencyState;
  grove: DependencyState;
  uptimeSeconds: number;
  timestamp: string;
}
