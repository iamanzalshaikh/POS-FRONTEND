import React, { useRef, useState } from 'react';
import { Camera } from 'lucide-react';

const StoreIdentityCard = ({ data, isLoading }: { data: any; isLoading: boolean }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerUpload = () => {
        fileInputRef.current?.click();
    };

    if (isLoading) return <div className="h-64 bg-white dark:bg-slate-900 rounded-[32px] animate-pulse" />;

    return (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 animate-fade-in hover:shadow-md transition-all duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                {/* Left Section: Form Fields (3/4) */}
                <div className="lg:col-span-3 space-y-8">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Store Profile</h3>
                    
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-medium uppercase tracking-[2px] text-slate-500 dark:text-slate-400 ml-1">Official Store Name</label>
                                <input 
                                    type="text" 
                                    defaultValue={data?.name || "Hybrid POS Flagship"}
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-[12px] font-medium text-slate-600 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-medium uppercase tracking-[2px] text-slate-500 dark:text-slate-400 ml-1">Email Address</label>
                                <input 
                                    type="email" 
                                    defaultValue={data?.email || "official@hybridpos.com"}
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-[12px] font-medium text-slate-600 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 md:col-span-1">
                                <label className="text-[11px] font-medium uppercase tracking-[2px] text-slate-500 dark:text-slate-400 ml-1">Phone Number</label>
                                <input 
                                    type="tel" 
                                    defaultValue={data?.phone || "021-34444555"}
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-[12px] font-medium text-slate-600 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-1">
                                <label className="text-[11px] font-medium uppercase tracking-[2px] text-slate-500 dark:text-slate-400 ml-1">Address</label>
                                <textarea 
                                    rows={1}
                                    defaultValue={data?.address || "Plot 42-C, 4th Lane, DHA Phase 6, Karachi"}
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-[12px] font-medium text-slate-600 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500/30 outline-none transition-all resize-none overflow-hidden"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-50 dark:border-slate-800/50 pt-8 mt-2">
                            <div className="space-y-2">
                                <label className="text-[11px] font-medium uppercase tracking-[2px] text-slate-500 dark:text-slate-400 ml-1">Base Currency</label>
                                <div className="relative group">
                                    <select 
                                        defaultValue={data?.currency || "PKR – Pakistani Rupee"}
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-[12px] font-medium text-slate-600 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500/30 outline-none transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="PKR">PKR – Pakistani Rupee</option>
                                        <option value="INR">INR – Indian Rupee</option>
                                        <option value="USD">USD – US Dollar</option>
                                        <option value="EUR">EUR – Euro</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-medium uppercase tracking-[2px] text-slate-500 dark:text-slate-400 ml-1">Regional Timezone</label>
                                <div className="relative group">
                                    <select 
                                        defaultValue={data?.timezone || "Asia/Karachi (PKT)"}
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-[12px] font-medium text-slate-600 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500/30 outline-none transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="Asia/Karachi">Asia/Karachi (PKT)</option>
                                        <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                                        <option value="UTC">UTC (GMT+0)</option>
                                        <option value="America/New_York">America/New_York (GMT-5)</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Section: Store Branding (1/4) */}
                <div className="lg:border-l lg:border-slate-100 lg:dark:border-slate-800 lg:pl-12 space-y-8 flex flex-col items-center lg:items-start border-t lg:border-t-0 pt-8 lg:pt-0">
                    <h3 className="text-[11px] font-medium text-slate-500 dark:text-slate-400 tracking-[2px] uppercase">Branding</h3>
                    
                    <div className="w-full flex flex-col items-center gap-6">
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                        <div 
                            onClick={triggerUpload}
                            className="w-40 h-40 bg-slate-50 dark:bg-slate-800/50 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-700 group hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all cursor-pointer overflow-hidden relative shadow-inner"
                        >
                            {preview ? (
                                <img src={preview} alt="Store Logo Preview" className="w-full h-full object-cover shadow-sm" />
                            ) : (
                                <div className="flex flex-col items-center gap-2">
                                    <Camera size={32} className="group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                                    <span className="text-[9px] font-bold uppercase tracking-tight opacity-50">Upload Logo</span>
                                </div>
                            )}
                        </div>
                        
                        <div className="w-full flex flex-col items-center gap-4">
                            <button 
                                onClick={triggerUpload}
                                className="w-full px-6 py-3.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all border border-indigo-100 dark:border-indigo-900/50 active:scale-95 shadow-sm"
                            >
                                Change Logo
                            </button>
                            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 text-center leading-relaxed">
                                Recommended:<br />512x512 • SVG or PNG
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StoreIdentityCard;
