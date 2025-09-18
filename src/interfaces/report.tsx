export interface ReportDataRow {
    date: string
    total_registered_members: number
    total_pending_members: number
    total_registration_fees_due_by_pending_members: number
    total_registration_fees_paid: number
    total_extra_fees_owed_by_registered_members: number
}

export interface GeneralReport {
  total_registered_members: number
  total_pending_members: number
  total_registration_fees_due_by_pending_members: number
  total_registration_fees_paid: number
  total_extra_fees_owed_by_registered_members: number
  data: ReportDataRow[]
}

export interface RegistrationReportRowDataItem {
  date: string
  paid_to_club: number
  due_to_club: number
}
export interface RegistrationRowData {
  row_name: string
  total: {
    fee_amount: number
    paid_to_club: number
    due_to_club: number
  }
  data: RegistrationReportRowDataItem[]
}

export interface RegistrationReportData {
  table_name: string
  field_id: string
  rows: RegistrationRowData[]
}

export interface RegistrationReport {
  report: RegistrationReportData[]
}
