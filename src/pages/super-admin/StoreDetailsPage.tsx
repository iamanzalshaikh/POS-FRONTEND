import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useStoreStore } from '../../store/useStoreStore';
import { useUserStore } from '../../store/useUserStore';
import FormWrapper from '../../components/shared/admin/FormWrapper';
import InputField from '../../components/shared/admin/InputField';
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
    Activity
} from 'lucide-react';
import { showToast } from '../../utils/admin-toast';
import Pagination from '../../components/shared/admin/Pagination';

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
    const { currentStore, fetchStoreById, updateStore, isLoading: isStoreLoading } = useStoreStore();
    const { users, fetchUsers, createUser, toggleUserStatus } = useUserStore();

    const [activeTab, setActiveTab] = useState<'details' | 'users' | 'devices'>('details');
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
        formState: { errors: storeErrors, isSubmitting: isStoreSubmitting },
    } = useForm({
        resolver: yupResolver(storeUpdateSchema)
    });

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
        if (success) showToast('Store Node Updated');
        else showToast('Update Execution Failed', 'error');
    };

    const onToggleStoreActive = async (val: boolean) => {
        const success = await updateStore(id!, { isActive: val });
        if (success) showToast(`Store ${val ? 'Activated' : 'Restricted'}`);
    };

    const onAddAdmin = async (data: any) => {
        const success = await createUser({
            ...data,
            role: 'STORE_ADMIN',
            storeId: id
        });
        if (success) {
            showToast('Store Administrator Added');
            resetUser();
            fetchUsers(id);
        } else {
            showToast('Node Deployment Failed', 'error');
        }
    };

    const handleToggleUser = async (userId: string, current: boolean) => {
        const success = await toggleUserStatus(userId, !current);
        if (success) showToast('User Access Protocol Updated');
    };

    if (isStoreLoading && !currentStore) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Header with Navigation */}
            <div className="flex items-center gap-5">
                <button
                    onClick={() => navigate('/super-admin/stores')}
                    className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 rounded-xl transition-all shadow-sm active:scale-95"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{currentStore?.name}</h1>
                    <p className="text-slate-500 font-medium uppercase tracking-widest text-[11px] mt-1">Management & Configuration Interface</p>
                </div>
            </div>

            {/* Status & Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-3 bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm flex flex-wrap items-center gap-8">
                    <div className="flex items-center gap-4 px-6 border-r border-slate-100">
                        <div className={`p-2 rounded-lg ${currentStore?.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                            <Activity size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Network Status</p>
                            <span className={`text-xs font-bold uppercase tracking-widest ${currentStore?.isActive ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {currentStore?.isActive ? 'Online' : 'Offline'}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 px-6 border-r border-slate-100">
                        <div className="p-2 bg-slate-50 text-slate-400 rounded-lg">
                            <Users size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Administrators</p>
                            <span className="text-xs font-bold text-slate-700">{currentStore?._count?.users || 0} Registered</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 px-6 border-r border-slate-100">
                        <div className="p-2 bg-slate-50 text-slate-400 rounded-lg">
                            <Package size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Inventory Items</p>
                            <span className="text-xs font-bold text-slate-700">{currentStore?._count?.products || 0} Products</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 px-6">
                        <div className="p-2 bg-slate-50 text-slate-400 rounded-lg">
                            <Monitor size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Device Uplinks</p>
                            <span className="text-xs font-bold text-slate-700">{currentStore?._count?.devices || 0} Registered</span>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm flex items-center justify-center">
                    <ToggleSwitch
                        label="Store Active"
                        checked={currentStore?.isActive || false}
                        onChange={onToggleStoreActive}
                    />
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex gap-2 p-1.5 bg-slate-100/50 rounded-2xl border border-slate-200/60 w-fit">
                <button
                    onClick={() => setActiveTab('details')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${activeTab === 'details' ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                        }`}
                >
                    <Settings size={14} /> Store Details
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                        }`}
                >
                    <Users size={14} /> Administrators
                </button>
            </div>

            {/* Tabbed Content */}
            <div className="pt-2">
                {activeTab === 'details' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in slide-in-from-left-4">
                        <FormWrapper title="Store Configuration" subtitle="Update core store metadata and location settings">
                            <form onSubmit={handleSubmitStore(onUpdateStore)} className="space-y-6">
                                <InputField
                                    label="Official Store Name"
                                    registration={regStore('name')}
                                    error={storeErrors.name?.message}
                                />
                                <InputField
                                    label="Street Address"
                                    registration={regStore('address')}
                                    error={storeErrors.address?.message}
                                />
                                <div className="grid grid-cols-3 gap-6">
                                    <InputField
                                        label="City"
                                        registration={regStore('city')}
                                        error={storeErrors.city?.message}
                                    />
                                    <InputField
                                        label="State / Province"
                                        registration={regStore('state')}
                                        error={storeErrors.state?.message}
                                    />
                                    <InputField
                                        label="Zip Code"
                                        registration={regStore('zipCode')}
                                        error={storeErrors.zipCode?.message}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <InputField
                                        label="Contact phone"
                                        registration={regStore('phone')}
                                        error={storeErrors.phone?.message}
                                    />
                                    <InputField
                                        label="Store Email (Public)"
                                        registration={regStore('email')}
                                        error={storeErrors.email?.message}
                                    />
                                </div>
                                <div className="pt-4">
                                    <SubmitButton isLoading={isStoreSubmitting} icon={<Save size={18} />}>
                                        Save Changes
                                    </SubmitButton>
                                </div>
                            </form>
                        </FormWrapper>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in fade-in slide-in-from-right-4">
                        {/* Administrator List */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                            <th className="px-8 py-5">Administrator</th>
                                            <th className="px-8 py-5 text-center">Status</th>
                                            <th className="px-8 py-5 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {users.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="px-8 py-12 text-center text-slate-400 text-sm font-medium">No administrators found.</td>
                                            </tr>
                                        ) : users.slice((userPage - 1) * itemsPerPage, userPage * itemsPerPage).map(u => (
                                            <tr key={u.id} className="group hover:bg-[#2563EB]/5 transition-all text-sm">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-indigo-600 text-[11px] shadow-sm">
                                                            {u.name[0].toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-900 leading-none mb-1.5">{u.name}</h4>
                                                            <p className="text-[11px] font-medium text-slate-400">{u.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-center">
                                                    <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${u.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                                        }`}>
                                                        {u.isActive ? 'Active' : 'Suspended'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <button
                                                        onClick={() => handleToggleUser(u.id, u.isActive)}
                                                        className={`p-2 rounded-xl transition-all shadow-sm border ${u.isActive
                                                            ? 'text-rose-500 bg-rose-50 border-rose-100 hover:bg-rose-100'
                                                            : 'text-emerald-500 bg-emerald-50 border-emerald-100 hover:bg-emerald-100'
                                                            }`}
                                                        title={u.isActive ? "Deactivate User" : "Activate User"}
                                                    >
                                                        {u.isActive ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <Pagination
                                    currentPage={userPage}
                                    totalPages={Math.ceil(users.length / itemsPerPage)}
                                    onPageChange={setUserPage}
                                />
                            </div>
                        </div>

                        {/* Add Admin Form */}
                        <div>
                            <FormWrapper title="Add Administrator" subtitle="Provision new administrative access">
                                <form onSubmit={handleSubmitUser(onAddAdmin)} className="space-y-6">
                                    <InputField
                                        label="Full Name"
                                        registration={regUser('name')}
                                        error={userErrors.name?.message}
                                    />
                                    <InputField
                                        label="Corporate Email"
                                        registration={regUser('email')}
                                        error={userErrors.email?.message}
                                    />
                                    <PasswordInput
                                        label="New Password"
                                        registration={regUser('password')}
                                        error={userErrors.password?.message}
                                    />
                                    <div className="pt-4">
                                        <SubmitButton
                                            isLoading={isUserSubmitting}
                                            icon={<UserPlus size={18} />}
                                        >
                                            Create Admin
                                        </SubmitButton>
                                    </div>
                                </form>
                            </FormWrapper>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StoreDetailsPage;
