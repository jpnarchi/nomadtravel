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
    const [selectedPlan, setSelectedPlan] = useState<"free" | "pro" | "premium" | "admin">(user.plan || "free")
    const [isUpdatingPlan, setIsUpdatingPlan] = useState(false)
    const updatePlan = useMutation(api.users.updatePlanAsAdmin)

    const handlePlanSelect = (value: string) => {
        setSelectedPlan(value as "free" | "pro" | "premium")
    }

    const handlePlanChange = async () => {
        setIsUpdatingPlan(true)
        try {
            await updatePlan({
                userId: user._id,
                plan: selectedPlan as "free" | "pro" | "premium"
            })
            toast.success(`Plan actualizado a ${selectedPlan}`)
            onOpenChange(false)
        } catch (error) {
            toast.error("Error al actualizar el plan")
        } finally {
            setIsUpdatingPlan(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Cambiar Plan de Usuario</DialogTitle>
                    <DialogDescription>
                        Actualiza el plan del usuario <strong>{user.name}</strong> ({user.email})
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex items-center gap-4">
                        <label htmlFor="plan" className="text-sm font-medium w-24">
                            Plan actual:
                        </label>
                        <Badge variant={user.role === "admin" ? "destructive" : user.plan === "pro" ? "default" : "secondary"} className="capitalize">
                            {user.plan || "free"}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-4">
                        <label htmlFor="new-plan" className="text-sm font-medium w-24">
                            Nuevo plan:
                        </label>
                        <Select value={selectedPlan} onValueChange={handlePlanSelect}>
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Selecciona un plan" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="free">Free</SelectItem>
                                <SelectItem value="pro">Pro</SelectItem>
                                <SelectItem value="premium">Premium</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
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
                        Cancelar
                    </Button>
                    <Button
                        onClick={handlePlanChange}
                        disabled={isUpdatingPlan || selectedPlan === user.plan}
                    >
                        {isUpdatingPlan ? "Actualizando..." : "Actualizar Plan"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}