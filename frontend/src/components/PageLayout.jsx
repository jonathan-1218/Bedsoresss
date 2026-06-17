import React from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function PageLayout({ user, onLogout, title, breadcrumb, motorsEnabled, toggleMotors, children }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} onLogout={onLogout} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          title={title}
          breadcrumb={breadcrumb}
          motorsEnabled={motorsEnabled}
          toggleMotors={toggleMotors}
          user={user}
        />
        <main className="flex-1 p-5 space-y-5 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
