/* One-shot check that the checkout pipeline prices a cart the way the shop
 * does, without contacting Stripe. Run with: node backend/scripts/verify-checkout.mjs */

import assert from "node:assert/strict";
import { validateCartItems } from "../shared/catalog.js";
import { createCheckoutSession } from "../shared/checkout-session.js";
import { corsHeaders } from "../shared/cors.js";

const config = {
    publicBaseUrl: "https://example.com",
    currency: "usd",
    shippingCents: 800,
    maxQtyPerLine: 20,
    maxCartLines: 30,
    allowedShippingCountries: ["US", "CA"],
    allowedOrigins: []
};
const limits = { maxCartLines: config.maxCartLines, maxQtyPerLine: config.maxQtyPerLine };

/* Stands in for the Stripe client so the params can be inspected. */
function stubStripe() {
    const calls = [];
    return {
        calls,
        checkout: {
            sessions: {
                create(params, options) {
                    calls.push({ params, options });
                    return Promise.resolve({ id: "cs_test_stub", url: "https://stripe.test/pay" });
                }
            }
        }
    };
}

function expectRejected(items, expected) {
    let message = "";
    try {
        validateCartItems(items, limits);
    } catch (err) {
        message = err.message;
    }
    assert.notEqual(message, "", `expected a rejection for ${JSON.stringify(items)}`);
    assert.ok(
        message.includes(expected),
        `expected "${expected}" in rejection, got "${message}"`
    );
    console.log(`  rejected: ${message}`);
}

console.log("pricing");
const lines = validateCartItems(
    [
        { id: "shirt1", size: "M", color: "snow", material: "snow-washed", qty: 1 },
        { id: "shirt1", size: "L", color: "snow", material: "essential-cotton", qty: 2 },
        { id: "print1", size: "", color: "", material: "", qty: 3 }
    ],
    limits
);
assert.equal(lines[0].priceCents, 3600);
assert.equal(lines[1].priceCents, 3000);
assert.equal(lines[2].priceCents, 1500);
console.log("  snow-washed 3600, essential cotton 3000, print 1500");

console.log("client-sent prices are ignored");
const tampered = validateCartItems(
    [{ id: "shirt1", size: "M", color: "snow", material: "snow-washed", qty: 1, priceCents: 1 }],
    limits
);
assert.equal(tampered[0].priceCents, 3600);
console.log("  priceCents: 1 in request still charged 3600");

console.log("legacy lines with no variant fall back to defaults");
const legacy = validateCartItems([{ id: "shirt1", size: "M", qty: 1 }], limits);
assert.equal(legacy[0].colorId, "snow");
assert.equal(legacy[0].materialId, "snow-washed");
assert.equal(legacy[0].priceCents, 3600);
console.log("  resolved to snow / snow-washed at 3600");

console.log("invalid lines");
expectRejected([{ id: "nope", size: "M", qty: 1 }], "Unknown product");
expectRejected([{ id: "shirt1", size: "XXL", qty: 1 }], "needs a valid size");
expectRejected([{ id: "print1", size: "M", qty: 1 }], "does not use sizes");
expectRejected([{ id: "shirt1", size: "M", qty: 0 }], "Invalid quantity");
expectRejected([{ id: "shirt1", size: "M", qty: 999 }], "Invalid quantity");
expectRejected(
    [{ id: "shirt1", size: "M", color: "chartreuse", material: "snow-washed", qty: 1 }],
    "no longer offered in that color"
);
expectRejected(
    [{ id: "shirt1", size: "M", color: "green", material: "essential-cotton", qty: 1 }],
    "not available in that combination"
);
expectRejected([{ id: "print1", color: "snow", qty: 1 }], "does not come in different colors");
expectRejected([], "cart is empty");

console.log("session params");
const stripe = stubStripe();
await createCheckoutSession({ stripe, config, lines, idempotencyKey: "key-1" });
const { params, options } = stripe.calls[0];
assert.equal(options.idempotencyKey, "key-1");
assert.equal(params.mode, "payment");
assert.equal(params.line_items.length, 3);
assert.equal(params.line_items[0].price_data.unit_amount, 3600);
assert.equal(
    params.line_items[0].price_data.product_data.name,
    "doodler (M) \u2014 snow / oversized snow washed"
);
assert.deepEqual(params.line_items[0].price_data.product_data.metadata, {
    product_id: "shirt1",
    size: "M",
    color: "snow",
    material: "snow-washed"
});
assert.deepEqual(params.line_items[0].price_data.product_data.images, [
    "https://example.com/assets/shop/mockups/oversized snow washed /doodler/SW_doodler00001.png"
]);
assert.equal(params.line_items[2].price_data.product_data.name, "Cyanotype");
assert.equal(params.shipping_options[0].shipping_rate_data.fixed_amount.amount, 800);
assert.equal(params.success_url, "https://example.com/shop/cart/success.html?session_id={CHECKOUT_SESSION_ID}");
assert.equal(params.cancel_url, "https://example.com/shop/cart/cart.html?canceled=1");
console.log("  name: " + params.line_items[0].price_data.product_data.name);
console.log("  cart metadata: " + params.metadata.cart);
assert.ok(params.metadata.cart.length <= 500);

console.log("localhost images are omitted");
const localStripe = stubStripe();
await createCheckoutSession({
    stripe: localStripe,
    config: { ...config, publicBaseUrl: "http://localhost:3000" },
    lines,
    idempotencyKey: ""
});
assert.equal(localStripe.calls[0].options, undefined);
assert.equal(localStripe.calls[0].params.line_items[0].price_data.product_data.images, undefined);
console.log("  no images sent, no idempotency key sent");

console.log("cross-origin access");
assert.equal(corsHeaders("https://everythingburger.studio", config), null);
const shared = { ...config, allowedOrigins: ["https://everythingburger.studio"] };
assert.equal(corsHeaders("", shared), null);
assert.equal(corsHeaders("https://evil.example", shared), null);
const allowed = corsHeaders("https://everythingburger.studio/", shared);
assert.equal(allowed["access-control-allow-origin"], "https://everythingburger.studio");
assert.equal(allowed.vary, "Origin");
console.log("  off by default, allowlisted origin echoed back, others refused");

console.log("\nall checks passed");
