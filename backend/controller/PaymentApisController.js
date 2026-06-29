const crypto = require("crypto");
const Stripe = require("stripe");
const Razorpay = require("razorpay");

const GATEWAY_STRIPE = 1;
const GATEWAY_RAZORPAY = 2;
const CURRENCY_DEFAULT = "INR";

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeType(type) {
  return toNumber(type, 0);
}

function normalizeCurrency(currency) {
  return String(currency || CURRENCY_DEFAULT).toUpperCase();
}

function amountToSmallestUnit(amount) {
  const value = toNumber(amount, 0);
  return Math.round(value * 100);
}

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("Missing STRIPE_SECRET_KEY in environment");
  return new Stripe(secretKey);
}

function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("Missing RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET in environment");
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

function getGatewayTypeFromReq(req) {
  return normalizeType(req.body?.type || req.query?.type);
}

function requireType(type) {
  if (![GATEWAY_STRIPE, GATEWAY_RAZORPAY].includes(type)) {
    throw new Error("Invalid type. Use type=1 for Stripe, type=2 for Razorpay");
  }
}

function makeReference(prefix = "PAY") {
  const ts = Date.now();
  const rand = Math.floor(Math.random() * 100000);
  return `${prefix}_${ts}_${rand}`;
}

function parsePagination(req) {
  const limit = Math.min(Math.max(toNumber(req.query?.limit, 10), 1), 100);
  const offset = Math.max(toNumber(req.query?.offset, 0), 0);
  return { limit, offset };
}

