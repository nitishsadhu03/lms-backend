const TeacherAvailability = require("../schema/teacherAvailablity");
const TeacherSchedule = require("../schema/TeacherScheduleNew");
const Class = require("../schema/class");
const Teacher = require("../schema/teacher");
const mongoose = require("mongoose");

// Controller functions for teacher availability
exports.setAvailability = async (req, res) => {
  try {
    const { startTime, endTime, date } = req.body;

    // Find existing availability document for the teacher
    let teacherAvailability = await TeacherAvailability.findOne({
      teacherId: req.user.roleId,
    });

    if (!teacherAvailability) {
      teacherAvailability = new TeacherAvailability({
        teacherId: req.user.roleId,
        availableTimeSlots: [],
      });
    }

    // Add new time slot
    teacherAvailability.availableTimeSlots.push({
      startTime,
      endTime,
      date,
      status: "active",
    });

    await teacherAvailability.save();
    res.status(201).json({ success: true, data: teacherAvailability });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getAvailability = async (req, res) => {
  try {
    // Find the availability document for the authenticated teacher
    const teacherAvailability = await TeacherAvailability.findOne({
      teacherId: req.user.roleId,
    });

    if (!teacherAvailability) {
      return res.status(200).json({
        success: true,
        data: [], // Return an empty array
      });
    }

    // Return the available time slots
    res.status(200).json({
      success: true,
      data: teacherAvailability.availableTimeSlots,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.getAllTeachersAvailabilities = async (req, res) => {
  try {
    // Fetch all TeacherAvailability documents from the database
    const allAvailabilities = await TeacherAvailability.find().exec();

    // If no availabilities are found, return an empty array
    if (!allAvailabilities || allAvailabilities.length === 0) {
      console.log("No TeacherAvailability documents found.");
      return res.status(200).json({
        success: true,
        data: [], // Return an empty array
      });
    }

    // Return all availabilities as they are
    res.status(200).json({
      success: true,
      data: allAvailabilities,
    });
  } catch (error) {
    console.error("Error fetching all teachers' availabilities:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.updateAvailabilitySlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    const updates = req.body;

    const availability = await TeacherAvailability.findOneAndUpdate(
      {
        teacherId: req.user._id,
        "availableTimeSlots._id": slotId,
      },
      {
        $set: {
          "availableTimeSlots.$": { ...updates },
        },
      },
      { new: true }
    );

    if (!availability) {
      return res
        .status(404)
        .json({ success: false, message: "Availability slot not found" });
    }

    res.status(200).json({ success: true, data: availability });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.deleteAvailabilitySlot = async (req, res) => {
  try {
    const { slotId } = req.params;

    const availability = await TeacherAvailability.findOneAndUpdate(
      { teacherId: req.user._id },
      { $pull: { availableTimeSlots: { _id: slotId } } },
      { new: true }
    );

    if (!availability) {
      return res
        .status(404)
        .json({ success: false, message: "Availability slot not found" });
    }

    res.status(200).json({ success: true, data: availability });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Controller functions for teacher schedule
// exports.getTeacherSchedule = async (req, res) => {
//   try {
//     const teacherId = req.params.teacherId || req.user.roleId;
//     const { startDate, endDate } = req.query;

//     // Validate teacherId as a valid ObjectId
//     if (!mongoose.Types.ObjectId.isValid(teacherId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid teacherId",
//       });
//     }

//     // Build the query
//     const query = { teacherId };
//     if (startDate && endDate) {
//       query.date = {
//         $gte: new Date(startDate),
//         $lte: new Date(endDate),
//       };
//     }

//     // Fetch the schedule
//     const schedule = await TeacherSchedule.find(query)
//       .populate("classId")
//       .sort({ date: 1, startTime: 1 });

//     // If no schedule is found, return an empty array
//     if (!schedule || schedule.length === 0) {
//       return res.status(200).json({ success: true, data: [] });
//     }

//     // Return the schedule
//     res.status(200).json({ success: true, data: schedule });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// };

// Admin controller to get all teachers' timetables
exports.getAllTeachersTimetables = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Both startDate and endDate are required",
      });
    }

    // Get all teachers
    const teachers = await Teacher.find().select("_id teacherId name email");

    // Prepare date range for query
    const dateQuery = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };

    // Get all schedules for all teachers in the date range
    const allSchedules = await TeacherSchedule.find(dateQuery)
      .populate("teacherId", "teacherId name email")
      .populate("classId")
      .sort({ date: 1, startTime: 1 });

    // Organize schedules by teacher
    const timetablesByTeacher = {};

    teachers.forEach((teacher) => {
      timetablesByTeacher[teacher._id] = {
        teacherInfo: {
          _id: teacher._id,
          teacherId: teacher.teacherId,
          name: teacher.name,
          email: teacher.email,
        },
        schedule: [],
      };
    });

    // Populate the schedule for each teacher
    allSchedules.forEach((schedule) => {
      if (schedule.teacherId && schedule.teacherId._id) {
        const teacherId = schedule.teacherId._id.toString();
        if (timetablesByTeacher[teacherId]) {
          timetablesByTeacher[teacherId].schedule.push(schedule);
        }
      }
    });

    res.status(200).json({
      success: true,
      data: Object.values(timetablesByTeacher),
      period: {
        startDate,
        endDate,
      },
    });
  } catch (error) {
    console.error("Error fetching all teachers timetables:", error);
    res.status(400).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// Admin controller for assigning classes
exports.assignClass = async (req, res) => {
  try {
    const { teacherId, classId, date, startTime, endTime, recurringSessionId } =
      req.body;

    // Convert date to the day of week
    const dayOfWeek = new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
    });

    // Find teacher availability
    const teacherAvailability = await TeacherAvailability.findOne({
      teacherId,
      "availableTimeSlots.dayOfWeek": dayOfWeek,
      "availableTimeSlots.status": "active",
    });

    if (!teacherAvailability) {
      return res.status(400).json({
        success: false,
        message: "Teacher is not available at this time",
        debug: {
          requestedTeacherId: teacherId,
          requestedDay: dayOfWeek,
          availabilityFound: null,
        },
      });
    }

    // Check if the requested time falls within any of the available time slots
    const availableSlot = teacherAvailability.availableTimeSlots.find(
      (slot) => {
        return (
          slot.dayOfWeek === dayOfWeek &&
          slot.startTime <= startTime &&
          slot.endTime >= endTime &&
          slot.status === "active"
        );
      }
    );

    if (!availableSlot) {
      return res.status(400).json({
        success: false,
        message: "No matching availability slot found for the requested time",
        debug: {
          requestedTime: { startTime, endTime },
          availableSlots: teacherAvailability.availableTimeSlots,
        },
      });
    }

    // Check for existing schedule conflicts
    const existingSchedule = await TeacherSchedule.findOne({
      teacherId,
      date,
      $or: [
        {
          startTime: { $lte: startTime },
          endTime: { $gt: startTime },
        },
        {
          startTime: { $lt: endTime },
          endTime: { $gte: endTime },
        },
      ],
    });

    if (existingSchedule) {
      return res.status(400).json({
        success: false,
        message: "Schedule conflict exists",
        debug: {
          conflictingSchedule: existingSchedule,
        },
      });
    }

    // Create new schedule
    const schedule = new TeacherSchedule({
      teacherId,
      classId,
      date,
      startTime,
      endTime,
      recurringSessionId, // If this is part of a recurring session, include the ID
      status: "scheduled",
    });

    await schedule.save();
    res.status(201).json({ success: true, data: schedule });
  } catch (error) {
    console.error("Error in assignClass:", error);
    res.status(400).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// Reschedule a specific class session
exports.rescheduleClass = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { date, startTime, endTime, rescheduleFutureSessions, reason } =
      req.body;

    // Find the schedule to be rescheduled
    const schedule = await TeacherSchedule.findById(scheduleId);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found",
      });
    }

    // Get class details
    const classDetails = await Class.findById(schedule.classId);
    if (!classDetails) {
      return res.status(404).json({
        success: false,
        message: "Class details not found",
      });
    }

    // Check if we need to reschedule future sessions of a recurring class
    if (rescheduleFutureSessions && classDetails.isRecurring) {
      // Generate a recurring session ID if one doesn't exist
      const recurringSessionId =
        schedule.recurringSessionId || schedule._id.toString();

      // Find all future instances of this recurring class
      const futureSchedules = await TeacherSchedule.find({
        $or: [
          { recurringSessionId: recurringSessionId },
          { _id: scheduleId }, // Include the current schedule if it doesn't have a recurringSessionId
        ],
        date: { $gte: schedule.date },
      }).sort({ date: 1 });

      if (futureSchedules.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No future sessions found for this class",
        });
      }

      // Calculate time difference between old and new times
      const oldTime = {
        startHours: parseInt(schedule.startTime.split(":")[0]),
        startMinutes: parseInt(schedule.startTime.split(":")[1]),
        endHours: parseInt(schedule.endTime.split(":")[0]),
        endMinutes: parseInt(schedule.endTime.split(":")[1]),
      };

      const newTime = {
        startHours: parseInt(startTime.split(":")[0]),
        startMinutes: parseInt(startTime.split(":")[1]),
        endHours: parseInt(endTime.split(":")[0]),
        endMinutes: parseInt(endTime.split(":")[1]),
      };

      // Calculate time difference in minutes
      const startTimeDiffMinutes =
        (newTime.startHours - oldTime.startHours) * 60 +
        (newTime.startMinutes - oldTime.startMinutes);

      const endTimeDiffMinutes =
        (newTime.endHours - oldTime.endHours) * 60 +
        (newTime.endMinutes - oldTime.endMinutes);

      // Calculate date difference in days
      const oldDate = new Date(schedule.date);
      const newDate = new Date(date);
      const dateDiffDays = Math.floor(
        (newDate - oldDate) / (1000 * 60 * 60 * 24)
      );

      const updatePromises = [];
      const updatedSessions = [];
      const skippedSessions = [];

      // Process each future session
      for (const session of futureSchedules) {
        // Apply the same time and date shifts
        const sessionDate = new Date(session.date);
        sessionDate.setDate(sessionDate.getDate() + dateDiffDays);

        // Calculate new times
        const sessionStartHours = parseInt(session.startTime.split(":")[0]);
        const sessionStartMinutes = parseInt(session.startTime.split(":")[1]);
        const sessionEndHours = parseInt(session.endTime.split(":")[0]);
        const sessionEndMinutes = parseInt(session.endTime.split(":")[1]);

        // Apply time differences
        let newStartHours =
          sessionStartHours +
          Math.floor((sessionStartMinutes + startTimeDiffMinutes) / 60);
        let newStartMinutes = (sessionStartMinutes + startTimeDiffMinutes) % 60;
        if (newStartMinutes < 0) {
          newStartHours--;
          newStartMinutes += 60;
        }
        newStartHours = (newStartHours + 24) % 24; // Ensure hours are in 0-23 range

        let newEndHours =
          sessionEndHours +
          Math.floor((sessionEndMinutes + endTimeDiffMinutes) / 60);
        let newEndMinutes = (sessionEndMinutes + endTimeDiffMinutes) % 60;
        if (newEndMinutes < 0) {
          newEndHours--;
          newEndMinutes += 60;
        }
        newEndHours = (newEndHours + 24) % 24; // Ensure hours are in 0-23 range

        const newSessionStartTime = `${newStartHours
          .toString()
          .padStart(2, "0")}:${newStartMinutes.toString().padStart(2, "0")}`;
        const newSessionEndTime = `${newEndHours
          .toString()
          .padStart(2, "0")}:${newEndMinutes.toString().padStart(2, "0")}`;

        // Check if the new time is valid (start before end)
        const startTimeMinutes = newStartHours * 60 + newStartMinutes;
        const endTimeMinutes = newEndHours * 60 + newEndMinutes;

        if (startTimeMinutes >= endTimeMinutes) {
          skippedSessions.push({
            sessionId: session._id,
            reason: "Invalid time range after adjustment",
          });
          continue;
        }

        // Check teacher availability for the new time
        const newDayOfWeek = sessionDate.toLocaleDateString("en-US", {
          weekday: "long",
        });

        const teacherAvailability = await TeacherAvailability.findOne({
          teacherId: session.teacherId,
          "availableTimeSlots.dayOfWeek": newDayOfWeek,
          "availableTimeSlots.status": "active",
        });

        if (!teacherAvailability) {
          skippedSessions.push({
            sessionId: session._id,
            reason: "Teacher not available on the new date",
          });
          continue;
        }

        // Check if the time slot is available
        const availableSlot = teacherAvailability.availableTimeSlots.find(
          (slot) => {
            return (
              slot.dayOfWeek === newDayOfWeek &&
              slot.startTime <= newSessionStartTime &&
              slot.endTime >= newSessionEndTime &&
              slot.status === "active"
            );
          }
        );

        if (!availableSlot) {
          skippedSessions.push({
            sessionId: session._id,
            reason: "No matching availability slot for the new time",
          });
          continue;
        }

        // Check for schedule conflicts
        const conflictingSchedule = await TeacherSchedule.findOne({
          teacherId: session.teacherId,
          date: sessionDate,
          _id: { $ne: session._id },
          $or: [
            {
              startTime: { $lte: newSessionStartTime },
              endTime: { $gt: newSessionStartTime },
            },
            {
              startTime: { $lt: newSessionEndTime },
              endTime: { $gte: newSessionEndTime },
            },
          ],
        });

        if (conflictingSchedule) {
          skippedSessions.push({
            sessionId: session._id,
            reason: "Schedule conflict exists for the new time",
          });
          continue;
        }

        // Update the session
        session.date = sessionDate;
        session.startTime = newSessionStartTime;
        session.endTime = newSessionEndTime;
        session.status = "rescheduled";
        session.recurringSessionId = recurringSessionId;
        session.updatedAt = Date.now();

        updatePromises.push(session.save());
        updatedSessions.push({
          sessionId: session._id,
          newDate: sessionDate,
          newStartTime: newSessionStartTime,
          newEndTime: newSessionEndTime,
        });
      }

      // Execute all updates
      await Promise.all(updatePromises);

      return res.status(200).json({
        success: true,
        message: `Rescheduled ${updatedSessions.length} class sessions, skipped ${skippedSessions.length} sessions`,
        data: {
          updatedSessions,
          skippedSessions,
        },
      });
    } else {
      // Just reschedule this one session

      // Check teacher availability for the new date/time
      const dayOfWeek = new Date(date).toLocaleDateString("en-US", {
        weekday: "long",
      });

      const teacherAvailability = await TeacherAvailability.findOne({
        teacherId: schedule.teacherId,
        "availableTimeSlots.dayOfWeek": dayOfWeek,
        "availableTimeSlots.status": "active",
      });

      if (!teacherAvailability) {
        return res.status(400).json({
          success: false,
          message: "Teacher is not available on the requested date",
        });
      }

      // Check if the requested time falls within any of the available time slots
      const availableSlot = teacherAvailability.availableTimeSlots.find(
        (slot) => {
          return (
            slot.dayOfWeek === dayOfWeek &&
            slot.startTime <= startTime &&
            slot.endTime >= endTime &&
            slot.status === "active"
          );
        }
      );

      if (!availableSlot) {
        return res.status(400).json({
          success: false,
          message: "No matching availability slot found for the requested time",
        });
      }

      // Check for scheduling conflicts
      const existingSchedule = await TeacherSchedule.findOne({
        teacherId: schedule.teacherId,
        date,
        _id: { $ne: scheduleId },
        $or: [
          {
            startTime: { $lte: startTime },
            endTime: { $gt: startTime },
          },
          {
            startTime: { $lt: endTime },
            endTime: { $gte: endTime },
          },
        ],
      });

      if (existingSchedule) {
        return res.status(400).json({
          success: false,
          message: "Schedule conflict exists for the requested time",
        });
      }

      // Update the schedule
      schedule.date = date;
      schedule.startTime = startTime;
      schedule.endTime = endTime;
      schedule.status = "rescheduled";
      schedule.updatedAt = Date.now();

      await schedule.save();

      res.status(200).json({
        success: true,
        message: "Class rescheduled successfully",
        data: schedule,
      });
    }
  } catch (error) {
    console.error("Error in rescheduleClass:", error);
    res.status(400).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};


/**
 * @desc    Create or update teacher's weekly schedule
 * @route   POST /api/teacher-schedule/weekly-schedule
 * @access  Private (Teacher only)
 */
exports.createTeacherSchedule = async (req, res) => {
  try {
    const { schedule } = req.body;
    const teacherId = req.user.roleId;

    // Validate teacherId as a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid teacherId",
      });
    }

    // Input validation for schedule
    if (!schedule || !Array.isArray(schedule) || schedule.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Schedule is required and must be a non-empty array",
      });
    }

    // Validate each schedule entry
    const validDays = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const daysSet = new Set();

    for (const slot of schedule) {
      // Validate required fields
      if (!slot.day || !slot.startTime || !slot.endTime) {
        return res.status(400).json({
          success: false,
          message: "Each schedule must have day, startTime, and endTime",
        });
      }

      // Validate day against enumerated values
      if (!validDays.includes(slot.day)) {
        return res.status(400).json({
          success: false,
          message: `Invalid day: ${slot.day}. Must be one of ${validDays.join(", ")}`,
        });
      }

      // Check for duplicate days
      if (daysSet.has(slot.day)) {
        return res.status(400).json({
          success: false,
          message: `Duplicate day found: ${slot.day}. Each day must be unique in the schedule.`,
        });
      }
      daysSet.add(slot.day);

      // Validate time format (HH:mm)
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
        return res.status(400).json({
          success: false,
          message: "Time must be in HH:mm format",
        });
      }

      // Validate start time is before end time
      const startMinutes = slot.startTime.split(":").reduce((acc, time) => 60 * acc + +time, 0);
      const endMinutes = slot.endTime.split(":").reduce((acc, time) => 60 * acc + +time, 0);
      if (endMinutes <= startMinutes) {
        return res.status(400).json({
          success: false,
          message: "End time must be after start time",
        });
      }
    }

    // Check if teacher already has a schedule
    let teacherSchedule = await TeacherSchedule.findOne({ teacherId });

    if (teacherSchedule) {
      // Update existing schedule
      teacherSchedule.schedule = schedule;
      await teacherSchedule.save();
      return res.json({
        success: true,
        data: teacherSchedule,
        message: "Schedule updated successfully",
      });
    } else {
      // Create new schedule
      teacherSchedule = new TeacherSchedule({
        teacherId,
        schedule,
      });
      await teacherSchedule.save();
      return res.status(201).json({
        success: true,
        data: teacherSchedule,
        message: "Schedule created successfully",
      });
    }
  } catch (error) {
    console.error("Error creating teacher schedule:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};



/**
 * @desc    Get logged in teacher's schedule
 * @route   GET /api/teacher-schedule/my-schedule
 * @access  Private (Teacher only)
 */
exports.getTeacherSchedule = async (req, res) => {
  try {
    const teacherId = req.user.roleId;

    // Validate teacherId as a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid teacherId",
      });
    }

    // Fetch the teacher's schedule
    const teacherSchedule = await TeacherSchedule.findOne({ teacherId });

    // If no schedule is found, return an empty object
    if (!teacherSchedule) {
      return res.status(200).json({
        success: true,
        data: {}, // Return an empty object
      });
    }

    // Return the schedule
    res.status(200).json({
      success: true,
      data: teacherSchedule,
    });
  } catch (error) {
    console.error("Error fetching teacher schedule:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * @desc    Get all teacher schedules
 * @route   GET /api/teacher-schedule/all
 * @access  Private (Admin only)
 */
exports.getAllTeacherSchedules = async (req, res) => {
  try {
    const teacherSchedules = await TeacherSchedule.find().populate('teacherId', 'name email teacherId');
    
    res.json({
      success: true,
      count: teacherSchedules.length,
      data: teacherSchedules
    });
  } catch (error) {
    console.error("Error fetching all teacher schedules:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};

/**
 * @desc    Get schedule for a specific teacher by ID
 * @route   GET /api/teacher-schedule/:teacherId
 * @access  Private (Admin or specific teacher)
 */
exports.getScheduleById = async (req, res) => {
  try {
    const teacherId = req.params.teacherId;
    
    // Only allow admins or the teacher themselves to access this
    if (req.user.role !== "admin" && req.user.roleId !== teacherId) {
      return res.status(403).json({ 
        success: false,
        message: "Access denied" 
      });
    }

    const teacherSchedule = await TeacherSchedule.findOne({ teacherId }).populate('teacherId', 'name email teacherId');

    if (!teacherSchedule) {
      return res.status(404).json({ 
        success: false,
        message: "Schedule not found for this teacher" 
      });
    }

    res.json({
      success: true,
      data: teacherSchedule
    });
  } catch (error) {
    console.error("Error fetching teacher schedule by ID:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};

/**
 * @desc    Delete teacher schedule
 * @route   DELETE /api/teacher-schedule/my-schedule
 * @access  Private (Teacher only)
 */
exports.deleteTeacherSchedule = async (req, res) => {
  try {
    const teacherId = req.user.roleId;
    const result = await TeacherSchedule.findOneAndDelete({ teacherId });

    if (!result) {
      return res.status(404).json({ 
        success: false,
        message: "Schedule not found for this teacher" 
      });
    }

    res.json({ 
      success: true,
      message: "Teacher schedule deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting teacher schedule:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};