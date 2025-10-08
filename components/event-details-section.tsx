"use client"

import React from "react"
import { useTask } from "@/contexts/TaskContextWithSupabase"

export function EventDetailsSection() {
  const { projectSettings, updateProjectSettings } = useTask()

  return (
    <div className="card-beautiful p-8">
      <div className="flex items-center gap-3 mb-6">
        <svg className="section-icon text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h2 className="header-section mb-0">📅 Event Details</h2>
      </div>

      <p className="text-lg text-gray-700 mb-8">
        Add event details that will be displayed to contributors. This helps them know when and where the event is taking place.
      </p>

      <div className="space-y-6">
        {/* Event Location */}
        <div>
          <label htmlFor="event-location" className="block text-lg font-semibold text-gray-900 mb-3">
            📍 Event Location
          </label>
          <input
            id="event-location"
            type="text"
            value={projectSettings.eventLocation || ""}
            onChange={(e) => updateProjectSettings({ eventLocation: e.target.value || undefined })}
            placeholder="e.g., Community Center, 123 Main St"
            maxLength={100}
            className="form-input text-base"
          />
          <p className="text-sm text-gray-600 mt-1">
            {(projectSettings.eventLocation || "").length}/100 characters
          </p>
        </div>

        {/* Event Time */}
        <div>
          <label htmlFor="event-time" className="block text-lg font-semibold text-gray-900 mb-3">
            ⏰ Event Time
          </label>
          <input
            id="event-time"
            type="text"
            value={projectSettings.eventTime || ""}
            onChange={(e) => updateProjectSettings({ eventTime: e.target.value || undefined })}
            placeholder="e.g., Saturday, March 15th at 2:00 PM"
            maxLength={100}
            className="form-input text-base"
          />
          <p className="text-sm text-gray-600 mt-1">
            {(projectSettings.eventTime || "").length}/100 characters
          </p>
        </div>

        {/* Additional Details */}
        <div>
          <label htmlFor="event-attire" className="block text-lg font-semibold text-gray-900 mb-3">
            📝 Additional Details
          </label>
          <input
            id="event-attire"
            type="text"
            value={projectSettings.eventAttire || ""}
            onChange={(e) => updateProjectSettings({ eventAttire: e.target.value || undefined })}
            placeholder="e.g., Casual dress, Bring a dish to share"
            maxLength={100}
            className="form-input text-base"
          />
          <p className="text-sm text-gray-600 mt-1">
            {(projectSettings.eventAttire || "").length}/100 characters
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Use this for dress code, special instructions, or other important details
          </p>
        </div>
      </div>
    </div>
  )
}
