import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Manage() {
    const navigate = useNavigate()
    const manageRoutes = [
        {
            name: "Club",
            description: "Manage your club here",
            route: "/manage/club"
        },
        {
            name: "Members",
            description: "Manage your members here",
            route: "/manage/members"
        },
        {
            name: "Registration Form",
            description: "Manage your registration form here",
            route: "/manage/registrations/forms"
        },
    ]
    return (
        <div className="p-5 min-h-screen">
            <h1 className="text-base font-bold">Manage</h1>
            <div className="rounded-md border overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted">
                        <TableRow>
                            <TableHead>Manage</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {
                            manageRoutes.map(r => (
                                <TableRow onClick={() => navigate(r.route)} key={r.name}>
                                    <TableCell className="font-bold">{r.name}</TableCell>
                                    <TableCell>{r.description}</TableCell>
                                    <TableCell><Button>View</Button></TableCell>
                                </TableRow>
                            ))
                        }
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}