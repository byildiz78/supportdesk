"use client";
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="container px-4 mx-auto">
        <div className="max-w-2xl mx-auto text-center">

          <h1 className="mb-4 text-9xl font-bold text-primary">404</h1>
          
          <h2 className="mb-4 text-3xl font-semibold tracking-tight">
            Sayfa Bulunamadı
          </h2>
          
          <p className="mb-8 text-muted-foreground">
            Üzgünüz, aradığınız sayfaya ulaşılamıyor. Sayfa kaldırılmış, adı değiştirilmiş
            veya geçici olarak kullanım dışı olabilir.
          </p>
          
          <div className="flex gap-4 justify-center">
            <Button variant="outline">
              Yardım Merkezi
            </Button>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
    </div>
  )
}
