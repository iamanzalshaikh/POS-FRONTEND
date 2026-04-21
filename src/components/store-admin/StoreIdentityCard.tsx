import React, { useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { formatPakistanMobile } from '../../utils/validation';

const StoreIdentityCard = ({ data, isLoading, onChange }: { data: any; isLoading: boolean; onChange: (updates: any) => void }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [formState, setFormState] = useState({
        storeName: "",
        email: "",
        phone: "",
        address: "",
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            onChange({ logoFile: file });
        }
    };

        // Update local form state when data is fetched
        React.useEffect(() => {
            if (data) {
                setFormState({
                    storeName: data.name || "",
                    email: data.email || "",
                    phone: data.phone || "",
                    address: data.address || "",
                });
            }
        }, [data]);

        const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
            const { name, value } = e.target;
            const finalValue = name === 'phone' ? formatPakistanMobile(value) : value;
            setFormState(prev => ({ ...prev, [name]: finalValue }));
            onChange({ [name]: finalValue });
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
                                        name="storeName"
                                        type="text" 
                                        value={formState.storeName}
                                        onChange={handleInputChange}
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-[12px] font-medium text-slate-600 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-medium uppercase tracking-[2px] text-slate-500 dark:text-slate-400 ml-1">Email Address</label>
                                    <input 
                                        name="email"
                                        type="email" 
                                        value={formState.email}
                                        onChange={handleInputChange}
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-[12px] font-medium text-slate-600 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 md:col-span-1">
                                    <label className="text-[11px] font-medium uppercase tracking-[2px] text-slate-500 dark:text-slate-400 ml-1">Phone Number</label>
                                    <input 
                                        name="phone"
                                        type="tel" 
                                        value={formState.phone}
                                        onChange={handleInputChange}
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-[12px] font-medium text-slate-600 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-1">
                                    <label className="text-[11px] font-medium uppercase tracking-[2px] text-slate-500 dark:text-slate-400 ml-1">Address</label>
                                    <textarea 
                                        name="address"
                                        rows={1}
                                        value={formState.address}
                                        onChange={handleInputChange}
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-[12px] font-medium text-slate-600 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500/30 outline-none transition-all resize-none overflow-hidden"
                                    />
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
                                {preview || data?.logoUrl ? (
                                    <img src={preview || data?.logoUrl} alt="Store Logo Preview" className="w-full h-full object-cover shadow-sm" />
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <Camera size={32} className="group-hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" />
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
