import { ValidationError, type AnyObjectSchema, type InferType } from "yup";

export type FieldErrors<T> = { [K in keyof T]?: string };

export type FormResult<S extends AnyObjectSchema> =
  | { isValid: true; values: InferType<S>; errors: Record<string, never> }
  | { isValid: false; values: null; errors: FieldErrors<InferType<S>> };

/**
 * Validates a whole form and returns the first error message per field, ready
 * to show under each input. Synchronous, so use it only with schemas that have
 * no async tests (all schemas in this folder qualify).
 */
export function validateForm<S extends AnyObjectSchema>(
  schema: S,
  values: unknown,
): FormResult<S> {
  try {
    const parsed = schema.validateSync(values, { abortEarly: false });
    return { isValid: true, values: parsed, errors: {} };
  } catch (error) {
    if (!(error instanceof ValidationError)) throw error;
    const entries = error.inner
      .filter((issue) => issue.path)
      .map((issue) => [issue.path as string, issue.message] as const);
    // Reversed so that, for a field with several broken rules, the first one wins.
    const errors = Object.fromEntries([...entries].reverse());
    return { isValid: false, values: null, errors: errors as FieldErrors<InferType<S>> };
  }
}

/** Error text for one field, or "" when it is valid (handy while the user types). */
export function validateField<S extends AnyObjectSchema>(
  schema: S,
  field: keyof InferType<S> & string,
  values: unknown,
): string {
  try {
    schema.validateSyncAt(field, values);
    return "";
  } catch (error) {
    if (error instanceof ValidationError) return error.message;
    throw error;
  }
}
