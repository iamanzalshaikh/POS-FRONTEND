const TaxSettingsForm = ({ data, isLoading }: { data: any; isLoading: boolean }) => {
    if (isLoading) return <div className="h-48 bg-white rounded-[32px] animate-pulse" />;
    
    return (
        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 space-y-8 animate-fade-in hover:shadow-md transition-all duration-300">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Financial & Tax Settings</h3>
            
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-3">Default Tax (%)</label>
                        <input 
                            type="number" 
                            defaultValue={data?.taxPercentage || "18"}
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 focus:bg-white focus:border-[#1E1B4B]/30 focus:ring-4 focus:ring-[#1E1B4B]/5 outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-3">Tax Registration Number</label>
                        <input 
                            type="text" 
                            placeholder="STRN / NTN / GSTIN"
                            defaultValue={data?.taxNumber || ""}
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 focus:bg-white focus:border-blue-100 outline-none transition-all placeholder:text-slate-300"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-3">Receipt Footer Statement</label>
                    <textarea 
                        rows={2}
                        defaultValue={data?.receiptFooter || "Thank you for shopping with us! No returns without receipt."}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 focus:bg-white focus:border-blue-100 outline-none transition-all resize-none"
                    />
                </div>
            </div>
        </div>
    );
};

export default TaxSettingsForm;
