/**
 * 애플리케이션 라우터
 */

import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { StudyPage } from './pages/StudyPage';
import { SettingsPage } from './pages/SettingsPage';

/**
 * 앱 루트 컴포넌트
 */
export function App() {
    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="study/:videoId" element={<StudyPage />} />
                <Route path="settings" element={<SettingsPage />} />
            </Route>
        </Routes>
    );
}
