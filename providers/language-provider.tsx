"use client"

import { createContext, useContext, useEffect, useState } from "react"

type Language = "tr" | "en" | "ar" | "az" | "ru"

type Direction = "ltr" | "rtl"

type LanguageProviderProps = {
  children: React.ReactNode
  defaultLanguage?: Language
  storageKey?: string
}

type LanguageContextType = {
  language: Language
  direction: Direction
  setLanguage: (language: Language) => void
}

const LanguageContext = createContext<LanguageContextType>({
  language: "tr",
  direction: "ltr",
  setLanguage: () => null,
})

export function LanguageProvider({
  children,
  defaultLanguage = "tr",
  storageKey = "language",
}: LanguageProviderProps) {
  const [language, setLanguage] = useState<Language>(defaultLanguage)

  // localStorage kontrolü client-side'da yapılıyor
  useEffect(() => {
    const savedLanguage = localStorage.getItem(storageKey) as Language
    if (savedLanguage) {
      setLanguage(savedLanguage)
    }
  }, [storageKey])

  const direction = language === "ar" ? "rtl" : "ltr"

  useEffect(() => {
    const root = window.document.documentElement
    root.setAttribute("dir", direction)
    localStorage.setItem(storageKey, language)
  }, [language, direction, storageKey])

  return (
    <LanguageContext.Provider
      value={{
        language,
        direction,
        setLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)

  if (context === undefined)
    throw new Error("useLanguage must be used within a LanguageProvider")

  return context
}
