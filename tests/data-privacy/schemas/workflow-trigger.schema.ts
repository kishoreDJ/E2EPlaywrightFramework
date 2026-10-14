import { z } from 'zod';

// POST /workflow/api/trigger → 200: plain text string response
export const WorkflowTriggerResponseSchema = z.string().min(1, 'Workflow trigger response must be a non-empty string');

export type WorkflowTriggerResponse = z.infer<typeof WorkflowTriggerResponseSchema>;
