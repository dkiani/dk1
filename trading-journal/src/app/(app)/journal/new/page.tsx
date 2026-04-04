"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { createTrade, calculatePnl } from "@/lib/trades";
import { TradeDirection, AssetClass, TimeFrame } from "@/types";
import { X, Camera } from "lucide-react";

export default function NewTradePage() {
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    symbol: "",
    assetClass: "futures" as AssetClass,
    direction: "long" as TradeDirection,
    entryPrice: "",
    exitPrice: "",
    quantity: "",
    entryTime: new Date().toISOString().slice(0, 16),
    exitTime: "",
    strategy: "",
    timeFrame: "5m" as TimeFrame,
    tags: "",
    notes: "",
    fees: "",
  });

  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleFileSelect(files: FileList | null) {
    if (!files) return;
    const newFiles = Array.from(files);
    setScreenshots((prev) => [...prev, ...newFiles]);
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  }

  function removeScreenshot(index: number) {
    setScreenshots((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function handlePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) handleFileSelect(createFileList([file]));
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    const entry = parseFloat(form.entryPrice);
    const exit = form.exitPrice ? parseFloat(form.exitPrice) : undefined;
    const qty = parseInt(form.quantity);
    const fees = form.fees ? parseFloat(form.fees) : 0;
    const pnl = exit ? calculatePnl(entry, exit, qty, form.direction) - fees : undefined;
    const pnlPercent = pnl && entry ? (pnl / (entry * qty)) * 100 : undefined;

    const screenshotData = previews.map((url, i) => ({
      id: crypto.randomUUID(),
      url,
      uploadedAt: new Date().toISOString(),
    }));

    await createTrade({
      userId: user.uid,
      symbol: form.symbol.toUpperCase(),
      assetClass: form.assetClass,
      direction: form.direction,
      status: exit ? "closed" : "open",
      entryPrice: entry,
      exitPrice: exit,
      quantity: qty,
      entryTime: new Date(form.entryTime).toISOString(),
      exitTime: form.exitTime ? new Date(form.exitTime).toISOString() : undefined,
      pnl,
      pnlPercent,
      fees,
      strategy: form.strategy || undefined,
      timeFrame: form.timeFrame,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : [],
      notes: form.notes || undefined,
      screenshots: screenshotData.length > 0 ? screenshotData : undefined,
    });

    router.push("/journal");
  }

  const inputClass = "w-full px-3 py-[0.7rem] bg-bg-input border border-border text-[0.75rem] font-light text-text-primary placeholder:text-text-muted focus:border-border-hover outline-none transition-colors duration-300";
  const labelClass = "block text-[0.6rem] font-light uppercase tracking-[0.06em] text-text-muted mb-1.5";

  return (
    <div className="animate-fade-in" onPaste={handlePaste}>
      <h1 className="text-[1.1rem] font-normal tracking-[-0.02em] mb-8">Log Trade</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Symbol + Asset Class */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Symbol</label>
            <input name="symbol" value={form.symbol} onChange={handleChange} placeholder="ES, NQ, SPY..." required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Asset Class</label>
            <select name="assetClass" value={form.assetClass} onChange={handleChange} className={inputClass}>
              <option value="futures">Futures</option>
              <option value="options">Options</option>
              <option value="stocks">Stocks</option>
              <option value="forex">Forex</option>
              <option value="crypto">Crypto</option>
            </select>
          </div>
        </div>

        {/* Direction + Time Frame */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Direction</label>
            <div className="flex gap-2">
              {(["long", "short"] as const).map((dir) => (
                <button
                  key={dir}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, direction: dir }))}
                  className={`flex-1 py-[0.7rem] text-[0.7rem] uppercase tracking-[0.06em] font-light cursor-pointer transition-colors duration-300 border ${
                    form.direction === dir
                      ? dir === "long"
                        ? "bg-green text-white border-green"
                        : "bg-red text-white border-red"
                      : "bg-transparent border-border text-text-muted hover:text-text-primary"
                  }`}
                >
                  {dir}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelClass}>Time Frame</label>
            <select name="timeFrame" value={form.timeFrame} onChange={handleChange} className={inputClass}>
              {(["1m", "5m", "15m", "1h", "4h", "1d", "1w"] as TimeFrame[]).map((tf) => (
                <option key={tf} value={tf}>{tf}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Entry / Exit prices */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Entry Price</label>
            <input name="entryPrice" type="number" step="any" value={form.entryPrice} onChange={handleChange} required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Exit Price</label>
            <input name="exitPrice" type="number" step="any" value={form.exitPrice} onChange={handleChange} placeholder="Leave blank if open" className={inputClass} />
          </div>
        </div>

        {/* Quantity + Fees */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Quantity / Contracts</label>
            <input name="quantity" type="number" value={form.quantity} onChange={handleChange} required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Fees</label>
            <input name="fees" type="number" step="any" value={form.fees} onChange={handleChange} placeholder="0.00" className={inputClass} />
          </div>
        </div>

        {/* Entry / Exit times */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Entry Time</label>
            <input name="entryTime" type="datetime-local" value={form.entryTime} onChange={handleChange} required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Exit Time</label>
            <input name="exitTime" type="datetime-local" value={form.exitTime} onChange={handleChange} className={inputClass} />
          </div>
        </div>

        {/* Strategy + Tags */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Strategy</label>
            <input name="strategy" value={form.strategy} onChange={handleChange} placeholder="Breakout, reversal, trend..." className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Tags</label>
            <input name="tags" value={form.tags} onChange={handleChange} placeholder="Comma separated..." className={inputClass} />
          </div>
        </div>

        {/* Screenshot Upload */}
        <div>
          <label className={labelClass}>Chart Screenshots</label>
          <p className="text-[0.65rem] text-text-muted font-light mb-3">
            Drag & drop, click to upload, or paste from clipboard (Ctrl+V)
          </p>
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleFileSelect(e.dataTransfer.files);
            }}
            className="border border-dashed border-border p-8 text-center cursor-pointer hover:border-border-hover transition-colors duration-300"
          >
            <Camera className="w-5 h-5 text-text-muted mx-auto mb-2" />
            <p className="text-[0.75rem] text-text-muted font-light">
              Click or drop chart screenshots here
            </p>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={(e) => handleFileSelect(e.target.files)} className="hidden" />

          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              {previews.map((src, i) => (
                <div key={i} className="relative group">
                  <img src={src} alt={`Screenshot ${i + 1}`} className="w-full h-32 object-cover border border-border" />
                  <button
                    type="button"
                    onClick={() => removeScreenshot(i)}
                    className="absolute top-1 right-1 p-1 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer border-0"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className={labelClass}>Notes</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={4}
            placeholder="Why did you take this trade? What was your setup?"
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* P&L Preview */}
        {form.entryPrice && form.exitPrice && form.quantity && (
          <div className="bg-bg-surface border border-border p-6">
            <span className="text-[0.6rem] uppercase tracking-[0.06em] text-text-muted font-light">
              Estimated P&L
            </span>
            <p className={`text-[1.5rem] font-medium mt-1 leading-tight ${
              calculatePnl(parseFloat(form.entryPrice), parseFloat(form.exitPrice), parseInt(form.quantity), form.direction) - (form.fees ? parseFloat(form.fees) : 0) >= 0 ? "text-green" : "text-red"
            }`}>
              ${(calculatePnl(parseFloat(form.entryPrice), parseFloat(form.exitPrice), parseInt(form.quantity), form.direction) - (form.fees ? parseFloat(form.fees) : 0)).toFixed(2)}
            </p>
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-[0.7rem] bg-btn-bg text-btn-fg text-[0.7rem] tracking-[0.02em] font-normal hover:opacity-85 transition-opacity duration-300 cursor-pointer disabled:opacity-40 border-0"
          >
            {saving ? "Saving..." : "Save Trade"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-[0.7rem] bg-transparent border border-border text-text-muted text-[0.7rem] tracking-[0.02em] font-light hover:text-text-primary hover:border-border-hover transition-colors duration-300 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function createFileList(files: File[]): FileList {
  const dt = new DataTransfer();
  files.forEach((f) => dt.items.add(f));
  return dt.files;
}
