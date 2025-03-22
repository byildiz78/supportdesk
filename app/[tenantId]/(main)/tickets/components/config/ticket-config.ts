import { Mail, Phone, Globe, MessageCircle } from "lucide-react"

export const statusConfig = {
    open: { label: "Açık", class: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800" },
    in_progress: { label: "İşlemde", class: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800" },
    waiting: { label: "Beklemede", class: "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 border-purple-200 dark:border-purple-800" },
    pending: { label: "Beklemede", class: "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 border-purple-200 dark:border-purple-800" },
    resolved: { label: "Çözüldü", class: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800" },
    closed: { label: "Kapalı", class: "bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-800" }
}

export const priorityConfig = {
    low: { label: "Düşük", class: "bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-800" },
    medium: { label: "Orta", class: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800" },
    high: { label: "Yüksek", class: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800" },
    urgent: { label: "Acil", class: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800" }
}

export const sourceConfig = {
    email: { icon: Mail, label: "E-posta" },
    phone: { icon: Phone, label: "Telefon" },
    web: { icon: Globe, label: "Web" },
    chat: { icon: MessageCircle, label: "Chat" }
}

export const calculateElapsedTime = (createdAt: string) => {
    const created = new Date(createdAt)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
        return `${diffInMinutes} dk`
    } else if (diffInMinutes < 1440) {
        const hours = Math.floor(diffInMinutes / 60)
        return `${hours} saat`
    } else {
        const days = Math.floor(diffInMinutes / 1440)
        return `${days} gün`
    }
}

export const calculateSlaTime = (dueDate: string, slaBreach: boolean) => {
    const due = new Date(dueDate)
    const now = new Date()
    
    // Calculate the difference in minutes
    const diffInMinutes = Math.floor((due.getTime() - now.getTime()) / (1000 * 60))
    const absDiffInMinutes = Math.abs(diffInMinutes)
    
    let timeText = ""
    
    if (absDiffInMinutes < 60) {
        timeText = `${absDiffInMinutes} dk`
    } else if (absDiffInMinutes < 1440) {
        const hours = Math.floor(absDiffInMinutes / 60)
        timeText = `${hours} saat`
    } else {
        const days = Math.floor(absDiffInMinutes / 1440)
        timeText = `${days} gün`
    }
    
    // If SLA is breached, show exceeded time, otherwise show remaining time
    return slaBreach ? `Aşıldı ${timeText}` : `İçinde ${timeText}`
}
