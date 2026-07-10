'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Shield, User, Edit } from 'lucide-react';
import { apiJson } from '@/lib/api';

interface User {
  _id: string;
  name: string;
  email: string;
  isAdmin: boolean;
}

export default function UsersManagement({ locale }: { locale: string }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', isAdmin: false });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      users: { en: 'Users Management', ar: 'إدارة المستخدمين' },
      usersDesc: { en: 'Add and manage user accounts', ar: 'إضافة وإدارة حسابات المستخدمين' },
      addUser: { en: 'Add User', ar: 'إضافة مستخدم' },
      cancel: { en: 'Cancel', ar: 'إلغاء' },
      addNewUser: { en: 'Add New User', ar: 'إضافة مستخدم جديد' },
      name: { en: 'Name', ar: 'الاسم' },
      email: { en: 'Email', ar: 'البريد الإلكتروني' },
      password: { en: 'Password', ar: 'كلمة المرور' },
      admin: { en: 'Admin', ar: 'مشرف' },
      createUser: { en: 'Create User', ar: 'إنشاء المستخدم' },
      usersList: { en: 'Users List', ar: 'قائمة المستخدمين' },
      role: { en: 'Role', ar: 'الصلاحية' },
      actions: { en: 'Actions', ar: 'الإجراءات' },
      makeAdmin: { en: 'Make Admin', ar: 'تعيين مشرف' },
      removeAdmin: { en: 'Remove Admin', ar: 'إلغاء المشرف' },
      delete: { en: 'Delete', ar: 'حذف' },
      confirmDelete: { en: 'Are you sure you want to delete this user?', ar: 'هل أنت متأكد من حذف هذا المستخدم؟' },
      loading: { en: 'Loading...', ar: 'جاري التحميل...' },
      adminRole: { en: 'Admin', ar: 'مشرف' },
      userRole: { en: 'User', ar: 'مستخدم' },
    };
    return translations[key]?.[locale] || key;
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await apiJson<User[]>('/api/admin/users');
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);

    try {
      await apiJson('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(newUser),
      });

      await fetchUsers();
      setShowAddUser(false);
      setNewUser({ name: '', email: '', password: '', isAdmin: false });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm(t('confirmDelete'))) return;

    try {
      await apiJson(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      await fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    try {
      setBusy(true);
      const user = users.find(u => u._id === userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      await apiJson(`/api/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: user.name, email: user.email, isAdmin: !currentStatus }),
      });

      await fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('users')}</h1>
          <p className="mt-1 text-slate-600">{t('usersDesc')}</p>
        </div>
        <button
          onClick={() => setShowAddUser(!showAddUser)}
          className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-white transition hover:bg-slate-800"
        >
          <Plus size={18} />
          {showAddUser ? t('cancel') : t('addUser')}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {showAddUser && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">{t('addNewUser')}</h2>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">{t('name')}</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-slate-400"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">{t('email')}</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-slate-400"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">{t('password')}</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-slate-400"
                />
                <p className="mt-1 text-xs text-slate-500">Password must be at least 6 characters</p>
              </div>
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <input
                  type="checkbox"
                  id="isAdmin"
                  checked={newUser.isAdmin}
                  onChange={(e) => setNewUser({ ...newUser, isAdmin: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                />
                <label htmlFor="isAdmin" className="mr-2 text-sm font-medium text-slate-700">{t('admin')}</label>
              </div>
            </div>
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-emerald-600 px-6 py-2.5 text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {busy ? '...' : t('createUser')}
            </button>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">{t('name')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">{t('email')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">{t('role')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
                        {user.name.charAt(0)}
                      </div>
                      {user.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                      user.isAdmin 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {user.isAdmin ? (
                        <>
                          <Shield size={14} />
                          {t('adminRole')}
                        </>
                      ) : (
                        <>
                          <User size={14} />
                          {t('userRole')}
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2 space-x-reverse">
                    <button
                      onClick={() => handleToggleAdmin(user._id, user.isAdmin)}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
                    >
                      <Edit size={14} />
                      {user.isAdmin ? t('removeAdmin') : t('makeAdmin')}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user._id)}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      <Trash2 size={14} />
                      {t('delete')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
