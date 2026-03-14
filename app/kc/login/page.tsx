import { Metadata } from 'next';
import LoginForm from './LoginForm';

export const metadata: Metadata = {
    title: 'Login KrosCek API — Developer Portal',
    description: 'Masuk ke KrosCek Developer Portal untuk mengakses dokumentasi API.',
};

export default function KrosCekLoginPage() {
    // LoginForm handles the full-screen background and layout
    return <LoginForm />;
}
