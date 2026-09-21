import { showSubmittedData } from '@/utils/show-submitted-data'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useTasks } from '../context/tasks-context'
import { BulkEmailDialog } from './bulk-email-dialog'
import { BulkNotifcationDialog } from './bulk-notifcation'
import { CustomerEmailDrawer } from './customer-email-drawer'
import { CustomerHistoryDrawer } from './customer-history-drawer'
import { TasksImportDialog } from './tasks-import-dialog'
import { CustomerMutateDrawer } from './tasks-mutate-drawer'

export function TasksDialogs() {
  const { open, setOpen, currentRow, setCurrentRow, selectedCustomers } =
    useTasks()

  const handleSuccess = () => {
    setOpen(null)
    setCurrentRow(null)
  }

  return (
    <>
      <CustomerMutateDrawer
        key='task-create'
        open={open === 'create'}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setOpen(null)
          }
        }}
        onSuccess={handleSuccess}
      />

      <TasksImportDialog
        key='tasks-import'
        open={open === 'import'}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setOpen(null)
          }
        }}
      />

      <BulkEmailDialog
        key='bulk-email'
        open={open === 'bulk-email'}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setOpen(null)
          }
        }}
        selectedCustomers={selectedCustomers}
      />
      <BulkNotifcationDialog
        key='bulk-notifcation'
        open={open === 'bulk-notifcation'}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setOpen(null)
          }
        }}
        selectedCustomers={selectedCustomers}
      />

      {currentRow && (
        <>
          <CustomerMutateDrawer
            key={`task-update-${currentRow.id}`}
            open={open === 'update'}
            onOpenChange={(isOpen) => {
              if (!isOpen) {
                setOpen(null)
                setTimeout(() => {
                  setCurrentRow(null)
                }, 500)
              }
            }}
            currentRow={currentRow}
            onSuccess={handleSuccess}
          />

          <CustomerHistoryDrawer
            key={`customer-history-${currentRow.id}`}
            open={open === 'history'}
            onOpenChange={(isOpen) => {
              if (!isOpen) {
                setOpen(null)
                setTimeout(() => {
                  setCurrentRow(null)
                }, 500)
              }
            }}
            currentRow={currentRow}
          />

          <CustomerEmailDrawer
            key={`customer-email-${currentRow.id}`}
            open={open === 'email'}
            onOpenChange={(isOpen) => {
              if (!isOpen) {
                setOpen(null)
                setTimeout(() => {
                  setCurrentRow(null)
                }, 500)
              }
            }}
            currentRow={currentRow}
          />

          <ConfirmDialog
            key='task-delete'
            destructive
            open={open === 'delete'}
            onOpenChange={(isOpen) => {
              if (!isOpen) {
                setOpen(null)
                setTimeout(() => {
                  setCurrentRow(null)
                }, 500)
              }
            }}
            handleConfirm={() => {
              setOpen(null)
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
              showSubmittedData(
                currentRow,
                'The following customer has been deleted:'
              )
            }}
            className='max-w-md'
            title={`Delete this customer: ${currentRow.id} ?`}
            desc={
              <>
                You are about to delete a customer with the ID{' '}
                <strong>{currentRow.id}</strong>. <br />
                This action cannot be undone.
              </>
            }
            confirmText='Delete'
          />
        </>
      )}
    </>
  )
}
