import { useState } from "react";
import { ChevronLeft, ChevronRight, Crown, FileDown, FileText, Lock } from "lucide-react";
import {
  useClipperStore,
  fmtMoney,
  PAYMENT_METHOD_LABELS,
  CATEGORY_LABELS,
  SCHEDULE_C_LINES,
  type PaymentMethod,
  type ExpenseCategory,
  type IncomeEntry,
  type ExpenseEntry,
} from "@/lib/clipper-store";

function escapeCsv(v: string) {
  return `"${v.replace(/"/g, '""')}"`;
}

function downloadCsv(
  incomes: IncomeEntry[],
  expenses: ExpenseEntry[],
  year: number,
  businessName: string,
) {
  const totalIn = incomes.reduce((s, e) => s + e.amount, 0);
  const totalOut = expenses.reduce((s, e) => s + e.amount, 0);
  const net = totalIn - totalOut;
  const generated = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const e = escapeCsv;
  const blank = ["", "", "", "", ""];
  const header = [
    [e("CLIPPER BUSINESS LEDGER"), "", "", "", ""],
    [e("Business"), e(businessName), "", e("Tax Year"), e(String(year))],
    [e("Report Generated"), e(generated), "", "", ""],
    blank,
    [e("FINANCIAL SUMMARY"), "", "", "", ""],
    [e("Total Income"), e(`$${totalIn.toFixed(2)}`), "", e("Total Expenses"), e(`$${totalOut.toFixed(2)}`)],
    [e("Net Profit"), e(`$${net.toFixed(2)}`), "", "", ""],
    blank,
    [e("TRANSACTIONS"), "", "", "", ""],
    [e("Type"), e("Date"), e("Amount ($)"), e("Category / Method"), e("Note")],
  ];

  const rows: string[][] = [];
  const sortedIncome = [...incomes].sort((a, b) => +new Date(b.date) - +new Date(a.date));
  const sortedExpenses = [...expenses].sort((a, b) => +new Date(b.date) - +new Date(a.date));

  sortedIncome.forEach((entry) =>
    rows.push([
      e("Income"),
      e(new Date(entry.date).toLocaleDateString("en-US")),
      e(entry.amount.toFixed(2)),
      e(PAYMENT_METHOD_LABELS[entry.paymentMethod]),
      e(entry.clientNote ?? ""),
    ]),
  );
  sortedExpenses.forEach((entry) =>
    rows.push([
      e("Expense"),
      e(new Date(entry.date).toLocaleDateString("en-US")),
      e(entry.amount.toFixed(2)),
      e(CATEGORY_LABELS[entry.category]),
      e(entry.description ?? ""),
    ]),
  );

  const csv = [...header, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `clipper-records-${year}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

async function downloadScheduleCPdf(opts: {
  year: number;
  totalIn: number;
  totalOut: number;
  net: number;
  seTax: number;
  byCat: Map<ExpenseCategory, number>;
  byMethod: Map<PaymentMethod, number>;
  businessName: string;
}) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "letter" });

  const W = 215.9;
  const H = 279.4;
  const M = 14; // margin
  const CW = W - M * 2; // content width

  // Brand palette (RGB)
  const C = {
    darkBg: [10, 15, 12] as [number, number, number],
    accent: [55, 231, 128] as [number, number, number],
    incomeGreen: [22, 163, 74] as [number, number, number],
    expenseRed: [185, 28, 28] as [number, number, number],
    textDark: [17, 24, 39] as [number, number, number],
    textMid: [75, 85, 99] as [number, number, number],
    textLight: [156, 163, 175] as [number, number, number],
    border: [229, 231, 235] as [number, number, number],
    rowAlt: [249, 250, 251] as [number, number, number],
    incomeLight: [240, 253, 244] as [number, number, number],
    expenseLight: [254, 242, 242] as [number, number, number],
    white: [255, 255, 255] as [number, number, number],
  };

  const generated = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  let y = 0;

  // Helper: check page space and add new page if needed
  const ensureSpace = (need: number) => {
    if (y + need > H - 18) {
      doc.addPage();
      y = 18;
    }
  };

  // Helper: section header band
  const sectionHeader = (label: string, color: [number, number, number], lightBg: [number, number, number]) => {
    ensureSpace(14);
    doc.setFillColor(...lightBg);
    doc.rect(M, y, CW, 10, "F");
    doc.setFillColor(...color);
    doc.rect(M, y, 3, 10, "F");
    doc.setTextColor(...color);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(label, M + 6, y + 6.5);
    y += 14;
  };

  // ── HEADER BAR ─────────────────────────────────────
  doc.setFillColor(...C.darkBg);
  doc.rect(0, 0, W, 26, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("CLIPPER", M, 12);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.accent);
  doc.text("SCHEDULE C TAX REPORT", M, 19);

  doc.setTextColor(200, 210, 205);
  doc.setFontSize(9);
  doc.text(`Tax Year ${opts.year}`, W - M, 14, { align: "right" });
  doc.setFontSize(7);
  doc.text(generated, W - M, 20, { align: "right" });

  y = 34;

  // ── BUSINESS NAME + SUBTITLE ────────────────────────
  doc.setTextColor(...C.textDark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(opts.businessName || "Business Ledger", M, y);

  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...C.textMid);
  doc.text("Schedule C — Profit or Loss from Business (Form 1040)", M, y);
  y += 5;
  doc.text(`Prepared with Clipper  ·  Generated ${generated}`, M, y);

  y += 8;
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.3);
  doc.line(M, y, W - M, y);
  y += 10;

  // ── EXECUTIVE SUMMARY CARDS ─────────────────────────
  doc.setTextColor(...C.textMid);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("EXECUTIVE SUMMARY", M, y);
  y += 5;

  const summaryCards = [
    { label: "Gross Income", value: fmtMoney(opts.totalIn), color: C.incomeGreen },
    { label: "Total Expenses", value: fmtMoney(opts.totalOut), color: C.expenseRed },
    { label: "Net Profit", value: fmtMoney(opts.net), color: opts.net >= 0 ? C.incomeGreen : C.expenseRed },
    { label: "SE Tax Estimate", value: fmtMoney(opts.seTax), color: C.textDark },
  ];

  const cardW = (CW - 4.5) / 4;
  summaryCards.forEach((card, i) => {
    const cx = M + i * (cardW + 1.5);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(cx, y, cardW, 24, 2, 2, "F");
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.2);
    doc.roundedRect(cx, y, cardW, 24, 2, 2, "S");
    // Top accent stripe
    doc.setFillColor(...card.color);
    doc.rect(cx, y, cardW, 1.8, "F");
    // Label
    doc.setTextColor(...C.textLight);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(card.label, cx + cardW / 2, y + 9.5, { align: "center" });
    // Value
    doc.setTextColor(...card.color);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text(card.value, cx + cardW / 2, y + 18.5, { align: "center" });
  });

  y += 31;

  // ── INCOME BY PAYMENT METHOD ────────────────────────
  sectionHeader("INCOME BY PAYMENT METHOD", C.incomeGreen, C.incomeLight);

  // Table columns
  const c1 = M, c2 = M + CW * 0.52, c3 = M + CW * 0.73, c4 = W - M;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...C.textMid);
  doc.text("Payment Method", c1, y);
  doc.text("Amount", c2, y);
  doc.text("% of Income", c3, y);
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.25);
  doc.line(M, y + 2.5, W - M, y + 2.5);
  y += 8;

  const methodEntries = [...opts.byMethod.entries()].sort((a, b) => b[1] - a[1]);

  if (methodEntries.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...C.textLight);
    doc.text("No income recorded for this year.", c1, y);
    y += 8;
  } else {
    methodEntries.forEach(([method, amount], idx) => {
      ensureSpace(8);
      if (idx % 2 === 0) {
        doc.setFillColor(...C.rowAlt);
        doc.rect(M, y - 4.5, CW, 7.5, "F");
      }
      const pct = opts.totalIn > 0 ? `${((amount / opts.totalIn) * 100).toFixed(1)}%` : "0%";
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...C.textDark);
      doc.text(PAYMENT_METHOD_LABELS[method], c1, y);
      doc.setTextColor(...C.incomeGreen);
      doc.setFont("helvetica", "bold");
      doc.text(fmtMoney(amount), c2, y);
      doc.setTextColor(...C.textMid);
      doc.setFont("helvetica", "normal");
      doc.text(pct, c3, y);
      y += 8;
    });
    // Totals row
    ensureSpace(12);
    doc.setDrawColor(...C.border);
    doc.line(M, y - 2, W - M, y - 2);
    doc.setFillColor(...C.incomeLight);
    doc.rect(M, y - 1, CW, 9, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...C.textDark);
    doc.text("Total Income", c1, y + 5);
    doc.setTextColor(...C.incomeGreen);
    doc.text(fmtMoney(opts.totalIn), c2, y + 5);
    doc.setTextColor(...C.textMid);
    doc.text("100%", c3, y + 5);
    y += 14;
  }

  // ── DEDUCTIONS — SCHEDULE C ─────────────────────────
  ensureSpace(30);
  sectionHeader("DEDUCTIONS — SCHEDULE C CATEGORIES", C.expenseRed, C.expenseLight);

  // Table header with 4 columns
  const d1 = M, d2 = M + CW * 0.22, d3 = M + CW * 0.60, d4 = M + CW * 0.78;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...C.textMid);
  doc.text("Sch C Line", d1, y);
  doc.text("Category", d2, y);
  doc.text("Amount", d3, y);
  doc.text("% of Expenses", d4, y);
  doc.setDrawColor(...C.border);
  doc.line(M, y + 2.5, W - M, y + 2.5);
  y += 8;

  const catEntries = [...opts.byCat.entries()].sort((a, b) => b[1] - a[1]);

  if (catEntries.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...C.textLight);
    doc.text("No expenses recorded for this year.", d1, y);
    y += 8;
  } else {
    catEntries.forEach(([cat, amount], idx) => {
      ensureSpace(8);
      if (idx % 2 === 0) {
        doc.setFillColor(...C.rowAlt);
        doc.rect(M, y - 4.5, CW, 7.5, "F");
      }
      const pct = opts.totalOut > 0 ? `${((amount / opts.totalOut) * 100).toFixed(1)}%` : "0%";
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...C.textMid);
      doc.text(SCHEDULE_C_LINES[cat], d1, y);
      doc.setFontSize(9);
      doc.setTextColor(...C.textDark);
      doc.text(CATEGORY_LABELS[cat], d2, y);
      doc.setTextColor(...C.expenseRed);
      doc.setFont("helvetica", "bold");
      doc.text(fmtMoney(amount), d3, y);
      doc.setTextColor(...C.textMid);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(pct, d4, y);
      y += 8;
    });
    // Totals row
    ensureSpace(12);
    doc.setDrawColor(...C.border);
    doc.line(M, y - 2, W - M, y - 2);
    doc.setFillColor(...C.expenseLight);
    doc.rect(M, y - 1, CW, 9, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...C.textDark);
    doc.text("Total Deductions", d1, y + 5);
    doc.setTextColor(...C.expenseRed);
    doc.text(fmtMoney(opts.totalOut), d3, y + 5);
    doc.setTextColor(...C.textMid);
    doc.text("100%", d4, y + 5);
    y += 14;
  }

  // ── NET PROFIT SUMMARY BAR ──────────────────────────
  ensureSpace(26);
  doc.setFillColor(...C.darkBg);
  doc.roundedRect(M, y, CW, 22, 3, 3, "F");
  // Left: Net Profit label + value
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(180, 200, 190);
  doc.text("NET PROFIT / LOSS", M + 6, y + 7);
  doc.setFontSize(16);
  doc.setTextColor(...(opts.net >= 0 ? C.accent : [255, 100, 100] as [number, number, number]));
  doc.text(fmtMoney(opts.net), M + 6, y + 17);
  // Right: SE tax
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(160, 185, 170);
  doc.text("SE Tax Estimate", W - M - 5, y + 7, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(200, 220, 210);
  doc.text(fmtMoney(opts.seTax), W - M - 5, y + 17, { align: "right" });
  y += 30;

  // ── FILING NOTES ────────────────────────────────────
  ensureSpace(50);
  doc.setTextColor(...C.textMid);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("SCHEDULE C FILING NOTES", M, y);
  y += 6;

  const notes = [
    ["Report gross income on", "Schedule C, Part I, Line 1 (Gross receipts or sales)."],
    ["List deductible business expenses in", "Schedule C, Part II, Lines 8–27."],
    ["Self-employment tax (SE tax) is", "reported on Schedule SE. Half is deductible on Schedule 1, Line 15."],
    ["Record retention:", "Keep all receipts and records for at least 7 years (IRS audit window)."],
    ["Tips deduction:", "Barber tip credits may apply — ask your preparer about Sec. 45B."],
  ];

  notes.forEach(([label, detail]) => {
    ensureSpace(7);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...C.textDark);
    doc.text(`• ${label}`, M, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.textMid);
    const labelW = doc.getTextWidth(`• ${label} `);
    // Wrap detail on next line if combined is too long
    doc.text(detail, M + 4, y + 5);
    y += 12;
  });

  // ── FOOTER ──────────────────────────────────────────
  // Draw on current page
  const footerY = H - 12;
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.2);
  doc.line(M, footerY - 4, W - M, footerY - 4);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...C.textLight);
  doc.text(
    `Generated by Clipper  ·  ${generated}  ·  Tax Year ${opts.year}`,
    W / 2,
    footerY,
    { align: "center" },
  );
  doc.text(
    "For informational purposes only. Verify all figures with a licensed tax professional before filing.",
    W / 2,
    footerY + 4.5,
    { align: "center" },
  );

  doc.save(`clipper-schedule-c-${opts.year}.pdf`);
}

export function TaxesScreen({ onPremium }: { onPremium: (f?: string) => void }) {
  const [store] = useClipperStore();
  const isPremium = store.user?.isPremium;
  const businessName = store.profile?.name ?? store.user?.name ?? "My Business";
  const currentYear = new Date().getFullYear();
  const earliestYear = [...store.incomeEntries, ...store.expenseEntries].reduce(
    (min, e) => Math.min(min, new Date(e.date).getFullYear()),
    currentYear,
  );
  const [year, setYear] = useState(currentYear);

  const incomes = store.incomeEntries.filter(
    (e) => e.confirmed && new Date(e.date).getFullYear() === year,
  );
  const expenses = store.expenseEntries.filter(
    (e) => !e.voided && new Date(e.date).getFullYear() === year,
  );
  const totalIn = incomes.reduce((s, e) => s + e.amount, 0);
  const totalOut = expenses.reduce((s, e) => s + e.amount, 0);
  const net = totalIn - totalOut;
  const seTax = Math.max(0, net * 0.9235 * 0.153);
  const tipsTotal = incomes.filter((e) => e.isTip).reduce((s, e) => s + e.amount, 0);
  const tipsDeduction = Math.min(tipsTotal, 25000);

  // by method
  const byMethod = new Map<PaymentMethod, number>();
  incomes.forEach((e) =>
    byMethod.set(e.paymentMethod, (byMethod.get(e.paymentMethod) ?? 0) + e.amount),
  );

  // by category
  const byCat = new Map<ExpenseCategory, number>();
  expenses.forEach((e) => byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount));

  // Quarter dates
  const quarters = [
    { label: "Q1", date: new Date(year, 3, 15) },
    { label: "Q2", date: new Date(year, 5, 16) },
    { label: "Q3", date: new Date(year, 8, 15) },
    { label: "Q4", date: new Date(year + 1, 0, 15) },
  ];
  const now = new Date();
  const isCurrentYear = year === currentYear;
  const nextQ = isCurrentYear ? (quarters.find((q) => q.date >= now) ?? quarters[0]) : null;
  const daysToNextQ = nextQ ? Math.ceil((+nextQ.date - +now) / 86400000) : 0;

  const monthIsJan = isCurrentYear && now.getMonth() === 0;
  const canPrevYear = year > earliestYear;
  const canNextYear = year < currentYear;

  return (
    <div className="space-y-4 pb-24">
      <header className="pt-2">
        <div className="text-xs uppercase tracking-[0.22em] text-brass">Taxes</div>
        <h1 className="mt-1 font-display text-3xl">Year at a glance</h1>
      </header>

      <div className="card-luxe flex items-center justify-between p-3">
        <button
          onClick={() => setYear((y) => y - 1)}
          disabled={!canPrevYear}
          className="rounded-full p-2 hover:bg-accent disabled:opacity-30"
          aria-label="Previous year"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="font-display text-xl">{year}</div>
        <button
          onClick={() => setYear((y) => y + 1)}
          disabled={!canNextYear}
          className="rounded-full p-2 hover:bg-accent disabled:opacity-30"
          aria-label="Next year"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {monthIsJan && (
        <button
          onClick={() => onPremium("Tax Season walkthrough")}
          className="card-luxe flex w-full items-center gap-3 border-brass/40 bg-gradient-to-r from-brass/10 to-transparent p-4 text-left"
        >
          <Crown className="h-5 w-5 text-brass" />
          <div className="flex-1">
            <div className="font-display text-lg">Tax season is here</div>
            <div className="text-xs text-muted-foreground">
              Reconcile 1099-Ks and prep your preparer packet
            </div>
          </div>
        </button>
      )}

      {/* Year summary */}
      <div className="card-luxe p-5">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          In Your Pocket · {isCurrentYear ? "YTD" : year}
        </div>
        <div className="mt-1 font-display text-4xl brass-text">{fmtMoney(net)}</div>
        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border/60 pt-4 text-center">
          <Stat label="Income" value={fmtMoney(totalIn)} tone="success" />
          <Stat label="Deductions" value={fmtMoney(totalOut)} tone="destructive" />
          <Stat label="SE tax est." value={fmtMoney(seTax)} />
        </div>
        <p className="mt-3 text-[10px] text-muted-foreground">
          SE tax = net × 0.9235 × 0.153. Half is deductible from AGI on Schedule 1.
        </p>
      </div>

      {tipsTotal > 0 && (
        <div className="card-luxe border-brass/30 p-4">
          <div className="text-[11px] uppercase tracking-[0.18em] text-brass">
            {year} Tips Deduction
          </div>
          <div className="mt-1.5 grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Tips logged
              </div>
              <div className="font-display text-xl">{fmtMoney(tipsTotal)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Potential deduction
              </div>
              <div className="font-display text-xl brass-text">{fmtMoney(tipsDeduction)}</div>
            </div>
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">
            Goes on Schedule 1-A — tell your preparer.
          </p>
        </div>
      )}

      {/* By method */}
      <div className="card-luxe p-4">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Income by payment method
        </div>
        <div className="mt-3 space-y-2.5">
          {[...byMethod.entries()].length === 0 && (
            <div className="text-sm text-muted-foreground">No income logged yet</div>
          )}
          {[...byMethod.entries()].map(([m, v]) => {
            const pct = totalIn > 0 ? (v / totalIn) * 100 : 0;
            const note = METHOD_NOTES[m];
            return (
              <div key={m}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{PAYMENT_METHOD_LABELS[m]}</span>
                  <span className="font-display text-success">{fmtMoney(v)}</span>
                </div>
                <div className="mt-1 h-1 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-success/70"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">{note}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quarter */}
      {nextQ && (
        <div className="card-luxe p-4">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Next estimated payment
          </div>
          <div className="mt-1.5 flex items-end justify-between">
            <div>
              <div className="font-display text-2xl">
                {nextQ.label} ·{" "}
                {nextQ.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </div>
              <div className="text-xs text-muted-foreground">
                {daysToNextQ} day{daysToNextQ !== 1 ? "s" : ""} away
              </div>
            </div>
            {daysToNextQ <= 14 && (
              <span className="rounded-full bg-warning/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-warning">
                Due soon
              </span>
            )}
          </div>
        </div>
      )}

      {/* Deductions by Schedule C line */}
      <div className="card-luxe p-4">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Deductions · Schedule C
        </div>
        <div className="mt-2 divide-y divide-border/60">
          {[...byCat.entries()].map(([c, v]) => (
            <div key={c} className="flex items-center justify-between py-2 text-sm">
              <span>{CATEGORY_LABELS[c]}</span>
              <span className="font-display text-destructive">{fmtMoney(v)}</span>
            </div>
          ))}
          {[...byCat.entries()].length === 0 && (
            <div className="py-3 text-sm text-muted-foreground">No expenses yet</div>
          )}
        </div>
      </div>

      {/* Exports */}
      <div className="grid grid-cols-2 gap-2.5">
        <ExportBtn
          icon={<FileText className="h-4 w-4" />}
          label="Schedule C PDF"
          locked={!isPremium}
          onClick={() =>
            isPremium
              ? downloadScheduleCPdf({ year, totalIn, totalOut, net, seTax, byCat, byMethod, businessName })
              : onPremium("Schedule C PDF export")
          }
        />
        <ExportBtn
          icon={<FileDown className="h-4 w-4" />}
          label="CSV records"
          onClick={() => downloadCsv(incomes, expenses, year, businessName)}
        />
      </div>
    </div>
  );
}

const METHOD_NOTES: Record<PaymentMethod, string> = {
  cashApp: "1099-K issued if >$20K AND >200 txns",
  venmo: "1099-K issued if >$20K AND >200 txns",
  zelle: "No 1099-K — still fully taxable",
  applePay: "Confirm 1099-K status with your bank",
  appleCash: "Confirm 1099-K status with your bank",
  cash: "No 1099-K — self-reported",
  other: "Verify with payer",
};

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "success" | "destructive";
}) {
  return (
    <div>
      <div
        className={`font-display text-lg ${tone === "success" ? "text-success" : tone === "destructive" ? "text-destructive" : ""}`}
      >
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}

function ExportBtn({
  icon,
  label,
  locked,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  locked?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`card-luxe relative flex h-20 flex-col items-start justify-between p-3 text-left tap-highlight ${
        locked ? "opacity-95" : ""
      }`}
    >
      <div className="grid h-8 w-8 place-items-center rounded-full bg-brass/10 text-brass">
        {icon}
      </div>
      <div className="text-sm font-semibold">{label}</div>
      {locked && (
        <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-brass/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-brass">
          <Lock className="h-2.5 w-2.5" /> Premium
        </div>
      )}
    </button>
  );
}
