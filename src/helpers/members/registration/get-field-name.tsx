export const getFieldName = (pages: any, field_id: string) => {
    const allFields = pages.flatMap((p: any) => p.fields);
    let field_name = ""
    allFields.forEach((field: any) => {
        if (field.field_id === field_id) {
            field_name = field.field_name
        }
    })
    return field_name
}