"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { createTrade, calculatePnl } from "@/lib/trades";
import {
  TradeDirection,
  AssetClass,
  TimeFrame,
  SetupGrade,
  TradingSession,
  AiReviewMessage,
} from "@/types";
import { X, Camera, Send } from "lucide-react";

export default function NewTradePage() {
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reviewFileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"trade" | "review">("trade");

  const [form, setForm] = useState({
    symbol: "",
    assetClass: "futures" as AssetClass,
    direction: "long" as TradeDirection,
    entryPrice: "",
    exitPrice: "",
    stopLoss: "",
    takeProfit: "",
    quantity: "",
    entryTime: new Date().toISOString().slice(0, 16),
    exitTime: "",
    strategy: "",
    setupType: "",
    setupGrade: "" as SetupGrade | "",
    session: "" as TradingSession | "",
    timeFrame: "5m" as TimeFrame,
    tags: "",
    notes: "",
    fees: "",
    account: "",
  });

  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // AI Review state
  const [reviewImage, setReviewImage] = useState<string | null>(null);
  const [reviewImageBase64, setReviewImageBase64] = useState<string | null>(null);
  const [reviewMediaType, setReviewMediaType] = useState<string>("image/png");
  const [reviewAnalysis, setReviewAnalysis] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [chatHistory, setChatHistory] = useState<AiReviewMessage[]>([]);
  const [followUpInput, setFollowUpInput] = useState("");
  const [sendingFollowUp, setSendingFollowUp] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, reviewAnalysis]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
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
        if (file) {
          if (activeTab === "review") {
            handleReviewImageSelect(file);
          } else {
            handleFileSelect(createFileList([file]));
          }
        }
      }
    }
  }

  function handleReviewImageSelect(file: File) {
    setReviewMediaType(file.type || "image/png");
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setReviewImage(dataUrl);
      const base64 = dataUrl.split(",")[1];
      setReviewImageBase64(base64);
    };
    reader.readAsDataURL(file);
  }

  async function handleAnalyzeChart() {
    if (!reviewImageBase64) return;
    setAnalyzing(true);
    setReviewAnalysis("");

    try {
      const res = await fetch("/api/journal/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: reviewImageBase64,
          mediaType: reviewMediaType,
        }),
      });

      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                fullText += parsed.text;
                setReviewAnalysis(fullText);
              }
            } catch {
              // skip
            }
          }
        }
      }

      setChatHistory([
        { role: "user", content: "[Chart screenshot uploaded for analysis]", timestamp: new Date().toISOString() },
        { role: "assistant", content: fullText, timestamp: new Date().toISOString() },
      ]);
    } catch {
      setReviewAnalysis("Failed to analyze chart. Please try again.");
    }
    setAnalyzing(false);
  }

  async function handleFollowUp(e: React.FormEvent) {
    e.preventDefault();
    if (!followUpInput.trim() || sendingFollowUp) return;

    const question = followUpInput.trim();
    setFollowUpInput("");
    setSendingFollowUp(true);

    const newHistory: AiReviewMessage[] = [
      ...chatHistory,
      { role: "user", content: question, timestamp: new Date().toISOString() },
    ];
    setChatHistory(newHistory);

    try {
      const apiHistory = newHistory.map((msg) => ({
        role: msg.role,
        content:
          msg.content === "[Chart screenshot uploaded for analysis]"
            ? "I uploaded a chart screenshot for analysis."
            : msg.content,
      }));

      const res = await fetch("/api/journal/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: reviewImageBase64,
          mediaType: reviewMediaType,
          followUp: question,
          chatHistory: apiHistory,
        }),
      });

      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                fullText += parsed.text;
                setChatHistory([
                  ...newHistory,
                  { role: "assistant", content: fullText, timestamp: new Date().toISOString() },
                ]);
              }
            } catch {
              // skip
            }
          }
        }
      }

      setChatHistory([
        ...newHistory,
        { role: "assistant", content: fullText, timestamp: new Date().toISOString() },
      ]);
    } catch {
      setChatHistory([
        ...newHistory,
        { role: "assistant", content: "Failed to get response. Please try again.", timestamp: new Date().toISOString() },
      ]);
    }

    setSendingFollowUp(false);
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

    const result: "win" | "loss" | "breakeven" | undefined = pnl !== undefined ? (pnl > 0 ? "win" : pnl < 0 ? "loss" : "breakeven") : undefined;

    const screenshotData = previews.map((url) => ({
      id: crypto.randomUUID(),
      url,
      uploadedAt: new Date().toISOString(),
    }));

    const aiReview = reviewAnalysis
      ? {
          imageUrl: reviewImage || "",
          analysis: reviewAnalysis,
          chatHistory,
          createdAt: new Date().toISOString(),
        }
      : undefined;

    await createTrade({
      userId: user.uid,
      symbol: form.symbol.toUpperCase(),
      assetClass: form.assetClass,
      direction: form.direction,
      status: exit ? "closed" : "open",
      entryPrice: entry,
      exitPrice: exit,
      stopLoss: form.stopLoss ? parseFloat(form.stopLoss) : undefined,
      takeProfit: form.takeProfit ? parseFloat(form.takeProfit) : undefined,
      quantity: qty,
      entryTime: new Date(form.entryTime).toISOString(),
      exitTime: form.exitTime ? new Date(form.exitTime).toISOString() : undefined,
      pnl,
      pnlPercent,
      result,
      fees,
      strategy: form.strategy || undefined,
      setupType: form.setupType || undefined,
      setupGrade: form.setupGrade ? (form.setupGrade as SetupGrade) : undefined,
      session: form.session ? (form.session as TradingSession) : undefined,
      timeFrame: form.timeFrame,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : [],
      notes: form.notes || undefined,
      account: form.account || undefined,
      screenshots: screenshotData.length > 0 ? screenshotData : undefined,
      aiReview,
    });

    router.push("/journal/trades");
  }

  const inputClass =
    "w-full px-3 py-[0.65rem] bg-bg-input border border-border text-[0.85rem] font-mono text-text-primary placeholder:text-text-tertiary focus:border-accent-teal focus:shadow-[0_0_0_2px_var(--accent-teal-dim)] outline-none transition-all duration-150 rounded-[var(--radius-sm)]";
  const labelClass = "text-label block mb-1.5";
  const selectClass = `${inputClass} appearance-none`;

  return (
    <div className="animate-fade-in" onPaste={handlePaste}>
      {/* Header with tabs */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-h1">Log Trade</h1>
        <div className="flex items-center bg-bg-elevated rounded-[var(--radius-sm)] p-1">
          {(["trade", "review"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-[0.75rem] font-mono uppercase tracking-[0.08em] cursor-pointer transition-all duration-150 border-0 rounded-[var(--radius-sm)] ${
                activeTab === tab
                  ? "bg-accent-teal text-text-inverse font-medium"
                  : "bg-transparent text-text-tertiary hover:text-text-secondary"
              }`}
            >
              {tab === "trade" ? "Trade Details" : "AI Review"}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "trade" ? (
        <div className="max-w-[700px] mx-auto">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Row 1: Date/Time + Instrument */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Entry Time</label>
                <input
                  name="entryTime"
                  type="datetime-local"
                  value={form.entryTime}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Symbol</label>
                <input
                  name="symbol"
                  value={form.symbol}
                  onChange={handleChange}
                  placeholder="NQ, ES, SPY..."
                  required
                  className={inputClass}
                />
              </div>
            </div>

            {/* Row 2: Direction + Session */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Direction</label>
                <div className="flex gap-2">
                  {(["long", "short"] as const).map((dir) => (
                    <button
                      key={dir}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, direction: dir }))}
                      className={`flex-1 py-[0.65rem] text-[0.8rem] font-mono uppercase tracking-[0.06em] cursor-pointer transition-all duration-150 border rounded-[var(--radius-sm)] ${
                        form.direction === dir
                          ? dir === "long"
                            ? "bg-green text-white border-green"
                            : "bg-red text-white border-red"
                          : "bg-transparent border-border text-text-tertiary hover:text-text-secondary hover:border-border-hover"
                      }`}
                    >
                      {dir === "long" ? "▲ " : "▼ "}
                      {dir}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>Session</label>
                <select name="session" value={form.session} onChange={handleChange} className={selectClass}>
                  <option value="">Select session...</option>
                  <option value="London">London</option>
                  <option value="NY AM">NY AM</option>
                  <option value="NY PM">NY PM</option>
                  <option value="Asia">Asia</option>
                </select>
              </div>
            </div>

            {/* Row 3: Entry + Exit Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Entry Price</label>
                <input
                  name="entryPrice"
                  type="number"
                  step="any"
                  value={form.entryPrice}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Exit Price</label>
                <input
                  name="exitPrice"
                  type="number"
                  step="any"
                  value={form.exitPrice}
                  onChange={handleChange}
                  placeholder="Leave blank if open"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Row 4: Stop Loss + Take Profit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Stop Loss</label>
                <input
                  name="stopLoss"
                  type="number"
                  step="any"
                  value={form.stopLoss}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Take Profit</label>
                <input
                  name="takeProfit"
                  type="number"
                  step="any"
                  value={form.takeProfit}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Row 5: Quantity + Account */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Quantity / Contracts</label>
                <input
                  name="quantity"
                  type="number"
                  value={form.quantity}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Account</label>
                <input
                  name="account"
                  value={form.account}
                  onChange={handleChange}
                  placeholder="e.g. Prop Firm, Live..."
                  className={inputClass}
                />
              </div>
            </div>

            {/* Row 6: Setup Type + Grade */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Setup Type</label>
                <input
                  name="setupType"
                  value={form.setupType}
                  onChange={handleChange}
                  placeholder="BOS, CHoCH, FVG, Silver Bullet..."
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Setup Grade</label>
                <select name="setupGrade" value={form.setupGrade} onChange={handleChange} className={selectClass}>
                  <option value="">Select grade...</option>
                  <option value="A+">A+</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>
            </div>

            {/* Row 7: Timeframe + Tags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Timeframe</label>
                <select name="timeFrame" value={form.timeFrame} onChange={handleChange} className={selectClass}>
                  {(["1m", "5m", "15m", "1h", "4h", "1d", "1w"] as TimeFrame[]).map((tf) => (
                    <option key={tf} value={tf}>
                      {tf}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Tags</label>
                <input
                  name="tags"
                  value={form.tags}
                  onChange={handleChange}
                  placeholder="Comma separated..."
                  className={inputClass}
                />
              </div>
            </div>

            {/* Chart Screenshot */}
            <div>
              <label className={labelClass}>Chart Screenshot</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleFileSelect(e.dataTransfer.files);
                }}
                className="border border-dashed border-border-hover rounded-[var(--radius-md)] p-8 text-center cursor-pointer hover:border-accent-teal hover:bg-accent-teal-glow transition-all duration-150"
              >
                <Camera className="w-6 h-6 text-text-tertiary mx-auto mb-2" />
                <p className="text-body text-text-secondary">
                  Drop chart here, click to upload, or paste (Ctrl+V)
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />

              {previews.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {previews.map((src, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={src}
                        alt={`Screenshot ${i + 1}`}
                        className="w-full h-32 object-cover border border-border rounded-[var(--radius-sm)]"
                      />
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
              <div className="journal-card !p-5">
                <p className="text-label mb-1">Estimated P&L</p>
                <p
                  className={`text-stat-value ${
                    calculatePnl(
                      parseFloat(form.entryPrice),
                      parseFloat(form.exitPrice),
                      parseInt(form.quantity),
                      form.direction
                    ) -
                      (form.fees ? parseFloat(form.fees) : 0) >=
                    0
                      ? "text-green"
                      : "text-red"
                  }`}
                >
                  $
                  {(
                    calculatePnl(
                      parseFloat(form.entryPrice),
                      parseFloat(form.exitPrice),
                      parseInt(form.quantity),
                      form.direction
                    ) - (form.fees ? parseFloat(form.fees) : 0)
                  ).toFixed(2)}
                </p>
              </div>
            )}

            {/* AI Review notice */}
            {reviewAnalysis && (
              <div className="journal-card !p-5 !border-accent-teal/30">
                <p className="text-label text-accent-teal mb-1">AI Review Attached</p>
                <p className="text-body text-text-secondary">
                  Chart analysis and{" "}
                  {chatHistory.length > 2
                    ? `${Math.floor(chatHistory.length / 2)} follow-up messages`
                    : "feedback"}{" "}
                  will be saved with this trade.
                </p>
              </div>
            )}

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-accent text-white text-[0.8rem] font-sans font-medium uppercase tracking-[0.05em] rounded-[var(--radius-sm)] hover:bg-accent-hover hover:shadow-[var(--shadow-glow-orange)] transition-all duration-150 cursor-pointer disabled:opacity-40 border-0"
              >
                {saving ? "Saving..." : "Save Trade"}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 bg-transparent border border-border text-text-secondary text-[0.8rem] font-sans rounded-[var(--radius-sm)] hover:text-text-primary hover:border-border-hover transition-all duration-150 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* AI Review Tab */
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
            {/* Left: Chart Image */}
            <div>
              <label className={labelClass}>Chart Screenshot</label>
              <p className="text-small mb-3">
                Upload or paste a screenshot with execution marks visible
              </p>

              {reviewImage ? (
                <div className="relative group">
                  <img
                    src={reviewImage}
                    alt="Chart for review"
                    className="w-full border border-border rounded-[var(--radius-md)] object-contain max-h-[500px]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setReviewImage(null);
                      setReviewImageBase64(null);
                      setReviewAnalysis("");
                      setChatHistory([]);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer border-0"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => reviewFileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const file = e.dataTransfer.files?.[0];
                    if (file && file.type.startsWith("image/")) {
                      handleReviewImageSelect(file);
                    }
                  }}
                  className="border border-dashed border-border-hover rounded-[var(--radius-md)] p-16 text-center cursor-pointer hover:border-accent-teal hover:bg-accent-teal-glow transition-all duration-150"
                >
                  <Camera className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
                  <p className="text-body text-text-secondary mb-1">Drop chart screenshot here</p>
                  <p className="text-small">or click to browse — paste with Ctrl+V</p>
                </div>
              )}
              <input
                ref={reviewFileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleReviewImageSelect(file);
                }}
                className="hidden"
              />

              {reviewImage && !analyzing && !reviewAnalysis && (
                <button
                  onClick={handleAnalyzeChart}
                  className="mt-4 w-full px-5 py-3 bg-accent-teal text-text-inverse text-[0.8rem] font-sans font-medium uppercase tracking-[0.05em] rounded-[var(--radius-sm)] hover:shadow-[var(--shadow-glow-teal)] transition-all duration-150 cursor-pointer border-0"
                >
                  Analyze Execution
                </button>
              )}
            </div>

            {/* Right: Analysis */}
            <div>
              <label className={labelClass}>AI Feedback</label>
              <div className="journal-card min-h-[300px] max-h-[500px] overflow-y-auto">
                {analyzing && !reviewAnalysis && (
                  <p className="text-body text-accent-teal animate-pulse-subtle">
                    Analyzing your execution...
                  </p>
                )}

                {reviewAnalysis ? (
                  <div className="text-body text-text-secondary leading-relaxed whitespace-pre-wrap">
                    {reviewAnalysis}
                    {analyzing && (
                      <span className="inline-block w-1.5 h-4 bg-accent-teal ml-0.5 animate-pulse" />
                    )}
                  </div>
                ) : !analyzing ? (
                  <p className="text-body text-text-tertiary">
                    Upload a chart screenshot and click &ldquo;Analyze Execution&rdquo; to get ICT/Smart Money Concepts feedback.
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {/* Follow-up Chat */}
          {chatHistory.length > 0 && (
            <div>
              <label className={labelClass}>Follow-up Questions</label>
              <div className="journal-card max-h-[400px] overflow-y-auto !p-0">
                {chatHistory.slice(2).map((msg, i) => (
                  <div
                    key={i}
                    className={`px-5 py-4 border-b border-border last:border-b-0 ${
                      msg.role === "user" ? "bg-bg-elevated" : ""
                    }`}
                  >
                    <span className="text-[0.6rem] font-mono uppercase tracking-[0.1em] text-text-tertiary">
                      {msg.role === "user" ? "You" : "AI Coach"}
                    </span>
                    <p className="text-body text-text-secondary mt-1 whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                ))}
                {sendingFollowUp && (
                  <div className="px-5 py-4">
                    <span className="text-[0.6rem] font-mono uppercase tracking-[0.1em] text-text-tertiary">
                      AI Coach
                    </span>
                    <p className="text-body text-accent-teal mt-1 animate-pulse-subtle">
                      Thinking...
                    </p>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleFollowUp} className="flex gap-2 mt-3">
                <input
                  type="text"
                  value={followUpInput}
                  onChange={(e) => setFollowUpInput(e.target.value)}
                  placeholder="Ask a follow-up about this trade..."
                  disabled={sendingFollowUp}
                  className={`${inputClass} flex-1`}
                />
                <button
                  type="submit"
                  disabled={sendingFollowUp || !followUpInput.trim()}
                  className="px-4 py-[0.65rem] bg-accent-teal text-text-inverse rounded-[var(--radius-sm)] hover:shadow-[var(--shadow-glow-teal)] transition-all duration-150 cursor-pointer disabled:opacity-40 border-0 flex items-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* Save with Review */}
          {reviewAnalysis && (
            <div className="journal-card !border-accent-teal/20">
              <p className="text-body text-text-secondary mb-4">
                Switch to &ldquo;Trade Details&rdquo; to fill in your trade data. The AI review will be attached automatically.
              </p>
              <button
                onClick={() => setActiveTab("trade")}
                className="px-5 py-2.5 bg-accent text-white text-[0.8rem] font-sans font-medium uppercase tracking-[0.05em] rounded-[var(--radius-sm)] hover:bg-accent-hover transition-all duration-150 cursor-pointer border-0"
              >
                Go to Trade Details
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function createFileList(files: File[]): FileList {
  const dt = new DataTransfer();
  files.forEach((f) => dt.items.add(f));
  return dt.files;
}
