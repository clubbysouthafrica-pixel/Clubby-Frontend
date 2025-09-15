import { PageFormRegistration } from "@/interfaces/formRegistration";

export function createDeleteFieldsRequest(
    deleteFields: string[],
    originalPages: PageFormRegistration[]
  ): string[] {
    // Keep only string values
    const filteredDeleteFields = deleteFields.filter(el => typeof el === 'string');
  
    // Keep only fields that actually exist in originalPages
    const validDeleteFields = filteredDeleteFields.filter(df =>
      originalPages.some(page => page.fields.some(field => field.field_id === df))
    );
  
    return validDeleteFields;
  }