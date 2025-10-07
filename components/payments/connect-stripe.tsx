import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useState } from "react";
import { Loader } from "../ai-elements/loader";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

export function ConnectStripe() {
    const [isLoading, setIsLoading] = useState(false);
    const [isDeploying, setIsDeploying] = useState(false);
    const [showInputs, setShowInputs] = useState(false);
    const [publishableKey, setPublishableKey] = useState("");
    const [secretKey, setSecretKey] = useState("");
    const [webhookSecret, setWebhookSecret] = useState("");
    const [deployResult, setDeployResult] = useState<string | null>(null);

    const projectId = 'qrrvowlhalhjczhpcrlk'
    const saveStripeCredentials = useAction(api.supabase.saveStripeCredentials);
    const deployEdgeFunction = useAction(api.supabase.deployEdgeFunction);

    const handleSave = async () => {
        setIsLoading(true);
        await saveStripeCredentials({ publishableKey, secretKey, webhookSecret, projectId });
        setIsLoading(false);
    }

    const handleDeployTestFunction = async () => {
        setIsDeploying(true);
        setDeployResult(null);

        // Test edge function code
        const testFunctionCode = `
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { method } = req;
  
  if (method === 'GET') {
    return new Response(
      JSON.stringify({
        message: "Test Edge Function is working!",
        timestamp: new Date().toISOString(),
        method: method,
        url: req.url
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  }
  
  if (method === 'POST') {
    const body = await req.json();
    return new Response(
      JSON.stringify({
        message: "POST request received!",
        receivedData: body,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  }
  
  return new Response(
    JSON.stringify({ error: "Method not allowed" }),
    {
      headers: { "Content-Type": "application/json" },
      status: 405,
    }
  );
});
`;

        try {
            const result = await deployEdgeFunction({
                functionName: 'test-stripe-function',
                projectId: projectId,
                fileContent: testFunctionCode,
                // slug: 'test-stripe-function',
                // entrypointPath: 'index.ts',
                // verifyJwt: false,
                // importMap: false
            });

            if (result.success) {
                setDeployResult(`✅ Function deployed successfully! You can test it at: https://${projectId}.supabase.co/functions/v1/test-stripe-function`);
            } else {
                setDeployResult(`❌ Deployment failed: ${result.message}`);
            }
        } catch (error) {
            setDeployResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        setIsDeploying(false);
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
                        disabled={isLoading}
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
                    <div className="space-y-2">
                        <Label htmlFor="publishable-key">Publishable Key</Label>
                        <Input
                            id="publishable-key"
                            type="text"
                            placeholder="pk_test_..."
                            value={publishableKey}
                            onChange={(e) => setPublishableKey(e.target.value)}
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
                        />
                    </div>

                    {/* Disclaimer */}
                    <div className="bg-muted/50 p-3 rounded-lg border border-muted">
                        <p className="text-xs text-muted-foreground">
                            <strong>🔒 Seguridad:</strong> Nerd no almacena ni tiene acceso a tus credenciales de Stripe.
                            Estas se envían directamente a tu aplicación y se almacenan de forma segura en tu entorno.
                        </p>
                    </div>

                    {/* Test Edge Function Section */}
                    <div className="border-t pt-4 mt-4">
                        <h4 className="font-medium text-sm mb-2">🧪 Test Edge Function</h4>
                        <p className="text-xs text-muted-foreground mb-3">
                            Deploy a test edge function to verify the integration works correctly.
                        </p>

                        <Button
                            onClick={handleDeployTestFunction}
                            disabled={isDeploying}
                            variant="outline"
                            size="sm"
                            className="w-full"
                        >
                            {isDeploying ? (
                                <>
                                    <Loader className="w-4 h-4 mr-2" />
                                    Deploying Test Function...
                                </>
                            ) : (
                                "Deploy Test Edge Function"
                            )}
                        </Button>

                        {deployResult && (
                            <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-muted">
                                <p className="text-xs font-mono break-all">{deployResult}</p>
                            </div>
                        )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setPublishableKey("");
                                setSecretKey("");
                                setWebhookSecret("");
                                setDeployResult(null);
                            }}
                            disabled={!publishableKey && !secretKey && !webhookSecret}
                        >
                            Limpiar
                        </Button>
                        <Button
                            onClick={() => {
                                handleSave();
                                setShowInputs(false);
                            }}
                            disabled={!publishableKey || !secretKey || !webhookSecret}
                        >
                            Guardar
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    )
}