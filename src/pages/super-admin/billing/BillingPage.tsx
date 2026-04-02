import { CreditCard, Plus, HelpCircle, Edit3, Trash2 } from 'lucide-react';
import { formatPKR } from '@/utils/format';

const SuperAdminBillingPage = () => {
    const billingSummary = {
        plan: 'Professional',
        cycle: 'Monthly',
        status: 'Paid',
        nextDue: 'May 05, 2026',
        paymentMethod: 'Visa •••• 4242',
        amount: 79,
    };

    const paymentMethods = [
        {
            type: 'Visa',
            number: '•••• •••• •••• 4242',
            expiry: '12/2025',
            default: true,
            brand: 'visa'
        },
        {
            type: 'Mastercard',
            number: '•••• •••• •••• 5555',
            expiry: '08/2026',
            default: false,
            brand: 'mastercard'
        }
    ];

    return (
        <div className="animate-fade-in space-y-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Billing Page</h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">View current billing details and manage payment methods for the Super Admin account.</p>
                </div>
                <button className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-indigo-700 transition-all shadow-xl active:scale-95">
                    <Plus size={16} />
                    Update Payment Method
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Plan</p>
                    <p className="text-2xl font-black text-slate-900 mt-3">{billingSummary.plan}</p>
                </div>
                <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Billing Cycle</p>
                    <p className="text-2xl font-black text-slate-900 mt-3">{billingSummary.cycle}</p>
                </div>
                <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Status</p>
                    <p className="text-2xl font-black text-emerald-600 mt-3">{billingSummary.status}</p>
                </div>
                <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Next Payment</p>
                    <p className="text-2xl font-black text-slate-900 mt-3">{billingSummary.nextDue}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                {/* Left Column: Billing Details */}
                <div className="xl:col-span-2 space-y-8">
                    <section className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">Current Billing Overview</h2>
                                <p className="text-sm text-slate-500 mt-2">All active billing information for the global Super Admin account.</p>
                            </div>
                            <div className="rounded-3xl bg-slate-50 px-5 py-4 border border-slate-100">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Method</p>
                                <p className="text-sm font-black text-slate-900 mt-2">{billingSummary.paymentMethod}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subscription Amount</p>
                                <p className="text-3xl font-black text-slate-900">{formatPKR(billingSummary.amount)}</p>
                            </div>
                            <div className="space-y-3">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Billing Status</p>
                                <p className="text-sm font-black uppercase tracking-widest text-emerald-600">{billingSummary.status}</p>
                            </div>
                        </div>

                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all">
                                Change Default Payment Method
                            </button>
                            <button className="w-full py-4 bg-slate-50 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-slate-200 hover:bg-slate-100 transition-all">
                                Review Upcoming Invoice
                            </button>
                        </div>
                    </section>

                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                Platform Payment Methods
                                <span className="bg-slate-100 text-slate-400 px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-widest leading-none">
                                    {paymentMethods.length} methods
                                </span>
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {paymentMethods.map((method, idx) => (
                                <div
                                    key={idx}
                                    className={`bg-white rounded-[40px] p-8 border ${method.default ? 'border-indigo-600 shadow-xl shadow-indigo-50 shadow-indigo-100' : 'border-slate-100'} group relative transition-all hover:border-slate-300`}
                                >
                                    {method.default && (
                                        <div className="absolute top-6 right-6 bg-emerald-500 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">
                                            Default
                                        </div>
                                    )}
                                    <div className="mb-10 w-12 h-8 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center">
                                        <CreditCard size={20} className={method.default ? 'text-indigo-600' : 'text-slate-400'} />
                                    </div>
                                    <div className="mb-6">
                                        <p className="text-xl font-mono font-bold text-slate-900 tracking-[1px]">{method.number}</p>
                                        <div className="mt-3 flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expires</p>
                                                <p className="text-sm font-bold text-slate-700">{method.expiry}</p>
                                            </div>
                                            <div className="flex items-center gap-2 pt-4">
                                                <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-all rounded-[12px]">
                                                    <Edit3 size={16} />
                                                </button>
                                                {!method.default && (
                                                    <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all rounded-[12px]">
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Right Column: Help & Action */}
                <div className="space-y-8">
                    <div className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                        <h3 className="text-lg font-black tracking-tight mb-4 relative z-10">Billing Summary</h3>
                        <div className="space-y-4 relative z-10">
                            <div className="rounded-3xl bg-white/10 p-5 border border-white/10">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Active Plan</p>
                                <p className="text-2xl font-black text-white mt-2">{billingSummary.plan}</p>
                            </div>
                            <div className="rounded-3xl bg-white/5 p-5 border border-white/10">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Next Payment Due</p>
                                <p className="text-sm font-black text-white mt-2">{billingSummary.nextDue}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm">
                        <div className="w-12 h-12 bg-amber-50 rounded-[16px] flex items-center justify-center text-amber-500 mb-6">
                            <HelpCircle size={24} />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 tracking-tight mb-2">Need Billing Help?</h3>
                        <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
                            View help resources, update payment settings, or connect with the finance team for any account-level billing questions.
                        </p>
                        <button className="w-full py-4 bg-slate-50 text-slate-900 border border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all">
                            Contact Finance Support
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminBillingPage;