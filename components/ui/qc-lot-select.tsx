"use client"

import { useState, useEffect } from "react"
import { Search, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useQCLots, type QCLot } from "@/hooks/use-master-data"

interface QCLotSelectProps {
  value?: string
  onValueChange?: (value: string) => void
  testId?: string
  placeholder?: string
  className?: string
}

export function QCLotSelect({
  value = "",
  onValueChange,
  testId,
  placeholder = "Chọn mã lô QC...",
  className,
}: QCLotSelectProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const { data: allLots, isLoading } = useQCLots()
  
  // Filter lots based on search term and test_id
  const filteredLots = allLots.filter(lot => {
    const matchesTest = !testId || lot.test_id === testId
    const matchesSearch = !searchTerm || 
      lot.lot_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.lot_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return lot.is_active && matchesTest && matchesSearch
  })

  const selectedLot = filteredLots.find(lot => lot.lot_id === value)

  const handleValueChange = (newValue: string) => {
    if (newValue === "clear_selection") {
      onValueChange?.("")
      setSearchTerm("")
    } else {
      onValueChange?.(newValue)
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm theo mã lô, số lô hoặc tên sản phẩm..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-10"
        />
      </div>

      {/* Dropdown Select */}
      <Select value={value} onValueChange={handleValueChange}>
        <SelectTrigger className="h-10">
          <SelectValue placeholder={placeholder}>
            {selectedLot ? (
              <div className="flex items-center gap-2">
                <span className="font-medium">{selectedLot.lot_number}</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                  {selectedLot.level}
                </span>
              </div>
            ) : (
              placeholder
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <SelectItem value="loading" disabled>Đang tải...</SelectItem>
          ) : filteredLots.length === 0 ? (
            <SelectItem value="empty" disabled>
              {searchTerm ? "Không tìm thấy lô QC nào" : "Chưa có dữ liệu lô QC"}
            </SelectItem>
          ) : (
            <>
              {value && (
                <SelectItem value="clear_selection">
                  <span className="text-muted-foreground">-- Xóa lựa chọn --</span>
                </SelectItem>
              )}
              {filteredLots.map((lot) => (
                <SelectItem key={lot.lot_id} value={lot.lot_id}>
                  <div className="flex flex-col gap-1 py-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{lot.lot_number}</span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        {lot.level}
                      </span>
                    </div>
                    {lot.product_name && (
                      <span className="text-sm text-muted-foreground">
                        {lot.product_name}
                      </span>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {lot.manufacturer && (
                        <span>Hãng: {lot.manufacturer}</span>
                      )}
                      <span>HSD: {new Date(lot.expiry_date).toLocaleDateString("vi-VN")}</span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>

      {/* Selected lot info */}
      {selectedLot && (
        <div className="text-xs text-muted-foreground p-2 bg-gray-50 rounded border">
          <div className="flex items-center justify-between">
            <span>ID: {selectedLot.lot_id}</span>
            <span>Test: {selectedLot.test_id}</span>
          </div>
          {selectedLot.manufacturer && (
            <div className="mt-1">Nhà sản xuất: {selectedLot.manufacturer}</div>
          )}
        </div>
      )}
    </div>
  )
}
