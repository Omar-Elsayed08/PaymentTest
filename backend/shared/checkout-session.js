import { HttpError } from "./http-error.js";

function absoluteUrl(baseUrl, sitePath) {
    if (!sitePath) {
        return "";
    }
    if (/^https?:\/\//i.test(sitePath)) {
        return sitePath;
    }
    /* Mockup folder names contain spaces, which are invalid in URLs. */
    return baseUrl + encodeURI(sitePath);
}

function buildLineItems(lines, config) {
    return lines.map(({ product, size, qty, variant }) => {
        const imageUrl = absoluteUrl(config.publicBaseUrl, (variant && variant.imagePath) || product.imagePath);
        const details = [
            size,
            variant && variant.colorLabel,
            variant && variant.materialLabel
        ].filter(Boolean);
        const productData = {
            name: details.length ? `${product.title} (${details.join(", ")})` : product.title,
            metadata: {
                product_id: product.id,
                size,
                color: variant ? variant.color : "",
                material: variant ? variant.material : ""
            }
        };
        /* Stripe rejects non-public image URLs, so localhost is skipped. */
        if (imageUrl && !/^https?:\/\/(localhost|127\.0\.0\.1)/i.test(imageUrl)) {
            productData.images = [imageUrl];
        }
        return {
            quantity: qty,
            price_data: {
                currency: config.currency,
                unit_amount: variant ? variant.priceCents : product.priceCents,
                product_data: productData
            }
        };
    });
}

function buildShippingOptions(config) {
    const isFree = config.shippingCents <= 0;
    return [
        {
            shipping_rate_data: {
                type: "fixed_amount",
                display_name: isFree ? "Free shipping" : "Standard shipping",
                fixed_amount: { amount: config.shippingCents, currency: config.currency },
                delivery_estimate: {
                    minimum: { unit: "business_day", value: 5 },
                    maximum: { unit: "business_day", value: 10 }
                }
            }
        }
    ];
}

/* Stripe caps metadata values at 500 characters. */
function cartMetadata(lines) {
    const summary = lines
        .map(({ product, size, qty, variant }) => {
            const options = variant ? `:${variant.color || "-"}/${variant.material || "-"}` : "";
            return `${product.id}:${size || "-"}${options}x${qty}`;
        })
        .join(",");
    return { cart: summary.slice(0, 500) };
}

export async function createCheckoutSession({ stripe, config, lines, idempotencyKey }) {
    const metadata = cartMetadata(lines);
    const params = {
        mode: "payment",
        submit_type: "pay",
        billing_address_collection: "required",
        phone_number_collection: { enabled: true },
        shipping_address_collection: { allowed_countries: config.allowedShippingCountries },
        shipping_options: buildShippingOptions(config),
        line_items: buildLineItems(lines, config),
        success_url: `${config.publicBaseUrl}/shop/cart/success.html?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${config.publicBaseUrl}/shop/cart/cart.html?canceled=1`,
        metadata,
        payment_intent_data: { metadata }
    };

    const session = idempotencyKey
        ? await stripe.checkout.sessions.create(params, { idempotencyKey })
        : await stripe.checkout.sessions.create(params);

    if (!session.url) {
        throw new HttpError(502, "Stripe did not return a checkout URL.");
    }
    return session;
}

export function isCheckoutSessionId(id) {
    return typeof id === "string" && /^cs_(test|live)_[A-Za-z0-9_]{10,255}$/.test(id);
}

export async function getCheckoutSummary({ stripe, sessionId }) {
    if (!isCheckoutSessionId(sessionId)) {
        throw new HttpError(400, "Invalid checkout session.");
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return {
        id: session.id,
        paid: session.payment_status === "paid",
        status: session.status,
        paymentStatus: session.payment_status,
        amountTotal: session.amount_total,
        currency: session.currency,
        customerEmail: session.customer_details?.email || ""
    };
}
