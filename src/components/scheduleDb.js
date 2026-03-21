// ============================================================
// SCHEDULE DATABASE OPERATIONS
// Save and load schedules from Supabase
// ============================================================

export const saveSchedule = async (scheduleName, scheduleBlocks, userId) => {
  try {
    const { data, error } = await window.supabaseDb
      .from('rehearsal_sessions')
      .insert({
        production_id: '00000000-0000-0000-0000-000000000000', // Placeholder
        session_date: new Date().toISOString().split('T')[0],
        start_time: '09:00:00',
        end_time: '17:00:00',
        session_type: 'custom',
        location: 'Studio',
        notes: JSON.stringify(scheduleBlocks)
      })
      .select();

    if (error) throw error;
    console.log('✅ Schedule saved:', scheduleName);
    return { success: true, data };
  } catch (error) {
    console.error('Error saving schedule:', error);
    return { success: false, error };
  }
};

export const loadSchedules = async () => {
  try {
    const { data, error } = await window.supabaseDb
      .from('rehearsal_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    console.log('✅ Schedules loaded:', data.length);
    return data || [];
  } catch (error) {
    console.error('Error loading schedules:', error);
    return [];
  }
};