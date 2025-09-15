export interface ReportDataRow {
    date: string
    total_registered_members: number
    total_pending_members: number
    total_registration_fees_due_by_pending_members: number
    total_registration_fees_paid: number
    total_extra_fees_owed_by_registered_members: number
}
export interface ReportData {
    total_registered_members: number
    total_pending_members: number
    total_registration_fees_due_by_pending_members: number
    total_registration_fees_paid: number
    total_extra_fees_owed_by_registered_members: number
    data: ReportDataRow[]
}

export interface GeneralReport {
  report: ReportData
}