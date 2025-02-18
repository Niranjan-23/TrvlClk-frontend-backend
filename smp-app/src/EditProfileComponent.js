import React, { useState } from "react";
import "./EditProfileComponent.css"; // Updated styles

const EditProfileComponent = ({ user, onClose, onSave }) => {
  // Initialize state from the current user’s values.
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio);
  const [profilePicture, setProfilePicture] = useState(user.profileImage);

  const handleSave = () => {
    const updatedUser = {
      ...user,
      name,
      bio,
      profileImage: profilePicture
    };

    // Save the updated user to localStorage
    localStorage.setItem("loggedInUser", JSON.stringify(updatedUser));

    // Optionally update the parent's state if the onSave callback is provided
    if (onSave) {
      onSave(updatedUser);
    }

    // Close the edit overlay.
    onClose();
  };

  return (
    <div className="overlay">
      <div className="edit-profile-container">
        <h2>Edit Profile</h2>
        <div className="form-group">
          <label>Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Bio</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Profile Picture URL</label>
          <input
            type="text"
            value={profilePicture}
            onChange={(e) => setProfilePicture(e.target.value)}
          />
        </div>
        <div className="button-group">
          <button className="save-button" onClick={handleSave}>
            Save
          </button>
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfileComponent;
