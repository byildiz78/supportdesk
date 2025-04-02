"use client"

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { FaWhatsapp } from 'react-icons/fa'

export default function WhatsAppPage() {
  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex items-center p-4 bg-white dark:bg-gray-800 border-b">
        <FaWhatsapp className="text-green-500 h-6 w-6 mr-2" />
        <h1 className="text-2xl font-bold">WhatsApp Arayüzü</h1>
      </div>

      <div className="flex-1 w-full">
        <iframe
          src="/whatsapp/"
          className="w-full h-full border-0"
          title="WhatsApp Interface"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          loading="lazy"
        />
      </div>
    </div>
  )
}