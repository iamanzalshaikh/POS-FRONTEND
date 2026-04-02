import { useState } from 'react';
import SettingsTabs from '@/components/store-admin/SettingsTabs';
import StoreIdentityCard from '@/components/store-admin/StoreIdentityCard';
import TaxSettingsForm from '@/components/store-admin/TaxSettingsForm';
import { StoreHealthCard, StoreBrandingCard, QuickHelpCard } from '@/components/store-admin/SettingsUtilityCards';
import { Save, X } from 'lucide-react';

import { useQuery } from '@tanstack/react-query';
import { getCurrentUser, getStoreInfo } from '@/api/dashboard.api';

const SettingsPage = () => {
    const [activeTab, setActiveTab] = useState('Store Profile');

    const { data: userData } = useQuery({
        queryKey: ['auth', 'me'],
        queryFn: getCurrentUser,
    });
    const storeId = (userData as any)?.data?.storeId || (userData as any)?.storeId;
    const { data: storeRes, isLoading } = useQuery({
        queryKey: ['store', storeId],
        queryFn: () => getStoreInfo(storeId!),
        enabled: !!storeId,
    });

    const storeData = (storeRes as any)?.data || storeRes;

    return (
        <div className="animate-in fade-in duration-500 space-y-10">
            {/* Header Section */}
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Settings</h1>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Manage your store preferences, tax configurations, and system alerts.</p>
            </div>

            <SettingsTabs activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Content Section */}
            {activeTab === 'Store Profile' ? (
                <div className="max-w-4xl mx-auto w-full flex flex-col gap-8">
                    <StoreIdentityCard data={storeData} isLoading={isLoading} />
                    <TaxSettingsForm data={storeData} isLoading={isLoading} />

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-4">
                        <button className="flex items-center gap-2 px-6 py-3.5 bg-white dark:bg-slate-900 text-[#1E1B4B] dark:text-slate-300 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-[#1E1B4B]/20 dark:border-slate-800 shadow-sm active:scale-95">
                            <X size={16} className="text-rose-600" />
                            Discard Changes
                        </button>
                        <button className="flex items-center gap-2 px-8 py-3.5 bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-blue-800 shadow-lg shadow-blue-400/20 transition-all border border-blue-600 active:scale-95">
                            <Save size={16} />
                            Save Profile Settings
                        </button>
                    </div>

                    {/* Info Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 pb-10">
                        <StoreHealthCard />
                        <StoreBrandingCard />
                        <QuickHelpCard />
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-[40px] p-24 flex flex-col items-center justify-center border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-[24px] flex items-center justify-center text-slate-300 dark:text-slate-600 mb-6 border border-slate-100 dark:border-slate-800">
                        <Save size={32} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        {activeTab} modules are currently under construction
                    </p>
                </div>
            )}
        </div>
    );
};

export default SettingsPage;
