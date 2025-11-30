import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { User } from "./columns"
import { toast } from "sonner"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"

interface UpdatePlanDialogProps {
    user: User
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}

export function UpdatePlanDialog({ user, isOpen, onOpenChange }: UpdatePlanDialogProps) {
    const [selectedPlan, setSelectedPlan] = useState<"free" | "pro" | "premium" | "ultra">(user.plan || "free")
    const [isUpdatingPlan, setIsUpdatingPlan] = useState(false)
    const updatePlan = useMutation(api.users.updatePlanAsAdmin)

    const handlePlanSelect = (value: string) => {
        setSelectedPlan(value as "free" | "pro" | "premium" | "ultra")
    }

    const handlePlanChange = async () => {
        setIsUpdatingPlan(true)
        try {
            await updatePlan({
                userId: user._id,
                plan: selectedPlan as "free" | "pro" | "premium" | "ultra"
            })
            toast.success(`Plan updated to ${selectedPlan}`)
            onOpenChange(false)
        } catch (error) {
            toast.error("Error updating plan")
        } finally {
            setIsUpdatingPlan(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Change User Plan</DialogTitle>
                    <DialogDescription>
                        Update the plan for user <strong>{user.name}</strong> ({user.email})
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex items-center gap-4">
                        <label htmlFor="plan" className="text-sm font-medium w-24">
                            Current plan:
                        </label>
                        <Badge variant={(user.plan === "pro" || user.plan === "premium" || user.plan === "ultra") ? "default" : "secondary"} className="capitalize">
                            {user.plan || "free"}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-4">
                        <label htmlFor="new-plan" className="text-sm font-medium w-24">
                            New plan:
                        </label>
                        <Select value={selectedPlan} onValueChange={handlePlanSelect}>
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Select a plan" />
                            </SelectTrigger>
                            <SelectContent className="z-[10000]">
                                <SelectItem value="free">Free</SelectItem>
                                <SelectItem value="pro">Pro</SelectItem>
                                <SelectItem value="premium">Premium</SelectItem>
                                <SelectItem value="ultra">Ultra</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isUpdatingPlan}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handlePlanChange}
                        disabled={isUpdatingPlan || selectedPlan === user.plan}
                    >
                        {isUpdatingPlan ? "Updating..." : "Update Plan"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}