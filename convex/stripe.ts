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

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;

        const priceId = args.plan === "pro" ? process.env.STRIPE_PRO_PRICE_ID! : process.env.STRIPE_PREMIUM_PRICE_ID!;

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
            const completedEvent = event.data.object as Stripe.Checkout.Session & {
                metadata: Metadata;
            }

            if (event.type === "checkout.session.completed") {
                const subscription = await stripe.subscriptions.retrieve(
                    completedEvent.subscription as string
                )

                if (subscription.items && subscription.items.data && subscription.items.data.length > 0) {
                    const firstSubscriptionItem = subscription.items.data[0];
                    const currentPeriodEnd = firstSubscriptionItem.current_period_end;

                    const userId = completedEvent.metadata.userId;

                    let plan = subscription.items.data[0].plan.product as string;

                    if (plan === process.env.STRIPE_PRO_PRODUCT_ID!) {
                        plan = "pro";
                    } else if (plan === process.env.STRIPE_PREMIUM_PRODUCT_ID!) {
                        plan = "premium";
                    }

                    await runMutation(internal.users.updateSubscription, {
                        userId,
                        subscriptionId: subscription.id,
                        customerId: subscription.customer as string,
                        endsOn: currentPeriodEnd * 1000,
                        plan: plan,
                    });
                }
            }

            if (event.type === "invoice.payment_succeeded") {
                const subscription = await stripe.subscriptions.retrieve(
                    completedEvent.subscription as string
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

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;

        const session = await stripe.billingPortal.sessions.create({
            locale: "es",
            customer: user.customerId,
            return_url: `${baseUrl}/pricing`,
        })

        return session.url;
    },
});