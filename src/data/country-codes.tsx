export const countryCodes = [
  { code: "ZA", name: "South Africa", dialingCode: "+27" },
  { code: "US", name: "United States", dialingCode: "+1" },
  { code: "GB", name: "United Kingdom", dialingCode: "+44" },
  { code: "CA", name: "Canada", dialingCode: "+1" },
  { code: "AU", name: "Australia", dialingCode: "+61" },
  { code: "NZ", name: "New Zealand", dialingCode: "+64" },
  { code: "DE", name: "Germany", dialingCode: "+49" },
  { code: "FR", name: "France", dialingCode: "+33" },
  { code: "IN", name: "India", dialingCode: "+91" },
  { code: "NG", name: "Nigeria", dialingCode: "+234" },
  { code: "KE", name: "Kenya", dialingCode: "+254" },
  { code: "GH", name: "Ghana", dialingCode: "+233" },
  { code: "TZ", name: "Tanzania", dialingCode: "+255" },
  { code: "UG", name: "Uganda", dialingCode: "+256" },
  { code: "BW", name: "Botswana", dialingCode: "+267" },
  { code: "ZM", name: "Zambia", dialingCode: "+260" },
  { code: "ZW", name: "Zimbabwe", dialingCode: "+263" },
  { code: "BR", name: "Brazil", dialingCode: "+55" },
  { code: "CN", name: "China", dialingCode: "+86" },
  { code: "JP", name: "Japan", dialingCode: "+81" },
  { code: "KR", name: "South Korea", dialingCode: "+82" },
  { code: "MX", name: "Mexico", dialingCode: "+52" },
  { code: "RU", name: "Russia", dialingCode: "+7" },
  { code: "AE", name: "United Arab Emirates", dialingCode: "+971" },
  { code: "SA", name: "Saudi Arabia", dialingCode: "+966" },
];

export const getDialingCode = (countryCode: string): string => {
  const country = countryCodes.find(c => c.code === countryCode);
  return country?.dialingCode || "";
};

// Validate phone number format (basic validation - at least 7 digits)
export const validatePhoneNumber = (phoneNumber: string): boolean => {
  const digitsOnly = phoneNumber.replace(/\D/g, "");
  return digitsOnly.length >= 7 && digitsOnly.length <= 15;
};
