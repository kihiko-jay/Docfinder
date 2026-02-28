import { onCall, onRequest } from "firebase-functions/v2/https";
import axios from "axios";
import { db } from "./firebase.js";
import { normalizeKenyanPhone, requireField } from "./utils/validation.js";

const MPESA_BASE_URL = "https://sandbox.safaricom.co.ke";

const getAccessToken = async (): Promise<string> => {
  const consumerKey = requireField(process.env.MPESA_CONSUMER_KEY, "MPESA_CONSUMER_KEY");
  const consumerSecret = requireField(
    process.env.MPESA_CONSUMER_SECRET,
    "MPESA_CONSUMER_SECRET"
  );
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
  const response = await axios.get(
    `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: { Authorization: `Basic ${auth}` },
    }
  );
  return response.data.access_token;
};

export const initiateMpesaPayment = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new Error("Unauthenticated");
  }
  const phoneNumber = normalizeKenyanPhone(
    requireField(request.data?.phoneNumber, "phoneNumber")
  );
  const amount = requireField(request.data?.amount, "amount");
  const documentId = requireField(request.data?.documentId, "documentId");
  const userId = request.auth.uid;

  const accessToken = await getAccessToken();
  const shortcode = requireField(process.env.MPESA_SHORTCODE, "MPESA_SHORTCODE");
  const passkey = requireField(process.env.MPESA_PASSKEY, "MPESA_PASSKEY");
  const callbackUrl = requireField(
    process.env.MPESA_CALLBACK_URL,
    "MPESA_CALLBACK_URL"
  );

  const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");

  const stkResponse = await axios.post(
    `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
    {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: shortcode,
      PhoneNumber: phoneNumber,
      CallBackURL: callbackUrl,
      AccountReference: documentId,
      TransactionDesc: "Kenya Lost & Found unlock",
    },
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  const paymentRef = db.collection("payments").doc();
  await paymentRef.set({
    id: paymentRef.id,
    documentId,
    amount,
    method: "mpesa",
    status: "pending",
    transactionId: stkResponse.data.CheckoutRequestID,
    userId,
    createdAt: Date.now(),
  });

  return {
    paymentId: paymentRef.id,
    checkoutRequestId: stkResponse.data.CheckoutRequestID,
    merchantRequestId: stkResponse.data.MerchantRequestID,
  };
});

export const mpesaCallback = onRequest(async (req, res) => {
  try {
    const callback = req.body?.Body?.stkCallback;
    if (!callback) {
      res.status(400).json({ error: "Invalid callback payload" });
      return;
    }

    const checkoutRequestId = callback.CheckoutRequestID;
    const resultCode = callback.ResultCode;
    const isSuccess = resultCode === 0;

    const paymentQuery = await db
      .collection("payments")
      .where("transactionId", "==", checkoutRequestId)
      .limit(1)
      .get();

    if (!paymentQuery.empty) {
      const paymentDoc = paymentQuery.docs[0];
      const paymentData = paymentDoc.data();

      await paymentDoc.ref.update({
        status: isSuccess ? "completed" : "failed",
        completedAt: Date.now(),
      });

      if (isSuccess) {
        await db.collection("unlocked_contacts").add({
          userId: paymentData.userId,
          documentId: paymentData.documentId,
          paymentId: paymentDoc.id,
          unlockedAt: Date.now(),
        });
      }
    }

    res.json({ status: "ok" });
  } catch (error) {
    console.error("M-Pesa callback error", error);
    res.status(500).json({ error: "Callback processing failed" });
  }
});
