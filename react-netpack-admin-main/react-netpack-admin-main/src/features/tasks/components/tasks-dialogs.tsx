'use client'

import { useState } from 'react'
import http from '@/utils/http'
import { ENQUIRY_ENDPOINTS } from '@/constants/endpoint'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { CustomerMutateDrawer } from '../../customer/components/tasks-mutate-drawer'
import TasksProvider from '../../customer/context/tasks-context'
import { useTasks } from '../context/tasks-context'
import { EnquiryModalForm } from './enquiry-create-modal'
import { GetEnquiryInfoDrawer } from './enquiry-info-drawer'
// 👈 Add this
import { TasksImportDialog } from './tasks-import-dialog'
import { EnquiryMutateDrawer } from './tasks-mutate-drawer'

export function TasksDialogs() {
  const { open, setOpen, currentRow, setCurrentRow, onRefresh } = useTasks()
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false)

  const handleCreateCustomer = () => {
    setIsCustomerModalOpen(true)
  }

  const handleCustomerCreated = () => {
    setIsCustomerModalOpen(false)
    // Optionally refresh customer data if needed
  }

  // Convert currentRow to match the expected Props interface
  const convertedCurrentRow = currentRow ? { id: currentRow.id } : null

  return (
    <>
      <EnquiryMutateDrawer
        key='task-create'
        open={open === 'create'}
        onOpenChange={() => setOpen('create')}
        currentRow={null}
      />

      <TasksImportDialog
        key='tasks-import'
        open={open === 'import'}
        onOpenChange={() => setOpen('import')}
      />

      {open === 'modal' && currentRow && (
        <EnquiryModalForm
          open={true}
          onClose={() => {
            setOpen(null)
            setTimeout(() => setCurrentRow(null), 500)
          }}
          selectedEnquiries={[currentRow]}
          onEnquiryCreated={onRefresh}
          onCreateCustomer={handleCreateCustomer}
        />
      )}

      {currentRow && (
        <>
          <EnquiryMutateDrawer
            key={`task-update-${currentRow.id}`}
            open={open === 'update'}
            currentRow={convertedCurrentRow}
            onOpenChange={() => {
              setOpen('update')
              setTimeout(() => setCurrentRow(null), 500)
            }}
          />

          <GetEnquiryInfoDrawer
            key={`task-info-${currentRow.id}`}
            open={open === 'info'}
            currentRow={{ id: Number(currentRow.id) }}
            onOpenChange={() => {
              setOpen('info')
              setTimeout(() => setCurrentRow(null), 500)
            }}
          />

          <ConfirmDialog
            key='task-delete'
            destructive
            open={open === 'delete'}
            onOpenChange={() => {
              setOpen('delete')
            }}
            handleConfirm={() => {
              setOpen(null)
              setTimeout(() => setCurrentRow(null), 500)
              // showSubmittedData(
              //   currentRow,
              //   'The following task has been deleted:'
              // )
              http.delete(
                `${ENQUIRY_ENDPOINTS.DELETE_ENQUIRY}/${currentRow.id}`
              )
              window.location.reload()
            }}
            className='max-w-md'
            title={`Delete this task: ${currentRow.id} ?`}
            desc={
              <>
                You are about to delete a task with the ID{' '}
                <strong>{currentRow.id}</strong>. <br />
                This action cannot be undone.
              </>
            }
            confirmText='Delete'
          />
        </>
      )}

      {/* Customer Creation Modal */}
      <TasksProvider>
        <CustomerMutateDrawer
          open={isCustomerModalOpen}
          onOpenChange={setIsCustomerModalOpen}
          onSuccess={handleCustomerCreated}
        />
      </TasksProvider>
    </>
  )
}
