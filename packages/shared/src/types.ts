export type EventType =
  | 'click'
  | 'input'
  | 'network'
  | 'dom'
  | 'error'
  | 'warning'
  | 'signal'
  | 'performance'
  | 'websocket_in'
  | 'websocket_out'
  | 'route_change'
  | 'navigation'
  | 'form_submit';

export type EventSeverity = 'info' | 'warn' | 'error' | 'critical';

export type SignalType =
  | 'dead_click'
  | 'rage_click'
  | 'duplicate_request'
  | 'slow_request'
  | 'obscured_click'
  | 'numeric_value_change'
  | 'listener_leak'
  | 'websocket_drop';

export type BodyShapeValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | { [key: string]: BodyShapeValue }
  | BodyShapeValue[];

export type BodyShape = { [key: string]: BodyShapeValue } | BodyShapeValue[] | string;

export interface TelemetryEvent {
  id: string;
  session_id: string;
  ts: number; // millisecond epoch
  type: EventType;
  severity: EventSeverity;
  url?: string;
  method?: string;
  status?: number;
  duration_ms?: number;
  selector?: string;
  text?: string;
  shape?: BodyShape;
  fingerprint?: string;
  trigger_event_id?: string;
  metadata?: Record<string, unknown>;
}

export interface Complaint {
  id: string;
  session_id: string;
  note: string;
  picked_selector?: string;
  tester_name?: string;
  device_tag?: string;
  recent_event_id?: string;
  window_seconds?: number;
  submitted_at: number;
  window_start?: number;
  window_end?: number;
}

export type ReportSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ReportConfidence = 'low' | 'medium' | 'high';
export type ReportStatus =
  | 'draft'
  | 'approved'
  | 'sent'
  | 'open'
  | 'in_progress'
  | 'fixed'
  | 'verified';

export interface DefectReport {
  id: string;
  complaint_id?: string;
  title: string;
  severity: ReportSeverity;
  steps: string[];
  expected: string;
  actual: string;
  root_cause_hypothesis?: string;
  confidence: ReportConfidence;
  evidence_ids: string[];
  evidence_snapshot?: TelemetryEvent[];
  suggested_checks?: string[];
  suggested_fix?: string;
  playwright_script?: string;
  status: ReportStatus;
  ai_provider?: string;
  ai_fallback: boolean;
  assignee_id?: string;
  created_at: string;
  updated_at: string;
}

export interface SignalSummary {
  error_count: number;
  failed_request_count: number;
  dead_click_count: number;
  rage_click_count: number;
  duplicate_request_count: number;
  slow_request_count: number;
  numeric_change_count: number;
}

