"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatINR } from "@/lib/site";

export function DonateClientComponent() {
  const searchParams = useSearchParams();
  const [callerRef, setCallerRef] = useState<string>("DIRECT");
  const [amount, setAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [donorName, setDonorName] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorPan, setDonorPan] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const urlRef = searchParams.get("ref");
    if (urlRef) {
      const clean = urlRef.trim().toUpperCase();
      sessionStorage.setItem("antigravity_caller_ref", clean);
      setCallerRef(clean);
    } else {
      const stored = sessionStorage.getItem("antigravity_caller_ref");
      if (stored) setCallerRef(stored);
    }
  }, [searchParams]);

  const handlePayNow = async () => {
    const finalAmount = customAmount ? parseFloat(customAmount) : amount;
    if (!finalAmount || finalAmount < 10) {
      return alert("Please enter a valid donation amount (minimum ₹10).");
    }

    if (!donorName.trim()) {
      return alert("Please enter your name so the 25 boys can chant your name in morning prayers.");
    }

    if (!donorPhone.trim() || donorPhone.length < 10) {
      return alert("Please enter a valid 10-digit WhatsApp number to receive your 80G tax receipt.");
    }

    setLoading(true);

    try {
      const res = await fetch("/api/v1/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmount,
          callerRefId: callerRef,
          donorName,
          donorPhone,
          donorEmail,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to initialize checkout");

      // Load Razorpay script dynamically if missing
      if (typeof window !== "undefined" && !(window as any).Razorpay) {
        await new Promise((resolve) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = resolve;
          document.body.appendChild(script);
        });
      }

      if ((window as any).Razorpay && data.mode === "live") {
        const options = {
          key: data.keyId,
          amount: data.amount,
          currency: data.currency,
          name: "Janaseva Ashrama",
          description: "Birthday Seva & Meals for 25 Boys",
          order_id: data.orderId,
          prefill: {
            name: donorName,
            contact: donorPhone,
            email: donorEmail,
          },
          theme: { color: "#052F2C" },
          handler: async function (response: any) {
            // Trigger webhook attribution verification
            await fetch("/api/v1/webhooks/payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                event: "payment.captured",
                payload: {
                  payment: {
                    entity: {
                      id: response.razorpay_payment_id,
                      order_id: response.razorpay_order_id,
                      amount: data.amount,
                      currency: "INR",
                      status: "captured",
                      notes: {
                        caller_ref_id: callerRef,
                        donor_name: donorName,
                        donor_phone: donorPhone,
                      },
                    },
                  },
                },
              }),
            });
            setSuccess(true);
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        // Instant simulated demo payment verification
        await fetch("/api/v1/webhooks/payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "simulate_donation",
            callerRefId: callerRef,
            amount: finalAmount,
            donorName,
            donorPhone,
            paymentId: `pay_demo_${Date.now()}`,
          }),
        });
        setSuccess(true);
      }
    } catch (err: any) {
      alert("Payment processing error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-teal-900/10 text-center animate-fadeIn">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-100 text-3xl mx-auto mb-4">
          🙏
        </div>
        <h2 className="font-display text-2xl font-bold text-teal-950">
          Dhanyavadagalu, {donorName}!
        </h2>
        <p className="mt-2 text-sm text-teal-950/75 leading-relaxed">
          Your auspicious birthday contribution of{" "}
          <strong className="text-teal-950 font-black">
            {formatINR(customAmount ? parseFloat(customAmount) : amount)}
          </strong>{" "}
          has been received for all 25 boys at Janaseva Ashrama.
        </p>

        {callerRef !== "DIRECT" && (
          <p className="mt-3 text-xs text-emerald-800 font-bold bg-emerald-50 py-2 rounded-xl border border-emerald-200">
            ✓ Successfully credited to Care Advisor {callerRef}
          </p>
        )}

        <div className="mt-6 pt-5 border-t border-teal-900/10 text-xs text-teal-950/60 space-y-1.5">
          <p>📜 Form 10AC 80G Tax Exemption Receipt sent to WhatsApp ({donorPhone}).</p>
          <p>The boys will chant your family prayer in the morning prayer assembly.</p>
        </div>

        <button
          onClick={() => setSuccess(false)}
          className="mt-6 inline-flex rounded-xl bg-teal-950 text-gold px-6 py-2.5 text-xs font-bold hover:bg-teal-900 transition"
        >
          Make Another Dedication
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-teal-900/10 animate-fadeIn">
      {/* Header */}
      <div className="text-center mb-6">
        <span className="rounded-full bg-saffron/15 text-saffron-dark px-3 py-1 text-xs font-black uppercase tracking-wider">
          Auspicious Birthday Seva
        </span>
        <h1 className="font-display text-2xl font-bold text-teal-950 mt-2">
          Celebrate with 25 Resident Boys
        </h1>
        <p className="text-xs text-teal-950/70 mt-1">
          Janaseva Ashrama · Turahalli Bengaluru · Form 10AC 80G 100% Tax Deductible
        </p>

        {callerRef !== "DIRECT" && (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Assisted by Dedicated Care Advisor: <strong>{callerRef}</strong></span>
          </div>
        )}
      </div>

      {/* Preset Amount Chips */}
      <div className="mb-4">
        <label className="block text-xs font-bold text-teal-950 mb-2">
          Select Auspicious Blessing Tier:
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { amt: 500, label: "Morning Milk" },
            { amt: 1000, label: "Punya Lunch" },
            { amt: 2500, label: "Full Feast" },
          ].map((item) => (
            <button
              key={item.amt}
              type="button"
              onClick={() => {
                setAmount(item.amt);
                setCustomAmount("");
              }}
              className={`py-3 px-1 rounded-2xl text-center transition cursor-pointer ${
                amount === item.amt && !customAmount
                  ? "bg-teal-950 text-white shadow-md ring-2 ring-amber-400"
                  : "bg-cream text-teal-950 hover:bg-sand"
              }`}
            >
              <span className="block text-sm font-black">{formatINR(item.amt)}</span>
              <span className={`block text-[10px] ${amount === item.amt && !customAmount ? "text-amber-300 font-bold" : "text-teal-950/60"}`}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Amount */}
      <div className="mb-4">
        <label className="block text-xs font-bold text-teal-950 mb-1">
          Or Enter Any Custom Amount (₹):
        </label>
        <div className="relative">
          <span className="absolute left-3 top-3 text-sm font-bold text-teal-950/50">₹</span>
          <input
            type="number"
            placeholder="e.g. 5000"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            className="w-full rounded-xl border border-teal-900/20 py-2.5 pl-8 pr-3 text-sm font-bold text-teal-950 focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>
      </div>

      {/* Donor Details */}
      <div className="space-y-3 mb-6">
        <div>
          <label className="block text-xs font-bold text-teal-950 mb-1">
            Celebrant / Donor Name *
          </label>
          <input
            type="text"
            placeholder="For boys' prayer chanting"
            value={donorName}
            onChange={(e) => setDonorName(e.target.value)}
            className="w-full rounded-xl border border-teal-900/20 p-2.5 text-sm text-teal-950 focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-teal-950 mb-1">
            WhatsApp Mobile Number *
          </label>
          <input
            type="tel"
            placeholder="10-digit mobile (for 80G tax receipt)"
            value={donorPhone}
            onChange={(e) => setDonorPhone(e.target.value)}
            className="w-full rounded-xl border border-teal-900/20 p-2.5 text-sm text-teal-950 focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-teal-950 mb-1">
            PAN Number (Optional, for 80G Tax Exemption)
          </label>
          <input
            type="text"
            placeholder="ABCDE1234F"
            maxLength={10}
            value={donorPan}
            onChange={(e) => setDonorPan(e.target.value.toUpperCase())}
            className="w-full rounded-xl border border-teal-900/20 p-2.5 text-sm font-mono uppercase text-teal-950 focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="button"
        onClick={handlePayNow}
        disabled={loading}
        className="focus-ring tap-scale w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-orange-500/25 active:scale-95 transition cursor-pointer"
      >
        {loading ? "Preparing Gateway..." : `Donate ${formatINR(customAmount ? parseFloat(customAmount) : amount)} Now 💝`}
      </button>

      <div className="mt-4 flex items-center justify-center gap-3 text-[11px] text-teal-950/60 font-semibold">
        <span>🛡️ 256-Bit SSL</span>
        <span>·</span>
        <span>📜 80G Tax Exemption</span>
        <span>·</span>
        <span>⚡ Instant WhatsApp Receipt</span>
      </div>
    </div>
  );
}
