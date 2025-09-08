import { useState } from "react"
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

import { ClubRegisterForm } from "./club-onboard-form"


export default function ClubOnboardDialog() {
const [openDialog, setOpenDialog] = useState<boolean>(false);

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogTrigger asChild>
        <Button>Register</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <ClubRegisterForm/>
      </DialogContent>
    </Dialog>
  )
}
