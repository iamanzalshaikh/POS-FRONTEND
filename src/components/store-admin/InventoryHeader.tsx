import { useNavigate } from 'react-router-dom';

const InventoryHeader = () => {
    const navigate = useNavigate();
    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Stock Movements</h1>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">Real-time inventory logs and tracking</p>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
                <button 
                    onClick={() => navigate('/store-admin/inventory/adjustments')}
                    className="flex-1 sm:flex-none bg-indigo-900 text-white px-6 py-4 rounded-2xl hover:bg-indigo-600 font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20 transition-all active:scale-95 border border-indigo-900/20"
                >
                    Log Adjustment
                </button>
            </div>
        </div>
    )
}

export default InventoryHeader
