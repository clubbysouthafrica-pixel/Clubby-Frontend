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
