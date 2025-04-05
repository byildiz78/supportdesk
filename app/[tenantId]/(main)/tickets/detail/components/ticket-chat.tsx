"use client"

import React, { useEffect, useState } from 'react'
import { FaWhatsapp } from 'react-icons/fa'

export default function TicketChat({mobil}: {mobil?:string}) {
  const [formattedPhone, setFormattedPhone] = useState('')

  useEffect(() => {
    // Telefon numarası undefined ise işlem yapma
    if (!mobil) return;
    
    // Telefon numarasını formatla: + işaretini kaldır ve 90 ile başladığından emin ol
    let phone = mobil.replace(/\+/g, '')
    // Eğer 90 ile başlamıyorsa ekle
    if (!phone.startsWith('90')) {
      phone = '90' + phone
    }
    setFormattedPhone(phone)
  }, [mobil])

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex items-center p-4 bg-white dark:bg-gray-800 border-b">
        <FaWhatsapp className="text-green-500 h-6 w-6 mr-2" />
        <h1 className="text-2xl font-bold">WhatsApp Arayüzü</h1>
      </div>

      <div className="flex-1 w-full">
        {formattedPhone ? (
          <iframe 
            src={`/whatsapp/chat/${formattedPhone}`} 
            className="w-full h-full border-0" 
            title="WhatsApp Interface"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <FaWhatsapp className="text-green-500 h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Telefon numarası bulunamadı</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                WhatsApp sohbeti başlatmak için geçerli bir telefon numarası gereklidir.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}