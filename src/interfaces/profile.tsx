export interface ProfileSettings {
    first_name: string,
    surname: string,
    date_of_birth: string,
    phone_number: string,
    address_line_1?: string,
    address_line_2?: string,
    suburb?: string,
    postal_code?: string,
    city?: string,
    country?:  string
}