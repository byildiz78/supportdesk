"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useUserStore } from "@/stores/user-store"
import { mockUsers } from "../data/mock-users"
import { UserHeader } from "../components/UserHeader"
import { UserFilters } from "../components/UserFilters"
import { UserPagination } from "../components/UserPagination"
import { UserForm } from "../components/UserForm"
import { PlusCircle, Edit, Trash2, User, Mail, Clock } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function UserSettingsPage() {
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [isAddUserOpen, setIsAddUserOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<string | null>(null)
    const itemsPerPage = 10

    const { users, setUsers, isLoading, addUser, updateUser, deleteUser } = useUserStore()

    // Load mock data
    useEffect(() => {
        setUsers(mockUsers)
    }, [setUsers])

    // Filter users based on search term
    const filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.flowID?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Calculate pagination
    const totalUsers = filteredUsers.length
    const totalPages = Math.ceil(totalUsers / itemsPerPage)
    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const handleAddUser = (userData: any) => {
        const newUser = {
            ...userData,
            id: `USER-${String(users.length + 1).padStart(3, '0')}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: "current-user", // Would be replaced with actual user ID in real implementation
            updatedBy: "current-user", // Would be replaced with actual user ID in real implementation
            lastLogin: "-",
            isDeleted: false
        }
        addUser(newUser)
        setIsAddUserOpen(false)
    }

    const handleUpdateUser = (userData: any) => {
        const updatedUser = {
            ...userData,
            updatedAt: new Date().toISOString(),
            updatedBy: "current-user" // Would be replaced with actual user ID in real implementation
        }
        updateUser(updatedUser)
        setEditingUser(null)
    }

    const handleDeleteUser = (userId: string) => {
        if (window.confirm("Bu kullanıcıyı silmek istediğinizden emin misiniz?")) {
            deleteUser(userId)
        }
    }

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-2 pt-2 h-[calc(85vh-4rem)] flex flex-col">
            <UserHeader />
            
            <div className="flex justify-between items-center">
                <UserFilters 
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                />
                
                <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                    <DialogTrigger asChild>
                        <Button className="flex items-center gap-2">
                            <PlusCircle className="h-4 w-4" />
                            Yeni Kullanıcı
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Yeni Kullanıcı Ekle</DialogTitle>
                        </DialogHeader>
                        <UserForm onSubmit={handleAddUser} />
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-0 shadow-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm flex-1 overflow-hidden rounded-xl">
                <div className="rounded-xl border border-gray-100 dark:border-gray-800 h-full flex flex-col">
                    <div className="overflow-x-auto flex-1">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Kullanıcı</TableHead>
                                    <TableHead>E-posta</TableHead>
                                    <TableHead>Rol</TableHead>
                                    <TableHead>Departman</TableHead>
                                    <TableHead>Durum</TableHead>
                                    <TableHead>Flow ID</TableHead>
                                    <TableHead>Son Giriş</TableHead>
                                    <TableHead>İşlemler</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center py-10">
                                            Yükleniyor...
                                        </TableCell>
                                    </TableRow>
                                ) : paginatedUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center py-10">
                                            Kullanıcı bulunamadı
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedUsers.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.id}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Avatar>
                                                        <AvatarImage src={user.profileImageUrl} />
                                                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                                    </Avatar>
                                                    <span>{user.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Mail className="h-4 w-4 text-gray-500" />
                                                    {user.email}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={
                                                    user.role === "admin" ? "destructive" : 
                                                    user.role === "manager" ? "warning" : "default"
                                                }>
                                                    {user.role === "admin" ? "Yönetici" : 
                                                     user.role === "manager" ? "Müdür" : "Destek Ekibi"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{user.department || "-"}</TableCell>
                                            <TableCell>
                                                <Badge variant={user.status === "active" ? "success" : "secondary"}>
                                                    {user.status === "active" ? "Aktif" : "Pasif"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{user.flowID || "-"}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-4 w-4 text-gray-500" />
                                                    {user.lastLogin !== "-" ? new Date(user.lastLogin).toLocaleString() : "-"}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Dialog open={editingUser === user.id} onOpenChange={(open) => {
                                                        if (!open) setEditingUser(null)
                                                        else setEditingUser(user.id)
                                                    }}>
                                                        <DialogTrigger asChild>
                                                            <Button variant="outline" size="icon">
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="sm:max-w-[500px]">
                                                            <DialogHeader>
                                                                <DialogTitle>Kullanıcı Düzenle</DialogTitle>
                                                            </DialogHeader>
                                                            <UserForm user={user} onSubmit={handleUpdateUser} />
                                                        </DialogContent>
                                                    </Dialog>
                                                    
                                                    <Button 
                                                        variant="destructive" 
                                                        size="icon"
                                                        onClick={() => handleDeleteUser(user.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    
                    <UserPagination 
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalUsers={totalUsers}
                        setCurrentPage={setCurrentPage}
                    />
                </div>
            </Card>
        </div>
    )
}
