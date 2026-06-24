import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export function Layout() {
  const { admin, signOutNow } = useAuth();
  const nav = useNavigate();

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brandTitle">StudentMATE</div>
          <div className="brandSub">Admin</div>
        </div>

        <nav className="nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'navItem active' : 'navItem')}>
            Dashboard
          </NavLink>
          <NavLink to="/universities" className={({ isActive }) => (isActive ? 'navItem active' : 'navItem')}>
            Universities
          </NavLink>
          <NavLink to="/modules" className={({ isActive }) => (isActive ? 'navItem active' : 'navItem')}>
            Modules
          </NavLink>
          <NavLink to="/assessments" className={({ isActive }) => (isActive ? 'navItem active' : 'navItem')}>
            Assessments
          </NavLink>
          <NavLink to="/user-uploads" className={({ isActive }) => (isActive ? 'navItem active' : 'navItem')}>
            User Uploads
          </NavLink>
          <NavLink to="/reports" className={({ isActive }) => (isActive ? 'navItem active' : 'navItem')}>
            Reports
          </NavLink>
          <NavLink to="/users" className={({ isActive }) => (isActive ? 'navItem active' : 'navItem')}>
            Users
          </NavLink>
          <NavLink to="/analytics" className={({ isActive }) => (isActive ? 'navItem active' : 'navItem')}>
            Analytics
          </NavLink>
          <NavLink to="/announcements" className={({ isActive }) => (isActive ? 'navItem active' : 'navItem')}>
            Announcements
          </NavLink>
          <NavLink to="/admins" className={({ isActive }) => (isActive ? 'navItem active' : 'navItem')}>
            Admins
          </NavLink>
          <NavLink to="/system-config" className={({ isActive }) => (isActive ? 'navItem active' : 'navItem')}>
            System Config
          </NavLink>
          <NavLink to="/upload-batches" className={({ isActive }) => (isActive ? 'navItem active' : 'navItem')}>
            Upload Logs
          </NavLink>
        </nav>

        <div className="sidebarFooter">
          <div className="muted">{admin?.email}</div>
          <button
            className="button secondary"
            onClick={async () => {
              await signOutNow();
              nav('/login', { replace: true });
            }}
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
