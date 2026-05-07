import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config({ override: true });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "",
  });

  // API Routes
  app.get("/api/config", (req, res) => {
    res.json({
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder"
    });
  });

  app.post("/api/create-order", async (req, res) => {
    try {
      const keyId = process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;

      if (!keyId || !keySecret) {
        console.error("Razorpay Keys are missing in environment variables.");
        return res.status(500).json({ error: "Razorpay keys not configured on server." });
      }

      console.log(`Initialising order with Key ID starting: ${keyId.substring(0, 8)}...`);

      const options = {
        amount: 500, // INR 5.00 in paise
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      };

      const order = await razorpay.orders.create(options);
      console.log("Order created successfully:", order.id);
      res.json(order);
    } catch (error: any) {
      console.error("Razorpay Order Error Details:", JSON.stringify(error, null, 2));
      res.status(500).json({ 
        error: "Failed to create order", 
        message: error.description || error.message || "Unknown error",
        code: error.code
      });
    }
  });

  app.post("/api/verify-payment", (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    console.log("Verifying payment:", razorpay_payment_id);

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ status: "error", message: "Key secret missing" });
    }

    const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest("hex");

    if (digest === razorpay_signature) {
      console.log("Payment verified successfully");
      res.json({ status: "ok" });
    } else {
      console.warn("Payment verification failed - signature mismatch");
      res.status(400).json({ status: "invalid" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
