import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { Label } from "@/components/ui/label"
import { formatAmount } from "@/data/currencies";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Card, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card"
import { DndContext, KeyboardSensor, MouseSensor, TouchSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import * as React from "react";

const REPORTING_METRICS = ["Registrations", "Emails"]

export default function ClubUsageAndCharges({ data, currency }: any) {
  const [selectedTab, setSelectedTab] = useState("Registrations");

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )
  const sortableId = React.useId()

  console.log(data)

  return (
    <div className="space-y-10">
      <h2 className="text-l font-semibold mb-2">Billing Summary</h2>
      <div className="overflow-hidden rounded-lg border">
        <DndContext
          collisionDetection={closestCenter}
          sensors={sensors}
          id={sortableId}>
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              <TableRow>
                <TableHead className="text-center">Month</TableHead>
                <TableHead className="text-center">Charge</TableHead>
                <TableHead className="text-center">Outstanding</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.keys(data.overall_month_data || {}).map((key) => (
                <TableRow key={key}>
                  <TableCell className="text-center">{key}</TableCell>
                  <TableCell className="text-center">
                    {formatAmount(data.overall_month_data[key].total_amount, currency)}
                  </TableCell>
                  <TableCell className="text-center">
                    {formatAmount(data.overall_month_data[key].outstanding_amount, currency)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-semibold bg-gray-50">
                <TableCell className="text-center">Total</TableCell>
                <TableCell className="text-center">{formatAmount(data.total_charge, currency)}</TableCell>
                <TableCell className="text-center">{formatAmount(data.total_outstanding_amount, currency)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </DndContext>
      </div>

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

          {REPORTING_METRICS.map((key) => {
            if (selectedTab !== key) return null;

            return (
              <div key={key}>
                <div className="flex gap-4 pb-4 px-8 *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs">
                  {Object.keys(data[key])?.map((k) => {
                    if (k === "month_data") return null;
                    return (
                      <Card key={k} className="@container/card w-[100%]">
                        <CardHeader className="flex flex-col items-center justify-center text-center">
                          <CardDescription>{k}</CardDescription>
                          <CardTitle className="text-xl font-semibold tabular-nums">
                            {data[key][k]}
                          </CardTitle>
                        </CardHeader>
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
