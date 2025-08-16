"use client"

import { useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Button } from "@/components/ui/button"
import { QCPoint } from "@/lib/google-sheets"
import { format } from "date-fns"

const DOTS = "..."

const usePagination = ({ total, limit, siblingCount = 1, page }) => {
  const paginationRange = useMemo(() => {
    const totalPageCount = Math.ceil(total / limit)

    // Pages count is determined as siblingCount + firstPage + lastPage + page + 2*DOTS
    const totalPageNumbers = siblingCount + 5

    /*
      Case 1: If the number of pages is less than the page numbers we want to show in our
      paginationComponent, we return the range [1..totalPageCount]
    */
    if (totalPageNumbers >= totalPageCount) {
      return Array.from({ length: totalPageCount }, (_, i) => i + 1)
    }

    const leftSiblingIndex = Math.max(page - siblingCount, 1)
    const rightSiblingIndex = Math.min(page + siblingCount, totalPageCount)

    const shouldShowLeftDots = leftSiblingIndex > 2
    const shouldShowRightDots = rightSiblingIndex < totalPageCount - 2

    const firstPageIndex = 1
    const lastPageIndex = totalPageCount

    if (!shouldShowLeftDots && shouldShowRightDots) {
      let leftItemCount = 3 + 2 * siblingCount
      let leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1)

      return [...leftRange, DOTS, totalPageCount]
    } else if (shouldShowLeftDots && !shouldShowRightDots) {
      let rightItemCount = 3 + 2 * siblingCount
      let rightRange = Array.from({ length: rightItemCount }, (_, i) => totalPageCount - rightItemCount + i + 1)
      return [firstPageIndex, DOTS, ...rightRange]
    } else {
      let middleRange = Array.from({ length: rightSiblingIndex - leftSiblingIndex + 1 }, (_, i) => leftSiblingIndex + i)
      return [firstPageIndex, DOTS, ...middleRange, DOTS, lastPageIndex]
    }
  }, [total, limit, siblingCount, page])

  return paginationRange
}

interface QCDataTableProps {
  data: QCPoint[]
  page: number
  limit: number
  total: number
  onPageChange: (page: number) => void
}

export function QCDataTable({ data, page, limit, total, onPageChange }: QCDataTableProps) {
  const pageCount = Math.ceil(total / limit)
  const paginationRange = usePagination({ total, limit, page })

  const handlePrevious = () => {
    if (page > 1) {
      onPageChange(page - 1)
    }
  }

  const handleNext = () => {
    if (page < pageCount) {
      onPageChange(page + 1)
    }
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <Table className="w-full text-sm">
          <TableHeader>
            <TableRow>
              <TableHead>Point</TableHead>
              <TableHead>Date/Time</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Z-Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Run ID</TableHead>
              <TableHead>Violations</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((point, index) => {
              let formattedTimestamp = "Invalid Date"
              try {
                if (point.timestamp) {
                  const date = new Date(point.timestamp)
                  if (!isNaN(date.getTime())) {
                    formattedTimestamp = format(date, "dd/MM/yyyy HH:mm")
                  }
                }
              } catch (error) {
                console.warn("Invalid timestamp format:", point.timestamp, error)
              }

              const safeValue = typeof point.value === "number" ? point.value : parseFloat(point.value) || 0
              const safeZ = typeof point.z === "number" ? point.z : parseFloat(point.z) || 0

              return (
                <TableRow key={point.id || `qc-point-${index}`}>
                  <TableCell>{(page - 1) * limit + index + 1}</TableCell>
                  <TableCell>{formattedTimestamp}</TableCell>
                  <TableCell className="font-mono">{safeValue.toFixed(3)}</TableCell>
                  <TableCell className="font-mono">
                    <span className={Math.abs(safeZ) >= 2 ? "text-red-600" : "text-green-600"}>
                      {safeZ.toFixed(3)}
                    </span>
                  </TableCell>
                  <TableCell>{point.status}</TableCell>
                  <TableCell>{point.run_id}</TableCell>
                  <TableCell>{Array.isArray(point.violations) ? point.violations.join("; ") : ""}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground whitespace-nowrap">
          Hiển thị từ {(page - 1) * limit + 1} đến {Math.min(page * limit, total)} của {total} mục
        </div>
        <Pagination className="justify-end">
          <PaginationContent>
            <PaginationItem>
              <Button variant="ghost" size="sm" onClick={() => onPageChange(1)} disabled={page === 1}>
                Đầu
              </Button>
            </PaginationItem>
            <PaginationItem>
              <PaginationPrevious href="#" onClick={handlePrevious} />
            </PaginationItem>
            {paginationRange.map((pageNumber, index) => {
              if (pageNumber === DOTS) {
                return <PaginationEllipsis key={index} />
              }
              return (
                <PaginationItem key={index}>
                  <PaginationLink href="#" isActive={pageNumber === page} onClick={() => onPageChange(pageNumber as number)}>
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              )
            })}
            <PaginationItem>
              <PaginationNext href="#" onClick={handleNext} />
            </PaginationItem>
            <PaginationItem>
              <Button variant="ghost" size="sm" onClick={() => onPageChange(pageCount)} disabled={page === pageCount}>
                Cuối
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}
