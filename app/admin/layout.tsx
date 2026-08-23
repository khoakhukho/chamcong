import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import AdminSidebar from '@/components/layout/AdminSidebar';
import NotificationBell from '@/components/notifications/NotificationBell';
import NotificationToaster from '@/components/notifications/NotificationToaster';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role === 'EMPLOYEE') {
    redirect('/chamcong');
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Floating Real-time Notification Toasts */}
      <NotificationToaster />

      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-slate-900 overflow-y-auto">
        <header className="h-16 px-6 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-semibold text-slate-400">
              Xin chào, <strong className="text-white">{user.fullName}</strong>
            </span>
            <span className="text-[10px] bg-red-950 text-red-400 border border-red-800/80 px-2 py-0.5 rounded-full font-mono font-bold">
              {user.role}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <NotificationBell />
            <div className="text-xs text-slate-400 font-medium hidden sm:block">
              Hệ Thống Chấm Công Caritas Đà Lạt
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
