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
import { formatAmount } from "@/data/currencies";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function ClubUsageAndCharges({ data, currency }: any) {
  const months = Object.entries(data as any)
    .filter(([key]) => /^\d{4}-\d{2}$/.test(key))
    .map(([month, values]) => ({
      month,
      registrations: (values as any).Registration["Total registered users"],
      registrationCharge: (values as any).Registration["MCS registration charge"],
      emailsSent: (values as any).Emails["Total emails sent"],
      emailCharge: (values as any).Emails["MCS email charge"],
      totalMonthlyCharge: (values as any)["MCS total monthly charge"],
      monthlyOutstanding: (values as any)["MCS monthly outstanding amount"],
    }));

  const totalRegistrationCharge = months.reduce((sum, m) => sum + m.registrationCharge, 0);
  const totalEmailCharge = months.reduce((sum, m) => sum + m.emailCharge, 0);
  const totalEmailsSent = months.reduce((sum, m) => sum + m.emailsSent, 0);
  const totalCharge = months.reduce((sum, m) => sum + m.totalMonthlyCharge, 0);
  const totalRegisteredUsers = months.reduce((sum, m) => sum + m.registrations, 0);

  const registrationChartData = months.map((m) => {
    return {
      name: m.month,
      users: m.registrations,
      charge: m.registrationCharge
    }
  });

  const emailChartData = months.map((m) => ({
    name: m.month,
    emails: m.emailsSent,
    charge: m.emailCharge
  }));

  console.log(data)

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-xl font-semibold mb-2">Billing Summary</h2>
        <table className="min-w-full border border-gray-300 text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 border">Month</th>
              <th className="px-3 py-2 border">Charge</th>
              <th className="px-3 py-2 border">Outstanding</th>
            </tr>
          </thead>
          <tbody>
            {months.map((m) => (
              <tr key={m.month}>
                <td className="px-3 py-2 border">{m.month}</td>
                <td className="px-3 py-2 border">{formatAmount(m.totalMonthlyCharge, currency)}</td>
                <td className="px-3 py-2 border">{formatAmount(m.monthlyOutstanding, currency)}</td>
              </tr>
            ))}
            <tr className="font-semibold bg-gray-50">
              <td className="px-3 py-2 border">Totals</td>
              <td className="px-3 py-2 border">{formatAmount(totalCharge, currency)}</td>
              <td className="px-3 py-2 border">{formatAmount(data["MCS total outstanding amount"], currency)}</td>
            </tr>
          </tbody>
        </table>
      </section>
      <Card className="p-6 w-[1000px] gap-2">
        <CardHeader className="text-xl font-semibold mb-0 pb-0">Registrations</CardHeader>
        <div className="mx-8 mb-2 *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-0 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
          <Card className="gap-2 px-2 py-3 items-center">
            <CardDescription>Total registration charge</CardDescription>
            <CardTitle className="text-xl font-semibold tabular-nums font-semibold tabular-nums @[250px]/card:text-3xl">
              {formatAmount(totalRegistrationCharge, currency)}
            </CardTitle>
          </Card>
          <Card className="gap-2 p-2 items-center">
            <CardDescription>Registered Users</CardDescription>
            <CardTitle className="text-xl font-semibold tabular-nums font-semibold tabular-nums @[250px]/card:text-3xl">
              {totalRegisteredUsers}
            </CardTitle>
          </Card>
          <Card className="gap-2 p-2 items-center">
            <CardDescription>Charge per member</CardDescription>
            <CardTitle className="text-xl font-semibold tabular-nums font-semibold tabular-nums @[250px]/card:text-3xl">
              {formatAmount(data["MCS charge per registration"], currency)}
            </CardTitle>
          </Card>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={registrationChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => formatAmount(value, currency)} />
            <Tooltip
              formatter={(value, name) => {
                if (name === "Charges" || name === "Email Charges") {
                  return [formatAmount(value as number, currency), name];
                }
                return [value, name];
              }}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="users" fill="#82ca9d" name="Users" />
            <Bar yAxisId="right" dataKey="charge" fill="#8884d8" name="Charges" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Emails Section */}
      <Card className="p-5 w-[1000px] gap-2">
        <CardHeader className="text-xl font-semibold mb-0 pb-0">Emails</CardHeader>
        <div className="mx-8 mb-2 *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-0 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
          <Card className="gap-2 px-4 py-3 items-center">
            <CardDescription>Total email charge</CardDescription>
            <CardTitle className="text-xl font-semibold tabular-nums font-semibold tabular-nums @[250px]/card:text-3xl">
              {formatAmount(totalEmailCharge, currency)}
            </CardTitle>
          </Card>
          <Card className="gap-2 p-4 items-center">
            <CardDescription>Total emails sent</CardDescription>
            <CardTitle className="text-xl font-semibold tabular-nums font-semibold tabular-nums @[250px]/card:text-3xl">
              {totalEmailsSent}
            </CardTitle>
          </Card>
          <Card className="gap-2 p-4 items-center">
            <CardDescription>Monthly free emails</CardDescription>
            <CardTitle className="text-xl font-semibold tabular-nums font-semibold tabular-nums @[250px]/card:text-3xl">
              {data["Total free emails per month"]}
            </CardTitle>
          </Card>
          <Card className="gap-2 p-4 items-center">
            <CardDescription>Charge per email</CardDescription>
            <CardTitle className="text-xl font-semibold tabular-nums font-semibold tabular-nums @[250px]/card:text-3xl">
              {formatAmount(data["MCS charge per email"], currency)}
            </CardTitle>
          </Card>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={emailChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => formatAmount(value, currency)} />
            <Tooltip
              formatter={(value, name) => {
                if (name === "Charges" || name === "Email Charges") {
                  return [formatAmount(value as number, currency), name];
                }
                return [value, name];
              }}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="emails" fill="#4caf50" name="Emails Sent" />
            <Bar yAxisId="right" dataKey="charge" fill="#ff9800" name="Email Charges" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
