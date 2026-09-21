'use client'

import { ColumnDef } from '@tanstack/react-table'
import { TermsAndPolicy } from '@/type/policy'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { usePolicy } from '../context/policy-context'
import { Eye, Edit, Trash, MoreHorizontal } from 'lucide-react'
import { format } from 'date-fns'

export const columns: ColumnDef<TermsAndPolicy>[] = [
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => <div className='font-medium'>{row.getValue('title')}</div>,
  },
  {
    accessorKey: 'slug',
    header: 'Slug',
    cell: ({ row }) => <code className='text-xs font-mono bg-muted px-1.5 py-0.5 rounded'>{row.getValue('slug')}</code>,
  },
  {
    accessorKey: 'isActive',
    header: 'Status',
    cell: ({ row }) => {
      const isActive = row.getValue('isActive') as boolean
      return (
        <Badge variant={isActive ? 'default' : 'secondary'}>
          {isActive ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'updatedAt',
    header: 'Last Updated',
    cell: ({ row }) => {
      const rawDate = row.getValue('updatedAt') as string
      try {
        return <div>{format(new Date(rawDate), 'MMM dd, yyyy HH:mm')}</div>
      } catch {
        return <div>{rawDate || '-'}</div>
      }
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const policy = row.original
      const { setOpen, setCurrentRow } = usePolicy()

      const handlePreview = () => {
        setCurrentRow(policy)
        setOpen('preview')
      }

      const handleEdit = () => {
        setCurrentRow(policy)
        setOpen('update')
      }

      const handleDelete = () => {
        setCurrentRow(policy)
        setOpen('delete')
      }

      return (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'
              aria-label='Open action menu'
            >
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-[160px]'>
            <DropdownMenuItem onClick={handlePreview} className='cursor-pointer'>
              <Eye className='mr-2 h-4 w-4 text-muted-foreground' />
              Preview HTML
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleEdit} className='cursor-pointer'>
              <Edit className='mr-2 h-4 w-4 text-muted-foreground' />
              Edit Policy
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete} className='cursor-pointer text-destructive focus:bg-destructive focus:text-destructive-foreground'>
              <Trash className='mr-2 h-4 w-4' />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
