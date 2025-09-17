import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { Label } from "@/components/ui/label"
import { formatAmount } from "@/data/currencies";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card, CardDescription, CardTitle
} from "@/components/ui/card"

const REPORTING_METRICS = ["Registrations", "Emails"]

export default function ClubUsageAndCharges({ data, currency }: any) {
  const [selectedTab, setSelectedTab] = useState("Registrations");

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
  return (
    <div className="space-y-10">

      {/* --- Billing Summary Table --- */}
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
            {Object.keys(data.overall_month_data).map((key, index) => (
              <tr key={key}>
                <td className="px-3 py-2 border">{key}</td>
                <td className="px-3 py-2 border">{formatAmount(data.overall_month_data[key].total_amount, currency)}</td>
                <td className="px-3 py-2 border">{formatAmount(data.overall_month_data[key].outstanding_amount, currency)}</td>
              </tr>
            ))}
            <tr className="font-semibold bg-gray-50">
              <td className="px-3 py-2 border">Total</td>
              <td className="px-3 py-2 border">{formatAmount(data.total_charge, currency)}</td>
              <td className="px-3 py-2 border">{formatAmount(data.total_outstanding_amount, currency)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* --- Graphs --- */}
      <Card className="p-5 w-full gap-2">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full flex-col gap-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="view-selector" className="sr-only">View</Label>
            <TabsList>
              <TabsTrigger value="Registrations" className="w-[150px]">Registrations</TabsTrigger>
              <TabsTrigger value="Emails" className="w-[150px]">Emails</TabsTrigger>
            </TabsList>
          </div>

          {/* Only show the selected tab's data */}
          {REPORTING_METRICS.map((key) => {
            if (selectedTab !== key) return null;

            return (
              <div key={key}>
                <div className="mx-8 mb-2 grid grid-cols-1 gap-4 px-4 lg:px-0 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
                  {Object.keys(data[key]).map((k) => {
                    if (k === "month_data") return null;
                    return (
                      <Card key={k} className="gap-2 px-4 py-3 items-center">
                        <CardDescription>{k}</CardDescription>
                        <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-3xl">
                          {data[key][k]}
                        </CardTitle>
                      </Card>
                    );
                  })}
                </div>

                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data[key].month_data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right"
                      tickFormatter={(value) => formatAmount(value, currency)} />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === "Charges" || name === "Email Charges") {
                          return [formatAmount(value as number, currency), name];
                        }
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Bar yAxisId="left"
                      dataKey={key === "Registrations" ? "users" : "emails"}
                      fill="#4caf50"
                      name={key === "Registrations" ? "Users" : "Emails Sent"}
                    />
                    <Bar yAxisId="right" dataKey="charge" fill="#ff9800" name="Charges" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            );
          })}
        </Tabs>
      </Card>
    </div>
  );
}
