import { TableCell, TableRow } from "@/components/ui/table";

interface EmptyRegistrationsRowProps {
  colSpan: number;
}

export default function EmptyRegistrationsRow({
  colSpan,
}: EmptyRegistrationsRowProps) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-24 text-center text-slate-500">
        No registrations found.
      </TableCell>
    </TableRow>
  );
}