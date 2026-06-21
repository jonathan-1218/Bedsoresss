import React from "react";
import { LayoutDashboard, BarChart3, Settings, Users, LogOut, Activity } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Sidebar({ user, onLogout, collapsed }) {
  const location = useLocation();
  const navigate = useNavigate();

  const links = [
    { name: "Dashboard",  path: "/",          icon: LayoutDashboard },
    { name: "Analytics",  path: "/analytics",  icon: BarChart3 },
    { name: "Patients",   path: "/patients",   icon: Users },
  ];
  if (user?.role === "admin") {
    links.push({ name: "Settings", path: "/settings", icon: Settings });
  }

  const logout = () => { onLogout?.(); navigate("/"); };

  return (
    <aside
      className="glass glow flex-shrink-0 flex flex-col relative transition-all duration-300 hidden md:flex border-r border-cyan-400/10 sticky top-0 h-screen overflow-y-auto"
      style={{ width: collapsed ? 64 : 240 }}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 h-16 border-b border-cyan-400/10 ${collapsed ? "justify-center" : ""}`}>
        <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center flex-shrink-0">
          <Activity size={16} className="text-cyan-400" />
        </div>
        {!collapsed && <h1 className="text-base font-bold text-white tracking-tight">BedSore AI</h1>}
      </div>

      {/* User chip */}
      {!collapsed && (
        <div className="mx-3 mt-4 mb-2 p-3 rounded-2xl bg-slate-800/40 border border-cyan-400/10">
          <p className="text-sm font-semibold text-cyan-300 truncate">{user?.name || "User"}</p>
          <p className="text-xs text-slate-400 capitalize">{user?.role || "user"} Panel</p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-hidden">
        {!collapsed && (
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-2 mb-2">Menu</p>
        )}
        {links.map(({ name, path, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={name}
              to={path}
              title={collapsed ? name : ""}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-sm ${
                active
                  ? "bg-cyan-500/20 border border-cyan-400/30 text-cyan-300"
                  : "hover:bg-slate-800/60 text-slate-300"
              } ${collapsed ? "justify-center px-0" : ""}`}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4">
        <button
          onClick={logout}
          title={collapsed ? "Logout" : ""}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-300 transition w-full text-sm ${collapsed ? "justify-center px-0" : ""}`}
        >
          <LogOut size={16} className="flex-shrink-0" />
          {!collapsed && "Logout"}
        </button>
      </div>
    </aside>
  );
}
