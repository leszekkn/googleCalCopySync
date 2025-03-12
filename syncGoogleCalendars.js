/**
 * Google Apps Script to synchronize two calendars bidirectionally, one day at a time.
 * - Events are copied **from one calendar to another** and vice versa.
 * - Copies are clearly marked as "[COPY] {10_characters_from_original_name} [ID: {id}]".
 * - Only outdated/orphaned copies are deleted—**NEVER the original events**.
 * - The script does not copy existing copies back to the source to prevent loops.
 * - If an event **already exists in both calendars**, it is skipped to avoid unnecessary duplication.
 * - **All-day events are skipped** to prevent unintended behavior.
 * - **Copies are set to graphite color** for differentiation.
 */

function syncCopyCalendars() {
  // Define calendar IDs
  var CALENDAR_A_ID = 'your-calendar-a-id@group.calendar.google.com';
  var CALENDAR_B_ID = 'your-calendar-b-id@group.calendar.google.com';

  // Define event color for copies
  var COPY_EVENT_COLOR = CalendarApp.EventColor.GRAY;

  // Define the time range for sync
  var SYNC_DAYS = 30;
  
  // Define sync period (e.g., next 30 days)
  var now = new Date();

  // Get calendar objects
  var calendarA = CalendarApp.getCalendarById(CALENDAR_A_ID);
  var calendarB = CalendarApp.getCalendarById(CALENDAR_B_ID);

  if (!calendarA || !calendarB) {
    Logger.log("Error: One or more calendar IDs are invalid.");
    return;
  }

  // Process events one day at a time
  for (var i = 0; i < SYNC_DAYS; i++) {
    var dayStart = new Date();
    dayStart.setDate(now.getDate() + i);
    dayStart.setHours(0, 0, 0, 0);
    var dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    // Synchronize events for the specific day
    syncDay(calendarA, calendarB, dayStart, dayEnd, COPY_EVENT_COLOR);
    syncDay(calendarB, calendarA, dayStart, dayEnd, COPY_EVENT_COLOR);
    Utilities.sleep(500); // Pause to avoid rate limits
  }

  Logger.log("Synchronization completed.");
}

/**
 * Synchronizes a single day's events between two calendars.
 */
function syncDay(sourceCalendar, targetCalendar, startTime, endTime, copyColor) {
  var sourceEvents = sourceCalendar.getEvents(startTime, endTime).filter(e => !e.isAllDayEvent());
  var targetEvents = targetCalendar.getEvents(startTime, endTime).filter(e => !e.isAllDayEvent());
  var targetCopies = targetEvents.filter(e => e.getTitle().startsWith("[COPY]"));

  // Delete only orphaned/outdated copies in target calendar
  cleanUpCopies(targetCopies, sourceEvents);

  // Copy missing events to the target calendar
  sourceEvents.forEach(event => {
    if (!event.getTitle().startsWith("[COPY]") && !eventExistsInTarget(event, targetEvents)) {
      createOrUpdateCopy(event, targetCalendar, copyColor);
    }
  });
}

/**
 * Deletes only outdated or orphaned copies in the target calendar.
 */
function cleanUpCopies(targetCopies, sourceEvents) {
  targetCopies.forEach(copy => {
    var copyIdMatch = copy.getTitle().match(/\[ID: (.+?)\]/);
    var copyId = copyIdMatch ? copyIdMatch[1] : null;
    
    if (!copyId || !sourceEvents.some(e => e.getId() === copyId)) {
      try {
        copy.deleteEvent();
        Logger.log(`Deleted orphaned copy: ${copy.getTitle()}`);
      } catch (e) {
        Logger.log(`Error deleting copy: ${e.message}`);
      }
    }
  });
}

/**
 * Checks if an event with the same title, start time, and end time exists in the target calendar.
 */
function eventExistsInTarget(sourceEvent, targetEvents) {
  return targetEvents.some(targetEvent =>
    targetEvent.getTitle() === sourceEvent.getTitle() &&
    targetEvent.getStartTime().getTime() === sourceEvent.getStartTime().getTime() &&
    targetEvent.getEndTime().getTime() === sourceEvent.getEndTime().getTime()
  );
}

/**
 * Copies an event from the source calendar to the target calendar.
 * Ensures proper naming and updates existing copies instead of duplicating.
 * Sets the copied event color to graphite.
 */
function createOrUpdateCopy(sourceEvent, targetCalendar, copyColor) {
  var truncatedTitle = sourceEvent.getTitle().substring(0, 10);
  var copyTitle = `[COPY] ${truncatedTitle} [ID: ${sourceEvent.getId()}]`;
  var targetEvents = targetCalendar.getEvents(sourceEvent.getStartTime(), sourceEvent.getEndTime());
  var existingCopy = targetEvents.find(e => e.getTitle().includes(`[ID: ${sourceEvent.getId()}]`));

  if (existingCopy) {
    // Update the existing copy if details have changed
    if (
      existingCopy.getStartTime().getTime() !== sourceEvent.getStartTime().getTime() ||
      existingCopy.getEndTime().getTime() !== sourceEvent.getEndTime().getTime() ||
      existingCopy.getDescription() !== sourceEvent.getDescription() ||
      existingCopy.getLocation() !== sourceEvent.getLocation()
    ) {
      existingCopy.setTitle(copyTitle);
      existingCopy.setTime(sourceEvent.getStartTime(), sourceEvent.getEndTime());
      existingCopy.setDescription(sourceEvent.getDescription());
      existingCopy.setLocation(sourceEvent.getLocation());
      existingCopy.setColor(copyColor);
      Logger.log(`Updated copy: ${copyTitle}`);
    }
  } else {
    // Create a new copy
    var newEvent = targetCalendar.createEvent(copyTitle, sourceEvent.getStartTime(), sourceEvent.getEndTime(), {
      description: sourceEvent.getDescription(),
      location: sourceEvent.getLocation()
    });
    newEvent.setColor(copyColor);
    Logger.log(`Created copy: ${copyTitle}`);
  }
}
