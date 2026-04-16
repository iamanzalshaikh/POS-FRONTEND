import { useState } from 'react';
import StoreIdentityCard from '@/components/store-admin/StoreIdentityCard';
import { Save, X, Loader2 } from 'lucide-react';
import { getStoreInfo } from '@/api/dashboard.api';
import { profileApi } from '@/service/api';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/useAuthStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const SettingsPage = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { user, setUser } = useAuthStore();
    const [isSaving, setIsSaving] = useState(false);
    const [settingsData, setSettingsData] = useState<any>({});

    const storeId = user?.storeId || user?.store?.id;

    const { data: storeRes, isLoading } = useQuery({
        queryKey: ['store-info', storeId],
        queryFn: () => getStoreInfo(storeId!),
        enabled: !!storeId,
        staleTime: 1000 * 60 * 5,
    });

    const handleSettingsChange = (updates: any) => {
        setSettingsData((prev: any) => ({ ...prev, ...updates }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const formData = new FormData();
            const files: any[] = [];
            
            Object.keys(settingsData).forEach(key => {
                if (key === 'logoFile') {
                    files.push({ name: 'file', file: settingsData[key] });
                    formData.append('isStoreLogoUpdate', 'true');
                    formData.append('isProfileUpdate', 'false');
                } else {
                    formData.append(key, settingsData[key]);
                }
            });

            files.forEach(f => formData.append(f.name, f.file));
            const response = await profileApi.updateProfile(formData);
            
            if (response.data.success) {
                toast({
                    title: "Settings Saved",
                    description: "Store profile and branding updated successfully.",
                });
                setUser(response.data.data.user);
                setSettingsData({}); 
                queryClient.invalidateQueries({ queryKey: ['store-info', storeId] });
            }
        } catch (error: any) {
            toast({
                title: "Save Failed",
                description: error.response?.data?.message || "An error occurred while saving settings.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const storeData = storeRes?.data || storeRes;

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
                <StoreIdentityCard data={storeData} isLoading={isLoading} onChange={handleSettingsChange} />

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-8 border-t border-slate-100 dark:border-slate-800">
                    <button 
                        onClick={() => { setSettingsData({}); queryClient.invalidateQueries({ queryKey: ['store-info', storeId] }); }}
                        disabled={isSaving}
                        className="flex items-center justify-center gap-2 px-6 py-4 bg-white dark:bg-slate-900 text-[#1E1B4B] dark:text-slate-300 font-black text-[10px] uppercase tracking-[2px] rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-slate-100 dark:border-slate-800 shadow-sm active:scale-95 disabled:opacity-50"
                    >
                        <X size={16} className="text-rose-600" />
                        Discard Changes
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving || Object.keys(settingsData).length === 0}
                        className="flex items-center justify-center gap-2 px-10 py-4 bg-[#2563EB] text-white font-black text-[10px] uppercase tracking-[2px] rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all border border-blue-600 active:scale-95 disabled:opacity-50 disabled:bg-slate-400 disabled:border-slate-400"
                    >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {isSaving ? "Saving..." : "Save Profile Settings"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
