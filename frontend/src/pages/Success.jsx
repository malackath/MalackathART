import React, { useEffect, useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useLang } from "../contexts/LanguageContext";
import { api } from "../lib/api";
import { Check, X } from "lucide-react";

export default function Success() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const { t } = useLang();
  const [state, setState] = useState({ status: "processing", data: null });
  const pollRef = useRef(0);

  useEffect(() => {
    if (!sessionId) {
      setState({ status: "failed", data: null });
      return;
    }
    const poll = async () => {
      if (pollRef.current >= 10) {
        setState({ status: "failed", data: null });
        return;
      }
      pollRef.current += 1;
      try {
        const res = await api.get(`/checkout/status/${sessionId}`);
        if (res.data.payment_status === "paid") {
          setState({ status: "paid", data: res.data });
          return;
        }
        if (res.data.status === "expired") {
          setState({ status: "failed", data: res.data });
          return;
        }
        setTimeout(poll, 2000);
      } catch (e) {
        setTimeout(poll, 2000);
      }
    };
    poll();
  }, [sessionId]);

  return (
    <div data-testid="success-page" className="max-w-[1400px] mx-auto px-6 md:px-12 py-32 min-h-[60vh] flex flex-col items-center justify-center text-center">
      {state.status === "processing" && (
        <div data-testid="success-processing" className="text-white/60 font-display text-3xl">
          {t.success.processing}
        </div>
      )}
      {state.status === "paid" && (
        <div data-testid="success-confirmed" className="fade-up">
          <div className="w-16 h-16 mx-auto rounded-full border border-white flex items-center justify-center mb-8">
            <Check size={28} />
          </div>
          <h1 className="font-display tracking-tighter text-5xl md:text-6xl leading-none">{t.success.title}</h1>
          <p className="mt-6 text-white/60 max-w-md mx-auto">{t.success.sub}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-3 mt-12 px-7 py-4 border border-white/30 text-sm tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-colors"
          >
            {t.success.back}
          </Link>
        </div>
      )}
      {state.status === "failed" && (
        <div data-testid="success-failed">
          <div className="w-16 h-16 mx-auto rounded-full border border-white/40 flex items-center justify-center mb-8 text-white/60">
            <X size={28} />
          </div>
          <h1 className="font-display tracking-tighter text-3xl">{t.success.failed}</h1>
          <Link
            to="/"
            className="inline-flex items-center gap-3 mt-10 px-7 py-4 border border-white/30 text-sm tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-colors"
          >
            {t.success.back}
          </Link>
        </div>
      )}
    </div>
  );
}
