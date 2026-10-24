import { useBoard } from "@planner/context/boardContext"
import { SaveForm } from "@common/SaveForm"
import { SavedList } from "@common/saved-list/SavedList"
import { Section } from "@common/Section"

export const ManualBoardsSection = ({
    defaultOpen,
}: {
    defaultOpen: boolean
}) => {
    const { view, changeView, manual } = useBoard()

    const openBoard = (id: string) => {
        const entry = manual.savedBoards.find(
            (candidate) => candidate.id === id,
        )
        if (!entry) {
            return
        }

        if (view !== "board") {
            changeView("board")
        }

        manual.loadBoard(entry)
    }

    return (
        <Section
            count={manual.savedBoards.length}
            defaultOpen={defaultOpen}
            title="Manual boards"
        >
            <SaveForm
                label="Name this board"
                value={manual.boardSaveName}
                disabled={manual.selectedCells.size === 0}
                onChange={manual.setBoardSaveName}
                onSave={manual.saveBoard}
            />

            <SavedList
                empty="Boards you pick by hand can be saved here."
                items={manual.savedBoards.map((saved) => ({
                    id: saved.id,
                    name: saved.name,
                    detail: `${saved.selectedCells.length} nodes`,
                }))}
                onDelete={manual.deleteBoard}
                onLoad={openBoard}
                onRename={manual.renameBoard}
            />
        </Section>
    )
}
