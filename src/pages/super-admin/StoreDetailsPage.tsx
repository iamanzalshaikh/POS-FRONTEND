import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useStoreStore } from '../../store/useStoreStore';
import { useUserStore } from '../../store/useUserStore';
import FormWrapper from '../../components/shared/admin/FormWrapper';
import InputField from '../../components/shared/admin/InputField';
import SelectField from '../../components/shared/admin/SelectField';
import { PAKISTAN_PROVINCES, PAKISTAN_CITIES } from '../../components/global-components/pakistan-geography';
import PasswordInput from '../../components/shared/admin/PasswordInput';
import SubmitButton from '../../components/shared/admin/SubmitButton';
import ToggleSwitch from '../../components/shared/admin/ToggleSwitch';
import {
    ArrowLeft,
    Settings,
    Users,
    Monitor,
    Save,
    UserPlus,
    CheckCircle2,
    XCircle,
    Activity,
    Package,
    ShieldCheck,
    MapPin
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatNumberShort } from '@/utils/format';
import Pagination from '../../components/shared/admin/Pagination';
import { cn } from '@/lib/utils';

const storeUpdateSchema = yup.object().shape({
    name: yup.string().required('Store name is required'),
    address: yup.string().required('Address is required'),
    phone: yup.string().optional(),
    email: yup.string().email('Invalid email').optional(),
    city: yup.string().optional(),
    state: yup.string().optional(),
    zipCode: yup.string().required('Zip code is required'),
});

const addUserSchema = yup.object().shape({
    name: yup.string().required('Name is required'),
    email: yup.string().email('Invalid email').required('Email is required'),
    password: yup.string()
        .min(8, 'Min 8 characters')
        .matches(/[A-Z]/, 'Uppercase required')
        .matches(/[0-9]/, 'Number required')
        .required('Password is required'),
});

const StoreDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { currentStore, fetchStoreById, updateStore, isLoading: isStoreLoading } = useStoreStore();
    const { users, fetchUsers, createUser, toggleUserStatus } = useUserStore();

    const [activeTab, setActiveTab] = useState<'details' | 'users'>('details');
    const [userPage, setUserPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        if (id) {
            fetchStoreById(id);
            fetchUsers(id);
        }
    }, [id, fetchStoreById, fetchUsers]);

    // Store Form
    const {
        register: regStore,
        handleSubmit: handleSubmitStore,
        reset: resetStore,
        watch: watchStore,
        setValue: setStoreValue,
        formState: { errors: storeErrors, isSubmitting: isStoreSubmitting },
    } = useForm({
        resolver: yupResolver(storeUpdateSchema)
    });

    const selectedState = watchStore('state');

    useEffect(() => {
        if (currentStore) {
            resetStore({
                name: currentStore.name,
                address: currentStore.address,
                phone: currentStore.phone || '',
                email: currentStore.email || '',
                city: currentStore.city || '',
                state: currentStore.state || '',
                zipCode: currentStore.zipCode || '',
            });
        }
    }, [currentStore, resetStore]);

    // Add User Form
    const {
        register: regUser,
        handleSubmit: handleSubmitUser,
        reset: resetUser,
        formState: { errors: userErrors, isSubmitting: isUserSubmitting },
    } = useForm({
        resolver: yupResolver(addUserSchema)
    });

    const onUpdateStore = async (data: any) => {
        const success = await updateStore(id!, data);
        if (success) {
            toast({
                title: "Update Successful",
                description: 'Store Metadata Updated',
                variant: 'success'
            });
        } else {
            toast({
                title: "Update Failed",
                description: 'Update Execution Failed',
                variant: 'destructive'
            });
        }
    };

    const onToggleStoreActive = async (val: boolean) => {
        const success = await updateStore(id!, { isActive: val });
        if (success) {
            toast({
                title: "Status Updated",
                description: `Store ${val ? 'Activated' : 'Suspended'}`,
                variant: 'success'
            });
        }
    };

    const onAddAdmin = async (data: any) => {
        const success = await createUser({
            ...data,
            role: 'STORE_ADMIN',
            storeId: id
        });
        if (success) {
            toast({
                title: "User Added",
                description: 'Administrator provisioned successfully',
                variant: 'success'
            });
            resetUser();
            fetchUsers(id);
        } else {
            toast({
                title: "Action Failed",
                description: 'Failed to create user',
                variant: 'destructive'
            });
        }
    };

    const handleToggleUser = async (userId: string, current: boolean) => {
        const success = await toggleUserStatus(userId, !current);
        if (success) {
            toast({
                title: "Access Updated",
                description: 'User access status changed',
                variant: 'success'
            });
        }
    };

    if (isStoreLoading && !currentStore) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-indigo-50 border-t-indigo-600 rounded-full animate-spin shadow-inner"></div>
                <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-400">Loading Node Data</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/super-admin/stores')}
                        className="group p-4 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 rounded-2xl transition-all shadow-sm active:scale-95"
                    >
                        <ArrowLeft size={22} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">{currentStore?.name}</h1>
                            <span className={cn(
                                "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                                currentStore?.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                            )}>
                                {currentStore?.isActive ? 'Active Node' : 'Suspended'}
                            </span>
                        </div>
                        <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[11px] flex items-center gap-2">
                            <MapPin size={12} className="text-indigo-500" /> {currentStore?.city}, {currentStore?.state} • Unit ID: {id?.slice(-6).toUpperCase()}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                    <ToggleSwitch
                        label="System Status"
                        checked={currentStore?.isActive || false}
                        onChange={onToggleStoreActive}
                    />
                </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Uptime Status', val: currentStore?.isActive ? 'Healthy' : 'Off-Line', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { label: 'Staff Nodes', val: `${currentStore?._count?.users || 0} Admins`, icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                    { label: 'Inventory', val: `${currentStore?._count?.products || 0} SKUs`, icon: Package, color: 'text-amber-500', bg: 'bg-amber-50' },
                    { label: 'Terminals', val: `${currentStore?._count?.devices || 0} Units`, icon: Monitor, color: 'text-blue-500', bg: 'bg-blue-50' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow group">
                        <div className={cn("w-12 h-12 rounded-2xl mb-4 flex items-center justify-center transition-transform group-hover:scale-110", stat.bg, stat.color)}>
                            <stat.icon size={24} />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                        <p className="text-xl font-black text-slate-900 tracking-tight">{stat.val}</p>
                    </div>
                ))}
            </div>

            {/* Tabs & Content */}
            <div className="space-y-6">
                <div className="inline-flex p-1.5 bg-slate-200/50 rounded-[1.5rem] border border-slate-200/60 backdrop-blur-sm">
                    {[
                        { id: 'details', label: 'Configuration', icon: Settings },
                        { id: 'users', label: 'Access Control', icon: ShieldCheck },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex items-center gap-2 px-8 py-3 rounded-[1.2rem] text-[11px] font-black uppercase tracking-widest transition-all",
                                activeTab === tab.id 
                                    ? "bg-white text-indigo-600 shadow-md border border-slate-100 scale-105" 
                                    : "text-slate-500 hover:text-slate-800"
                            )}
                        >
                            <tab.icon size={14} /> {tab.label}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {activeTab === 'details' ? (
                        <div className="lg:col-span-12 animate-in slide-in-from-left-8 duration-500">
                            <FormWrapper title="Store Configuration" subtitle="Primary Store Metadata" maxWidth="max-w-4xl">
                                <form onSubmit={handleSubmitStore(onUpdateStore)} className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                                    <div className="space-y-6">
                                        <InputField 
                                            label="Official Name" 
                                            registration={regStore('name')} 
                                            error={storeErrors.name?.message} 
                                        />
                                        <InputField 
                                            label="Physical Address" 
                                            registration={regStore('address')} 
                                            error={storeErrors.address?.message} 
                                        />
                                        <div className="grid grid-cols-2 gap-4">
                                            <SelectField 
                                                label="State" 
                                                registration={regStore('state')} 
                                                error={(storeErrors as any).state?.message}
                                                placeholder="Select State"
                                                options={PAKISTAN_PROVINCES.map(p => ({ value: p, label: p }))}
                                                onChange={(e) => {
                                                    regStore('state').onChange(e);
                                                    setStoreValue('city', '');
                                                }}
                                            />
                                            <SelectField 
                                                label="City" 
                                                registration={regStore('city')} 
                                                error={(storeErrors as any).city?.message}
                                                placeholder="Select City"
                                                disabled={!selectedState}
                                                options={(PAKISTAN_CITIES[selectedState as keyof typeof PAKISTAN_CITIES] || []).map(c => ({ value: c, label: c }))}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <InputField 
                                            label="Zip Code" 
                                            registration={regStore('zipCode')} 
                                            error={(storeErrors as any).zipCode?.message}
                                        />
                                        <InputField 
                                            label="Hotline / Phone" 
                                            registration={regStore('phone')} 
                                            error={(storeErrors as any).phone?.message}
                                        />
                                        <InputField 
                                            label="Public Email" 
                                            registration={regStore('email')} 
                                            error={(storeErrors as any).email?.message}
                                        />
                                        
                                        <div className="pt-2">
                                            <SubmitButton isLoading={isStoreSubmitting} icon={<Save size={18} />}>
                                                Update Node Configuration
                                            </SubmitButton>
                                        </div>
                                    </div>
                                </form>
                            </FormWrapper>
                        </div>
                    ) : (
                        <>
                            <div className="lg:col-span-8 space-y-6 animate-in slide-in-from-right-8 duration-500">
                                <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden">
                                    <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                                        <h3 className="text-[11px] font-black uppercase tracking-[3px] text-slate-500">Authorized Personnel</h3>
                                        <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md">{users.length} Users</span>
                                    </div>
                                    <table className="w-full text-left">
                                        <tbody className="divide-y divide-slate-50">
                                            {users.slice((userPage - 1) * itemsPerPage, userPage * itemsPerPage).map(u => (
                                                <tr key={u.id} className="group hover:bg-slate-50/80 transition-all">
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-[1rem] bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-lg shadow-indigo-200">
                                                                {u.name[0].toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-black text-slate-900 leading-none mb-1.5 uppercase tracking-tight">{u.name}</h4>
                                                                <p className="text-[11px] font-bold text-slate-400">{u.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <button
                                                            onClick={() => handleToggleUser(u.id, u.isActive)}
                                                            className={cn(
                                                                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all active:scale-90",
                                                                u.isActive ? "bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-600 hover:text-white" : "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white"
                                                            )}
                                                        >
                                                            {u.isActive ? "Deactivate" : "Activate"}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className="p-6 border-t border-slate-50">
                                        <Pagination currentPage={userPage} totalPages={Math.ceil(users.length / itemsPerPage)} onPageChange={setUserPage} />
                                    </div>
                                </div>
                            </div>
                            <div className="lg:col-span-4 animate-in fade-in slide-in-from-bottom-8 duration-500 delay-150">
                                <FormWrapper title="User Provisioning" subtitle="Deploy New Administrator">
                                    <form onSubmit={handleSubmitUser(onAddAdmin)} className="space-y-6">
                                        <InputField label="Full Name" registration={regUser('name')} error={userErrors.name?.message} />
                                        <InputField label="Corporate Email" registration={regUser('email')} error={userErrors.email?.message} />
                                        <PasswordInput label="Access Key" registration={regUser('password')} error={userErrors.password?.message} />
                                        <div className="pt-4">
                                            <SubmitButton isLoading={isUserSubmitting} icon={<UserPlus size={18} />}>Deploy Admin</SubmitButton>
                                        </div>
                                    </form>
                                </FormWrapper>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StoreDetailsPage;