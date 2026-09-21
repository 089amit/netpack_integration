import { showSubmittedData } from '@/utils/show-submitted-data'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useTasks } from '../context/tasks-context'
import { ForwardingCompanyEditDrawer } from './forwarding-company-drawer'
import { ForwardingCompanyServiceDrawer } from './forwarding-cpmpany-service-drawer'
import { TasksImportDialog } from './tasks-import-dialog'

export function TasksDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useTasks()

  return (
    <>
      {/* Create Drawer */}
      <ForwardingCompanyEditDrawer
        key='company-create'
        open={open === 'create'}
        onOpenChange={(v) => !v && setOpen(null)}
      />

      {/* Update Drawer */}
      {open === 'update' && currentRow && (
        <ForwardingCompanyEditDrawer
          key={`company-update-${currentRow.id}`}
          open
          onOpenChange={(v) => !v && setOpen(null)}
          currentRow={currentRow}
        />
      )}

      {/* Manage Services Drawer */}
      {open === 'services' && currentRow && (
        <ForwardingCompanyServiceDrawer
          key={`company-services-${currentRow.id}`}
          open
          onOpenChange={(v) => !v && setOpen(null)}
          currentRow={currentRow}
        />
      )}

      {/* Import Dialog */}
      <TasksImportDialog
        key='tasks-import'
        open={open === 'import'}
        onOpenChange={() => setOpen('import')}
      />

      {/* Delete Dialog */}
      {open === 'delete' && currentRow && (
        <ConfirmDialog
          key='company-delete'
          destructive
          open
          onOpenChange={() => {
            setOpen(null)
            setTimeout(() => setCurrentRow(null), 500)
          }}
          handleConfirm={() => {
            setOpen(null)
            setTimeout(() => setCurrentRow(null), 500)
            showSubmittedData(
              currentRow,
              'The following task has been deleted:'
            )
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
      )}
    </>
  )
}
