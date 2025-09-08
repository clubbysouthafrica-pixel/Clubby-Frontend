import { useState } from "react"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { TrashIcon } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"

interface Props {
    id: any
    tooltipDescription: string
    removeFunc: (pageIndex: any) => void
}

export default function ConfirmDeleteDialog({id, tooltipDescription, removeFunc}: Props) {
  const [openDialog, setOpenDialog] = useState<boolean>(false);

  const remove = () => {
    removeFunc(id)
    setOpenDialog(false)
  }

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
                <Button variant={"outline"} className="ml-2 h-full"><TrashIcon/></Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipDescription}</p>
          </TooltipContent>
        </Tooltip>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Are you sure you want to remove this?</DialogTitle>
        </DialogHeader>
        Confirm to remove item
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" variant={"destructive"} onClick={remove}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
