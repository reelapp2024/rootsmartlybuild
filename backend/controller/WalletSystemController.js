const mongoose = require("mongoose");
const CreditWallet = require("../models/CreditWallet");
const CreditTransaction = require("../models/CreditTransaction");
const SubscriptionPlan = require("../models/SubscriptionPlanV2");
const UserSubscription = require("../models/UserSubscription");
const CreditPackage = require("../models/CreditPackage");
const Order = require("../models/OrderV2");
const Service = require("../models/ServicePlugin");
const ServicePurchase = require("../models/ServicePurchase");
const Offer = require("../models/OfferV2");
const Coupon = require("../models/Coupon");
const User = require("../models/users");
const CreditSystemConfig = require("../models/CreditSystemConfig");

async function ensureWallet(userId) {
  let wallet = await CreditWallet.findOne({ user_id: userId });
  if (!wallet) wallet = await CreditWallet.create({ user_id: userId });
  return wallet;
}

async function applyWalletTransaction({
  userId,
  type,
  amount,
  source,
  referenceId = null,
  meta = {},
}) {
  const wallet = await ensureWallet(userId);
  const amt = Math.max(0, Number(amount || 0));
  if (type === "debit" && wallet.balance < amt) {
    throw new Error("Insufficient credits");
  }
  const balanceAfter = type === "credit" ? wallet.balance + amt : wallet.balance - amt;
  wallet.balance = balanceAfter;
  if (type === "credit") wallet.total_earned += amt;
  else wallet.total_spent += amt;
  await wallet.save();

  const tx = await CreditTransaction.create({
    user_id: userId,
    type,
    amount: amt,
    source,
    reference_id: referenceId,
    balance_after: balanceAfter,
    meta,
  });
  return { wallet, tx };
}

async function getSystemConfig() {
  const cfg = await CreditSystemConfig.findOneAndUpdate(
    { key: "default" },
    {
      $setOnInsert: {
        usd_to_credits: 100,
        min_credits_for_website_creation: 10,
        freepik_credits_per_image: 1,
        nanobanana_credits_per_image: 1,
        openai_input_credits_per_1k_tokens: 0.5,
        openai_output_credits_per_1k_tokens: 1,
      },
    },
    { upsert: true, new: true }
  ).lean();
  return cfg;
}

function getHttpStatusFromError(e) {
  const msg = String(e?.message || "").toLowerCase();
  if (msg.includes("unauthorized")) return 401;
  if (msg.includes("forbidden")) return 403;
  return 500;
}

function applyDiscount(baseAmount, offer, coupon) {
  const base = Math.max(0, Number(baseAmount || 0));
  let offerDiscount = 0;
  if (offer) {
    offerDiscount = offer.type === "percentage"
      ? (base * Number(offer.value || 0)) / 100
      : Number(offer.value || 0);
  }
  let couponDiscount = 0;
  if (coupon) {
    couponDiscount = coupon.type === "percentage"
      ? (base * Number(coupon.value || 0)) / 100
      : Number(coupon.value || 0);
  }
  const totalDiscount = Math.min(base, Math.max(0, offerDiscount) + Math.max(0, couponDiscount));
  return { totalDiscount, finalAmount: Math.max(0, base - totalDiscount) };
}

