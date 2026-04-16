import React, { useState, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { profileApi, authApi } from '@/service/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Camera, User, Phone, Mail, Lock, ShieldCheck, Loader2, Save, KeyRound, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
    const { user, setUser } = useAuthStore();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isUpdating, setIsUpdating] = useState(false);
    const [isChangingPass, setIsChangingPass] = useState(false);
    const [showOldPass, setShowOldPass] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);
    const [profileData, setProfileData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        phone: user?.phone || '',
    });

    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            const response = await profileApi.updateProfile(profileData);
            if (response.data.success) {
                setUser(response.data.data.user);
                toast({
                    title: "Profile Updated",
                    description: "Your profile information has been successfully updated.",
                });
            }
        } catch (error: any) {
            toast({
                title: "Update Failed",
                description: error.response?.data?.message || "Something went wrong while updating your profile.",
                variant: "destructive",
            });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast({
                title: "Password Mismatch",
                description: "New password and confirmation do not match.",
                variant: "destructive",
            });
            return;
        }

        setIsChangingPass(true);
        try {
            const response = await authApi.changePassword({
                oldPassword: passwordData.oldPassword,
                newPassword: passwordData.newPassword,
            });
            if (response.data.success) {
                setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                toast({
                    title: "Password Changed",
                    description: "Your password has been successfully updated.",
                });
            }
        } catch (error: any) {
            toast({
                title: "Password Change Failed",
                description: error.response?.data?.message || "Invalid current password or new password requirements not met.",
                variant: "destructive",
            });
        } finally {
            setIsChangingPass(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Size limit: 2MB
        if (file.size > 2 * 1024 * 1024) {
            toast({
                title: "File too large",
                description: "Profile picture must be less than 2MB.",
                variant: "destructive",
            });
            return;
        }

        const formData = new FormData();
        formData.append('isProfileUpdate', 'true');
        formData.append('file', file);

        setIsUpdating(true);
        try {
            const response = await profileApi.updateProfile(formData);
            if (response.data.success) {
                setUser(response.data.data.user);
                toast({
                    title: "Picture Updated",
                    description: "Your profile picture has been updated successfully.",
                });
            }
        } catch (error: any) {
            toast({
                title: "Upload Failed",
                description: error.response?.data?.message || "Failed to upload profile picture.",
                variant: "destructive",
            });
        } finally {
            setIsUpdating(false);
        }
    };

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-12 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row items-center gap-8 bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none">
                <div className="relative group">
                    <Avatar className="w-32 h-32 md:w-40 md:h-40 rounded-[35px] border-4 border-indigo-50 dark:border-indigo-950/30 overflow-hidden shadow-2xl">
                        <AvatarImage src={user?.profilePictureUrl} className="object-cover transition-transform group-hover:scale-105 duration-500" />
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-4xl font-black">
                            {user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <button 
                        onClick={triggerFileSelect}
                        disabled={isUpdating}
                        className="absolute bottom-1 right-1 p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group-hover:rotate-12 duration-300"
                    >
                        {isUpdating ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                        accept="image/*"
                    />
                </div>

                <div className="flex-1 text-center md:text-left space-y-2">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">{user?.name}</h1>
                        <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400 py-1.5 px-4 rounded-xl text-[10px] uppercase font-black tracking-widest border-none">
                            {user?.role?.replace('_', ' ')}
                        </Badge>
                    </div>
                    <p className="text-slate-500 font-medium flex items-center justify-center md:justify-start gap-2">
                        <Mail size={16} className="text-indigo-500" />
                        {user?.email}
                    </p>
                    <div className="flex items-center justify-center md:justify-start gap-4 pt-2">
                         <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                             <ShieldCheck size={14} className="text-emerald-500" />
                             Account Active
                         </div>
                         <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
                         <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                             ID: {user?.displayId || user?.id.substring(0, 8)}
                         </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Details Form */}
                <Card className="lg:col-span-2 rounded-[40px] border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden group">
                    <CardHeader className="bg-slate-50/50 dark:bg-slate-800/20 pb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-white dark:bg-slate-800 rounded-2xl shadow-sm text-indigo-600 dark:text-indigo-400">
                                <User size={20} />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold tracking-tight">Personal Information</CardTitle>
                                <CardDescription className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Manage your identity and contact details</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-8 px-8">
                        <form id="profile-form" onSubmit={handleUpdateProfile} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2.5">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">First Name</Label>
                                    <div className="relative group/input">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-indigo-500 transition-colors" size={18} />
                                        <Input 
                                            name="firstName"
                                            value={profileData.firstName}
                                            onChange={handleProfileChange}
                                            className="h-14 pl-12 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:bg-white dark:focus:bg-slate-900 transition-all focus:ring-4 focus:ring-indigo-500/10 font-medium"
                                            placeholder="Enter first name"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2.5">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Last Name</Label>
                                    <div className="relative group/input">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-indigo-500 transition-colors" size={18} />
                                        <Input 
                                            name="lastName"
                                            value={profileData.lastName}
                                            onChange={handleProfileChange}
                                            className="h-14 pl-12 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:bg-white dark:focus:bg-slate-900 transition-all focus:ring-4 focus:ring-indigo-500/10 font-medium"
                                            placeholder="Enter last name"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Contact Number</Label>
                                <div className="relative group/input">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-indigo-500 transition-colors" size={18} />
                                    <Input 
                                        name="phone"
                                        value={profileData.phone}
                                        onChange={handleProfileChange}
                                        className="h-14 pl-12 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:bg-white dark:focus:bg-slate-900 transition-all focus:ring-4 focus:ring-indigo-500/10 font-medium"
                                        placeholder="+92 300 1234567"
                                    />
                                </div>
                            </div>
                        </form>
                    </CardContent>
                    <CardFooter className="bg-slate-50/30 dark:bg-slate-800/10 px-8 py-6">
                        <Button 
                            form="profile-form"
                            disabled={isUpdating}
                            className="h-14 px-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 active:scale-95 transition-all w-full sm:w-auto"
                        >
                            {isUpdating ? (
                                <Loader2 className="animate-spin mr-2" size={20} />
                            ) : (
                                <Save className="mr-2" size={20} />
                            )}
                            Save Changes
                        </Button>
                    </CardFooter>
                </Card>

                {/* Password Change Sidebar */}
                <Card className="rounded-[40px] border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden h-fit">
                    <CardHeader className="bg-slate-50/50 dark:bg-slate-800/20 pb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-white dark:bg-slate-800 rounded-2xl shadow-sm text-indigo-600 dark:text-indigo-400">
                                <Lock size={20} />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold tracking-tight">Security</CardTitle>
                                <CardDescription className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Update your access credentials</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-8 px-6 space-y-6">
                        <form id="password-form" onSubmit={handleUpdatePassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Current Password</Label>
                                <div className="relative group/input">
                                    <Input 
                                        type={showOldPass ? "text" : "password"}
                                        name="oldPassword"
                                        value={passwordData.oldPassword}
                                        onChange={handlePasswordChange}
                                        className="h-12 pr-11 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:bg-white dark:focus:bg-slate-900 transition-all font-medium"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowOldPass(!showOldPass)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                                    >
                                        {showOldPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">New Password</Label>
                                <div className="relative group/input">
                                    <Input 
                                        type={showNewPass ? "text" : "password"}
                                        name="newPassword"
                                        value={passwordData.newPassword}
                                        onChange={handlePasswordChange}
                                        className="h-12 pr-11 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:bg-white dark:focus:bg-slate-900 transition-all font-medium"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPass(!showNewPass)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                                    >
                                        {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Confirm New Password</Label>
                                <div className="relative group/input">
                                    <Input 
                                        type={showConfirmPass ? "text" : "password"}
                                        name="confirmPassword"
                                        value={passwordData.confirmPassword}
                                        onChange={handlePasswordChange}
                                        className="h-12 pr-11 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:bg-white dark:focus:bg-slate-900 transition-all font-medium"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                                    >
                                        {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                    <CardFooter className="pb-8 px-6">
                        <Button 
                            form="password-form"
                            disabled={isChangingPass}
                            variant="secondary"
                            className="w-full h-12 rounded-xl font-black uppercase tracking-widest active:scale-95 transition-all bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white"
                        >
                            {isChangingPass ? (
                                <Loader2 className="animate-spin mr-2" size={18} />
                            ) : (
                                <KeyRound className="mr-2" size={18} />
                            )}
                            Update Password
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
