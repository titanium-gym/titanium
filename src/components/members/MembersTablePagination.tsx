"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MembersTablePaginationProps {
  currentPage: number;
  totalPages: number;
  filteredCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function MembersTablePagination({
  currentPage,
  totalPages,
  filteredCount,
  pageSize,
  onPageChange,
}: MembersTablePaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
      <span className="tabular-nums">
        {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredCount)} de {filteredCount}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          aria-label="Página anterior"
          className="h-7 w-7 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="px-2 tabular-nums">{currentPage} / {totalPages}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          aria-label="Página siguiente"
          className="h-7 w-7 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
