import { ScenarioSchema as BaseSchema, type CanonicalScenario as BaseScenario, normalizeScenario as baseNormalize, safeRandomUUID } from '@/lib/ask/types';
import { truncate as baseTruncate } from '@/lib/ask/utils';

// Re-export canonical schema utilities for the Ask Purposely feature module
export const ScenarioSchema = BaseSchema;
export type Scenario = BaseScenario;
export const normalizeScenario = baseNormalize;
export const randomId = safeRandomUUID;
export const truncate = baseTruncate;
