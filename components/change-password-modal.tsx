"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import axios from "@/lib/axios"
import { usePathname, useRouter } from "next/navigation"
import { useFilterStore } from "@/stores/filters-store"
import { getUserId } from "@/utils/user-utils"

interface ChangePasswordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChangePasswordModal({ open, onOpenChange }: ChangePasswordModalProps) {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const { setToDefaultFilters } = useFilterStore();
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const pathname = usePathname()
  const router = useRouter()
  
  // Modal kapandığında state'leri sıfırla
  useEffect(() => {
    if (!open) {
      setPassword("")
      setConfirmPassword("")
      setError(null)
      setSuccess(false)
      setShowPassword(false)
      setShowConfirmPassword(false)
    }
  }, [open])
  
  const handleLogout = () => {
    const tenantId = pathname?.split('/')[1] || '';
    
    // Kullanıcı verilerini temizle
    localStorage.removeItem(`userData_${tenantId}`);
    
    // Filtre ve şube seçimlerini sıfırla
    // Önce store'daki şube listesini temizleyelim ki, setToDefaultFilters çalıştığında
    // önceki kullanıcının şubeleri seçili kalmasın
    useFilterStore.getState().setBranchs([]);
    // Sonra filtreleri sıfırlayalım
    setToDefaultFilters();
    
    // Ek olarak, diğer store'lardaki verileri de temizlemek için localStorage'dan ilgili verileri silebiliriz
    // Örneğin, filtre ve şube seçimleri ile ilgili localStorage verileri
    localStorage.removeItem(`filter_${tenantId}`);
    localStorage.removeItem(`selectedBranches_${tenantId}`);
    localStorage.removeItem(`branches_${tenantId}`);
    
    // Tüm filtre ve ayarlarla ilgili localStorage verilerini temizlemek için
    Object.keys(localStorage).forEach(key => {
        if (key.includes(tenantId) && (key.includes('filter') || key.includes('branch') || key.includes('setting'))) {
            localStorage.removeItem(key);
        }
    });
    
    axios.get('/api/auth/logout').then(()=>{
        router.push(`/${tenantId}/login`);

    }).catch(() => {});
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Reset states
    setError(null)
    setSuccess(false)
    
    // Validate passwords
    if (!password) {
      setError("Lütfen yeni şifrenizi girin")
      return
    }
    
    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır")
      return
    }
    
    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor")
      return
    }
    
    setLoading(true)
    
    try {
      const userId = getUserId();
      const response = await axios.post('/api/main/users/changePassword', {
        id: userId,
        password: password,
        updated_by: userId
      })
      
      if (response.data.success) {
        setSuccess(true)
        setPassword("")
        setConfirmPassword("")
        
        // 2 saniye sonra modalı kapat ve çıkış yap
        setTimeout(() => {
          onOpenChange(false)
          setSuccess(false)
          handleLogout()
        }, 2000)
      } else {
        setError(response.data.message || "Şifre değiştirme işlemi başarısız oldu")
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Bir hata oluştu. Lütfen tekrar deneyin.")
    } finally {
      setLoading(false)
    }
  }

  const toggleShowPassword = () => setShowPassword(prev => !prev)
  const toggleShowConfirmPassword = () => setShowConfirmPassword(prev => !prev)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Şifre Değiştir</DialogTitle>
          <DialogDescription>
            Hesabınız için yeni bir şifre belirleyin. Şifreniz değiştikten sonra otomatik olarak çıkış yapılacaktır.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <AlertDescription>Şifreniz başarıyla değiştirildi! Çıkış yapılıyor...</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="password">Yeni Şifre</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Yeni şifrenizi girin"
                disabled={loading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={toggleShowPassword}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-500" />
                )}
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Şifre Tekrar</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Şifrenizi tekrar girin"
                disabled={loading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={toggleShowConfirmPassword}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-500" />
                )}
              </button>
            </div>
          </div>
          
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Değiştiriliyor...
                </>
              ) : (
                "Şifreyi Değiştir"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
