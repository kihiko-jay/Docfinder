import { config as loadEnv } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load root .env when running in emulator (compiled output is in backend/lib/, so root is ../..)
loadEnv({ path: path.resolve(__dirname, "../../.env") });

export { extractDocument } from "./extractDocument.js";
export { initiateMpesaPayment, mpesaCallback } from "./mpesa.js";
export { createPaymentIntent, stripeWebhook } from "./stripe.js";
export { createDocument } from "./createDocument.js";
export { createAlert } from "./createAlert.js";
export { createFeedback } from "./createFeedback.js";
export { getContact } from "./getContact.js";
