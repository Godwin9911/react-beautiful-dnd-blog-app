import React, { useState, useEffect } from "react";
import { useLocalStorage } from "./hooks";

const TrelloBoards = ({ setSelectedBoard, boards = [], setBoards }) => {
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const url = new URL(window.location.href);

  const apiKey = "25eb7950bf43c6cc382ef32d357069c5"; // Replace with your actual API key
  const redirectUri = url.origin; // "http://localhost:3000"; // Replace with your actual redirect URI

  useEffect(() => {
    // Function to extract the token from the URL
    const getTokenFromUrl = () => {
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.substring(1));
      return params.get("token");
    };

    // Get the token from the URL
    const token = getTokenFromUrl();
    if (token) {
      setToken(token);
      // Clear the hash from the URL
      window.history.replaceState(null, null, " ");
    }
  }, []);

  const setUp = ({ token }) => {
    setIsLoading(true);
    // Trello API URL to fetch boards
    const url = `https://api.trello.com/1/members/me/boards?key=${apiKey}&token=${token}`;

    // Perform the fetch request
    fetch(url)
      .then((response) => {
        // Log the status code for debugging
        console.log("Status:", response.status);

        // Check if the response is successful
        if (!response.ok) {
          throw new Error("Network response was not ok " + response.statusText);
        }
        // Parse the JSON from the response
        return response.json();
      })
      .then((data) => {
        // Handle the data from the response
        setBoards(data);
      })
      .catch((error) => {
        // Handle any errors that occurred during the fetch
        setError(error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (token) {
      setUp({ token });
    }
  }, [token]);

  const handleAuthorize = () => {
    // Construct the authorization URL
    const authUrl = `https://trello.com/1/authorize?expiration=never&name=MyApp&scope=read,write&response_type=token&key=${apiKey}&return_url=${encodeURIComponent(
      redirectUri
    )}`;

    // Redirect the user to the authorization URL
    window.location.href = authUrl;
  };

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <div>
        <h1>Trello Boards</h1>
        {!token && (
          <button onClick={handleAuthorize}>
            Click Here to Authorize Trello / Fetch Boards
          </button>
        )}
        {error && <p>Error: {error.message}</p>}
      </div>

      {boards?.length > 0 && (
        <>
          {" "}
          <hr style={{ margin: "2rem" }} />
          <p>{isLoading ? "Loading Boards, Please wait..." : ""}</p>
          <ul style={{ padding: 0 }}>
            {boards.map((board) => (
              <li
                key={board.id}
                style={{ listStyleType: "none", marginBottom: "1rem" }}
              >
                <button
                  onClick={() => setSelectedBoard({ ...board, token })}
                  style={{ width: "300px", padding: "0.5rem 1rem" }}
                >
                  {" "}
                  {board.name}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default TrelloBoards;
