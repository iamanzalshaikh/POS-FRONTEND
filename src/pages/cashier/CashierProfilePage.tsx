import React, { useEffect, useState } from 'react';
import { Lock, Save, LogOut, Eye, EyeOff } from 'lucide-react';
import { profileApi, authApi } from '../../service/api';
import { useAuthStore } from '../../store/useAuthStore';

const CashierProfilePage: React.FC = () => {
  const { user, setUser, logout } = useAuthStore();
  const [firstName, setFirstName] = useState((user?.name || '').split(' ').slice(0, 1).join(' '));
  const [lastName, setLastName] = useState((user?.name || '').split(' ').slice(1).join(' '));
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await profileApi.getProfile();
        if (res.data?.success && res.data.data?.user) {
          setUser(res.data.data.user);
          const fullName = res.data.data.user.name || '';
          setFirstName(fullName.split(' ').slice(0, 1).join(' '));
          setLastName(fullName.split(' ').slice(1).join(' '));
          setPhone(res.data.data.user.phone || '');
        }
      } catch {
        // ignore
      }
    };
    loadProfile();
  }, [setUser]);

  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const name = `${firstName} ${lastName}`.trim();
      const res = await profileApi.updateProfile({ name, phone });
      if (res.data?.success && res.data.data?.user) {
        setUser(res.data.data.user);
        setMessage('Profile updated successfully.');
      } else {
        setMessage(res.data?.message || 'Failed to update profile.');
      }
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || newPassword !== confirmPassword) {
      setPasswordMessage('Check password fields and confirmation.');
      return;
    }
    setChangingPassword(true);
    setPasswordMessage(null);
    try {
      const res = await authApi.changePassword({
        oldPassword: currentPassword,
        newPassword,
      });
      if (res.data?.success) {
        setPasswordMessage('Password changed successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMessage(res.data?.message || 'Failed to change password.');
      }
    } catch (err: any) {
      setPasswordMessage(
        err.response?.data?.message || 'Failed to change password.'
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-[520px] flex flex-col bg-white border border-slate-200 rounded-3xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900">
            My Profile
          </h1>
          <p className="text-xs text-slate-500">
            Review your account details and manage your credentials.
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center space-x-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50"
        >
          <LogOut size={13} />
          <span>Logout</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">
            Profile Details
          </h2>
          <div className="space-y-2 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                First Name
              </label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-100 focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Last Name
              </label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-100 focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Email
              </label>
              <input
                value={user?.email || ''}
                disabled
                className="w-full rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5 text-xs font-medium text-slate-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Contact Number
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-100 focus:border-emerald-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Role
                </label>
                <input
                  value={user?.role || ''}
                  disabled
                  className="w-full rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5 text-xs font-medium text-slate-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Store
                </label>
                <input
                  value={user?.store?.name || ''}
                  disabled
                  className="w-full rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5 text-xs font-medium text-slate-500"
                />
              </div>
            </div>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={handleSaveProfile}
            className="inline-flex items-center space-x-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-slate-900 disabled:bg-emerald-400"
          >
            <Save size={13} />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
          {message && (
            <div className="text-[11px] text-slate-600 mt-1">{message}</div>
          )}
        </div>

        <div className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">
            Change Password
          </h2>
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1.5 ml-0.5 uppercase tracking-wider">
                Current Password
              </label>
              <div className="relative group">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-4 pr-11 py-2.5 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-all flex items-center justify-center"
                >
                  {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1.5 ml-0.5 uppercase tracking-wider">
                New Password
              </label>
              <div className="relative group">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-4 pr-11 py-2.5 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-all flex items-center justify-center"
                >
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1.5 ml-0.5 uppercase tracking-wider">
                Confirm New Password
              </label>
              <div className="relative group">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-4 pr-11 py-2.5 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-all flex items-center justify-center"
                >
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          </div>
          <button
            type="button"
            disabled={changingPassword}
            onClick={handleChangePassword}
            className="inline-flex items-center space-x-1 rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-white disabled:bg-slate-500"
          >
            <Lock size={13} />
            <span>{changingPassword ? 'Changing...' : 'Change Password'}</span>
          </button>
          {passwordMessage && (
            <div className="text-[11px] text-slate-600 mt-1">
              {passwordMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CashierProfilePage;

