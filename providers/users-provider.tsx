"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import axios from '@/lib/axios'

// Kullanıcı tipi tanımı
export interface User {
    id: string
    name: string
    // Diğer kullanıcı alanları burada tanımlanabilir
}

// Context için tip tanımı
interface UsersContextType {
    users: User[]
    isLoading: boolean
    error: string | null
    refetchUsers: () => Promise<void>
}

// Varsayılan context değerleri
const defaultContextValue: UsersContextType = {
    users: [],
    isLoading: false,
    error: null,
    refetchUsers: async () => {}
}

// Context oluşturma
const UsersContext = createContext<UsersContextType>(defaultContextValue)

// Provider props tipi
interface UsersProviderProps {
    children: ReactNode
}

export function UsersProvider({ children }: UsersProviderProps) {
    const [users, setUsers] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Kullanıcıları getiren fonksiyon
    const fetchUsers = async () => {
        try {
            setIsLoading(true)
            setError(null)
            
            const response = await axios.get('/api/main/users/getUsers')
            console.log('Users API response:', response.data)
            
            if (response.data) {
                // Farklı yanıt formatlarını işleme
                const userData = Array.isArray(response.data) 
                    ? response.data 
                    : (response.data.data && Array.isArray(response.data.data)) 
                        ? response.data.data 
                        : []
                
                setUsers(userData)
            } else {
                console.error('Invalid users data format:', response.data)
                setError('Geçersiz kullanıcı veri formatı')
                setUsers([])
            }
        } catch (error) {
            console.error('Error fetching users:', error)
            setError('Kullanıcılar yüklenirken bir hata oluştu')
            setUsers([])
        } finally {
            setIsLoading(false)
        }
    }

    // İlk yüklemede kullanıcıları getir
    useEffect(() => {
        fetchUsers()
    }, [])

    // Context değerini oluştur
    const value = {
        users,
        isLoading,
        error,
        refetchUsers: fetchUsers
    }

    return (
        <UsersContext.Provider value={value}>
            {children}
        </UsersContext.Provider>
    )
}

// Custom hook ile kolay erişim sağlama
export function useUsers() {
    const context = useContext(UsersContext)
    
    if (context === undefined) {
        throw new Error('useUsers hook must be used within a UsersProvider')
    }
    
    return context
}