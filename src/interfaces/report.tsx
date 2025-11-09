export interface ReportDataRow {
    date: string
    total_registered_members: number
    total_pending_members: number
    total_pending_revenue: number
    total_revenue: number
    total_deregistered_members: number
}

export interface GeneralReport {
  total_registered_members: number
  total_pending_members: number
  total_registration_revenue: number
  total_registration_pending_revenue: number
  total_pending_revenue: number
  total_revenue: number
  total_active_members: number
  total_deregistered_members: number
  data: ReportDataRow[]
}

export interface RegistrationReportRowDataItem {
  date: string
  paid_to_club: number
  due_to_club: number
  total: number
  pending: number
}
export interface RegistrationRowData {
  row_name: string
  fee_amount: number
  total: {
    total: number
    pending: number
    paid_to_club: number
    due_to_club: number
  }
  data: RegistrationReportRowDataItem[]
}

// A top-level registration report bucket can either contain nested rows (rows[])
// or be an aggregate with its own data series (data[]) and summary totals.
// The original code accessed properties like fee_amount, total, data on items
// that were typed loosely as any. We model them here as optional so that
// strict typing reflects the API shape without losing safety.
export interface RegistrationReportDropDown {
  table_name: string
  field_id: string
  rows?: RegistrationRowData[]
  fee_amount?: number
  total?: {
    total: number
    pending: number
    paid_to_club: number
    due_to_club: number
  }
  data?: RegistrationReportRowDataItem[]
}

export interface RegistrationReportText {
  fee_amount: number
  data: {
    due_to_club: number
    paid_to_club: number
    month: string
  }
}

export interface RegistrationReport {
  report: RegistrationReportDropDown[] | RegistrationReportText
}