const PaymentApisController = {
  // Health endpoint to check if API keys are loaded.
  health: async (req, res) => {
    try {
      const type = getGatewayTypeFromReq(req);
      requireType(type);

      if (type === GATEWAY_STRIPE) {
        getStripeClient();
        return res.status(200).json({
          message: "Stripe payment gateway is configured",
          data: { type: GATEWAY_STRIPE, provider: "stripe" },
        });
      }

      getRazorpayClient();
      return res.status(200).json({
        message: "Razorpay payment gateway is configured",
        data: { type: GATEWAY_RAZORPAY, provider: "razorpay" },
      });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  },

  // Create customer on selected gateway.
  createCustomer: async (req, res) => {
    try {
      const type = getGatewayTypeFromReq(req);
      requireType(type);

      const { email, name, phone, customerId, metadata = {} } = req.body || {};
      if (!email && !customerId) {
        return res.status(400).json({ message: "email or customerId is required" });
      }

      if (type === GATEWAY_STRIPE) {
        const stripe = getStripeClient();
        const customer = await stripe.customers.create({
          email: email || undefined,
          name: name || undefined,
          phone: phone || undefined,
          metadata: metadata || {},
        });
        return res.status(201).json({ message: "Stripe customer created", data: customer });
      }

      // Razorpay supports customer creation via API.
      const razorpay = getRazorpayClient();
      const customer = await razorpay.customers.create({
        name: name || "Customer",
        email: email || undefined,
        contact: phone || undefined,
        fail_existing: "0",
        notes: metadata || {},
      });
      return res.status(201).json({ message: "Razorpay customer created", data: customer });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // One-time payment intent/order creation.
  createOneTimePayment: async (req, res) => {
    try {
      const type = getGatewayTypeFromReq(req);
      requireType(type);

      const {
        amount,
        currency = CURRENCY_DEFAULT,
        customerId,
        customerEmail,
        paymentMethodId,
        receipt,
        metadata = {},
      } = req.body || {};

      const smallestAmount = amountToSmallestUnit(amount);
      if (smallestAmount <= 0) return res.status(400).json({ message: "amount must be greater than 0" });

      if (type === GATEWAY_STRIPE) {
        const stripe = getStripeClient();
        const paymentIntent = await stripe.paymentIntents.create({
          amount: smallestAmount,
          currency: normalizeCurrency(currency).toLowerCase(),
          customer: customerId || undefined,
          payment_method: paymentMethodId || undefined,
          receipt_email: customerEmail || undefined,
          metadata: metadata || {},
          automatic_payment_methods: { enabled: true },
          confirm: Boolean(paymentMethodId),
        });
        return res.status(201).json({
          message: "Stripe one-time payment intent created",
          data: paymentIntent,
        });
      }

      const razorpay = getRazorpayClient();
      const order = await razorpay.orders.create({
        amount: smallestAmount,
        currency: normalizeCurrency(currency),
        receipt: receipt || makeReference("ORD"),
        notes: metadata || {},
      });
      return res.status(201).json({
        message: "Razorpay one-time order created",
        data: order,
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // Purchase endpoint (alias/wrapper): supports one-time and plan purchase.
  purchase: async (req, res) => {
    try {
      const mode = String(req.body?.mode || "onetime").toLowerCase();
      if (mode === "subscription") {
        return PaymentApisController.createSubscription(req, res);
      }
      return PaymentApisController.createOneTimePayment(req, res);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // Create subscription for Stripe or Razorpay.
  createSubscription: async (req, res) => {
    try {
      const type = getGatewayTypeFromReq(req);
      requireType(type);

      const {
        customerId,
        priceId, // Stripe price ID
        planId, // Razorpay plan ID
        quantity = 1,
        paymentMethodId,
        trialPeriodDays,
        totalCount = 12,
        startAt,
        metadata = {},
      } = req.body || {};

      if (type === GATEWAY_STRIPE) {
        if (!customerId || !priceId) {
          return res.status(400).json({ message: "customerId and priceId are required for Stripe subscription" });
        }

        const stripe = getStripeClient();
        if (paymentMethodId) {
          await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
          await stripe.customers.update(customerId, {
            invoice_settings: { default_payment_method: paymentMethodId },
          });
        }

        const subscription = await stripe.subscriptions.create({
          customer: customerId,
          items: [{ price: priceId, quantity: Math.max(toNumber(quantity, 1), 1) }],
          payment_behavior: "default_incomplete",
          payment_settings: { save_default_payment_method: "on_subscription" },
          expand: ["latest_invoice.payment_intent"],
          trial_period_days: Number.isFinite(Number(trialPeriodDays)) ? Number(trialPeriodDays) : undefined,
          metadata: metadata || {},
        });

        return res.status(201).json({ message: "Stripe subscription created", data: subscription });
      }

      if (!planId) {
        return res.status(400).json({ message: "planId is required for Razorpay subscription" });
      }

      const razorpay = getRazorpayClient();
      const subscription = await razorpay.subscriptions.create({
        plan_id: planId,
        customer_notify: 1,
        quantity: Math.max(toNumber(quantity, 1), 1),
        total_count: Math.max(toNumber(totalCount, 1), 1),
        start_at: Number.isFinite(Number(startAt)) ? Number(startAt) : undefined,
        notes: metadata || {},
      });
      return res.status(201).json({ message: "Razorpay subscription created", data: subscription });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // Cancel a subscription.
  cancelSubscription: async (req, res) => {
    try {
      const type = getGatewayTypeFromReq(req);
      requireType(type);

      const { subscriptionId, cancelAtPeriodEnd = false } = req.body || {};
      if (!subscriptionId) return res.status(400).json({ message: "subscriptionId is required" });

      if (type === GATEWAY_STRIPE) {
        const stripe = getStripeClient();
        const cancelled = await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: Boolean(cancelAtPeriodEnd),
        });
        return res.status(200).json({ message: "Stripe subscription updated/cancelled", data: cancelled });
      }

      const razorpay = getRazorpayClient();
      const cancelled = await razorpay.subscriptions.cancel(subscriptionId, {
        cancel_at_cycle_end: Boolean(cancelAtPeriodEnd),
      });
      return res.status(200).json({ message: "Razorpay subscription cancelled", data: cancelled });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // Resume paused/hold subscriptions where supported.
  resumeSubscription: async (req, res) => {
    try {
      const type = getGatewayTypeFromReq(req);
      requireType(type);

      const { subscriptionId } = req.body || {};
      if (!subscriptionId) return res.status(400).json({ message: "subscriptionId is required" });

      if (type === GATEWAY_STRIPE) {
        // Stripe does not have generic resume endpoint for all states;
        // if canceled, a new subscription is typically created.
        return res.status(400).json({
          message: "Stripe resume is not generic. Create a new subscription if it is already canceled.",
        });
      }

      const razorpay = getRazorpayClient();
      const resumed = await razorpay.subscriptions.resume(subscriptionId, { resume_at: "now" });
      return res.status(200).json({ message: "Razorpay subscription resumed", data: resumed });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // Get payment/subscription status.
  getStatus: async (req, res) => {
    try {
      const type = getGatewayTypeFromReq(req);
      requireType(type);

      const { paymentIntentId, orderId, paymentId, subscriptionId } = req.query || {};
      if (type === GATEWAY_STRIPE) {
        const stripe = getStripeClient();
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          return res.status(200).json({ message: "Stripe subscription status fetched", data: subscription });
        }
        if (!paymentIntentId) {
          return res.status(400).json({ message: "paymentIntentId or subscriptionId is required for Stripe" });
        }
        const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
        return res.status(200).json({ message: "Stripe payment status fetched", data: pi });
      }

      const razorpay = getRazorpayClient();
      if (subscriptionId) {
        const subscription = await razorpay.subscriptions.fetch(subscriptionId);
        return res.status(200).json({ message: "Razorpay subscription status fetched", data: subscription });
      }
      if (paymentId) {
        const payment = await razorpay.payments.fetch(paymentId);
        return res.status(200).json({ message: "Razorpay payment status fetched", data: payment });
      }
      if (!orderId) {
        return res.status(400).json({ message: "orderId, paymentId or subscriptionId is required for Razorpay" });
      }
      const order = await razorpay.orders.fetch(orderId);
      return res.status(200).json({ message: "Razorpay order status fetched", data: order });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // Verify payment signatures (important for Razorpay callbacks).
  verifyPayment: async (req, res) => {
    try {
      const type = getGatewayTypeFromReq(req);
      requireType(type);

      if (type === GATEWAY_STRIPE) {
        // Stripe verification should use webhook signature on raw body.
        return res.status(400).json({
          message: "Use verifyWebhook for Stripe signature validation",
        });
      }

      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({
          message: "razorpay_order_id, razorpay_payment_id and razorpay_signature are required",
        });
      }

      const secret = process.env.RAZORPAY_KEY_SECRET;
      if (!secret) return res.status(400).json({ message: "Missing RAZORPAY_KEY_SECRET in environment" });

      const generatedSignature = crypto
        .createHmac("sha256", secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      const verified = generatedSignature === razorpay_signature;
      return res.status(200).json({
        message: verified ? "Razorpay payment verified" : "Razorpay signature mismatch",
        data: { verified, generatedSignature },
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // Create refund for successful payment.
  createRefund: async (req, res) => {
    try {
      const type = getGatewayTypeFromReq(req);
      requireType(type);

      const { paymentIntentId, paymentId, amount, metadata = {} } = req.body || {};
      const amountSmallest = amount ? amountToSmallestUnit(amount) : undefined;

      if (type === GATEWAY_STRIPE) {
        if (!paymentIntentId) return res.status(400).json({ message: "paymentIntentId is required for Stripe refund" });
        const stripe = getStripeClient();
        const refund = await stripe.refunds.create({
          payment_intent: paymentIntentId,
          amount: amountSmallest,
          metadata: metadata || {},
        });
        return res.status(201).json({ message: "Stripe refund created", data: refund });
      }

      if (!paymentId) return res.status(400).json({ message: "paymentId is required for Razorpay refund" });
      const razorpay = getRazorpayClient();
      const refund = await razorpay.payments.refund(paymentId, {
        amount: amountSmallest,
        notes: metadata || {},
      });
      return res.status(201).json({ message: "Razorpay refund created", data: refund });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // List subscriptions/plans quickly for dashboard integrations.
  listResources: async (req, res) => {
    try {
      const type = getGatewayTypeFromReq(req);
      requireType(type);
      const resource = String(req.query?.resource || "subscriptions").toLowerCase();
      const { limit, offset } = parsePagination(req);

      if (type === GATEWAY_STRIPE) {
        const stripe = getStripeClient();
        if (resource === "prices") {
          const data = await stripe.prices.list({ limit: Math.min(limit, 100), active: true });
          return res.status(200).json({ message: "Stripe prices fetched", data });
        }
        if (resource === "products") {
          const data = await stripe.products.list({ limit: Math.min(limit, 100), active: true });
          return res.status(200).json({ message: "Stripe products fetched", data });
        }
        const data = await stripe.subscriptions.list({ limit: Math.min(limit, 100) });
        return res.status(200).json({ message: "Stripe subscriptions fetched", data });
      }

      const razorpay = getRazorpayClient();
      if (resource === "plans") {
        const data = await razorpay.plans.all({ count: limit, skip: offset });
        return res.status(200).json({ message: "Razorpay plans fetched", data });
      }
      if (resource === "payments") {
        const data = await razorpay.payments.all({ count: limit, skip: offset });
        return res.status(200).json({ message: "Razorpay payments fetched", data });
      }
      const data = await razorpay.subscriptions.all({ count: limit, skip: offset });
      return res.status(200).json({ message: "Razorpay subscriptions fetched", data });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // Webhook verification and event parsing.
  verifyWebhook: async (req, res) => {
    try {
      const type = getGatewayTypeFromReq(req);
      requireType(type);

      if (type === GATEWAY_STRIPE) {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!webhookSecret) return res.status(400).json({ message: "Missing STRIPE_WEBHOOK_SECRET in environment" });

        const stripe = getStripeClient();
        const signature = req.headers["stripe-signature"];
        if (!signature) return res.status(400).json({ message: "Missing stripe-signature header" });

        const event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
        return res.status(200).json({
          message: "Stripe webhook verified",
          data: { eventId: event.id, eventType: event.type },
        });
      }

      const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
      if (!secret) return res.status(400).json({ message: "Missing RAZORPAY_WEBHOOK_SECRET in environment" });

      const signature = req.headers["x-razorpay-signature"];
      if (!signature) return res.status(400).json({ message: "Missing x-razorpay-signature header" });

      const bodyString = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
      const expected = crypto.createHmac("sha256", secret).update(bodyString).digest("hex");
      const verified = signature === expected;
      if (!verified) return res.status(400).json({ message: "Invalid Razorpay webhook signature" });

      return res.status(200).json({
        message: "Razorpay webhook verified",
        data: { event: req.body?.event || "unknown" },
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // Optional utility endpoint to expose publishable key to frontend.
  getPublicConfig: async (req, res) => {
    try {
      const type = getGatewayTypeFromReq(req);
      requireType(type);

      if (type === GATEWAY_STRIPE) {
        return res.status(200).json({
          message: "Stripe public config",
          data: {
            type: GATEWAY_STRIPE,
            provider: "stripe",
            publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "",
          },
        });
      }

      return res.status(200).json({
        message: "Razorpay public config",
        data: {
          type: GATEWAY_RAZORPAY,
          provider: "razorpay",
          keyId: process.env.RAZORPAY_KEY_ID || "",
        },
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
};

module.exports = PaymentApisController;
