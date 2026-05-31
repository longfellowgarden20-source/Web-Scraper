'use client'

import { useState } from 'react'
import { MapPin } from 'lucide-react'

export function ServiceAreaMap() {
  const [mapLoaded, setMapLoaded] = useState(false)

  return (
    <div className="h-full w-full">
      {mapLoaded ? (
        <iframe
          title="BrightSpark Electric Service Area — Long Beach, CA"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d53001.70657385697!2d-118.22385!3d33.7900!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80dd31c46b2a3dd5%3A0x9be8ea12f3862ba!2sLong%20Beach%2C%20CA!5e0!3m2!1sen!2sus!4v1715000000000"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-slate-100 p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">Load live service area map</p>
            <p className="text-sm text-slate-600">Tap to load the full map and reduce initial script weight.</p>
          </div>
          <button
            type="button"
            onClick={() => setMapLoaded(true)}
            className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-dark"
          >
            Load map
          </button>
        </div>
      )}
    </div>
  )
}
