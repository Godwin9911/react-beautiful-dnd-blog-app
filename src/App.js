import { isEmpty } from "lodash";
import "./App.css";
import Kanban from "./Kanban";
import TrelloBoards from "./TrelloBoards";
import { useLocalStorage } from "./hooks";

function App() {
  const [selectedBoard, setSelectedBoard] = useLocalStorage(
    "SELECTED_BOARDS",
    {}
  );

  const [boards, setBoards] = useLocalStorage("BOARDS", []);

  return (
    <div className="App">
      {!isEmpty(selectedBoard) ? (
        <Kanban
          selectedBoard={selectedBoard}
          setSelectedBoard={setSelectedBoard}
          setBoards={setBoards}
          boards={boards}
        />
      ) : (
        <TrelloBoards
          selectedBoard={selectedBoard}
          setSelectedBoard={setSelectedBoard}
          setBoards={setBoards}
          boards={boards}
        />
      )}
    </div>
  );
}

export default App;
