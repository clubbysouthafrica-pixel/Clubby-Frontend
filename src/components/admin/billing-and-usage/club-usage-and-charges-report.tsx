import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

export default function ClubUsageAndCharges({ data }) {

  const months = Object.entries(data)
    .filter(([key]) => /^\d{4}-\d{2}$/.test(key)) 
    .map(([month, values]) => ({
      month,
      registrations: values.Registration["Total registered users"],
      registrationCharge: values.Registration["MCS registration charge"],
      emailsSent: values.Emails["Total emails sent"],
      emailCharge: values.Emails["MCS email charge"],
      totalMonthlyCharge: values["MCS total monthly charge"],
      monthlyOutstanding: values["MCS monthly outstanding amount"],
    }));


  const registrationChartData = months.map((m) => ({
    name: m.month,
    users: m.registrations,
    charge: m.registrationCharge
  }));

  const emailChartData = months.map((m) => ({
    name: m.month,
    emails: m.emailsSent,
    charge: m.emailCharge
  }));

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold">Usage & Charges Summary</h1>

      {/* Registrations Section */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Registrations</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={registrationChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="users" fill="#82ca9d" name="Users" />
            <Bar yAxisId="right" dataKey="charge" fill="#8884d8" name="Charges" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* Emails Section */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Emails</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={emailChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="emails" fill="#4caf50" name="Emails Sent" />
            <Bar yAxisId="right" dataKey="charge" fill="#ff9800" name="Email Charges" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* Billing Summary */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Billing Summary</h2>
        <table className="min-w-full border border-gray-300 text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 border">Month</th>
              <th className="px-3 py-2 border">Monthly Charge</th>
              <th className="px-3 py-2 border">Monthly Outstanding</th>
            </tr>
          </thead>
          <tbody>
            {months.map((m) => (
              <tr key={m.month}>
                <td className="px-3 py-2 border">{m.month}</td>
                <td className="px-3 py-2 border">₹{m.totalMonthlyCharge}</td>
                <td className="px-3 py-2 border">₹{m.monthlyOutstanding}</td>
              </tr>
            ))}
            <tr className="font-semibold bg-gray-50">
              <td className="px-3 py-2 border">Totals</td>
              <td className="px-3 py-2 border"></td>
              <td className="px-3 py-2 border">₹{data["MCS total outstanding amount"]}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
}
