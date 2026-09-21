import { showSubmittedData } from '@/utils/show-submitted-data'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useTasks } from '../context/tasks-context'
import { TasksImportDialog } from './tasks-import-dialog'
import { MawbMutateDrawer } from './tasks-mutate-drawer'

interface Props {
  onRefetch?: () => void
}

export function TasksDialogs({ onRefetch }: Props) {
  const { open, setOpen, currentRow, setCurrentRow } = useTasks()
  return (
    <>
      <MawbMutateDrawer
        key='task-create'
        open={open === 'create'}
        onOpenChange={() => setOpen('create')}
        onSuccess={onRefetch}
      />

      <TasksImportDialog
        key='tasks-import'
        open={open === 'import'}
        onOpenChange={() => setOpen('import')}
      />

      {currentRow && (
        <>
          <MawbMutateDrawer
            key={`task-update-${currentRow.id}`}
            open={open === 'update'}
            onOpenChange={() => {
              setOpen('update')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={{
              id: typeof currentRow.id === 'number' ? String(currentRow.id) : String(currentRow.id),
              mawbNumber: currentRow.mawbNumber,
              departureDate: currentRow.departureDateRaw ?? currentRow.departureDate,
              hasShipment: currentRow.hasShipment ?? false,
              documentUrl: currentRow.documentUrl ?? '',
              airlineName: currentRow.airlineName ?? '',
              destination: currentRow.destination ?? '',
              flightNumber: currentRow.flightNumber ?? '',
              arrivalDate: currentRow.dateOfArrival ?? '',
              arrivalTime: currentRow.timeOfArrival ?? '',
              agentId: currentRow.agentId ?? undefined,
            }}
            onSuccess={onRefetch}
          />

          <ConfirmDialog
            key='task-delete'
            destructive
            open={open === 'delete'}
            onOpenChange={() => {
              setOpen('delete')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            handleConfirm={() => {
              setOpen(null)
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
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
        </>
      )}
    </>
  )
}
