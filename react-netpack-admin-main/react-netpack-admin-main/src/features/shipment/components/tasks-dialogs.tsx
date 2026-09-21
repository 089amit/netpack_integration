import http from '@/utils/http'
import { SHIPMENT_ENDPOINT } from '@/constants/endpoint'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useTasks } from '../context/shipments-context'
import { TasksImportDialog } from './shipment-import-dialog'
import { GetShipmentInfoDrawer } from './shipment-info-drawer'
import { TasksMutateDrawer } from './tasks-mutate-drawer'

interface Props {
  onRefetch?: () => void
}

export function TasksDialogs({ onRefetch }: Props) {
  const { open, setOpen, currentRow, setCurrentRow } = useTasks()
  return (
    <>
      <TasksMutateDrawer
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
          <GetShipmentInfoDrawer
            open={open === 'info'}
            onOpenChange={(isOpen) => {
              if (!isOpen) setCurrentRow(null)
              setOpen(isOpen ? 'info' : null)
            }}
            currentRow={currentRow ? { id: Number(currentRow.id) } : null}
          />

          <TasksMutateDrawer
            key={`task-update-${currentRow.id}`}
            open={open === 'update'}
            onOpenChange={() => {
              setOpen('update')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
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
            handleConfirm={async () => {
              setOpen(null)
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
              try {
                await http.delete(
                  `${SHIPMENT_ENDPOINT.ALL_SHIPMENTS}/${currentRow.id}`
                )
                onRefetch?.()
              } catch (err) {
                alert('Failed to delete shipment')
              }
            }}
            className='max-w-md'
            title={`Delete this shipment: ${currentRow.id} ?`}
            desc={
              <>
                You are about to delete a shipment with the ID{' '}
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
