import { CalendarDays, Printer } from 'lucide-react';
import { reportsApi } from '../../service/api';
import { formatCurrency } from '@/utils/format';

type PaymentBreakdown = {
  method: string;
  amount: number;
  count: number;
};

const ShiftSummaryPage: React.FC = () => {
  const [summary, setSummary] = useState<any | null>(null);
  const [range, setRange] = useState<'today' | 'yesterday'>('today');
  const [loading, setLoading] = useState(false);

  const loadSummary = async (mode: 'today' | 'yesterday') => {
    setLoading(true);
    try {
      const now = new Date();
      let startDate: string | undefined;
      let endDate: string | undefined;

      if (mode === 'today') {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        startDate = start.toISOString();
        endDate = now.toISOString();
      } else {
        const start = new Date(now);
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setHours(23, 59, 59, 999);
        startDate = start.toISOString();
        endDate = end.toISOString();
      }

      const res = await reportsApi.getSalesReport({ startDate, endDate });
      if (res.data?.success && res.data.data) {
        const data = res.data.data;
        const s = data.summary || {};
        const totalRevenue = Number(s.totalRevenue ?? 0);
        const totalTransactions = Number(s.totalTransactions ?? 0);
        const averageTicketSize =
          totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
        setSummary({
          totalSalesAmount: totalRevenue,
          totalTransactions,
          averageTicketSize,
          totalDiscountGiven: Number(s.totalDiscount ?? 0),
          paymentBreakdown: [], // backend report does not expose per-method breakdown
        });
      }
    } catch {
      // swallow for now
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary(range);
  }, [range]);

  const paymentBreakdown: PaymentBreakdown[] = summary?.paymentBreakdown || [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-[520px] flex flex-col bg-white border border-slate-200 rounded-3xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">
            Shift Summary
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Performance overview for your current shift.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setRange('today')}
            className={`inline-flex items-center space-x-1 rounded-lg border px-3 py-1.5 text-[11px] font-black uppercase tracking-widest ${
              range === 'today'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-white text-slate-700'
            }`}
          >
            <CalendarDays size={13} />
            <span>Today</span>
          </button>
          <button
            type="button"
            onClick={() => setRange('yesterday')}
            className={`inline-flex items-center space-x-1 rounded-lg border px-3 py-1.5 text-[11px] font-black uppercase tracking-widest ${
              range === 'yesterday'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-white text-slate-700'
            }`}
          >
            <span>Yesterday</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center space-x-1 rounded-lg border border-slate-200 bg-slate-900 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-white"
          >
            <Printer size={13} />
            <span>Print</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
          Loading shift summary...
        </div>
      ) : !summary ? (
        <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
          No summary available for this period.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryCard
              label="Total Sales Amount"
              value={formatCurrency(summary.totalSalesAmount || 0)}
            />
            <SummaryCard
              label="Total Transactions"
              value={summary.totalTransactions || 0}
            />
            <SummaryCard
              label="Average Ticket Size"
              value={formatCurrency(summary.averageTicketSize || 0)}
            />
            <SummaryCard
              label="Total Discount Given"
              value={formatCurrency(summary.totalDiscountGiven || 0)}
            />
          </div>

          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
              Payment Breakdown
            </h2>
            <div className="space-y-2">
              {paymentBreakdown.length === 0 ? (
                <div className="text-xs text-slate-500">
                  No payment data available.
                </div>
              ) : (
                paymentBreakdown.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                  >
                    <div className="font-semibold text-slate-800">
                      {p.method}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">
                        {formatCurrency(p.amount)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {p.count} transactions
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SummaryCard: React.FC<{ label: string; value: string | number }> = ({
  label,
  value,
}) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-3">
    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
      {label}
    </div>
    <div className="text-sm font-extrabold text-slate-900">{value}</div>
  </div>
);

export default ShiftSummaryPage;

