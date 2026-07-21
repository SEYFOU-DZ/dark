'use client';

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, logout } from '@/lib/auth';
import { apiJson } from '@/lib/api';
import { LayoutDashboard, FileText, Receipt, Users, LogOut, Languages, Plus, Clock, CheckCircle, XCircle, Eye, Download, Bell, ShieldCheck, Sparkles, Send, Menu, X, Building2 } from 'lucide-react';
import { QuoteWizard } from '@/components/QuoteWizard';
import { InvoiceWizard } from '@/components/InvoiceWizard';
import UsersManagement from '@/components/dashboard/UsersManagement';
import CustomInvoiceForm from '@/components/admin/CustomInvoiceForm';
import CustomInvoicesList from '@/components/admin/CustomInvoicesList';
import CompanyHeadersList from '@/components/admin/CompanyHeadersList';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocale } from '@/contexts/LocaleContext';

interface Request {
  _id: string;
  customerName: string;
  customerPhone: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  vehiclePlate: string;
  description: string;
  status: 'pending' | 'accepted' | 'rejected';
  adminMessage?: string;
  decisionDate?: string | null;
  messageSeenAt?: string | null;
  createdAt: string;
  pdfUrl?: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
  };
}

interface Invoice {
  _id: string;
  invoiceNo?: string;
  customerName: string;
  vehicleType?: string;
  vehicleCategory?: string;
  total: number;
  pdfUrl?: string;
  createdAt: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
  };
}

