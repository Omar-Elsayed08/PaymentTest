(function () {
    "use strict";

    var statusEl = document.querySelector("[data-checkout-status]");
    var checkout = window.EBCheckout;
    var cart = window.EBCart;

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function setStatus(html) {
        if (statusEl) {
            statusEl.innerHTML = html;
        }
    }

    function sessionIdFromUrl() {
        return new URLSearchParams(window.location.search).get("session_id") || "";
    }

    if (!checkout) {
        setStatus("Checkout is not loaded.");
        return;
    }

    checkout.getSession(sessionIdFromUrl()).then(function (session) {
        if (!session.paid) {
            setStatus("Payment is not complete yet. If you were charged, contact us with your order email.");
            return;
        }
        if (cart && typeof cart.clear === "function") {
            cart.clear();
        }
        var extra = session.customerEmail
            ? " A receipt was sent to " + escapeHtml(session.customerEmail) + "."
            : "";
        setStatus("Payment received." + extra + ' <a href="../shop.html">Back to the shop</a>');
    }).catch(function (err) {
        setStatus(((err && err.message) || "Could not confirm payment.") + ' <a href="cart.html">Return to cart</a>');
    });
})();
