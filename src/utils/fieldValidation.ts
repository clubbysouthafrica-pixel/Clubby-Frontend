/**
 * Field metadata type for validation
 */
export interface FieldMetadata {
  input_type: string;
  options?: string[];
  required?: boolean;
  placeholder?: string;
}

/**
 * Validates a field value based on its type and required status
 * @param fieldName - The name of the field (for error messages)
 * @param editValue - The current value being edited
 * @param metadata - The field metadata containing type and required status
 * @returns An error message if validation fails, null if valid
 */
export function validateFieldValue(
  fieldName: string,
  editValue: string,
  metadata: FieldMetadata | undefined
): string | null {
  // Skip validation if field is not required
  if (!metadata?.required) {
    return null;
  }

  // If field is required (and editable), validate that it has a value
  const fieldType = metadata.input_type || "TEXT";

  if (fieldType === "TEXT" || fieldType === "DROPDOWN") {
    if (editValue.trim() === "") {
      return `${fieldName} cannot be empty`;
    }
  } else if (fieldType === "NUMBER") {
    if (editValue === undefined || editValue === "" || editValue === "0") {
      return `${fieldName} is required`;
    }
  } else if (fieldType === "CHECKBOX") {
    if (editValue !== "true") {
      return `${fieldName} must be checked`;
    }
  }

  return null;
}

/**
 * Converts input_type to standard field type for API
 * @param inputType - The input type from field metadata
 * @returns The corresponding STANDARD_* type string
 */
export function getStandardFieldType(inputType: string): string {
  const normalizedType = inputType?.toUpperCase() || "TEXT";

  switch (normalizedType) {
    case "DROPDOWN":
      return "STANDARD_DROPDOWN";
    case "CHECKBOX":
      return "STANDARD_CHECKBOX";
    case "NUMBER":
      return "STANDARD_NUMBER";
    default:
      return "STANDARD_TEXT";
  }
}