interface User {
  _id: string;
  name: string;
  email: string;
  isAdmin: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [userLoaded, setUserLoaded] = useState(false);
  const isAdmin = user?.isAdmin === true;
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showRequestWizard, setShowRequestWizard] = useState(false);
  const [showInvoiceWizard, setShowInvoiceWizard] = useState(false);
  const [showCustomInvoiceForm, setShowCustomInvoiceForm] = useState(false);
  const [customInvoicesRefresh, setCustomInvoicesRefresh] = useState(0);
  const [requests, setRequests] = useState<Request[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasHydratedData, setHasHydratedData] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [decisionTarget, setDecisionTarget] = useState<Request | null>(null);
  const [decisionStatus, setDecisionStatus] = useState<'accepted' | 'rejected'>('accepted');
  const [decisionMessage, setDecisionMessage] = useState('');
  const [decisionBusy, setDecisionBusy] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [announcement, setAnnouncement] = useState<Request | null>(null);
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const { locale, setLocale, dir } = useLocale();

  useEffect(() => {
    const mountedUser = getUser();
    setUser(mountedUser ?? null);
    setUserLoaded(true);
  }, []);

  useEffect(() => {
    if (userLoaded && !user) {
      router.push('/login');
    }
  }, [router, user, userLoaded]);

  const loadDashboardData = useCallback(async () => {
    if (!user) {
      return;
    }

    if (!hasHydratedData) {
      setLoading(true);
    }
    setLoadError('');

    try {
      const requestsEndpoint = user.isAdmin ? '/api/requests/all' : '/api/requests';
      const invoicesEndpoint = user.isAdmin ? '/api/invoices/all' : '/api/invoices';
      const tasks: Promise<unknown>[] = [
        apiJson<Request[]>(requestsEndpoint),
        apiJson<Invoice[]>(invoicesEndpoint),
      ];

      if (user.isAdmin) {
        tasks.push(apiJson<User[]>('/api/admin/users'));
      }

      const [requestsData, invoicesData, usersData] = await Promise.all(tasks);
      setRequests(requestsData as Request[]);
      setInvoices(invoicesData as Invoice[]);
      setUsers((usersData as User[] | undefined) ?? []);

      if (!user.isAdmin) {
        const notificationData = await apiJson<Request[]>('/api/requests/notifications');
        setNotifications(notificationData);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setLoadError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setHasHydratedData(true);
      setLoading(false);
    }
  }, [hasHydratedData, user]);

  useEffect(() => {
    if (user) {
      const timeoutId = window.setTimeout(() => {
        void loadDashboardData();
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }

    return undefined;
  }, [user, loadDashboardData]);

  useEffect(() => {
    if (!user || user.isAdmin || notifications.length === 0) {
      return;
    }

    const latestNotification = notifications[0];
    const lastShownNotificationId = window.sessionStorage.getItem('lastDecisionNotificationId');

    if (latestNotification && latestNotification._id !== lastShownNotificationId) {
      setAnnouncement(latestNotification);
      setAnnouncementOpen(true);
      window.sessionStorage.setItem('lastDecisionNotificationId', latestNotification._id);
    }
  }, [notifications, user]);

  const handleStatusUpdate = async (requestId: string, status: 'accepted' | 'rejected') => {
    if (!decisionTarget || decisionTarget._id !== requestId) {
      return;
    }

    setDecisionBusy(true);
    try {
      await apiJson(`/api/requests/${requestId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, adminMessage: decisionMessage }),
      });
      setDecisionModalOpen(false);
      setDecisionTarget(null);
      setDecisionMessage('');
      await loadDashboardData();
    } catch (error) {
      console.error('Failed to update status:', error);
      setLoadError(error instanceof Error ? error.message : 'Failed to update request');
    } finally {
      setDecisionBusy(false);
    }
  };

  const openDecisionModal = (request: Request, status: 'accepted' | 'rejected') => {
    setDecisionTarget(request);
    setDecisionStatus(status);
    setDecisionMessage(
      status === 'accepted'
        ? locale === 'ar'
          ? 'تم قبول طلبك بنجاح.'
          : 'Your request has been accepted successfully.'
        : locale === 'ar'
          ? 'تم رفض طلبك. يرجى التواصل مع الإدارة لمزيد من التفاصيل.'
          : 'Your request has been rejected. Please contact support for more details.'
    );
    setDecisionModalOpen(true);
  };

  const handleNotificationSeen = async (requestId: string) => {
    try {
      await apiJson(`/api/requests/${requestId}/message-seen`, { method: 'PUT' });
      setNotifications((prev) => prev.map((item) => 
        item._id === requestId ? { ...item, messageSeenAt: new Date().toISOString() } : item
      ));
    } catch (error) {
      console.error('Failed to mark notification as seen:', error);
    }
  };

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      dashboard: { en: 'Dashboard', ar: 'لوحة التحكم' },
      requests: { en: 'Requests', ar: 'الطلبات' },
      invoices: { en: 'Invoices', ar: 'الفواتير' },
      users: { en: 'Users', ar: 'المستخدمين' },
      logout: { en: 'Logout', ar: 'تسجيل الخروج' },
      welcome: { en: 'Welcome', ar: 'مرحباً' },
      totalRequests: { en: 'Total Requests', ar: 'الطلبات الكلية' },
      totalInvoices: { en: 'Total Invoices', ar: 'إجمالي الفواتير' },
      totalUsers: { en: 'Total Users', ar: 'إجمالي المستخدمين' },
      pending: { en: 'Pending', ar: 'قيد الانتظار' },
      accepted: { en: 'Accepted', ar: 'مقبولة' },
      rejected: { en: 'Rejected', ar: 'مرفوضة' },
      createRequest: { en: 'Create Request', ar: 'إنشاء طلب' },
      createRequestDesc: { en: 'Create a new service request', ar: 'إنشاء طلب خدمة جديد' },
      createInvoice: { en: 'Create Invoice', ar: 'إنشاء فاتورة' },
      createInvoiceDesc: { en: 'Create an invoice for existing request', ar: 'إنشاء فاتورة لطلب موجود' },
      requestsDesc: { en: 'View all your requests', ar: 'عرض جميع طلباتك' },
      requestsDescAdmin: { en: 'View and manage all requests', ar: 'عرض جميع الطلبات وإدارتها' },
      noRequests: { en: 'No requests yet', ar: 'لا توجد طلبات' },
      noInvoices: { en: 'No invoices yet', ar: 'لا توجد فواتير' },
      invoicesDesc: { en: 'View all your invoices', ar: 'عرض جميع فواتيرك' },
      usersDesc: { en: 'Add and manage user accounts', ar: 'إضافة وإدارة حسابات المستخدمين' },
      requestNo: { en: 'Request #', ar: 'رقم الطلب #' },
      user: { en: 'User', ar: 'المستخدم' },
      customerName: { en: 'Customer Name', ar: 'اسم العميل' },
      phone: { en: 'Phone', ar: 'رقم الهاتف' },
      vehicle: { en: 'Vehicle', ar: 'المركبة' },
      vehicleType: { en: 'Vehicle Type', ar: 'نوع المركبة' },
      status: { en: 'Status', ar: 'الحالة' },
      date: { en: 'Date', ar: 'التاريخ' },
      actions: { en: 'Actions', ar: 'الإجراءات' },
      accept: { en: 'Accept', ar: 'قبول' },
      reject: { en: 'Reject', ar: 'رفض' },
      processed: { en: 'Processed', ar: 'تمت المعالجة' },
      loading: { en: 'Loading...', ar: 'جاري التحميل...' },
      invoiceNo: { en: 'Invoice #', ar: 'رقم الفاتورة #' },
      amount: { en: 'Amount', ar: 'المبلغ' },
      name: { en: 'Name', ar: 'الاسم' },
      email: { en: 'Email', ar: 'البريد الإلكتروني' },
      role: { en: 'Role', ar: 'الصلاحية' },
      adminRole: { en: 'Admin', ar: 'مشرف' },
      userRole: { en: 'User', ar: 'مستخدم' },
      admin: { en: 'Administrator', ar: 'مشرف' },
      view: { en: 'View', ar: 'عرض' },
      download: { en: 'Download', ar: 'تحميل' },
      noFile: { en: 'No file', ar: 'لا يوجد ملف' },
      notAvailable: { en: 'N/A', ar: 'غير متوفر' },
      noUsers: { en: 'No users found', ar: 'لا يوجد مستخدمون' },
      dataSyncError: { en: 'Could not sync dashboard data.', ar: 'تعذر مزامنة بيانات اللوحة.' },
      cancel: { en: 'Cancel', ar: 'إلغاء' },
      notifications: { en: 'Notifications', ar: 'الإشعارات' },
      noNotifications: { en: 'No notifications yet', ar: 'لا توجد إشعارات بعد' },
      message: { en: 'Message', ar: 'الرسالة' },
      decisionMessagePlaceholder: { en: 'Write a message to the user', ar: 'اكتب رسالة للمستخدم' },
      confirmDecision: { en: 'Confirm decision', ar: 'تأكيد القرار' },
      addUser: { en: 'Add User', ar: 'إضافة مستخدم' },
      emailPlaceholder: { en: 'Enter email', ar: 'أدخل البريد الإلكتروني' },
      passwordPlaceholder: { en: 'Enter password', ar: 'أدخل كلمة المرور' },
      createUserSuccess: { en: 'User created successfully', ar: 'تم إنشاء المستخدم بنجاح' },
      createUserError: { en: 'Could not create user', ar: 'تعذر إنشاء المستخدم' },
      userCreated: { en: 'User added', ar: 'تمت إضافة المستخدم' },
      customInvoices: { en: 'Custom Invoices', ar: 'الفواتير المخصصة' },
      createCustomInvoice: { en: 'Create Custom Invoice', ar: 'إنشاء فاتورة مخصصة' },
      companyHeaders: { en: 'Company Headers', ar: 'ترويسات الشركات' },
      companyHeadersDesc: { en: 'Manage company headers for custom invoices', ar: 'إدارة ترويسات الشركات للفواتير المخصصة' },
    };
    return translations[key]?.[locale] || key;
  };

  const stats = useMemo(() => {
    const pending = requests.filter((request) => request.status === 'pending').length;
    const accepted = requests.filter((request) => request.status === 'accepted').length;
    const rejected = requests.filter((request) => request.status === 'rejected').length;

    return {
      pending,
      accepted,
      rejected,
    };
  }, [requests]);

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-GB');

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard },
    { id: 'requests', icon: FileText },
    { id: 'invoices', icon: Receipt },
  ];

  if (isAdmin) {
    menuItems.push({ id: 'users', icon: Users });
    menuItems.push({ id: 'custom-invoices', icon: Sparkles });
    menuItems.push({ id: 'company-headers', icon: Building2 });
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!userLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-600">{t('loading')}</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50/50" dir={dir}>
      {/* Header */}
      <header className="border-b border-slate-100 bg-white sticky top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <img src="/ttty.png" alt="Logo" className="h-8 w-auto sm:h-10" />
          </div>

          {/* Desktop buttons */}
          <div className="hidden md:flex items-center gap-3">
            {!isAdmin && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications((prev) => !prev)}
                  className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
                >
                  <Bell className="h-4 w-4 text-slate-500" />
                  <span className="hidden lg:inline">{t('notifications')}</span>
                  {notifications.length > 0 && (
                    <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-semibold text-white">{notifications.length}</span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute left-0 z-20 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-800">{t('notifications')}</p>
                      <span className="text-xs text-slate-500">{notifications.length}</span>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">{t('noNotifications')}</div>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {notifications.map((item) => (
                          <div key={item._id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-slate-800">{item.customerName}</p>
                              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${item.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                {item.status === 'accepted' ? t('accepted') : t('rejected')}
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-slate-600">{item.adminMessage}</p>
                            <button
                              onClick={() => handleNotificationSeen(item._id)}
                              className="mt-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                            >
                              {t('confirmDecision')}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setLocale(locale === "en" ? "ar" : "en")}
              className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
            >
              <Languages className="h-4 w-4 text-slate-500" />
              <span className="hidden lg:inline">{locale === "en" ? "العربية" : "English"}</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
            >
              <LogOut className="h-4 w-4 text-slate-500" />
              <span className="hidden lg:inline">{t('logout')}</span>
            </button>
          </div>

          {/* Mobile actions - top right */}
          <div className="flex md:hidden items-center gap-2">
            {!isAdmin && (
              <button
                onClick={() => setShowNotifications((prev) => !prev)}
                className="relative p-2 rounded-md border border-slate-200 bg-white"
              >
                <Bell className="h-4 w-4 text-slate-500" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -left-1 rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-semibold text-white">{notifications.length}</span>
                )}
              </button>
            )}
            <button
              onClick={() => setLocale(locale === "en" ? "ar" : "en")}
              className="p-2 rounded-md border border-slate-200 bg-white"
            >
              <Languages className="h-4 w-4 text-slate-500" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-md border border-slate-200 bg-white"
            >
              <LogOut className="h-4 w-4 text-slate-500" />
            </button>

            {/* Mobile menu button - next to actions */}
            <button
              onClick={() => setShowMobileMenu((prev) => !prev)}
              className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm"
            >
              {showMobileMenu ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu - left aligned near logo */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-2 shadow-lg">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setShowMobileMenu(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === item.id
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon size={16} />
                  {t(item.id)}
                </button>
              );
            })}
          </div>
        )}
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <Card className="border-slate-200/80 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-slate-800">{user.name}</CardTitle>
                <CardDescription className="text-slate-500">
                  {isAdmin ? t('admin') : t('user')}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <nav className="space-y-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          activeTab === item.id
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Icon size={16} />
                        {t(item.id)}
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{t('welcome')}, {user.name}</h2>
                  <p className="text-slate-600 mt-1 text-sm sm:text-base">{t('dashboard')}</p>
                </div>

                {loadError && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {t('dataSyncError')} {loadError}
                  </div>
                )}

                {/* Stats Cards - 2 per row on mobile */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <Card className="border-slate-200/80 shadow-sm">
                    <CardHeader className="pb-2 sm:pb-3">
                      <CardDescription className="text-slate-500 text-xs sm:text-sm">{t('totalRequests')}</CardDescription>
                      <CardTitle className="text-xl sm:text-2xl text-slate-900">{requests.length}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card className="border-slate-200/80 shadow-sm">
                    <CardHeader className="pb-2 sm:pb-3">
                      <CardDescription className="text-slate-500 text-xs sm:text-sm">{t('totalInvoices')}</CardDescription>
                      <CardTitle className="text-xl sm:text-2xl text-slate-900">{invoices.length}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card className="border-slate-200/80 shadow-sm">
                    <CardHeader className="pb-2 sm:pb-3">
                      <CardDescription className="text-slate-500 text-xs sm:text-sm">{t('pending')}</CardDescription>
                      <CardTitle className="text-xl sm:text-2xl text-slate-900">{stats.pending}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card className="border-slate-200/80 shadow-sm">
                    <CardHeader className="pb-2 sm:pb-3">
                      <CardDescription className="text-slate-500 text-xs sm:text-sm">
                        {isAdmin ? t('totalUsers') : t('accepted')}
                      </CardDescription>
                      <CardTitle className="text-xl sm:text-2xl text-slate-900">
                        {isAdmin ? users.length : stats.accepted}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </div>

                {/* Quick Actions - show higher on page */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <Card className="border-slate-200/80 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-slate-800 text-base sm:text-lg">{t('createRequest')}</CardTitle>
                      <CardDescription className="text-slate-500 text-xs sm:text-sm">{t('createRequestDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button onClick={() => setShowRequestWizard(true)} className="w-full">
                        <Plus className="h-4 w-4 ml-2" />
                        {t('createRequest')}
                      </Button>
                    </CardContent>
                  </Card>
                  <Card className="border-slate-200/80 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-slate-800 text-base sm:text-lg">{t('createInvoice')}</CardTitle>
                      <CardDescription className="text-slate-500 text-xs sm:text-sm">{t('createInvoiceDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button onClick={() => setShowInvoiceWizard(true)} variant="secondary" className="w-full">
                        <Plus className="h-4 w-4 ml-2" />
                        {t('createInvoice')}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === 'requests' && (
              <Card className="border-slate-200/80 shadow-sm">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle className="text-slate-800">{t('requests')}</CardTitle>
                  <CardDescription className="text-slate-500">
                    {isAdmin ? t('requestsDescAdmin') : t('requestsDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-slate-600">{t('loading')}</div>
                    </div>
                  ) : loadError ? (
                    <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {loadError}
                    </div>
                  ) : requests.length === 0 ? (
                    <div className="flex flex-col items-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-slate-100 text-slate-600 border border-slate-200/60">
                        <Plus className="h-6 w-6" />
                      </div>
                      <p className="text-sm text-slate-500 font-medium">{t('noRequests')}</p>
                      <Button onClick={() => setShowRequestWizard(true)} className="mt-5">
                        <Plus className="h-4 w-4 ml-2" />
                        {t('createRequest')}
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                      <div className="inline-block min-w-full align-middle">
                        <table className="min-w-full">
                          <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                              <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('requestNo')}</th>
                              {isAdmin && (
                                <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">{t('user')}</th>
                              )}
                              <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('customerName')}</th>
                              <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">{t('phone')}</th>
                              <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">{t('vehicle')}</th>
                              <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('status')}</th>
                              <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">{t('date')}</th>
                              {isAdmin && (
                                <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('actions')}</th>
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {requests.map((request) => (
                              <Fragment key={request._id}>
                                <tr className="hover:bg-slate-50">
                                  <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">
                                    #{request._id.slice(-6)}
                                  </td>
                                  {isAdmin && (
                                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm text-slate-900 hidden md:table-cell">
                                      {request.userId?.name || t('notAvailable')}
                                    </td>
                                  )}
                                  <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                                    {request.customerName}
                                  </td>
                                  <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm text-slate-600 hidden sm:table-cell">
                                    {request.customerPhone}
                                  </td>
                                  <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm text-slate-900 hidden md:table-cell">
                                    {request.vehicleMake} {request.vehicleModel} ({request.vehicleYear})
                                  </td>
                                  <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                                    {request.status === 'pending' && (
                                      <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                                        <Clock size={12} />
                                        {t('pending')}
                                      </span>
                                    )}
                                    {request.status === 'accepted' && (
                                      <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                        <CheckCircle size={12} />
                                        {t('accepted')}
                                      </span>
                                    )}
                                    {request.status === 'rejected' && (
                                      <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                                        <XCircle size={12} />
                                        {t('rejected')}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm text-slate-600 hidden sm:table-cell">
                                    {formatDate(request.createdAt)}
                                  </td>
                                  {isAdmin && (
                                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm space-x-2 space-x-reverse">
                                      {request.status === 'pending' && (
                                        <>
                                          <Button
                                            size="sm"
                                            onClick={() => openDecisionModal(request, 'accepted')}
                                            className="bg-green-600 hover:bg-green-700"
                                          >
                                            {t('accept')}
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => openDecisionModal(request, 'rejected')}
                                            className="bg-red-600 hover:bg-red-700 text-white"
                                          >
                                            {t('reject')}
                                          </Button>
                                        </>
                                      )}
                                    {request.status !== 'pending' && (
                                      <span className="text-sm text-slate-500">{t('processed')}</span>
                                    )}
                                    <div className="flex gap-1.5 mt-1">
                                      {request.pdfUrl ? (
                                        <>
                                          <a
                                            href={`/api/requests/pdf/${request._id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2 py-1 text-blue-700 transition-colors hover:bg-blue-200"
                                          >
                                            <Eye size={13} />
                                            <span className="hidden sm:inline">{t('view')}</span>
                                          </a>
                                          <a
                                            href={`/api/requests/pdf/${request._id}?download=true`}
                                            download
                                            className="inline-flex items-center gap-1 rounded-md bg-green-100 px-2 py-1 text-green-700 transition-colors hover:bg-green-200"
                                          >
                                            <Download size={13} />
                                            <span className="hidden sm:inline">{t('download')}</span>
                                          </a>
                                        </>
                                      ) : (
                                        <span className="text-sm text-slate-500">{t('noFile')}</span>
                                      )}
                                    </div>
                                    </td>
                                  )}
                                </tr>
                                {!isAdmin && request.adminMessage && request.status !== 'pending' && (
                                  <tr className="bg-slate-50">
                                    <td colSpan={isAdmin ? 7 : 5} className="px-3 sm:px-4 py-3 text-sm text-slate-600">
                                      <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                                        <strong>{t('message')}: </strong>
                                        {request.adminMessage}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'custom-invoices' && isAdmin && (
              <div className="space-y-6">
                <CustomInvoicesList
                  locale={locale}
                  refreshKey={customInvoicesRefresh}
                  onRefresh={() => setCustomInvoicesRefresh(prev => prev + 1)}
                />
                <Button
                  onClick={() => setShowCustomInvoiceForm(true)}
                  className="w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 ml-2" />
                  {t('createCustomInvoice')}
                </Button>
              </div>
            )}

            {activeTab === 'company-headers' && isAdmin && (
              <Card className="border-slate-200/80 shadow-sm">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle className="text-slate-800">{t('companyHeaders')}</CardTitle>
                  <CardDescription className="text-slate-500">{t('companyHeadersDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <CompanyHeadersList showSelector={false} />
                </CardContent>
              </Card>
            )}

            {activeTab === 'invoices' && (
              <Card className="border-slate-200/80 shadow-sm">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle className="text-slate-800">{t('invoices')}</CardTitle>
                  <CardDescription className="text-slate-500">{t('invoicesDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-slate-600">{t('loading')}</div>
                    </div>
                  ) : loadError ? (
                    <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {loadError}
                    </div>
                  ) : invoices.length === 0 ? (
                    <div className="flex flex-col items-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-slate-100 text-slate-600 border border-slate-200/60">
                        <Plus className="h-6 w-6" />
                      </div>
                      <p className="text-sm text-slate-500 font-medium">{t('noInvoices')}</p>
                      <Button onClick={() => setShowInvoiceWizard(true)} variant="secondary" className="mt-5">
                        <Plus className="h-4 w-4 ml-2" />
                        {t('createInvoice')}
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                      <div className="inline-block min-w-full align-middle">
                        <table className="min-w-full">
                          <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                              <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('invoiceNo')}</th>
                              {isAdmin && (
                                <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">{t('user')}</th>
                              )}
                              <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('customerName')}</th>
                              <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">{t('vehicleType')}</th>
                              <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('amount')}</th>
                              <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">{t('date')}</th>
                              <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('actions')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {invoices.map((invoice) => (
                              <tr key={invoice._id} className="hover:bg-slate-50">
                                <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">
                                  {invoice.invoiceNo || `#${invoice._id.slice(-6)}`}
                                </td>
                                {isAdmin && (
                                  <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm text-slate-900 hidden md:table-cell">
                                    {invoice.userId?.name || t('notAvailable')}
                                  </td>
                                )}
                                <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                                  {invoice.customerName}
                                </td>
                                <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm text-slate-600 hidden sm:table-cell">
                                  {invoice.vehicleType || invoice.vehicleCategory || t('notAvailable')}
                                </td>
                                <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                                  {invoice.total} AED
                                </td>
                                <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm text-slate-600 hidden sm:table-cell">
                                  {formatDate(invoice.createdAt)}
                                </td>
                                <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm">
                                  <div className="flex gap-1.5">
                                    <a
                                      href={`/api/invoices/pdf/${invoice._id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2 py-1 text-blue-700 transition-colors hover:bg-blue-200"
                                    >
                                      <Eye size={13} />
                                      <span className="hidden sm:inline">{t('view')}</span>
                                    </a>
                                    <a
                                      href={`/api/invoices/pdf/${invoice._id}?download=true`}
                                      className="inline-flex items-center gap-1 rounded-md bg-green-100 px-2 py-1 text-green-700 transition-colors hover:bg-green-200"
                                    >
                                      <Download size={13} />
                                      <span className="hidden sm:inline">{t('download')}</span>
                                    </a>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'users' && isAdmin && (
              <UsersManagement locale={locale} />
            )}


          </main>
        </div>
      </div>

      {showRequestWizard && (
        <QuoteWizard
          onClose={() => setShowRequestWizard(false)}
          onSuccess={loadDashboardData}
        />
      )}
      {showInvoiceWizard && (
        <InvoiceWizard
          onClose={() => setShowInvoiceWizard(false)}
          onSuccess={loadDashboardData}
        />
      )}
      {showCustomInvoiceForm && (
        <CustomInvoiceForm
          isOpen={showCustomInvoiceForm}
          onClose={() => setShowCustomInvoiceForm(false)}
          onSuccess={() => {
            setCustomInvoicesRefresh(prev => prev + 1);
          }}
        />
      )}

      {announcementOpen && announcement && !isAdmin && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{t('notifications')}</h3>
                <p className="text-sm text-slate-500">{announcement.customerName}</p>
              </div>
            </div>
            <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">{announcement.adminMessage}</p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => { setAnnouncementOpen(false); setAnnouncement(null); }}>
                {t('cancel')}
              </Button>
              <Button onClick={() => { setAnnouncementOpen(false); setAnnouncement(null); void handleNotificationSeen(announcement._id); }}>
                {t('confirmDecision')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {decisionModalOpen && decisionTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${decisionStatus === 'accepted' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {decisionStatus === 'accepted' ? <ShieldCheck className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{decisionStatus === 'accepted' ? t('accept') : t('reject')}</h3>
                <p className="text-sm text-slate-500">{decisionTarget.customerName}</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <label className="block text-sm font-medium text-slate-700">{t('message')}</label>
              <textarea
                value={decisionMessage}
                onChange={(event) => setDecisionMessage(event.target.value)}
                rows={5}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 outline-none ring-0 focus:border-slate-400"
                placeholder={t('decisionMessagePlaceholder')}
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => { setDecisionModalOpen(false); setDecisionTarget(null); setDecisionMessage(''); }}>
                {t('cancel')}
              </Button>
              <Button
                onClick={() => void handleStatusUpdate(decisionTarget._id, decisionStatus)}
                disabled={decisionBusy}
                className={decisionStatus === 'accepted' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}
              >
                <Send className="ml-2 h-4 w-4" />
                {decisionBusy ? t('loading') : t('confirmDecision')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}