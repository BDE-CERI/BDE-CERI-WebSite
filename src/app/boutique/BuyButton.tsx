"use client";

import React, { useState, useTransition } from "react";
import { buyItem } from "./actions";

interface BuyButtonProps {
  productId: string;
  stock: number | undefined;
  paymentLink?: string;
  isTaverne?: boolean;
  isOpen?: boolean;
  closedMessage?: string;
  english?: boolean;
}

export default function BuyButton({ productId, stock, paymentLink, isTaverne = false, isOpen = true, closedMessage, english = false }: BuyButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handleBuy = () => {
    startTransition(async () => {
      setMessage(null);
      const res = await buyItem(productId, isTaverne, english);
      if (res.error) {
        setMessage({ type: 'error', text: res.error });
      } else {
        setMessage({ type: 'success', text: "Stock réservé ! Redirection vers le paiement..." });
        
        // Simulate redirect to HelloAsso
        setTimeout(() => {
          if (paymentLink) {
            window.open(paymentLink, "_blank");
          } else {
            // Default HelloAsso link if none provided
            window.open("https://www.helloasso.com/associations/bde-ceri", "_blank");
          }
          setMessage(null);
        }, 1500);
      }
    });
  };

  return (
    <div className="flex flex-col gap-4 mt-12">
      {message && (
        <div className={`p-4 rounded-xl text-center text-xs font-bold uppercase tracking-widest ${message.type === 'success' ? 'bg-success/20 text-success border border-success/30' : 'bg-error/20 text-error border border-error/30'}`}>
          {message.text}
        </div>
      )}
      
      <button 
        onClick={handleBuy}
        disabled={isPending || stock === 0 || !isOpen}
        className="w-full bg-tertiary text-on-tertiary font-bold py-5 rounded-3xl shadow-xl shadow-tertiary/20 flex items-center justify-center gap-2 hover:scale-105 transition-all disabled:opacity-30 disabled:hover:scale-100 disabled:grayscale"
      >
        {!isOpen ? (english ? "Local closed — purchases are paused" : "Local fermé — achats suspendus") : isPending ? (
           <span className="material-symbols-outlined animate-spin">sync</span>
        ) : (
          <>
            Commander sur HelloAsso
            <span className="material-symbols-outlined">open_in_new</span>
          </>
        )}
      </button>
      {!isOpen && closedMessage && <p role="status" className="text-center text-sm leading-6 text-on-surface-variant">{closedMessage}</p>}
    </div>
  );
}
