import { useState } from 'react';
import { Zap, Check, Pencil, Trash2, Users, Building } from 'lucide-react';
import { formatPKR } from '@/utils/format';

interface Plan {
    name: string;
    slug: string;
    price: number;
    description: string;
    features: string[];
    current: boolean;
    popular?: boolean;
    duration: string;
    custom?: boolean;
    devices: number;
    staffCapacity: number;
    users?: string;
}

const initialPlans: Plan[] = [
    {
        name: 'Basic',
        slug: 'basic',
        price: 2900,
        description: 'Perfect for small shops and kiosks.',
        features: ['Up to 2 Devices', 'Unlimited Products', 'Basic Reports', 'Email Support'],
        current: false,
        duration: 'monthly',
        devices: 50,
        staffCapacity: 10,
    },
    {
        name: 'Professional',
        slug: 'professional',
        price: 7900,
        description: 'Best for growing retail businesses.',
        features: ['Up to 10 Devices', 'Inventory Management', 'Advanced Analytics', 'Priority Support', 'Staff Management'],
        current: true,
        popular: true,
        duration: 'monthly',
        devices: 200,
        staffCapacity: 45,
    },
    {
        name: 'Enterprise',
        slug: 'enterprise',
        price: 19900,
        description: 'Full power for large scale operations.',
        features: ['Unlimited Devices', 'Multi-store Support', 'Custom Integrations', '24/7 Dedicated Support', 'API Access'],
        current: false,
        duration: 'monthly',
        devices: 999,
        staffCapacity: 200,
    },
];


const getDurationLabel = (duration: string) => {
    if (duration === 'yearly') return '/ year';
    if (duration === 'monthly') return '/ month';
    return `/${duration}`;
};

