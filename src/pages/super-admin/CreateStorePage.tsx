import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { useStoreStore } from '../../store/useStoreStore';
import FormWrapper from '../../components/shared/admin/FormWrapper';
import InputField from '../../components/shared/admin/InputField';
import PasswordInput from '../../components/shared/admin/PasswordInput';
import SubmitButton from '../../components/shared/admin/SubmitButton';
import { Store, ArrowLeft, ShieldCheck } from 'lucide-react';
import { showToast } from '../../utils/admin-toast';

const createStoreSchema = yup.object().shape({
    // Store Details
    name: yup.string().required('Store name is required'),
    address: yup.string().required('Address is required'),
    phone: yup.string().optional(),
    email: yup.string().email('Invalid email').optional(),
    city: yup.string().optional(),
    state: yup.string().optional(),
    zipCode: yup.string().required('Zip code is required'),

    // Admin Details
    adminName: yup.string().required('Admin name is required'),
    adminEmail: yup.string().email('Invalid admin email').required('Admin email is required'),
    adminPassword: yup.string()
        .min(8, 'Password must be at least 8 characters')
        .matches(/[A-Z]/, 'Password must contain an uppercase letter')
        .matches(/[a-z]/, 'Password must contain a lowercase letter')
        .matches(/[0-9]/, 'Password must contain a number')
        .matches(/[^a-zA-Z0-9]/, 'Password must contain a special character')
        .required('Admin password is required'),
});

const CreateStorePage: React.FC = () => {
    const { createStore, error: storeError } = useStoreStore();
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: yupResolver(createStoreSchema)
    });

    const onSubmit = async (data: any) => {
        const success = await createStore(data);
        if (success) {
            showToast('Store Provisioned Successfully');
            navigate('/super-admin/stores');
        } else {
            // The createStore action sets the error in the store state on failure
            showToast(storeError || 'Failed to Provision Store', 'error');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Header Area */}
            <div className="flex items-center gap-5">
                <button
                    onClick={() => navigate('/super-admin/stores')}
                    className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 rounded-xl transition-all shadow-sm active:scale-95"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Provision New Store</h1>
                    <p className="text-slate-500 font-medium uppercase tracking-widest text-[11px] mt-1">Register a new network node and administrator account</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Store Identity Selection */}
                <FormWrapper title="Store Identity" subtitle="Core metadata and physical location configuration">
                    <div className="space-y-6">
                        <InputField
                            label="Official Store Name"
                            placeholder="e.g. Downtown Flagship"
                            registration={register('name')}
                            error={errors.name?.message}
                        />
                        <InputField
                            label="Business Address"
                            placeholder="Street address and building"
                            registration={register('address')}
                            error={errors.address?.message}
                        />
                        <div className="grid grid-cols-3 gap-6">
                            <InputField
                                label="City"
                                placeholder="City name"
                                registration={register('city')}
                                error={errors.city?.message}
                            />
                            <InputField
                                label="State / Region"
                                placeholder="Province/State"
                                registration={register('state')}
                                error={errors.state?.message}
                            />
                            <InputField
                                label="Zip Code"
                                placeholder="E.g. 75500"
                                registration={register('zipCode')}
                                error={errors.zipCode?.message}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <InputField
                                label="Primary Phone"
                                placeholder="Contact number"
                                registration={register('phone')}
                                error={errors.phone?.message}
                            />
                            <InputField
                                label="Support Email"
                                placeholder="store@example.com"
                                registration={register('email')}
                                error={errors.email?.message}
                            />
                        </div>
                    </div>
                </FormWrapper>

                {/* Administrator Credentials Section */}
                <div className="space-y-8">
                    <FormWrapper title="Root Administrator" subtitle="Configure primary administrative credentials">
                        <div className="space-y-6">
                            <InputField
                                label="Administrator Name"
                                placeholder="Full name of manager"
                                registration={register('adminName')}
                                error={errors.adminName?.message}
                            />
                            <InputField
                                label="Security Email"
                                placeholder="admin@example.com"
                                registration={register('adminEmail')}
                                error={errors.adminEmail?.message}
                            />
                            <PasswordInput
                                label="Account Password"
                                placeholder="Min. 8 chars with symbols"
                                registration={register('adminPassword')}
                                error={errors.adminPassword?.message}
                            />

                            <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-4">
                                <div className="p-2 bg-white rounded-xl shadow-sm text-indigo-500">
                                    <ShieldCheck size={24} />
                                </div>
                                <p className="text-[11px] font-bold text-indigo-700/80 leading-relaxed uppercase tracking-wide">
                                    The root administrator will possess complete authority over this store node and its devices.
                                </p>
                            </div>
                        </div>
                    </FormWrapper>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <SubmitButton
                            isLoading={isSubmitting}
                            icon={<Store size={18} />}
                            loadingText="Provisioning Node..."
                        >
                            Provision Store
                        </SubmitButton>
                        <button
                            type="button"
                            onClick={() => navigate('/super-admin/stores')}
                            className="px-8 py-3.5 bg-white border border-slate-200 text-slate-500 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 hover:text-slate-700 transition-all shadow-sm active:scale-95"
                        >
                            Cancel Request
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CreateStorePage;
