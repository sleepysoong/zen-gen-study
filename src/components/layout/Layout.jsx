/**
 * Layout 컴포넌트
 */
import { Header } from './Header';
import './Layout.css';

export function Layout({ children }) {
    return (
        <div className="layout">
            <Header />
            <main className="layout-main">
                {children}
            </main>
        </div>
    );
}
