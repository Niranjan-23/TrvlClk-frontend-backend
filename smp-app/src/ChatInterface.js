import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import Avatar from "@mui/material/Avatar";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import SearchIcon from "@mui/icons-material/Search";
import API_BASE_URL from "./config";
import "./ChatInterface.css";

const ChatInterface = ({ loggedInUser }) => {
  const { recipientId } = useParams();
  const [chatUsers, setChatUsers] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);

  // Fetch followers from the backend
  const fetchFollowers = async () => {
    if (!loggedInUser || !loggedInUser._id) {
      setError("Please log in to view chats.");
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/${loggedInUser._id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }
      const data = await response.json();
      const followers = data.user.followers || [];
      const mappedFollowers = followers.map((follower) => ({
        id: follower._id,
        name: follower.username || follower.name || "Unknown",
        profileImage: follower.profileImage || "/default-avatar.png", // Ensure profileImage is included
      }));
      setChatUsers(mappedFollowers);
      setFilteredUsers(mappedFollowers);

      if (mappedFollowers.length > 0) {
        const initialChat = recipientId
          ? mappedFollowers.find((user) => user.id === recipientId) || mappedFollowers[0]
          : mappedFollowers[0];
        setActiveChat(initialChat);
        fetchMessages(initialChat.id);
      }
    } catch (err) {
      console.error("Error fetching followers:", err);
      setError("Could not load chat users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for a specific chat
  const fetchMessages = async (recipientId) => {
    if (!loggedInUser || !recipientId) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/messages/${loggedInUser._id}/${recipientId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error("Error fetching messages:", err);
      setMessages([]);
    }
  };

  // Debounce function
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  // Filter chat users locally
  const filterUsers = (query) => {
    if (!query || query.trim() === "") {
      setFilteredUsers([]);
      setShowDropdown(false);
    } else {
      const filtered = chatUsers.filter((user) =>
        user.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredUsers(filtered);
      setShowDropdown(true);
    }
  };

  const debouncedFilterUsers = useCallback(debounce(filterUsers, 300), [chatUsers]);

  const handleSearchChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
    debouncedFilterUsers(query);
  };

  const handleSearchSelect = (user) => {
    setActiveChat(user);
    fetchMessages(user.id);
    setSearchQuery("");
    setShowDropdown(false);
  };

  // Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sendMessage = async () => {
    if (newMessage.trim() === "" || !activeChat) return;
    const newMsg = {
      id: messages.length + 1,
      text: newMessage,
      sender: "me",
    };
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderId: loggedInUser._id,
          recipientId: activeChat.id,
          text: newMessage,
        }),
      });
      if (response.ok) {
        setMessages([...messages, newMsg]);
        setNewMessage("");
      } else {
        console.error("Failed to send message:", response.status);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages([...messages, newMsg]);
      setNewMessage("");
    }
  };

  useEffect(() => {
    fetchFollowers();
  }, [loggedInUser, recipientId]);

  if (loading) return <div>Loading chats...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="chat-interface">
      <div className="chat-sidebar">
        <h3>Chats</h3>
        <div className="chat-search" ref={searchRef}>
          <form onSubmit={(e) => e.preventDefault()}>
            <TextField
              id="chat-search-bar"
              className="text"
              value={searchQuery}
              onChange={handleSearchChange}
              label="Search Chats"
              variant="outlined"
              placeholder="Search..."
              size="small"
              style={{ width: "80%" }}
            />
            <IconButton type="submit" aria-label="search">
              <SearchIcon style={{ fill: "blue" }} />
            </IconButton>
          </form>
          {showDropdown && filteredUsers.length > 0 && (
            <ul className="search-dropdown">
              {filteredUsers.map((user) => (
                <li
                  key={user.id}
                  onClick={() => handleSearchSelect(user)}
                  className="dropdown-item"
                >
                  <Avatar src={user.profileImage} className="dropdown-avatar" />
                  <span className="dropdown-name">{user.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <ul className="chat-list">
          {chatUsers.length > 0 ? (
            chatUsers.map((user) => (
              <li
                key={user.id}
                className={activeChat?.id === user.id ? "active" : ""}
                onClick={() => handleSearchSelect(user)}
              >
                <Avatar src={user.profileImage} className="sidebar-avatar" />
                <span className="sidebar-name">{user.name}</span>
              </li>
            ))
          ) : (
            <li>No followers to chat with</li>
          )}
        </ul>
      </div>
      <div className="chat-main">
        {activeChat ? (
          <>
            <div className="chat-header">
              <Avatar src={activeChat.profileImage} className="header-avatar" />
              <h2>Chat with {activeChat.name}</h2>
            </div>
            <div className="chat-messages">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message-row ${msg.sender === "me" ? "sent-row" : "received-row"}`}
                >
                  {msg.sender === "them" && (
                    <Avatar src={activeChat.profileImage} className="message-avatar" />
                  )}
                  <div className={msg.sender === "me" ? "sent" : "received"}>
                    {msg.text}
                  </div>
                  {msg.sender === "me" && (
                    <Avatar src={loggedInUser.profileImage} className="message-avatar" />
                  )}
                </div>
              ))}
            </div>
            <div className="chat-input">
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </>
        ) : (
          <div className="chat-main-empty">
            <p>Select a chat to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;