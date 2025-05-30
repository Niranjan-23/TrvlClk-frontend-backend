import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import Avatar from "@mui/material/Avatar";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import API_BASE_URL from "./config";
import "./ChatInterface.css";

const ChatInterface = ({ loggedInUser }) => {
  const { recipientId } = useParams();
  const [allFollowers, setAllFollowers] = useState([]);
  const [chatUsers, setChatUsers] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteFor, setShowDeleteFor] = useState(null);
  const searchRef = useRef(null);

  // Helper to format timestamps relative to now
  const formatRelativeTime = (timestamp) => {
    const messageDate = new Date(timestamp);
    const now = new Date();
    const diff = now - messageDate;
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? "s" : ""} ago`;
  };

  // Helper to fetch conversation for a given follower
  const fetchConversationForFollower = async (follower) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/conversations/${loggedInUser._id}/${follower.id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) return { ...follower, messages: [] };
      const data = await response.json();
      if (data.conversation && data.conversation._id) {
        follower.conversationId = data.conversation._id;
      }
      return { ...follower, messages: data.conversation.messages || [] };
    } catch (error) {
      console.error(
        "Error fetching conversation for follower",
        follower.id,
        error
      );
      return { ...follower, messages: [] };
    }
  };

  // Fetch conversations for all followers and return only those with messages
  const fetchConversationsForAllFollowers = async (followers) => {
    const conversationPromises = followers.map((follower) =>
      fetchConversationForFollower(follower)
    );
    const followersWithConversations = await Promise.all(conversationPromises);
    return followersWithConversations.filter(
      (follower) => follower.messages.length > 0
    );
  };

  // Fetch followers from the backend
  const fetchFollowers = async () => {
    if (!loggedInUser || !loggedInUser._id) {
      setError("Please log in to view chats.");
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/user/${loggedInUser._id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch user data");
      const data = await response.json();
      const followers = data.user.followers || [];
      const mappedFollowers = followers.map((follower) => ({
        id: follower._id,
        name: follower.username || follower.name || "Unknown",
        profileImage: follower.profileImage || "/default-avatar.png",
      }));
      setAllFollowers(mappedFollowers);
      const followersWithConversations = await fetchConversationsForAllFollowers(
        mappedFollowers
      );
      setChatUsers(followersWithConversations);
      setFilteredUsers(mappedFollowers);

      if (followersWithConversations.length > 0) {
        const initialChat =
          recipientId &&
          followersWithConversations.find((user) => user.id === recipientId)
            ? followersWithConversations.find((user) => user.id === recipientId)
            : followersWithConversations[0];
        setActiveChat(initialChat);
        fetchConversation(initialChat.id);
      }
    } catch (err) {
      console.error("Error fetching followers:", err);
      setError("Could not load chat users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch conversation between loggedInUser and active chat user
  const fetchConversation = async (recipientId) => {
    if (!loggedInUser || !recipientId) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/conversations/${loggedInUser._id}/${recipientId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch conversation");
      const data = await response.json();
      if (data.conversation && data.conversation._id) {
        setConversationId(data.conversation._id);
      }
      setMessages(data.conversation.messages || []);
    } catch (err) {
      console.error("Error fetching conversation:", err);
      setError("Could not load conversation. Please try again.");
      setMessages([]);
    }
  };

  // Debounce function for search
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const filterUsers = (query) => {
    if (!query || query.trim() === "") {
      setFilteredUsers([]);
      setShowDropdown(false);
    } else {
      const filtered = allFollowers.filter((user) =>
        user.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredUsers(filtered);
      setShowDropdown(true);
    }
  };

  const debouncedFilterUsers = useCallback(debounce(filterUsers, 300), [
    allFollowers,
  ]);

  const handleSearchChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
    debouncedFilterUsers(query);
  };

  const handleSearchSelect = (user) => {
    setActiveChat(user);
    fetchConversation(user.id);
    setSearchQuery("");
    setShowDropdown(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Send a message using the conversation endpoint
  const sendMessage = async () => {
    if (newMessage.trim() === "" || !activeChat) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/conversations`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderId: loggedInUser._id,
          recipientId: activeChat.id,
          text: newMessage,
          // Optional: add messageType if needed, e.g., messageType: "text"
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.conversation && data.conversation._id) {
          setConversationId(data.conversation._id);
        }
        setMessages(data.conversation.messages);
        setNewMessage("");
        if (!chatUsers.find((user) => user.id === activeChat.id)) {
          const updatedUser = await fetchConversationForFollower(activeChat);
          if (updatedUser.messages.length > 0) {
            setChatUsers((prev) => [...prev, updatedUser]);
          }
        }
      } else {
        console.error("Failed to send message:", response.status);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const newMsg = {
        id: messages.length + 1,
        text: newMessage,
        sender: loggedInUser._id,
        createdAt: new Date(),
      };
      setMessages([...messages, newMsg]);
      setNewMessage("");
    }
  };

  // Function for deleting an individual message using pull
  const deleteMessage = async (messageId) => {
    if (!conversationId) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/conversations/${conversationId}/messages/${messageId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to delete message");
      }
      const data = await response.json();
      setMessages(data.conversation.messages);
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  };

  // Helper to check if a string is an image URL
  const isImageUrl = (url) =>
    typeof url === "string" &&
    url.startsWith("https://images.pexels.com");

  useEffect(() => {
    fetchFollowers();
  }, [loggedInUser, recipientId]);

  if (loading) return <div>Loading chats...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="chat-interface">
      {/* ===== SIDEBAR ===== */}
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
            <li>No chats available</li>
          )}
        </ul>
      </div>

      {/* ===== MAIN CHAT AREA ===== */}
      <div className="chat-main">
        {activeChat ? (
          <>
            <div className="chat-header">
              <Avatar src={activeChat.profileImage} className="header-avatar" />
              <h2>{activeChat.name}</h2>
            </div>
            <div className="chat-messages">
              {messages.length > 0 ? (
                messages.map((msg, index) => {
                  const isSent = msg.sender === loggedInUser._id;
                  const messageId = msg._id || index;
                  return (
                    <div
                      key={messageId}
                      className={`message-row ${isSent ? "sent-row" : "received-row"}`}
                      style={{ position: "relative" }}
                    >
                      {isSent ? (
                        <>
                          <div className="sent" style={{ position: "relative" }}>
                            {/* 3-dots icon for sent messages: left inside bubble */}
                            <IconButton
                              size="small"
                              style={{
                                position: "absolute",
                                left: 8,
                                top: 8,
                                zIndex: 2,
                              }}
                              onClick={() =>
                                setShowDeleteFor(showDeleteFor === messageId ? null : messageId)
                              }
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                            {showDeleteFor === messageId && (
                              <IconButton
                                onClick={() => {
                                  deleteMessage(msg._id);
                                  setShowDeleteFor(null);
                                }}
                                size="small"
                                color="error"
                                style={{
                                  position: "absolute",
                                  left: 8,
                                  top: 40,
                                  background: "white",
                                  zIndex: 10,
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                            {msg.messageType === "image" ? (
                              <img
                                src={msg.imageUrl}
                                alt="post preview"
                                className="chat-image"
                              />
                            ) : isImageUrl(msg.text) ? (
                              <img
                                src={msg.text}
                                alt="sent"
                                className="chat-image"
                                style={{
                                  maxWidth: 120,
                                  maxHeight: 120,
                                  borderRadius: 8,
                                }}
                              />
                            ) : (
                              msg.text
                            )}
                            <div className="message-time">
                              {formatRelativeTime(msg.createdAt)}
                            </div>
                          </div>
                          <Avatar
                            src={loggedInUser.profileImage}
                            className="message-avatar"
                          />
                        </>
                      ) : (
                        <>
                          <Avatar
                            src={activeChat.profileImage}
                            className="message-avatar"
                          />
                          <div className="received" style={{ position: "relative" }}>
                            <IconButton
                              size="small"
                              style={{
                                position: "absolute",
                                right: 8,
                                top: 8,
                                zIndex: 2,
                              }}
                              onClick={() =>
                                setShowDeleteFor(showDeleteFor === messageId ? null : messageId)
                              }
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                            {showDeleteFor === messageId && (
                              <IconButton
                                onClick={() => {
                                  deleteMessage(msg._id);
                                  setShowDeleteFor(null);
                                }}
                                size="small"
                                color="error"
                                style={{
                                  position: "absolute",
                                  right: 8,
                                  top: 40,
                                  background: "white",
                                  zIndex: 10,
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                            {msg.messageType === "image" ? (
                              <img
                                src={msg.imageUrl}
                                alt="post preview"
                                className="chat-image"
                              />
                            ) : isImageUrl(msg.text) ? (
                              <img
                                src={msg.text}
                                alt="sent"
                                className="chat-image"
                                style={{
                                  maxWidth: 120,
                                  maxHeight: 120,
                                  borderRadius: 8,
                                }}
                              />
                            ) : (
                              msg.text
                            )}
                            <div className="message-time">
                              {formatRelativeTime(msg.createdAt)}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="no-messages">Start a convo!</div>
              )}
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
