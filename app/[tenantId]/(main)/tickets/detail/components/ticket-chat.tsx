"use client"

import axios from '@/lib/axios'
import React, { useEffect, useState } from 'react'
import { FaWhatsapp } from 'react-icons/fa'

export default function TicketChat({mobil}: {mobil?:string}) {
  const [formattedPhone, setFormattedPhone] = useState('')
  const [accessToken, setAccessToken] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

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

  useEffect(() => {
    const getAccessToken = async () => {
      try {
        setIsLoading(true)
        const response = await axios.get('/api/whatsapp-token')
        setAccessToken(response.data.accessToken)
      } catch (error) {
        console.error('Error fetching access token:', error)
      } finally {
        setIsLoading(false)
      }
    }

    getAccessToken()
  }, [])

  // WhatsApp iframe URL'sini oluştur
  const getWhatsAppUrl = () => {
    if (accessToken && formattedPhone) {
      // Token ile birlikte doğrudan sohbet URL'si
      return `https://new.dialogs.pro/dialogs/52504/grWhatsApp/${formattedPhone}@c.us?api[access_token]=${accessToken}`
    }
    return ''
  }

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex items-center p-4 bg-white dark:bg-gray-800 border-b">
        <FaWhatsapp className="text-green-500 h-6 w-6 mr-2" />
        <h1 className="text-2xl font-bold">WhatsApp Arayüzü</h1>
      </div>

      <div className="flex-1 w-full">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : formattedPhone && accessToken ? (
          <iframe
            id="webchat"
            src={getWhatsAppUrl()}
            sandbox="allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts allow-top-navigation allow-top-navigation-by-user-activation"
            allow="camera https://dialogs.pro/; microphone https://dialogs.pro/; clipboard-read https://dialogs.pro/; clipboard-write https://dialogs.pro/"
            width="100%"
            height="99%"
            className="border-0"
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