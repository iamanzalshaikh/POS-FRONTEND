import { useState, useEffect } from 'react';
import StoreIdentityCard from '@/components/store-admin/StoreIdentityCard';
import { Save, X } from 'lucide-react';

import { getCurrentUser, getStoreInfo } from '@/api/dashboard.api';

const SettingsPage = () => {
    const [storeRes, setStoreRes] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadSettings = async () => {
        setIsLoading(true);
        try {
            const user = await getCurrentUser();
            const storeId = (user as any)?.data?.storeId || (user as any)?.storeId;
            if (storeId) {
                const store = await getStoreInfo(storeId);
                setStoreRes(store);
            }
        } catch (error) {
            console.error("Failed to load settings:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    const storeData = (storeRes as any)?.data || storeRes;

    return (
        <div className="animate-in fade-in duration-500 space-y-12 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Settings</h1>
                    <p className="text-slate-500 dark:text-slate-500 font-medium uppercase tracking-widest text-[11px] mt-1">Manage your store profile and branding configurations.</p>
                </div>
            </div>

            {/* Profile Content (Directly displayed) */}
            <div className="max-w-[1400px] w-full flex flex-col gap-10">
                <StoreIdentityCard data={storeData} isLoading={isLoading} />

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-8 border-t border-slate-100 dark:border-slate-800">
                    <button className="flex items-center justify-center gap-2 px-6 py-4 bg-white dark:bg-slate-900 text-[#1E1B4B] dark:text-slate-300 font-black text-[10px] uppercase tracking-[2px] rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-slate-100 dark:border-slate-800 shadow-sm active:scale-95">
                        <X size={16} className="text-rose-600" />
                        Discard Changes
                    </button>
                    <button className="flex items-center justify-center gap-2 px-10 py-4 bg-[#2563EB] text-white font-black text-[10px] uppercase tracking-[2px] rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all border border-blue-600 active:scale-95">
                        <Save size={16} />
                        Save Profile Settings
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
