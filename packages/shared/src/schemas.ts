import { z } from 'zod';

export const EventSeveritySchema = z.enum(['info', 'warn', 'error', 'critical']);

export const EventTypeSchema = z.enum([
  'click',
  'input',
  'network',
  'dom',
  'error',
  'warning',
  'signal',
  'websocket_in',
  'websocket_out',
  'route_change',
]);

export const TelemetryEventSchema = z.object({
  id: z.string().min(1),
  session_id: z.string().min(1),
  ts: z.number().int().positive(),
  type: EventTypeSchema,
  severity: EventSeveritySchema.default('info'),
  url: z.string().optional(),
  method: z.string().optional(),
  status: z.number().int().optional(),
  duration_ms: z.number().optional(),
  selector: z.string().optional(),
  text: z.string().optional(),
  shape: z.record(z.any()).optional(),
  fingerprint: z.string().optional(),
  trigger_event_id: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const IngestBatchSchema = z.object({
  project_token: z.string().min(1),
  session_id: z.string().min(1),
  events: z.array(TelemetryEventSchema).min(1).max(200),
});

export const ComplaintSubmissionSchema = z.object({
  session_id: z.string().min(1),
  note: z.string().min(1).max(500),
  picked_selector: z.string().optional(),
  submitted_at: z.number().int().positive().default(() => Date.now()),
});

export const LLMReportOutputSchema = z.object({
  title: z.string().min(5).max(150),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  steps: z.array(z.string().min(2)).min(1),
  expected: z.string().min(5),
  actual: z.string().min(5),
  root_cause_hypothesis: z.string().min(5),
  confidence: z.enum(['low', 'medium', 'high']),
  evidence_ids: z.array(z.string()).min(1),
  suggested_checks: z.array(z.string()).default([]),
});

export const DefectReportUpdateSchema = z.object({
  title: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  steps: z.array(z.string()).optional(),
  expected: z.string().optional(),
  actual: z.string().optional(),
  root_cause_hypothesis: z.string().optional(),
  status: z
    .enum(['draft', 'approved', 'sent', 'open', 'in_progress', 'fixed', 'verified'])
    .optional(),
  assignee_id: z.string().uuid().nullable().optional(),
});
