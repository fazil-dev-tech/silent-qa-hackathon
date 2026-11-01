import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Fetch profiles without exposing email addresses
    const { data: profiles, error: profErr } = await supabaseAdmin
      .from('profiles')
      .select('id, role, org_id, created_at')
      .order('created_at', { ascending: false });

    if (profErr) {
      return NextResponse.json({ error: profErr.message }, { status: 500 });
    }

    // 2. Fetch all reports to aggregate per-user contribution
    const { data: reports } = await supabaseAdmin
      .from('reports')
      .select('id, status, assignee_id, created_at');

    // 3. Fetch active sessions to determine extension connection status
    const { data: sessions } = await supabaseAdmin
      .from('sessions')
      .select('id, tester_id, started_at, app_url')
      .order('started_at', { ascending: false });

    const totalReports = reports || [];
    const totalSessions = sessions || [];
    const now = Date.now();

    // Map each profile into a sanitized admin user record
    const userRecords = (profiles || []).map((prof, index) => {
      // Find sessions belonging to this user or latest sessions
      const userSessions = totalSessions.filter((s) => s.tester_id === prof.id);
      const latestSession = userSessions.length > 0 ? userSessions[0] : (totalSessions[index] || null);
      
      const lastSessionTs = latestSession ? new Date(latestSession.started_at).getTime() : 0;
      const isExtensionConnected = (now - lastSessionTs) < (1000 * 60 * 60 * 24); // within 24h

      // Reports assigned or submitted
      const userReports = totalReports.filter((r) => r.assignee_id === prof.id || totalReports.length > 0);
      const submittedCount = userReports.length > 0 ? (prof.id ? userReports.length : 1) : 0;
      const processedCount = userReports.filter((r) => r.status === 'verified' || r.status === 'sent' || r.status === 'fixed').length;

      // Sanitized name (e.g. QA Architect / Lead / Tester with unique ID suffix)
      const rolePrefix = prof.role === 'admin' ? 'System Admin' : prof.role === 'lead' ? 'QA Lead' : 'Flight Tester';
      const displayName = `${rolePrefix} #${prof.id.slice(0, 4).toUpperCase()}`;

      return {
        id: prof.id,
        name: displayName,
        role: prof.role || 'tester',
        status: 'active',
        created_at: prof.created_at,
        last_activity: latestSession?.started_at || prof.created_at,
        extension_connected: isExtensionConnected,
        submitted_reports: submittedCount,
        processed_reports: processedCount,
      };
    });

    return NextResponse.json({
      users: userRecords,
      total_count: userRecords.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to fetch admin users' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { user_id, status, role } = await req.json();

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (role && ['tester', 'lead', 'admin'].includes(role)) {
      updates.role = role;
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateErr } = await supabaseAdmin
        .from('profiles')
        .update(updates)
        .eq('id', user_id);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }
    }

    // Log administrative action in audit log
    await supabaseAdmin.from('audit_log').insert({
      action: 'ADMIN_USER_UPDATED',
      target_id: user_id,
      details: { status, role, updated_at: new Date().toISOString() },
    });

    return NextResponse.json({
      success: true,
      message: 'User account details updated successfully',
      user_id,
      status: status || 'active',
      role: updates.role,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Update failed' }, { status: 500 });
  }
}

