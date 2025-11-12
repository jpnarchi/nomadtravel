import { api, internal } from "./_generated/api";
import { action, internalAction } from "./_generated/server";
import Stripe from 'stripe';
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const pay = action({
    args: {
        plan: v.union(
            v.literal("pro"),
            v.literal("premium"),
            v.literal("ultra"),
        ),
        billingType: v.union(
            v.literal("monthly"),
            v.literal("annual"),
        ),
    },
    handler: async (ctx, args) => {
        const user = await ctx.runQuery(api.users.getUserInfo, {});

        if (!user) {
            throw new Error("User not found");
        }

        if (user.plan === args.plan) {
            throw new Error("User already has this plan");
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: "2025-09-30.clover"
        });

        const baseUrl = process.env.BASE_URL!;

        let priceId: string;

        // Seleccionar el price ID basado en el plan y el tipo de facturación
        if (args.plan === "pro") {
            priceId = args.billingType === "annual"
                ? process.env.STRIPE_PRO_ANNUAL_PRICE_ID!
                : process.env.STRIPE_PRO_PRICE_ID!;
        } else if (args.plan === "premium") {
            priceId = args.billingType === "annual"
                ? process.env.STRIPE_PREMIUM_ANNUAL_PRICE_ID!
                : process.env.STRIPE_PREMIUM_PRICE_ID!;
        } else {
            priceId = args.billingType === "annual"
                ? process.env.STRIPE_ULTRA_ANNUAL_PRICE_ID!
                : process.env.STRIPE_ULTRA_PRICE_ID!;
        }

        const session: Stripe.Response<Stripe.Checkout.Session> = await stripe.checkout.sessions.create(
            {
                locale: "es",
                mode: "subscription",
                line_items: [
                    {
                        price: priceId,
                        quantity: 1,
                    },
                ],
                customer_email: user.email,
                metadata: {
                    userId: user._id,
                },
                success_url: `${baseUrl}`,
                cancel_url: `${baseUrl}`,
                allow_promotion_codes: true,
            }
        );
        return session.url;
    },
});

type Metadata = {
    userId: Id<"users">;
}

export const fulfill = internalAction({
    args: {
        signature: v.string(),
        payload: v.string()
    },
    handler: async ({ runQuery, runMutation }, { signature, payload }) => {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: "2025-09-30.clover",
        });

        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;
        try {
            const event = await stripe.webhooks.constructEventAsync(
                payload,
                signature,
                webhookSecret
            );
            if (event.type === "checkout.session.completed") {
                const completedEvent = event.data.object as Stripe.Checkout.Session & {
                    metadata: Metadata;
                };
                // Verificar que la sesión tenga una suscripción
                if (!completedEvent.subscription) {
                    console.log("No subscription found in checkout session - this is OK, will be handled by invoice.payment_succeeded");
                    return { success: true };
                }

                try {
                    // Expandir el objeto subscription con line_items para obtener el producto
                    const subscription = await stripe.subscriptions.retrieve(
                        completedEvent.subscription as string,
                        {
                            expand: ['items.data.price.product']
                        }
                    )

                    if (subscription.items && subscription.items.data && subscription.items.data.length > 0) {
                        const firstSubscriptionItem = subscription.items.data[0];
                        const currentPeriodEnd = firstSubscriptionItem.current_period_end;

                        const userId = completedEvent.metadata.userId;

                        // Obtener el Product ID del price
                        // Si está expandido, es un objeto; si no, es un string
                        const product = subscription.items.data[0].price.product;
                        const productId = typeof product === 'string' ? product : product.id;

                        console.log("Product ID detected:", productId);

                        // Convertir Product ID a plan name
                        let plan: "pro" | "premium" | "ultra" | string = productId;

                        if (productId === process.env.STRIPE_PRO_PRODUCT_ID!) {
                            plan = "pro";
                        } else if (productId === process.env.STRIPE_PREMIUM_PRODUCT_ID!) {
                            plan = "premium";
                        } else if (productId === process.env.STRIPE_ULTRA_PRODUCT_ID!) {
                            plan = "ultra";
                        } else {
                            console.log(`Unknown product ID: ${productId}`);
                            return { success: false, error: `Unknown product ID: ${productId}` };
                        }

                        await runMutation(internal.users.updateSubscription, {
                            userId,
                            subscriptionId: subscription.id,
                            customerId: subscription.customer as string,
                            endsOn: currentPeriodEnd * 1000,
                            plan: plan,
                        });
                    }
                } catch (error) {
                    // Si falla en checkout.session.completed, no es crítico
                    // porque invoice.payment_succeeded lo manejará
                    console.log("Error in checkout.session.completed (will be handled by invoice.payment_succeeded):", error);
                    return { success: true };
                }
            }

            if (event.type === "invoice.payment_succeeded") {
                const invoice = event.data.object as any;

                if (!invoice.subscription) {
                    console.log("No subscription in invoice");
                    return { success: true };
                }

                const subscription = await stripe.subscriptions.retrieve(
                    invoice.subscription as string
                );

                if (subscription.items && subscription.items.data && subscription.items.data.length > 0) {
                    const firstSubscriptionItem = subscription.items.data[0];
                    const currentPeriodEnd = firstSubscriptionItem.current_period_end;

                    await runMutation(internal.users.updateSubscriptionById, {
                        subscriptionId: subscription.id,
                        endsOn: currentPeriodEnd * 1000,
                    });
                }
            }

            if (event.type === "customer.subscription.deleted") {
                const subscription = event.data.object as Stripe.Subscription;

                // Buscar el usuario por subscriptionId y resetear a plan free
                const user = await runQuery(internal.users.getUserBySubscriptionId, {
                    subscriptionId: subscription.id,
                });

                if (user) {
                    await runMutation(internal.users.cancelSubscription, {
                        userId: user._id,
                    });
                    console.log(`Subscription ${subscription.id} cancelled for user ${user._id}`);
                }
            }

            return { success: true };
        } catch (error) {
            console.log(error);
            return { success: false, error: (error as { message: string }).message };
        }
    },
});

export const billingPortal = action({
    args: {},
    handler: async (ctx, args) => {
        const user = await ctx.runQuery(api.users.getUserInfo, {});

        if (!user) {
            throw new Error("User not found");
        }

        if (!user.customerId) {
            throw new Error("User does not have a subscription");
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: "2025-09-30.clover"
        });

        const baseUrl = process.env.BASE_URL!;

        const session = await stripe.billingPortal.sessions.create({
            locale: "es",
            customer: user.customerId,
            return_url: `${baseUrl}/pricing`,
        })

        return session.url;
    },
});