/**
 * Human-readable labels for SPEC3 detection rule names.
 * Used by the teacher misconception frequency view (Step 9).
 * Keys are DetectionRule values stored in question_attempts.detected_error_id.
 */
import type { DetectionRule } from './repair'

export const ERROR_LABELS: Record<DetectionRule, string> = {
  answer_matches:                'Known common wrong answer',
  near_numeric:                  'Near-miss numeric answer',
  answer_equals_2x_value:        'Doubled the correct value',
  answer_equals_half_value:      'Halved the correct value',
  answer_equals_x_plus_n:        'Added offset instead of another operation',
  sign_error:                    'Sign error (positive/negative swapped)',
  off_by_one:                    'Off by one',
  digit_transposition:           'Transposed digits',
  wrong_operation:               'Used the wrong operation',
  numerator_denominator_swapped: 'Swapped numerator and denominator',
  did_not_simplify:              'Did not simplify the fraction',
  added_numerators_denominators: 'Added numerators and denominators separately',
}

/** Return a teacher-readable label. Falls back to the raw ID when not a known rule. */
export function errorLabel(ruleOrId: string): string {
  return ERROR_LABELS[ruleOrId as DetectionRule] ?? ruleOrId
}
