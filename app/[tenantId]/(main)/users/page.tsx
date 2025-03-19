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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { useUserStore } from "@/stores/user-store"
import { UserHeader } from "../components/UserHeader"
import { UserFilters } from "../components/UserFilters"
import { UserPagination } from "../components/UserPagination"
import { UserForm } from "../components/UserForm"
import { PlusCircle, Edit, Trash2, User, Mail, Clock, Loader2, AlertTriangle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserService } from "./services/user-service"
import { useToast } from "@/hooks/use-toast"

export default function UserSettingsPage() {
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [isAddUserOpen, setIsAddUserOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [userToDelete, setUserToDelete] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const itemsPerPage = 10

    const { users, setUsers, isLoading, setIsLoading, addUser, updateUser, deleteUser, setError } = useUserStore()
    const { toast } = useToast()

    // Load users from database
    useEffect(() => {
        const fetchUsers = async () => {
            setIsLoading(true)
            try {
                const usersData = await UserService.getUsers()
                setUsers(usersData)
            } catch (error: any) {
                console.error('Kullanıcılar alınırken hata oluştu:', error)
                setError(error.message)
                toast({
                    title: "Hata",
                    description: "Kullanıcılar alınırken bir hata oluştu",
                    variant: "destructive",
                })
            } finally {
                setIsLoading(false)
            }
        }

        fetchUsers()
    }, [setUsers, setIsLoading, setError, toast])

    // Filter users based on search term
    const filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Calculate pagination
    const totalUsers = filteredUsers.length
    const totalPages = Math.ceil(totalUsers / itemsPerPage)
    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const handleAddUser = async (userData: any) => {
        setIsSubmitting(true)
        try {
            // API üzerinden kullanıcı oluştur
            const newUser = await UserService.createUpdateUser({
                ...userData,
                created_by: "current-user", // Gerçek uygulamada mevcut kullanıcı ID'si ile değiştirilecek
            }, false)
            
            // Store'a ekle
            addUser(newUser)
            setIsAddUserOpen(false)
            
            toast({
                title: "Başarılı",
                description: "Kullanıcı başarıyla eklendi",
                variant: "default",
            })
        } catch (error: any) {
            console.error('Kullanıcı eklenirken hata oluştu:', error)
            toast({
                title: "Hata",
                description: error.message || "Kullanıcı eklenirken bir hata oluştu",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleUpdateUser = async (userData: any) => {
        setIsSubmitting(true)
        try {
            // API üzerinden kullanıcı güncelle
            const updatedUser = await UserService.createUpdateUser({
                ...userData,
                updated_by: "current-user", // Gerçek uygulamada mevcut kullanıcı ID'si ile değiştirilecek
            }, true)
            
            // Store'u güncelle
            updateUser(updatedUser)
            setEditingUser(null)
            
            toast({
                title: "Başarılı",
                description: "Kullanıcı başarıyla güncellendi",
                variant: "default",
            })
        } catch (error: any) {
            console.error('Kullanıcı güncellenirken hata oluştu:', error)
            toast({
                title: "Hata",
                description: error.message || "Kullanıcı güncellenirken bir hata oluştu",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const confirmDeleteUser = async () => {
        if (!userToDelete) return;
        
        setIsDeleting(true);
        try {
            // API üzerinden kullanıcı sil
            await UserService.deleteUser(userToDelete);
            
            // Store'dan sil
            deleteUser(userToDelete);
            
            toast({
                title: "Başarılı",
                description: "Kullanıcı başarıyla silindi",
                variant: "default",
            });
            
            // Diyaloğu kapat
            setUserToDelete(null);
        } catch (error: any) {
            console.error('Kullanıcı silinirken hata oluştu:', error);
            toast({
                title: "Hata",
                description: error.message || "Kullanıcı silinirken bir hata oluştu",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }

    // Kullanıcı adını bul
    const getUserName = (userId: string) => {
        const user = users.find(u => u.id === userId);
        return user ? user.name : "Kullanıcı";
    };

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

            {/* Silme Onay Diyaloğu */}
            <Dialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Kullanıcı Silme Onayı
                        </DialogTitle>
                        <DialogDescription className="pt-2">
                            <strong>{userToDelete ? getUserName(userToDelete) : ""}</strong> adlı kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button 
                            variant="outline" 
                            onClick={() => setUserToDelete(null)}
                        >
                            İptal
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={confirmDeleteUser}
                            disabled={isDeleting}
                            className="gap-2"
                        >
                            {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                            {isDeleting ? "Siliniyor..." : "Evet, Sil"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
                                    <TableHead>Son Giriş</TableHead>
                                    <TableHead>İşlemler</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-10">
                                            <div className="flex justify-center items-center">
                                                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : paginatedUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-10">
                                            Kullanıcı bulunamadı
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedUsers.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.id.substring(0, 8)}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Avatar>
                                                        <AvatarImage src={user.profileImageUrl || ""} />
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
                                                <Badge className={
                                                    user.role === "admin" ? "bg-red-500" : 
                                                    user.role === "manager" ? "bg-amber-500" : "bg-blue-500"
                                                }>
                                                    {user.role === "admin" ? "Yönetici" : 
                                                     user.role === "manager" ? "Müdür" : "Destek Ekibi"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{user.department || "-"}</TableCell>
                                            <TableCell>
                                                <Badge className={user.status === "active" ? "bg-green-500" : "bg-gray-500"}>
                                                    {user.status === "active" ? "Aktif" : "Pasif"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-4 w-4 text-gray-500" />
                                                    {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "-"}
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
                                                        onClick={() => setUserToDelete(user.id)}
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
