import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY ?? "";

export const hasStripe = Boolean(secretKey);

export const stripe = hasStripe ? new Stripe(secretKey) : null;
