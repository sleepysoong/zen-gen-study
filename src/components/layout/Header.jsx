/**
 * Header 컴포넌트
 */
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

export function Header() {
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <header className="header">
            <div className="header-container">
                <Link to="/" className="header-logo">
                    <span className="header-logo-text">Zen Gen Study</span>
                </Link>

                <nav className="header-nav">
                    <Link
                        to="/"
                        className={`header-nav-link ${isActive('/') ? 'header-nav-link--active' : ''}`}
                    >
                        홈
                    </Link>
                    <Link
                        to="/settings"
                        className={`header-nav-link ${isActive('/settings') ? 'header-nav-link--active' : ''}`}
                    >
                        설정
                    </Link>
                </nav>
            </div>
        </header>
    );
}
