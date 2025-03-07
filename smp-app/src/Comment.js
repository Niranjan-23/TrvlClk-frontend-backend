// Comment.jsx
import React, { useState, useEffect } from 'react';
import { Avatar, Grid, Paper, Divider, TextField, Button } from '@mui/material';
import './Comment.css';
import SendIcon from '@mui/icons-material/Send';
import API_BASE_URL from './config';

export default function Comment({ postId, loggedInUser }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  // Fetch comments for the post
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await fetch(`https://${API_BASE_URL}/api/posts/${postId}/comments`);
        if (response.ok) {
          const data = await response.json();
          setComments(data.comments || []);
        } else {
          console.error('Failed to fetch comments');
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
      }
    };

    if (postId) {
      fetchComments();
    }
  }, [postId]);

  const handleAddComment = async () => {
    if (newComment.trim() === '') return;

    try {
      const response = await fetch(`https://${API_BASE_URL}/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: loggedInUser._id, text: newComment })
      });
      if (!response.ok) {
        console.error("Error adding comment");
        return;
      }
      const data = await response.json();
      setComments([...comments, data.comment]);
      setNewComment('');
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  return (
    <div style={{ padding: 14 }} className="comment-box">
      <h1>Comments</h1>
      <Paper
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '350px',
          overflow: 'hidden',
          padding: '20px',
        }}
      >
        {/* Scrollable comment list */}
        <div className='comment-scroll'>
          {comments.map((comment) => (
            <Paper
              key={comment._id}
              style={{
                padding: '20px',
                marginBottom: '10px',
                animation: 'fadeIn 0.5s',
              }}
            >
              <Grid container wrap="nowrap" spacing={2}>
                <Grid item>
                  <Avatar alt={comment.user.username} src={comment.user.profileImage} />
                </Grid>
                <Grid justifyContent="left" item xs zeroMinWidth>
                  <h4 style={{ margin: 0, textAlign: 'left' }}>{comment.user.username}</h4>
                  <p style={{ textAlign: 'left' }}>{comment.text}</p>
                  <p style={{ textAlign: 'left', color: 'gray' }}>{new Date(comment.createdAt).toLocaleString()}</p>
                </Grid>
              </Grid>
              <Divider variant="fullWidth" style={{ margin: '20px 0' }} />
            </Paper>
          ))}
        </div>
  
        {/* Fixed input at the bottom */}
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