const WalletSystemController = {
  _assertSuper: async (req) => {
    const userId = req.user?.userId;
    if (!userId || !mongoose.isValidObjectId(userId)) throw new Error("Unauthorized");
    const u = await User.findById(userId).select("isSuper").lean();
    if (Number(u?.isSuper || 0) !== 1) throw new Error("Forbidden");
  },

  walletDashboard: async (req, res) => {
    try {
      const userId = req.user?.userId;
      const wallet = await ensureWallet(userId);
      const transactions = await CreditTransaction.find({ user_id: userId })
        .sort({ created_at: -1 })
        .limit(100)
        .lean();
      return res.status(200).json({ message: "ok", data: { wallet, transactions } });
    } catch (e) {
      return res.status(500).json({ message: e.message });
    }
  },

  getSystemConfig: async (_req, res) => {
    try {
      const config = await getSystemConfig();
      return res.status(200).json({ message: "ok", data: config });
    } catch (e) {
      return res.status(500).json({ message: e.message });
    }
  },

  updateSystemConfig: async (req, res) => {
    try {
      await WalletSystemController._assertSuper(req);
      const usdToCredits = Number(req.body?.usd_to_credits);
      const minCredits = Number(req.body?.min_credits_for_website_creation);
      const freepikPerImage = Number(req.body?.freepik_credits_per_image);
      const nanobananaPerImage = Number(req.body?.nanobanana_credits_per_image);
      const openaiInputPer1k = Number(req.body?.openai_input_credits_per_1k_tokens);
      const openaiOutputPer1k = Number(req.body?.openai_output_credits_per_1k_tokens);
      const payload = {};
      if (Number.isFinite(usdToCredits) && usdToCredits > 0) payload.usd_to_credits = usdToCredits;
      if (Number.isFinite(minCredits) && minCredits >= 0) payload.min_credits_for_website_creation = minCredits;
      if (Number.isFinite(freepikPerImage) && freepikPerImage >= 0) payload.freepik_credits_per_image = freepikPerImage;
      if (Number.isFinite(nanobananaPerImage) && nanobananaPerImage >= 0) payload.nanobanana_credits_per_image = nanobananaPerImage;
      if (Number.isFinite(openaiInputPer1k) && openaiInputPer1k >= 0) payload.openai_input_credits_per_1k_tokens = openaiInputPer1k;
      if (Number.isFinite(openaiOutputPer1k) && openaiOutputPer1k >= 0) payload.openai_output_credits_per_1k_tokens = openaiOutputPer1k;
      if (!Object.keys(payload).length) {
        return res.status(400).json({
          message: "Provide at least one valid config value",
        });
      }
      const defaultInsert = {
        usd_to_credits: 100,
        min_credits_for_website_creation: 10,
        freepik_credits_per_image: 1,
        nanobanana_credits_per_image: 1,
        openai_input_credits_per_1k_tokens: 0.5,
        openai_output_credits_per_1k_tokens: 1,
      };
      // Avoid Mongo conflict when same key appears in both $set and $setOnInsert.
      for (const k of Object.keys(payload)) {
        if (Object.prototype.hasOwnProperty.call(defaultInsert, k)) {
          delete defaultInsert[k];
        }
      }
      const config = await CreditSystemConfig.findOneAndUpdate(
        { key: "default" },
        {
          $set: payload,
          $setOnInsert: defaultInsert,
        },
        { upsert: true, new: true }
      ).lean();
      return res.status(200).json({ message: "updated", data: config });
    } catch (e) {
      return res.status(getHttpStatusFromError(e)).json({ message: e.message });
    }
  },

  adminCreatePlan: async (req, res) => {
    try {
      await WalletSystemController._assertSuper(req);
      const plan = await SubscriptionPlan.create(req.body || {});
      return res.status(201).json({ message: "created", data: plan });
    } catch (e) {
      return res.status(500).json({ message: e.message });
    }
  },
  adminListPlans: async (req, res) => {
    await WalletSystemController._assertSuper(req);
    const plans = await SubscriptionPlan.find({}).sort({ created_at: -1 }).lean();
    return res.status(200).json({ message: "ok", data: plans });
  },
  adminCreatePackage: async (req, res) => {
    try {
      await WalletSystemController._assertSuper(req);
      const row = await CreditPackage.create(req.body || {});
      return res.status(201).json({ message: "created", data: row });
    } catch (e) {
      return res.status(500).json({ message: e.message });
    }
  },
  adminListPackages: async (req, res) => {
    await WalletSystemController._assertSuper(req);
    const rows = await CreditPackage.find({}).sort({ created_at: -1 }).lean();
    return res.status(200).json({ message: "ok", data: rows });
  },
  adminCreateService: async (req, res) => {
    try {
      await WalletSystemController._assertSuper(req);
      const row = await Service.create(req.body || {});
      return res.status(201).json({ message: "created", data: row });
    } catch (e) {
      return res.status(500).json({ message: e.message });
    }
  },
  adminListServices: async (req, res) => {
    await WalletSystemController._assertSuper(req);
    const rows = await Service.find({}).sort({ created_at: -1 }).lean();
    return res.status(200).json({ message: "ok", data: rows });
  },
  adminCreateOffer: async (req, res) => {
    try {
      await WalletSystemController._assertSuper(req);
      const row = await Offer.create(req.body || {});
      return res.status(201).json({ message: "created", data: row });
    } catch (e) {
      return res.status(500).json({ message: e.message });
    }
  },
  adminCreateCoupon: async (req, res) => {
    try {
      await WalletSystemController._assertSuper(req);
      const row = await Coupon.create(req.body || {});
      return res.status(201).json({ message: "created", data: row });
    } catch (e) {
      return res.status(500).json({ message: e.message });
    }
  },

  listCheckoutData: async (req, res) => {
    const plans = await SubscriptionPlan.find({ is_active: 1 }).lean();
    const packages = await CreditPackage.find({ is_active: 1 }).lean();
    const services = await Service.find({ is_active: 1 }).lean();
    const config = await getSystemConfig();
    return res.status(200).json({ message: "ok", data: { plans, packages, services, config } });
  },

  purchasePlan: async (req, res) => {
    try {
      const userId = req.user?.userId;
      const { plan_id, coupon_code = "", payment_mode = "money", credits_to_use = 0 } = req.body || {};
      const plan = await SubscriptionPlan.findById(plan_id).lean();
      if (!plan || plan.is_active !== 1) return res.status(404).json({ message: "Plan not found" });

      const now = new Date();
      const offer = await Offer.findOne({
        applicable_to: "plan",
        is_active: 1,
        $or: [{ target_ids: { $size: 0 } }, { target_ids: String(plan_id) }],
        $and: [{ $or: [{ valid_from: null }, { valid_from: { $lte: now } }] }, { $or: [{ valid_to: null }, { valid_to: { $gte: now } }] }],
      }).lean();
      const coupon = coupon_code ? await Coupon.findOne({ code: String(coupon_code).toUpperCase(), is_active: 1 }).lean() : null;

      const { totalDiscount, finalAmount } = applyDiscount(plan.price, offer, coupon);
      const maxCreditsUse = Math.max(0, Number(credits_to_use || 0));
      let creditsUsed = 0;
      let moneyPaid = finalAmount;
      if (payment_mode === "credits" || payment_mode === "mixed") {
        const wallet = await ensureWallet(userId);
        creditsUsed = payment_mode === "credits" ? Math.min(wallet.balance, finalAmount) : Math.min(wallet.balance, maxCreditsUse, finalAmount);
        moneyPaid = Math.max(0, finalAmount - creditsUsed);
      }

      const order = await Order.create({
        user_id: userId,
        total_amount: plan.price,
        credits_used: creditsUsed,
        money_paid: moneyPaid,
        status: "paid",
        payment_gateway: "dummy",
        item_type: "plan",
        item_id: plan._id,
      });

      if (creditsUsed > 0) {
        await applyWalletTransaction({
          userId,
          type: "debit",
          amount: creditsUsed,
          source: "subscription",
          referenceId: order._id,
          meta: { action: "plan_purchase_credits_part" },
        });
      }

      await applyWalletTransaction({
        userId,
        type: "credit",
        amount: Number(plan.credits_per_cycle || 0),
        source: "subscription",
        referenceId: order._id,
        meta: { action: "plan_purchase_credit_grant" },
      });

      await UserSubscription.create({
        user_id: userId,
        plan_id: plan._id,
        start_date: now,
        end_date: new Date(now.getTime() + Number(plan.validity_days || 30) * 24 * 60 * 60 * 1000),
        status: "active",
        next_billing_date: plan.billing_type === "one_time" ? null : new Date(now.getTime() + Number(plan.validity_days || 30) * 24 * 60 * 60 * 1000),
      });

      return res.status(200).json({ message: "plan purchased", data: { order, totalDiscount, finalAmount, creditsUsed, moneyPaid } });
    } catch (e) {
      return res.status(500).json({ message: e.message });
    }
  },

  purchasePackage: async (req, res) => {
    try {
      const userId = req.user?.userId;
      const { package_id } = req.body || {};
      const pack = await CreditPackage.findById(package_id).lean();
      if (!pack || pack.is_active !== 1) return res.status(404).json({ message: "Package not found" });

      const order = await Order.create({
        user_id: userId,
        total_amount: pack.price,
        credits_used: 0,
        money_paid: pack.price,
        status: "paid",
        payment_gateway: "dummy",
        item_type: "package",
        item_id: pack._id,
      });
      const { wallet } = await applyWalletTransaction({
        userId,
        type: "credit",
        amount: pack.credits,
        source: "purchase",
        referenceId: order._id,
      });
      return res.status(200).json({ message: "package purchased", data: { order, wallet } });
    } catch (e) {
      return res.status(500).json({ message: e.message });
    }
  },

  purchaseCreditsByAmount: async (req, res) => {
    try {
      const userId = req.user?.userId;
      const usdAmount = Math.max(0, Number(req.body?.usd_amount || 0));
      if (!usdAmount) return res.status(400).json({ message: "usd_amount is required" });

      const config = await getSystemConfig();
      const creditsToAdd = Number((usdAmount * Number(config.usd_to_credits || 0)).toFixed(3));
      if (creditsToAdd <= 0) return res.status(400).json({ message: "Calculated credits must be > 0" });

      const transactionId = `DUMMY-CREDIT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const order = await Order.create({
        user_id: userId,
        total_amount: usdAmount,
        credits_used: 0,
        money_paid: usdAmount,
        status: "paid",
        payment_gateway: "dummy",
        item_type: "package",
        item_id: "custom_usd_to_credits",
      });

      const { wallet, tx } = await applyWalletTransaction({
        userId,
        type: "credit",
        amount: creditsToAdd,
        source: "purchase",
        referenceId: order._id,
        meta: {
          transaction_id: transactionId,
          usd_amount: usdAmount,
          usd_to_credits: Number(config.usd_to_credits || 0),
          action: "custom_credit_purchase",
        },
      });

      await CreditTransaction.updateOne(
        { _id: tx._id },
        { $set: { transaction_id: transactionId } }
      );

      return res.status(200).json({
        message: "credits purchased",
        data: { order, transaction_id: transactionId, credits_added: creditsToAdd, wallet },
      });
    } catch (e) {
      return res.status(500).json({ message: e.message });
    }
  },

  purchaseService: async (req, res) => {
    try {
      const userId = req.user?.userId;
      const { service_id, paid_by = "money", credits_to_use = 0 } = req.body || {};
      const svc = await Service.findById(service_id).lean();
      if (!svc || svc.is_active !== 1) return res.status(404).json({ message: "Service not found" });

      let creditsUsed = 0;
      let moneyPaid = Number(svc.price || 0);
      if (paid_by === "credits") {
        creditsUsed = Number(svc.credit_cost || 0);
        moneyPaid = 0;
      } else if (paid_by === "mixed") {
        creditsUsed = Math.max(0, Number(credits_to_use || 0));
        moneyPaid = Math.max(0, Number(svc.price || 0) - creditsUsed);
      }

      const order = await Order.create({
        user_id: userId,
        total_amount: Number(svc.price || 0),
        credits_used: creditsUsed,
        money_paid: moneyPaid,
        status: "paid",
        payment_gateway: "dummy",
        item_type: "service",
        item_id: svc._id,
      });

      if (creditsUsed > 0) {
        await applyWalletTransaction({
          userId,
          type: "debit",
          amount: creditsUsed,
          source: "plugin",
          referenceId: order._id,
        });
      }

      const purchase = await ServicePurchase.create({
        user_id: userId,
        service_id: svc._id,
        order_id: order._id,
        paid_by,
        status: "active",
      });

      return res.status(200).json({ message: "service purchased", data: { order, purchase } });
    } catch (e) {
      return res.status(500).json({ message: e.message });
    }
  },

  runSubscriptionRenewal: async (_req, res) => {
    try {
      const now = new Date();
      const due = await UserSubscription.find({
        status: "active",
        next_billing_date: { $lte: now, $ne: null },
      }).lean();

      for (const sub of due) {
        const plan = await SubscriptionPlan.findById(sub.plan_id).lean();
        if (!plan || plan.is_active !== 1) continue;
        await applyWalletTransaction({
          userId: sub.user_id,
          type: "credit",
          amount: Number(plan.credits_per_cycle || 0),
          source: "subscription",
          referenceId: sub._id,
          meta: { action: "renewal" },
        });
        await UserSubscription.updateOne(
          { _id: sub._id },
          { $set: { next_billing_date: new Date(now.getTime() + Number(plan.validity_days || 30) * 24 * 60 * 60 * 1000) } }
        );
      }
      return res.status(200).json({ message: "renewal processed", count: due.length });
    } catch (e) {
      return res.status(500).json({ message: e.message });
    }
  },
};

module.exports = WalletSystemController;

