export function assertNoSupabaseError(
  error: { readonly message: string } | null,
): void {
  if (error) {
    throw new Error(error.message)
  }
}

export function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}
