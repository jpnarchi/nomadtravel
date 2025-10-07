import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useState } from "react";
import { Loader } from "../ai-elements/loader";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

export function ConnectStripe({ 
    id, 
    onStripeConnected, 
    disableConnectStripe 
}: { 
    id: Id<"chats">, 
    onStripeConnected: (publishableKey: string) => void, 
    disableConnectStripe: boolean 
}) {
    const [isLoading, setIsLoading] = useState(false);
    const [showInputs, setShowInputs] = useState(false);
    const [publishableKey, setPublishableKey] = useState("");
    const [secretKey, setSecretKey] = useState("");
    const [webhookSecret, setWebhookSecret] = useState("");

    const saveStripeCredentials = useAction(api.supabase.saveStripeCredentials);
    const supabaseProjectId = useQuery(api.chats.getSupabaseProjectId, { chatId: id });

    const handleSave = async () => {
        if (!supabaseProjectId) {
            toast.error("No se encontró un proyecto de Supabase conectado");
            return;
        }
        setIsLoading(true);
        const result = await saveStripeCredentials({ publishableKey, secretKey, webhookSecret, projectId: supabaseProjectId });
        if (result.success && publishableKey) {
            onStripeConnected(publishableKey);
        }
        if (result.error) {
            toast.error(result.error);
        }
        setIsLoading(false);
    }

    return (
        <div className="flex flex-col gap-2 w-full">
            <Card className="group relative w-full flex flex-row items-center gap-4 px-4 py-3 rounded-lg border border-border bg-card hover:border-border/80 hover:shadow-sm transition-all duration-200">

                {/* Contenido central */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-foreground">Stripe</p>
                    </div>
                    <p className="text-sm text-muted-foreground">Integra pagos a tu página</p>
                </div>

                {/* Botones de acción */}
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        onClick={() => {
                            setShowInputs(!showInputs);
                        }}
                        disabled={isLoading || disableConnectStripe}
                        className="bg-[#533AFD] hover:bg-[#533AFD]/90 text-white cursor-pointer"
                    >
                        {isLoading ? (
                            <>
                                <Loader className="w-4 h-4" />
                                Cargando
                            </>
                        ) : (
                            <>
                                {showInputs ? "Ocultar" : "Integrar"}
                            </>
                        )}
                    </Button>
                </div>
            </Card>

            {/* Input fields section */}
            {showInputs && (
                <Card className="w-full p-4 space-y-2">
                    <div className="mb-2">
                        <Button
                            variant="default"
                            size="lg"
                            onClick={() => window.open('https://dashboard.stripe.com/test/apikeys', '_blank')}
                            disabled={disableConnectStripe}
                            className="bg-[#533AFD] hover:bg-[#533AFD]/90 text-white cursor-pointer w-full"
                        >
                            Obtener credenciales
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="publishable-key">Publishable Key</Label>
                        <Input
                            id="publishable-key"
                            type="text"
                            placeholder="pk_test_..."
                            value={publishableKey}
                            onChange={(e) => setPublishableKey(e.target.value)}
                            disabled={disableConnectStripe}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="secret-key">Secret Key</Label>
                        <Input
                            id="secret-key"
                            type="password"
                            placeholder="sk_test_..."
                            value={secretKey}
                            onChange={(e) => setSecretKey(e.target.value)}
                            disabled={disableConnectStripe}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="webhook-secret">Webhook Secret</Label>
                        <Input
                            id="webhook-secret"
                            type="password"
                            placeholder="whsec_..."
                            value={webhookSecret}
                            onChange={(e) => setWebhookSecret(e.target.value)}
                            disabled={disableConnectStripe}
                        />
                    </div>

                    {/* Disclaimer */}
                    <div className="bg-muted/50 p-3 rounded-lg border border-muted">
                        <p className="text-xs text-muted-foreground">
                            <strong>🔒 Seguridad:</strong> Nerd no almacena ni tiene acceso a tus credenciales de Stripe.
                            Estas se envían directamente a tu aplicación y se almacenan de forma segura en tu entorno.
                        </p>
                    </div>


                    {/* Action buttons */}
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setPublishableKey("");
                                setSecretKey("");
                                setWebhookSecret("");
                            }}
                            disabled={!publishableKey && !secretKey && !webhookSecret || disableConnectStripe}
                        >
                            Limpiar
                        </Button>
                        <Button
                            onClick={() => {
                                handleSave();
                                setShowInputs(false);
                            }}
                            disabled={!publishableKey || !secretKey || !webhookSecret || disableConnectStripe}
                        >
                            Guardar
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    )
}