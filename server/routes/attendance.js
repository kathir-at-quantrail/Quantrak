const express = require('express');
const router = express.Router();
const supabase = require('../db');
const { authenticateUser } = require('../middleware/auth');

// Mark attendance
router.post('/mark', authenticateUser, async (req, res) => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const currentHour = today.getHours();

    // Check if before 9 AM
    if (currentHour < 9) {
      return res.status(400).json({ error: 'Attendance cannot be marked before 9 AM' });
    }

    // Check if after 5 PM
    if (currentHour >= 17) {
      return res.status(400).json({ error: 'Attendance marking time for today is over (after 5 PM)' });
    }

    // Check if user's start date is in future
    if (new Date(req.user.start_date) > today) {
      return res.status(400).json({ error: 'Cannot mark attendance before start date' });
    }

    // Check if attendance already marked for today
    const { data: existingAttendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('date', todayStr);

    if (existingAttendance && existingAttendance.length > 0) {
      return res.status(400).json({ error: 'Attendance already marked for today' });
    }

    // Check if leave applied for today
    const { data: leave } = await supabase
      .from('leave_applications')
      .select('*')
      .eq('user_id', req.user.id)
      .lte('start_date', todayStr)
      .gte('end_date', todayStr)
      .eq('status', 'approved');

    if (leave && leave.length > 0) {
      return res.status(400).json({ error: 'Cannot mark attendance on leave days' });
    }

    // Check if today is weekend (Saturday or Sunday)
    if (today.getDay() === 0 || today.getDay() === 6) {
      const dayName = today.getDay() === 0 ? 'Sunday' : 'Saturday';
      return res.status(400).json({ error: `Attendance cannot be marked as today is a weekend (${dayName})` });
    }

    // Check if today is a local holiday
    const { data: holiday } = await supabase
      .from('local_holidays')
      .select('*')
      .lte('start_date', todayStr)
      .gte('end_date', todayStr);

    if (holiday && holiday.length > 0) {
      return res.status(400).json({ error: `Attendance cannot be marked as today is a local holiday due to: ${holiday[0].reason}` });
    }

    // Mark attendance
    const { error } = await supabase
      .from('attendance')
      .insert([{
        user_id: req.user.id,
        date: todayStr,
        status: 'present',
        marked_at: new Date().toISOString() // Add timestamp of when attendance was marked
      }]);

    if (error) throw error;

    res.json({
      message: 'Attendance marked successfully',
      timePeriod: currentHour >= 9 && currentHour < 12 ? 'morning' :
        currentHour >= 12 && currentHour < 15 ? 'afternoon' : 'evening'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Apply for leave
router.post('/leave', authenticateUser, async (req, res) => {
  try {
    const { start_date, end_date, reason } = req.body;

    // Validation
    if (!start_date || !end_date || !reason) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Get today's date at midnight for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Only reject if start date is before today (not equal to today)
    if (new Date(start_date) < today) {
      return res.status(400).json({ error: 'Cannot apply leave for dates before today' });
    }

    if (new Date(start_date) > new Date(end_date)) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    // Check for existing attendance or leave in the date range
    const { data: existingAttendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', req.user.id)
      .gte('date', start_date)
      .lte('date', end_date);

    if (existingAttendance && existingAttendance.length > 0) {
      return res.status(400).json({ error: 'Attendance already marked for some dates in this range' });
    }

    const { data: existingLeave } = await supabase
      .from('leave_applications')
      .select('*')
      .eq('user_id', req.user.id)
      .gte('start_date', start_date)
      .lte('end_date', end_date)
      .eq('status', 'approved');

    if (existingLeave && existingLeave.length > 0) {
      return res.status(400).json({ error: 'Leave already applied for some dates in this range' });
    }

    // Apply for leave
    const { data, error } = await supabase
      .from('leave_applications')
      .insert([{
        user_id: req.user.id,
        start_date,
        end_date,
        reason,
        status: 'approved' // Auto-approve for now, can be changed to 'pending' if needed
      }])
      .select();

    if (error) throw error;

    res.json({ message: 'Leave applied successfully', leave: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user attendance history
// Get user attendance history
router.get('/history', authenticateUser, async (req, res) => {
  try {
    // Get all attendance records
    const { data: attendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', req.user.id)
      .order('date', { ascending: false });

    // Get all leave applications
    const { data: leaves } = await supabase
      .from('leave_applications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('start_date', { ascending: false });

    // Calculate attendance stats and find missing attendance days
    const startDate = new Date(req.user.start_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to midnight for comparison
    
    let workingDays = 0;
    let presentDays = 0;
    let leaveDays = 0;
    const failedAttendanceDays = [];

    // Get current time for today's attendance check
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Iterate through each day from start date to today
    for (let date = new Date(startDate); date <= today; date.setDate(date.getDate() + 1)) {
      // Skip weekends (Saturday and Sunday)
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      const dateStr = date.toISOString().split('T')[0];
      
      // Check if it's a local holiday
      const { data: holiday } = await supabase
        .from('local_holidays')
        .select('*')
        .lte('start_date', dateStr)
        .gte('end_date', dateStr);

      if (holiday && holiday.length > 0) continue;

      workingDays++;

      // Check attendance
      const attendanceRecord = attendance.find(a => a.date === dateStr);
      if (attendanceRecord) {
        presentDays++;
      } else {
        // Check if leave was applied
        const leave = leaves.find(l => 
          new Date(l.start_date) <= date && new Date(l.end_date) >= date
        );

        if (leave) {
          leaveDays++;
        } else {
          // Only consider it failed if:
          // 1. It's a past date (not today)
          // OR
          // 2. It's today but after 5 PM
          const isPastDate = dateStr < today.toISOString().split('T')[0];
          const isTodayAfter5PM = dateStr === today.toISOString().split('T')[0] && 
                                currentHour >= 17 && currentMinute >= 0;
          
          if (isPastDate || isTodayAfter5PM) {
            failedAttendanceDays.push({
              id: `failed-${dateStr}`,
              date: dateStr,
              reason: 'Failed to Mark Attendance',
              status: 'auto-generated'
            });
          }
        }
      }
    }

    // Combine leaves and failed attendance days
    const allLeaveRecords = [
      ...leaves,
      ...failedAttendanceDays.map(failed => ({
        id: failed.id,
        start_date: failed.date,
        end_date: failed.date,
        reason: failed.reason,
        status: 'auto-generated',
        user_id: req.user.id,
        created_at: failed.date,
        updated_at: failed.date
      }))
    ];

    const attendancePercentage = workingDays > 0 ? Math.round((presentDays / workingDays) * 100) : 0;
    const failedToMark = failedAttendanceDays.length;

    res.json({
      attendance,
      leaves: allLeaveRecords,
      stats: {
        totalWorkingDays: workingDays,
        presentDays,
        leaveDays: leaveDays + failedToMark, // Include failed days in leave count
        failedToMark,
        attendancePercentage
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin routes
router.get('/admin/user/:id', authenticateUser, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const userId = req.params.id;

    // Get user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // Get all attendance records
    const { data: attendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    // Get all leave applications
    const { data: leaves } = await supabase
      .from('leave_applications')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: false });

    // Calculate attendance stats (same as user history)
    const startDate = new Date(user.start_date);
    const today = new Date();
    let workingDays = 0;
    let presentDays = 0;
    let leaveDays = 0;

    for (let date = new Date(startDate); date <= today; date.setDate(date.getDate() + 1)) {
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      const dateStr = date.toISOString().split('T')[0];
      const { data: holiday } = await supabase
        .from('local_holidays')
        .select('*')
        .lte('start_date', dateStr)
        .gte('end_date', dateStr);

      if (holiday && holiday.length > 0) continue;

      workingDays++;

      const { data: attendanceRecord } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', userId)
        .eq('date', dateStr);

      if (attendanceRecord && attendanceRecord.length > 0) {
        presentDays++;
      } else {
        const { data: leave } = await supabase
          .from('leave_applications')
          .select('*')
          .eq('user_id', userId)
          .lte('start_date', dateStr)
          .gte('end_date', dateStr)
          .eq('status', 'approved');

        if (leave && leave.length > 0) {
          leaveDays++;
        }
      }
    }

    const attendancePercentage = workingDays > 0 ? Math.round((presentDays / workingDays) * 100) : 0;
    const failedToMark = workingDays - presentDays - leaveDays;

    res.json({
      user,
      attendance,
      leaves,
      stats: {
        totalWorkingDays: workingDays,
        presentDays,
        leaveDays,
        failedToMark,
        attendancePercentage
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users attendance summary (for comparison)
router.get('/admin/summary', authenticateUser, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const { position } = req.query;

    // Get all users
    let query = supabase
      .from('users')
      .select('*');

    if (position) {
      query = query.eq('position', position);
    }

    const { data: users, error: usersError } = await query;

    if (usersError) throw usersError;

    // Get attendance stats for each user
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const startDate = new Date(user.start_date);
      const today = new Date();
      let workingDays = 0;
      let presentDays = 0;
      let leaveDays = 0;

      for (let date = new Date(startDate); date <= today; date.setDate(date.getDate() + 1)) {
        if (date.getDay() === 0 || date.getDay() === 6) continue;

        const dateStr = date.toISOString().split('T')[0];
        const { data: holiday } = await supabase
          .from('local_holidays')
          .select('*')
          .lte('start_date', dateStr)
          .gte('end_date', dateStr);

        if (holiday && holiday.length > 0) continue;

        workingDays++;

        const { data: attendanceRecord } = await supabase
          .from('attendance')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', dateStr);

        if (attendanceRecord && attendanceRecord.length > 0) {
          presentDays++;
        } else {
          const { data: leave } = await supabase
            .from('leave_applications')
            .select('*')
            .eq('user_id', user.id)
            .lte('start_date', dateStr)
            .gte('end_date', dateStr)
            .eq('status', 'approved');

          if (leave && leave.length > 0) {
            leaveDays++;
          }
        }
      }

      const attendancePercentage = workingDays > 0 ? Math.round((presentDays / workingDays) * 100) : 0;
      const failedToMark = workingDays - presentDays - leaveDays;

      return {
        ...user,
        stats: {
          totalWorkingDays: workingDays,
          presentDays,
          leaveDays,
          failedToMark,
          attendancePercentage
        }
      };
    }));

    // Find best and worst performers
    let bestPerformer = null;
    let worstPerformer = null;

    if (usersWithStats.length > 0) {
      bestPerformer = usersWithStats.reduce((prev, current) =>
        (prev.stats.attendancePercentage > current.stats.attendancePercentage) ? prev : current);

      worstPerformer = usersWithStats.reduce((prev, current) =>
        (prev.stats.attendancePercentage < current.stats.attendancePercentage) ? prev : current);
    }

    res.json({
      users: usersWithStats,
      bestPerformer,
      worstPerformer
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Local holidays CRUD
router.post('/admin/holidays', authenticateUser, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const { name, start_date, end_date, reason } = req.body;

    // Validation
    if (!name || !start_date || !end_date || !reason) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Get today's date at midnight for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Only reject if start date is before today (not equal to today)
    if (new Date(start_date) < today) {
      return res.status(400).json({ error: 'Cannot add holiday for dates before today' });
    }

    if (new Date(start_date) > new Date(end_date)) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    // Check if it's a weekend
    const startDay = new Date(start_date).getDay();
    const endDay = new Date(end_date).getDay();
    if (startDay === 0 || startDay === 6 || endDay === 0 || endDay === 6) {
      return res.status(400).json({ error: 'Weekends are already holidays' });
    }

    // Add holiday
    const { data, error } = await supabase
      .from('local_holidays')
      .insert([{
        name,
        start_date,
        end_date,
        reason
      }])
      .select();

    if (error) throw error;

    res.json({ message: 'Holiday added successfully', holiday: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/admin/holidays', authenticateUser, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const { type = 'upcoming' } = req.query;
    const today = new Date().toISOString().split('T')[0];

    let query = supabase
      .from('local_holidays')
      .select('*')
      .order('start_date', { ascending: true });

    if (type === 'upcoming') {
      query = query.gte('end_date', today);
    } else if (type === 'past') {
      query = query.lt('end_date', today);
    }

    const { data: holidays, error } = await query;

    if (error) throw error;

    res.json(holidays);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/admin/holidays/:id', authenticateUser, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const { id } = req.params;
    const { name, start_date, end_date, reason } = req.body;
    const today = new Date().toISOString().split('T')[0];

    // Check if holiday is in past
    const { data: existingHoliday } = await supabase
      .from('local_holidays')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingHoliday) {
      return res.status(404).json({ error: 'Holiday not found' });
    }

    if (existingHoliday.end_date < today) {
      return res.status(400).json({ error: 'Cannot edit past holidays' });
    }

    // Validation
    if (!name || !start_date || !end_date || !reason) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (new Date(start_date) < new Date()) {
      return res.status(400).json({ error: 'Cannot set holiday to past dates' });
    }

    if (new Date(start_date) > new Date(end_date)) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    // Update holiday
    const { data, error } = await supabase
      .from('local_holidays')
      .update({
        name,
        start_date,
        end_date,
        reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) throw error;

    res.json({ message: 'Holiday updated successfully', holiday: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/admin/holidays/:id', authenticateUser, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const { id } = req.params;

    const { error } = await supabase
      .from('local_holidays')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Holiday deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/reset-attendance', authenticateUser, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const { userId, newStartDate } = req.body;

    // Delete all attendance records before new start date
    await supabase
      .from('attendance')
      .delete()
      .eq('user_id', userId)
      .lt('date', newStartDate);

    // Delete all leave records before new start date
    await supabase
      .from('leave_applications')
      .delete()
      .eq('user_id', userId)
      .lt('start_date', newStartDate);

    res.json({ message: 'Attendance history reset successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;