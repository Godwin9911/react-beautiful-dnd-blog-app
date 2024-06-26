import React, { useEffect, useState } from "react";
import styled from "@emotion/styled";
import { columnsFromBackend } from "./KanbanData";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import TaskCard from "./TaskCard";
import { useEffectOnce } from "./hooks";
import { isEmpty } from "lodash";
import { toast } from "react-toastify";

const Container = styled.div`
  display: flex;
`;

const TaskList = styled.div`
  min-height: 100px;
  display: flex;
  flex-direction: column;
  background: #f3f3f3;
  min-width: 300px;
  border-radius: 5px;
  padding: 15px 15px;
  margin-right: 32px;
`;

const TaskColumnStyles = styled.div`
  margin: 8px;
  display: flex;
  width: 100vw;
  height: calc(100vh - 6.5rem);
  overflow: auto;
`;

const Title = styled.span`
  color: #10957d;
  background: rgba(16, 149, 125, 0.15);
  padding: 4px 12px;
  border-radius: 5px;
  align-self: flex-start;
  font-weight: 500;
  margin-bottom: 1rem;
`;

// Your API key and token
const apiKey = "25eb7950bf43c6cc382ef32d357069c5";

const Kanban = ({ selectedBoard, setSelectedBoard, setBoards }) => {
  const [columns, setColumns] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const onDragEnd = (result, columns, setColumns) => {
    try {
      if (!result.destination) return;
      const { source, destination } = result;
      if (source.droppableId !== destination.droppableId) {
        const sourceColumn = columns[source.droppableId];
        const destColumn = columns[destination.droppableId];
        const sourceItems = [...sourceColumn.items];
        const destItems = [...destColumn.items];
        const [removed] = sourceItems.splice(source.index, 1);
        destItems.splice(destination.index, 0, removed);
        setColumns({
          ...columns,
          [source.droppableId]: {
            ...sourceColumn,
            items: sourceItems,
          },
          [destination.droppableId]: {
            ...destColumn,
            items: destItems,
          },
        });
      } else {
        const column = columns[source.droppableId];
        const copiedItems = [...column.items];
        const [removed] = copiedItems.splice(source.index, 1);
        copiedItems.splice(destination.index, 0, removed);
        setColumns({
          ...columns,
          [source.droppableId]: {
            ...column,
            items: copiedItems,
          },
        });
      }

      console.log(result, {
        cardId: result.draggableId,
        listId: result.destination.droppableId,
        position: result.destination.index,
      });

      moveCard({
        cardId: result.draggableId,
        listId: result.destination.droppableId,
        position: result.destination.index,
      });
    } catch (err) {
      console.log(err);
    }
  };

  const fetchAllCardsInBoard = () => {
    return new Promise((resolve, reject) => {
      // Trello API URL to fetch all cards in a board
      const url = `https://api.trello.com/1/boards/${selectedBoard.id}/cards?key=${apiKey}&token=${selectedBoard.token}`;

      // Perform the fetch request
      fetch(url)
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              "Network response was not ok " + response.statusText
            );
          }
          return response.json();
        })
        .then((data) => {
          console.log("Cards:", data);
          resolve(data);
        })
        .catch((error) => {
          console.error(error);
          reject(error);
        });
    });
  };
  function waitFor(time) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, time);
    });
  }

  const fetchBoards = async () => {
    return new Promise((resolve, reject) => {
      // Trello API URL to fetch boards
      const url = `https://api.trello.com/1/boards/${selectedBoard.id}/lists?key=${apiKey}&token=${selectedBoard.token}`;

      // Options for the fetch request
      const options = {
        method: "GET", // For fetching data
        headers: {
          "Content-Type": "application/json",
        },
      };

      // Perform the fetch request
      fetch(url, options)
        .then(async (response) => {
          if (response.status === 401) {
            toast.error("Unauthorized: Please check your API key and token");
            setBoards();
            setSelectedBoard();
            await waitFor(500);
            return;
          }

          // Check if the response is successful
          if (!response.ok) {
            throw new Error(
              "Network response was not ok " + response.statusText
            );
          }
          // Parse the JSON from the response
          return response.json();
        })
        .then((data) => {
          // Handle the data from the response
          console.log("List:", data);
          resolve(data);

          resolve(data);
        })
        .catch((error) => {
          // Handle any errors that occurred during the fetch
          console.error("There was a problem with the fetch operation:", error);
          reject(error);
        });
    });
  };

  const fetchCardsInList = (listId) => {
    return new Promise((resolve, reject) => {
      // Trello API URL to fetch cards in a list
      const url = `https://api.trello.com/1/lists/${listId}/cards?key=${apiKey}&token=${selectedBoard.token}`;

      // Perform the fetch request
      fetch(url)
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              "Network response was not ok " + response.statusText
            );
          }
          return response.json();
        })
        .then((data) => {
          resolve(data);
        })
        .catch((error) => {
          reject(error);
        });
    });
  };

  const setUp = async () => {
    try {
      setIsLoading(true);
      const lists = await fetchBoards();
      const cardsByList = await Promise.all(
        lists.map((list) => fetchCardsInList(list.id))
      );

      const obj = {};

      for (let [index, list] of lists.entries()) {
        obj[list.id] = { ...list, items: cardsByList[index] };
      }

      setColumns(obj);

      // ====
    } catch (err) {
      console.log(err);
      toast.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffectOnce(() => {
    setUp();
  }, []);

  const moveCard = async ({ cardId, listId, position }) => {
    console.log({ cardId, listId, position });
    return new Promise(async (resolve, reject) => {
      const url = `https://api.trello.com/1/cards/${cardId}?key=${apiKey}&token=${selectedBoard.token}`;

      try {
        setIsLoading(true);
        const response = await fetch(url, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            idList: listId,
            pos: position,
            idBoard: selectedBoard.id,
          }),
        });

        if (response.status === 401) {
          toast.error("Unauthorized: Please check your API key and token");
          setBoards();
          setSelectedBoard();
          await waitFor(500);
          return;
        }

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data = await response.json();
        console.log("Card moved:", data);
        resolve(data);
      } catch (error) {
        console.error("Error:", error);
        reject(error);
      } finally {
        setIsLoading(false);
      }
    });
  };

  return (
    <div>
      <div style={{ textAlign: "center", padding: "1rem" }}>
        {" "}
        <div
          style={{ position: "fixed", left: 0, margin: "1rem", marginTop: 0 }}
        >
          <button
            style={{
              padding: "0.5rem 1rem",
            }}
            onClick={() => setSelectedBoard()}
          >
            {" "}
            🔙 Back to Boards
          </button>
          <span> {isLoading ? "Syncing Board..." : ""}</span>
        </div>
        <h1 style={{ margin: "0" }} className="truncate">
          {selectedBoard?.name}
        </h1>
        <p
          style={{ margin: "0 auto", maxWidth: "60vw", textAlign: "center" }}
          className="truncate"
        >
          {selectedBoard?.desc}
        </p>
      </div>

      <DragDropContext
        onDragEnd={(result) => onDragEnd(result, columns, setColumns)}
      >
        <Container style={{ pointerEvents: isLoading ? "none" : "" }}>
          <TaskColumnStyles>
            {!isEmpty(columns) ? (
              Object.entries(columns).map(([columnId, column], index) => {
                return (
                  <Droppable key={columnId} droppableId={columnId}>
                    {(provided, snapshot) => (
                      <TaskList ref={provided.innerRef}>
                        {/*  {column.id} */}
                        <Title>{column.name}</Title>

                        <div
                          style={{ height: "calc(100%)", overflowY: "auto" }}
                        >
                          {column.items.map((item, index) => (
                            <TaskCard key={item.id} item={item} index={index} />
                          ))}
                        </div>
                        {provided.placeholder}
                      </TaskList>
                    )}
                  </Droppable>
                );
              })
            ) : (
              <p
                style={{
                  padding: "5rem",
                  textAlign: "center",
                  display: "flex",
                  justifyContent: "center",
                  width: "100%",
                }}
              >
                <span> {isLoading ? "Loading..." : "..."}</span>
              </p>
            )}
          </TaskColumnStyles>
        </Container>
      </DragDropContext>
    </div>
  );
};

export default Kanban;
