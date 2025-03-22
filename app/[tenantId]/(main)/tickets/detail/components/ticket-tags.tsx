"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tag, Loader2, Plus } from "lucide-react"
import axios from "@/lib/axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { TicketService } from "../services/ticket-service"
import { Tag as TagType } from "../types"

interface TicketTagsProps {
  ticketId: string
  onTagsUpdate?: () => void
}

export function TicketTags({ ticketId, onTagsUpdate }: TicketTagsProps) {
  const [tags, setTags] = useState<TagType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newTag, setNewTag] = useState("")
  const [isAddingTag, setIsAddingTag] = useState(false)
  const { toast } = useToast()

  const fetchTags = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const fetchedTags = await TicketService.getTicketTags(ticketId)
      setTags(fetchedTags)
    } catch (error: any) {
      console.error("Etiketler alınırken hata oluştu:", error)
      setError(error.message || "Etiketler alınamadı")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (ticketId) {
      fetchTags()
    }
  }, [ticketId])

  const handleAddTag = async () => {
    if (!newTag.trim()) return
    
    setIsAddingTag(true)
    try {
      const response = await TicketService.updateTicket({
        id: ticketId,
        tags: [...tags.map(tag => tag.name), newTag.trim()]
      })
      
      toast({
        title: "Başarılı",
        description: "Etiket başarıyla eklendi",
        variant: "default",
      })
      setNewTag("")
      fetchTags()
      if (onTagsUpdate) {
        onTagsUpdate()
      }
    } catch (error: any) {
      console.error("Etiket eklenirken hata oluştu:", error)
      toast({
        title: "Hata",
        description: error.message || "Etiket eklenirken bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setIsAddingTag(false)
    }
  }

  const handleRemoveTag = async (tagToRemove: TagType) => {
    try {
      const updatedTags = tags.filter(tag => tag.id !== tagToRemove.id)
      
      const response = await TicketService.updateTicket({
        id: ticketId,
        tags: updatedTags.map(tag => tag.name)
      })
      
      toast({
        title: "Başarılı",
        description: "Etiket başarıyla kaldırıldı",
        variant: "default",
      })
      fetchTags()
      if (onTagsUpdate) {
        onTagsUpdate()
      }
    } catch (error: any) {
      console.error("Etiket kaldırılırken hata oluştu:", error)
      toast({
        title: "Hata",
        description: error.message || "Etiket kaldırılırken bir hata oluştu",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold flex items-center">
          <Tag className="h-4 w-4 mr-2 text-blue-600" />
          Etiketler
        </h3>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <div className="text-center py-2 text-sm text-red-500">{error}</div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.length > 0 ? (
              tags.map((tag) => (
                <Badge 
                  key={tag.id} 
                  variant="secondary"
                  className="px-2 py-1 flex items-center gap-1 group"
                >
                  <span>{tag.name}</span>
                  <button 
                    onClick={() => handleRemoveTag(tag)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 hover:text-red-500"
                  >
                    &times;
                  </button>
                </Badge>
              ))
            ) : (
              <div className="text-sm text-gray-500 py-1">Henüz etiket eklenmemiş</div>
            )}
          </div>
          
          <div className="flex items-center gap-2 mt-3">
            <Input
              placeholder="Yeni etiket ekle"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              className="text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddTag()
                }
              }}
            />
            <Button 
              size="sm" 
              onClick={handleAddTag}
              disabled={isAddingTag || !newTag.trim()}
              className="flex items-center"
            >
              {isAddingTag ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Plus className="h-4 w-4 mr-1" />
              )}
              Ekle
            </Button>
          </div>
        </>
      )}
    </Card>
  )
}