const SuperAdminSubscriptionPage = () => {
    const [plans, setPlans] = useState<Plan[]>(initialPlans);
    const [customName, setCustomName] = useState('');
    const [customSlug, setCustomSlug] = useState('');
    const [customPrice, setCustomPrice] = useState('');
    const [customDevices, setCustomDevices] = useState('');
    const [customStaff, setCustomStaff] = useState('');
    const [customUsers, setCustomUsers] = useState('');
    const [editingPlanSlug, setEditingPlanSlug] = useState<string | null>(null);

    const handleActivatePlan = (planName: string) => {
        setPlans((prevPlans: Plan[]) =>
            prevPlans.map((plan: Plan) => ({
                ...plan,
                current: plan.name === planName,
            }))
        );
    };

    const handleEditPlan = (plan: Plan) => {
        if (!plan.custom) return;
        setEditingPlanSlug(plan.slug);
        setCustomName(plan.name);
        setCustomSlug(plan.slug);
        setCustomPrice(plan.price.toString());
        setCustomDevices(plan.devices.toString());
        setCustomStaff(plan.staffCapacity.toString());
        setCustomUsers(plan.users || '');
    };

    const handleDeletePlan = (planSlug: string) => {
        setPlans((prevPlans: Plan[]) => {
            const remaining = prevPlans.filter((plan: Plan) => plan.slug !== planSlug);
            if (!remaining.some((plan: Plan) => plan.current) && remaining.length > 0) {
                return remaining.map((plan: Plan, index: number) => ({
                    ...plan,
                    current: index === 0,
                }));
            }
            return remaining;
        });
    };

    const handleCreateCustomPlan = () => {
        const priceValue = Number(customPrice.replace(/[^0-9.]/g, ''));
        const devicesValue = Number(customDevices.replace(/\D/g, ''));
        const staffValue = Number(customStaff.replace(/\D/g, ''));

        if (
            !customName.trim() ||
            !customSlug.trim() ||
            !customPrice.trim() ||
            !customDevices.trim() ||
            !customStaff.trim() ||
            Number.isNaN(priceValue) ||
            Number.isNaN(devicesValue) ||
            Number.isNaN(staffValue)
        ) {
            return;
        }

        const nextPlan: Plan = {
            name: customName.trim(),
            slug: customSlug.trim().toLowerCase().replace(/\s+/g, '-'),
            price: priceValue,
            description: 'Custom subscription package with tailored limits.',
            features: ['Dedicated onboarding', 'Flexible limits', 'Priority support'],
            current: false,
            duration: 'monthly',
            custom: true,
            devices: devicesValue,
            staffCapacity: staffValue,
            users: customUsers.trim() || undefined,
        };

        setPlans((prevPlans: Plan[]) => {
            if (editingPlanSlug) {
                return prevPlans.map((plan: Plan) =>
                    plan.slug === editingPlanSlug ? { ...plan, ...nextPlan } : plan
                );
            }
            return [...prevPlans, nextPlan];
        });

        setEditingPlanSlug(null);
        setCustomName('');
        setCustomSlug('');
        setCustomPrice('');
        setCustomDevices('');
        setCustomStaff('');
        setCustomUsers('');
    };

    return (
        <div className="p-8 bg-slate-50 dark:bg-slate-950 min-h-screen font-jakarta animate-fade-in">
            {/* Header Area */}
            <div className="mb-10">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Subscription Plans</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">PRICING • SCHOOL PLANS AND LIMITS</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* Standard and Custom Plans */}
                {plans.map((plan: Plan, index: number) => (
                    <div
                        key={index}
                        className={`bg-white dark:bg-slate-900 border ${plan.current ? 'border-blue-500 ring-2 ring-blue-500/10 shadow-xl' : 'border-slate-200 dark:border-slate-800 shadow-sm'} rounded-xl p-6 flex flex-col justify-between transition-all hover:shadow-md relative overflow-hidden h-full min-h-[500px]`}
                    >
                        {plan.popular && (
                            <div className="absolute top-4 right-16 px-3 py-1 bg-amber-500 text-white text-[8px] font-black uppercase tracking-widest rounded-full">
                                MOST POPULAR
                            </div>
                        )}

                        <div className="flex flex-col gap-6">
                            {/* Header Row */}
                            <div className="flex justify-between items-start">
                                <div className={`p-2.5 rounded-lg border ${plan.name === 'Basic' ? 'bg-slate-50 text-slate-400' : plan.name === 'Silver' ? 'bg-blue-50 text-blue-500' : plan.name === 'Gold' ? 'bg-amber-50 text-amber-500' : 'bg-indigo-50 text-indigo-500'}`}>
                                    {plan.name === 'Basic' && <Zap size={18} />}
                                    {plan.name === 'Silver' && <Check size={18} />}
                                    {plan.name === 'Gold' && <Building size={18} />}
                                    {plan.name === 'Premium' && <Users size={18} />}
                                    {plan.custom && <Zap size={18} />}
                                </div>
                                <div className="flex gap-2 text-slate-300">
                                    <button
                                        type="button"
                                        disabled={!plan.custom}
                                        onClick={() => handleEditPlan(plan)}
                                        className={`transition-colors ${plan.custom ? 'hover:text-blue-600' : 'cursor-not-allowed text-slate-200'}`}
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        disabled={!plan.custom}
                                        onClick={() => plan.custom && handleDeletePlan(plan.slug)}
                                        className={`transition-colors ${plan.custom ? 'hover:text-rose-600' : 'cursor-not-allowed text-slate-200'}`}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Plan Name & Price */}
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {formatPKR(plan.price).split('/')[0]}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                                        {getDurationLabel(plan.duration)}
                                    </span>
                                </div>
                            </div>

                            {/* Core Limits */}
                            <div className="space-y-3">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                    CORE LIMITS
                                </p>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30 px-3 py-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-2">
                                            <Users size={14} className="text-blue-500" />
                                            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Devices</span>
                                        </div>
                                        <span className="text-xs font-bold text-slate-900 dark:text-white">{plan.devices.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30 px-3 py-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-2">
                                            <Building size={14} className="text-blue-500" />
                                            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Staff Capacity</span>
                                        </div>
                                        <span className="text-xs font-bold text-slate-900 dark:text-white">{plan.staffCapacity}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Included Features */}
                            <div className="space-y-3">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                    INCLUDED FEATURES
                                </p>
                                {/* Feature list omitted for brevity as per screenshot focus on limits */}
                            </div>
                        </div>

                        {/* Select Button */}
                        <button
                            onClick={() => !plan.current && handleActivatePlan(plan.name)}
                            disabled={plan.current}
                            className={`mt-8 w-full rounded-lg py-2.5 text-[10px] font-bold uppercase tracking-widest border transition-all
                                ${plan.current
                                    ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed dark:bg-slate-800 dark:border-slate-700'
                                    : 'border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white dark:border-slate-100 dark:text-slate-100 dark:hover:bg-slate-100 dark:hover:text-slate-900'
                                }`}
                        >
                            {plan.current ? 'ACTIVE PLAN' : 'SELECT PLAN'}
                        </button>
                    </div>
                ))}

                {/* Create Custom Plan Card */}
                <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-blue-200 dark:border-blue-900/50 rounded-xl p-8 flex flex-col justify-between h-full min-h-[500px]">
                    <div className="space-y-8">
                        <div className="flex items-center gap-2 text-blue-500">
                            <Zap size={18} fill="currentColor" />
                            <h3 className="font-bold text-lg">
                                {editingPlanSlug ? 'Update Custom Plan' : 'Create Custom Plan'}
                            </h3>
                        </div>

                        <div className="space-y-4">
                            <input
                                type="text"
                                value={customName}
                                onChange={(e) => setCustomName(e.target.value)}
                                placeholder="Plan name (e.g. Custom 1)"
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-lg px-4 py-3 text-sm font-medium outline-none focus:border-blue-500 transition-all"
                            />
                            <input
                                type="text"
                                value={customSlug}
                                onChange={(e) => setCustomSlug(e.target.value)}
                                placeholder="Slug (e.g. custom-1)"
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-lg px-4 py-3 text-sm font-medium outline-none focus:border-blue-500 transition-all font-mono"
                            />
                            <div className="grid grid-cols-3 gap-2">
                                <input
                                    type="number"
                                    value={customPrice}
                                    onChange={(e) => setCustomPrice(e.target.value)}
                                    placeholder="Price"
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-lg px-4 py-3 text-sm font-medium outline-none focus:border-blue-500 transition-all"
                                />
                                <input
                                    type="number"
                                    value={customDevices}
                                    onChange={(e) => setCustomDevices(e.target.value)}
                                    placeholder="Devices"
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-lg px-4 py-3 text-sm font-medium outline-none focus:border-blue-500 transition-all"
                                />
                                <input
                                    type="number"
                                    value={customStaff}
                                    onChange={(e) => setCustomStaff(e.target.value)}
                                    placeholder="Staff"
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-lg px-4 py-3 text-sm font-medium outline-none focus:border-blue-500 transition-all"
                                />
                            </div>
                            <input
                                type="text"
                                value={customUsers}
                                onChange={(e) => setCustomUsers(e.target.value)}
                                placeholder="Users (officer tokens)"
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-lg px-4 py-3 text-sm font-medium outline-none focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleCreateCustomPlan}
                        className="mt-8 w-full bg-blue-600 text-white rounded-lg py-3 text-sm font-bold hover:bg-blue-700 transition-all active:scale-[0.98]"
                    >
                        {editingPlanSlug ? 'Update Plan' : 'Save Plan'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminSubscriptionPage;