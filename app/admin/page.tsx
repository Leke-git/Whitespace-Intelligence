import { redirect } from 'next/navigation';
import AdminDashboard from './AdminDashboard';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = params.token;
  const adminToken = process.env.ADMIN_URL_TOKEN;

  // If the admin token is set in environment variables, check it against the query parameter.
  // This provides a simple way to protect the admin dashboard without a full auth system.
  if (adminToken && token !== adminToken) {
    redirect('/');
  }

  return <AdminDashboard />;
}
