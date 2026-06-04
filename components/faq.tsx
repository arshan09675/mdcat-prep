"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

export interface FaqItem {
  q: string;
  a: string;
}

export function Faq({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="faq-list">
      {items.map((item, i) => {
        const open = openIndex === i;
        return (
          <div key={i} className={`faq-item ${open ? "open" : ""}`}>
            <button
              type="button"
              className="faq-q"
              aria-expanded={open}
              onClick={() => setOpenIndex(open ? null : i)}
            >
              {item.q}
              <Plus className="faq-ico h-[18px] w-[18px]" />
            </button>
            {open && <div className="faq-a">{item.a}</div>}
          </div>
        );
      })}
    </div>
  );
}
