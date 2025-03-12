Sync Google Calendars
=====================

Overview
--------

This Google Apps Script synchronizes two Google Calendars **bidirectionally** while ensuring that:

*   Events are **copied** from one calendar to the other, and vice versa.
    
*   Copies are **clearly marked** as \[COPY\] {10\_characters\_from\_original\_name} \[ID: {id}\].
    
*   Only **outdated or orphaned copies** are deleted—**original events are never deleted**.
    
*   The script **does not copy copies back to the source** to prevent infinite loops.
    
*   **Identical events in both calendars are skipped** to avoid duplicates.
    
*   **All-day events are ignored**.
    
*   **Copied events are colored graphite** for easy identification.
    

How It Works
------------

1.  The script **runs periodically (e.g., every 5 minutes via a time-based trigger)**.
    
2.  Copies are created in the target calendar while preserving event details (title, description, location, and time).
    
3.  Outdated copies are removed automatically.


Installation & Setup
--------------------

1.  **Open Google Apps Script**:
    
    *   Go to [Google Apps Script](https://script.google.com/)
        
    *   Create a new script project
        
2.  **Copy and paste the [syncGoogleCalendars.js](syncGoogleCalendars.js) into the editor**.
    
3.  **Set up the required variables in the script**:
    
    *   Replace your-calendar-a-id@group.calendar.google.com and your-calendar-b-id@group.calendar.google.com with your actual Google Calendar IDs.
        
    *   Adjust SYNC\_DAYS if needed.
        
4.  **Set up Google Calendar Triggers**:
    
    *   Open the Apps Script Editor → Triggers
        
    *   Set up a time-based trigger (e.g., every 5 minutes)
        
5.  **Save and deploy** the script.
