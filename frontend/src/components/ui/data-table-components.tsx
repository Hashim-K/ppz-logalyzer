"use client"

import { ColumnDef, Column, Row } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"

export interface SortableColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>
  children: React.ReactNode
}

export function SortableColumnHeader<TData, TValue>({ column, children }: SortableColumnHeaderProps<TData, TValue>) {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="p-0 hover:bg-transparent"
    >
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  )
}

export interface RowActionsProps<T> {
  row: Row<T>
  actions?: Array<{
    label: string
    onClick: (data: T) => void
    variant?: "default" | "destructive"
  }>
}

export function RowActions<T>({ row, actions }: RowActionsProps<T>) {
  if (!actions || actions.length === 0) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {actions.map((action, index) => (
          <DropdownMenuItem
            key={index}
            onClick={() => action.onClick(row.original)}
            className={action.variant === "destructive" ? "text-destructive" : ""}
          >
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Helper function to create a selection column
export function createSelectionColumn<T>(): ColumnDef<T> {
  return {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  }
}

// Helper function to create an actions column
export function createActionsColumn<T>(
  actions: Array<{
    label: string
    onClick: (data: T) => void
    variant?: "default" | "destructive"
  }>
): ColumnDef<T> {
  return {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => <RowActions row={row} actions={actions} />,
  }
}
