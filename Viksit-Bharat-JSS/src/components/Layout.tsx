import { ReactNode, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Briefcase, ClipboardCheck, FileText, CheckSquare, Wallet, AlertTriangle, LogOut, Menu, X, CircleUser as UserCircle } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { officer, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    ...(officer?.role === 'village_officer' ? [{ icon: Users, label: 'Workers', path: '/workers' }] : []),
    { icon: Briefcase, label: 'Projects', path: '/projects' },
    ...(officer?.role === 'village_officer' ? [{ icon: ClipboardCheck, label: 'Attendance', path: '/attendance' }] : []),
    ...(officer?.role === 'village_officer' ? [{ icon: FileText, label: 'Work Progress', path: '/work-progress' }] : []),
    { icon: CheckSquare, label: 'Approvals', path: '/approvals' },
    ...(officer?.role !== 'block_officer' ? [{ icon: Wallet, label: 'Wages', path: '/wages' }] : []),
    { icon: AlertTriangle, label: 'Fraud Alerts', path: '/fraud-alerts' },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const getRoleBadge = (role: string) => {
    const badges = {
      village_officer: { label: 'Village Officer', color: 'bg-blue-100 text-blue-700' },
      block_officer: { label: 'Block Officer', color: 'bg-emerald-100 text-emerald-700' },
      district_officer: { label: 'District Officer', color: 'bg-amber-100 text-amber-700' },
    };
    return badges[role as keyof typeof badges] || badges.village_officer;
  };

  const roleBadge = officer ? getRoleBadge(officer.role) : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <h1 className="text-xl font-bold text-slate-800 ml-2 lg:ml-0">Viksit Bharat</h1>
            </div>

            <div className="flex items-center gap-4">
              {officer && (
                <div className="flex items-center gap-3">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-slate-800">{officer.name}</p>
                    <p className="text-xs text-slate-500">{officer.officer_code}</p>
                  </div>
                  {roleBadge && (
                    <span className={`hidden sm:inline-flex px-3 py-1 rounded-full text-xs font-medium ${roleBadge.color}`}>
                      {roleBadge.label}
                    </span>
                  )}
                </div>
              )}
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-red-50 text-slate-600 hover:text-red-600 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        <aside
          className={`
            ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0
            fixed lg:static inset-y-0 left-0 z-40
            w-64 bg-white border-r border-slate-200
            transition-transform duration-300 ease-in-out
            pt-16 lg:pt-0
          `}
        >
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                    ${isActive
                      ? 'bg-emerald-50 text-emerald-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {officer && (
            <div className="p-4 border-t border-slate-200 mt-auto">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <UserCircle className="w-10 h-10 text-slate-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{officer.name}</p>
                  <p className="text-xs text-slate-500">{officer.email}</p>
                </div>
              </div>
            </div>
          )}
        </aside>

        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
