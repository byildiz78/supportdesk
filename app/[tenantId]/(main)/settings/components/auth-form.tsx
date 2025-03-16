import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Lock, KeyRound, EyeOff, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AuthFormProps {
  onAuthenticate: (password: string) => void;
  error?: string;
}

export function AuthForm({ onAuthenticate, error }: AuthFormProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto focus password input when component mounts
    passwordInputRef.current?.focus();
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAuthenticate(password);
    // Eğer hata varsa, şifreyi temizle
    if (error) {
      setPassword("");
    }
  };

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Logo */}
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-primary to-purple-600 rounded-full opacity-70 blur-md" />
        <div className="relative flex items-center justify-center w-20 h-20 bg-gradient-to-br from-background to-background/80 rounded-full border border-primary/20 shadow-xl backdrop-blur-sm">
          <KeyRound className="w-10 h-10 text-primary" />
        </div>
      </div>

      {/* Title */}
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-500 via-primary to-purple-500 bg-clip-text text-transparent">
          Yönetici Paneli
        </h2>
        <div className="h-1 w-24 mx-auto bg-gradient-to-r from-blue-500 via-primary to-purple-500 rounded-full" />
        <p className="text-sm text-muted-foreground mt-2">
          Lütfen erişim kodunu girin
        </p>
      </div>

      <form onSubmit={handlePasswordSubmit} className="w-full space-y-6">
        <input 
          type="text" 
          autoComplete="username" 
          defaultValue="admin" 
          tabIndex={-1}
          aria-hidden="true"
          style={{ display: 'none' }}
          readOnly
        />
        
        {/* Password input with toggle */}
        <div className="relative">
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 via-primary/20 to-purple-500/20 rounded-xl blur-sm group-hover:blur group-focus-within:blur" />
            <div className="relative flex items-center bg-card border border-input/10 rounded-lg overflow-hidden shadow-sm">
              <Input
                ref={passwordInputRef}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-0 bg-transparent text-center text-xl tracking-[0.5em] py-7 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/40"
                maxLength={4}
                placeholder="••••"
                autoComplete="current-password"
                spellCheck={false}
                aria-label="Şifre"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-muted-foreground/60 hover:text-primary focus:outline-none"
                aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm py-3 px-4 rounded-lg flex items-center gap-2">
            <Lock size={14} className="text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit button */}
        <Button
          type="submit"
          className="w-full py-6 bg-gradient-to-r from-blue-600 via-primary to-purple-600 hover:from-blue-700 hover:via-primary/90 hover:to-purple-700 text-white font-medium shadow-lg transition-all duration-300"
        >
          <span className="flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" />
            <span>Giriş Yap</span>
          </span>
        </Button>
      </form>
    </div>
  );
}
