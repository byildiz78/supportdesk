"use client"

import { Button } from '@/components/ui/button'
import axios from '@/lib/axios'
import { Menu } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { FaWhatsapp } from 'react-icons/fa'
import { MobileMenu } from '../components/MobileNavigation/MobileMenu'

export default function WhatsAppPage() {
    const [accessToken, setAccessToken] = useState<string>('')
  const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const getAccessToken = async () => {
            try {
                const response = await axios.get('/api/whatsapp-token')
                setAccessToken(response.data.accessToken)
            } catch (error) {
                console.error('Error fetching access token:', error)
            }
        }

        getAccessToken()
    }, [])

    return (
        <div className="h-full w-full flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 z-10 bg-white">
                <div className="flex items-center gap-2">
                    <img
                        src={`${process.env.NEXT_PUBLIC_BASEPATH || ''}/images/Audit.png`}
                        alt="Logo"
                        className="h-8 w-8"
                    />
                    <span className="font-semibold">robotPOS Support</span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMenuOpen(true)}
                    className="rounded-full"
                >
                    <Menu className="h-5 w-5" />
                </Button>
            </div>

            <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
            <div className="flex items-center p-4 bg-white dark:bg-gray-800 border-b">
                <FaWhatsapp className="text-green-500 h-6 w-6 mr-2" />
                <h1 className="text-2xl font-bold">WhatsApp Arayüzü</h1>
            </div>

            <div className="flex-1 w-full">
                {accessToken && (
                    <iframe
                        id="webchat"
                        src={`https://new.dialogs.pro/?api[access_token]=${accessToken}&api[license_id]=52504`}
                        sandbox="allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts allow-top-navigation allow-top-navigation-by-user-activation"
                        allow="camera https://dialogs.pro/; microphone https://dialogs.pro/; clipboard-read https://dialogs.pro/; clipboard-write https://dialogs.pro/"
                        width="100%"
                        height="99%"
                        className="border-0"
                    />
                )}
            </div>
        </div>
    )
}