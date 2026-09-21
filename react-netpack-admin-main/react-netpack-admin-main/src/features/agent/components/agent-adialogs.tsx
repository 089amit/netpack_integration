// src/app/agents/components/agent-dialogs.tsx
import { showSubmittedData } from '@/utils/show-submitted-data'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useTasks } from '../context/tasks-context'
import { AgentMutateDrawer } from './agent-mutate-drawer'
import { TasksImportDialog } from './tasks-import-dialog'

// Optional – keep if used for agents

export function AgentDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useTasks()

  return (
    <>
      {/* Create Agent Drawer */}
      <AgentMutateDrawer
        key='agent-create'
        open={open === 'create'}
        onOpenChange={() => setOpen('create')}
      />

      {/* Import Agents Dialog (Optional) */}
      <TasksImportDialog
        key='agent-import'
        open={open === 'import'}
        onOpenChange={() => setOpen('import')}
      />

      {/* Edit & Delete Dialogs - Only render if currentRow exists */}
      {currentRow && (
        <>
          {/* Edit Agent Drawer */}
          <AgentMutateDrawer
            key={`agent-update-${currentRow.id}`}
            open={open === 'update'}
            onOpenChange={(isOpen) => {
              if (!isOpen) {
                setOpen(null)
              }
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={{
              id: currentRow.id.toString(),
              name: currentRow.name,
              companyName: currentRow.companyName,
              country: currentRow.country,
              city: currentRow.city,
              address: currentRow.address,
              postcode: currentRow.postcode,
              phone: currentRow.phone,
              code: currentRow.code,
            }}
          />

          {/* Delete Confirmation Dialog */}
          <ConfirmDialog
            key='agent-delete'
            destructive
            open={open === 'delete'}
            onOpenChange={(isOpen) => {
              if (!isOpen) {
                setOpen(null)
              }
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            handleConfirm={() => {
              setOpen(null)
              showSubmittedData(
                currentRow,
                'The following agent has been deleted:'
              )
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            className='max-w-md'
            title={`Delete this agent: ${currentRow.name} ?`}
            desc={
              <>
                You are about to delete an agent named{' '}
                <strong>{currentRow.name}</strong>. <br />
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
