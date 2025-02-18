import React, { useState, useEffect } from 'react';
import { Avatar, Grid, Paper, Divider, TextField, Button } from '@mui/material';
import './Comment.css';
import SendIcon from '@mui/icons-material/Send';

// Helper function to get the logged-in user (assuming it's stored in localStorage)
const getLoggedInUser = () => {
  const user = JSON.parse(localStorage.getItem('loggedInUser'));
  console.log('Logged-in user:', user); // Debugging the logged-in user data
  return user || { name: 'Guest User', avatar: 'https://via.placeholder.com/150' }; // Fallback values
};

export default function Comment() {
  const loggedInUser = getLoggedInUser(); // Get the logged-in user
  console.log('Logged-in user in comment component:', loggedInUser); // Debugging

  const [comments, setComments] = useState([
    {
      id: 1,
      author: 'Michel Michel',
      text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean luctus ut est sed faucibus.',
      time: 'posted 1 minute ago',
      avatar: 'https://via.placeholder.com/150', // Example avatar for Michel
    },
    {
      id: 2,
      author: 'Michel Michel',
      text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean luctus ut est sed faucibus.',
      time: 'posted 1 minute ago',
      avatar: 'https://via.placeholder.com/150', // Example avatar for Michel
    }
  ]);
  
  const [newComment, setNewComment] = useState('');

  const handleAddComment = () => {
    if (newComment.trim() === '') return;

    const newCommentObj = {
      id: comments.length + 1,
      author: loggedInUser.name,  // Use logged-in user's name
      text: newComment,
      time: 'just now',
      avatar: loggedInUser.avatar,  // Use logged-in user's avatar
    };

    setComments([...comments, newCommentObj]);
    setNewComment('');  // Clear the input field
  };

  return (
    <div style={{ padding: 14 }} className="comment-box">
      <h1>Comments</h1>

      {/* Display existing comments */}
      {comments.map((comment) => (
        <Paper key={comment.id} style={{ padding: '40px 20px', animation: 'fadeIn 0.5s' }}>
          <Grid container wrap="nowrap" spacing={2}>
            <Grid item>
              <Avatar alt={comment.author} src={comment.avatar} />
            </Grid>
            <Grid justifyContent="left" item xs zeroMinWidth>
              <h4 style={{ margin: 0, textAlign: 'left' }}>{comment.author}</h4>
              <p style={{ textAlign: 'left' }}>{comment.text}</p>
              <p style={{ textAlign: 'left', color: 'gray' }}>{comment.time}</p>
            </Grid>
          </Grid>
          <Divider variant="fullWidth" style={{ margin: '30px 0' }} />
        </Paper>
      ))}

      {/* Comment input area */}
      <Paper style={{ padding: '20px', marginTop: '20px' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs>
            <TextField
              fullWidth
              label="Add a comment"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
          </Grid>
          <Grid item>
            <Button color="secondary" onClick={handleAddComment}>
              <SendIcon />
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </div>
  );
}
