// Comment.jsx
import React, { useState, useEffect } from 'react';
import { Avatar, Grid, Paper, Divider, TextField, Button } from '@mui/material';
import './Comment.css';
import SendIcon from '@mui/icons-material/Send';

const getLoggedInUser = () => {
  const user = JSON.parse(localStorage.getItem('loggedInUser'));
  console.log('Logged-in user:', user);
  return user || { name: 'Guest User', avatar: 'https://via.placeholder.com/150' };
};

export default function Comment() {
  const loggedInUser = getLoggedInUser();

  const [comments, setComments] = useState([
    {
      id: 1,
      author: 'Michel Michel',
      text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean luctus ut est sed faucibus.',
      time: 'posted 1 minute ago',
      avatar: 'https://via.placeholder.com/150',
    },
    {
      id: 2,
      author: 'Michel Michel',
      text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean luctus ut est sed faucibus.',
      time: 'posted 1 minute ago',
      avatar: 'https://via.placeholder.com/150',
    },
  ]);
  
  const [newComment, setNewComment] = useState('');

  const handleAddComment = () => {
    if (newComment.trim() === '') return;

    const newCommentObj = {
      id: comments.length + 1,
      author: loggedInUser.name,
      text: newComment,
      time: 'just now',
      avatar: loggedInUser.avatar,
    };

    setComments([...comments, newCommentObj]);
    setNewComment('');
  };

  return (
    <div style={{ padding: 14 }} className="comment-box">
      <h1>Comments</h1>
      <Paper
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '350px', // Reduced height for the comment section
          overflow: 'hidden',
          padding: '20px',
        }}
      >
        {/* Scrollable comment list */}
        <div className='comment-scroll'>
          {comments.map((comment) => (
            <Paper
              key={comment.id}
              style={{
                padding: '20px',
                marginBottom: '10px',
                animation: 'fadeIn 0.5s',
              }}
            >
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
              <Divider variant="fullWidth" style={{ margin: '20px 0' }} />
            </Paper>
          ))}
        </div>
  
        {/* Fixed input at the bottom of the container */}
        <div style={{ paddingTop: '10px' }}>
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
        </div>
      </Paper>
    </div>
  );
}
