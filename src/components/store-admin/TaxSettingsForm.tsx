import React from 'react';

const TaxSettingsForm = ({ data, isLoading }: { data: any; isLoading: boolean }) => {
    if (isLoading) return <div className="h-48 bg-white dark:bg-slate-900 rounded-[32px] animate-pulse" />;
    
    return (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 animate-fade-in hover:shadow-md transition-all duration-300">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-8">Financial & Tax Settings</h3>
            
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-[11px] font-medium uppercase tracking-[2px] text-slate-500 dark:text-slate-400 ml-1">Default Tax (%)</label>
                        <input 
                            type="number" 
                            defaultValue={data?.taxPercentage || "13"}
                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-[12px] font-medium text-slate-600 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-medium uppercase tracking-[2px] text-slate-500 dark:text-slate-400 ml-1">Tax Registration Number</label>
                        <input 
                            type="text" 
                            placeholder="STRN / NTN / GSTIN"
                            defaultValue={data?.taxNumber || ""}
                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-[12px] font-medium text-slate-600 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500/30 outlines-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[11px] font-medium uppercase tracking-[2px] text-slate-500 dark:text-slate-400 ml-1">Receipt Footer Statement</label>
                    <textarea 
                        rows={2}
                        defaultValue={data?.receiptFooter || "Thank you for shopping with us! No returns without receipt."}
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-[12px] font-medium text-slate-600 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500/30 outline-none transition-all resize-none"
                    />
                    <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 ml-1 uppercase tracking-tighter">This message will appear at the bottom of all customer receipts.</p>
                </div>
            </div>
        </div>
    );
};

export default TaxSettingsForm;
