import React, { useState, useEffect, useRef } from 'react';
import {
  Fab,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Button,
  Avatar,
  Typography,
  Box,
  Paper,
  Fade,
  Slide,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Chat,
  Close,
  Send,
  SmartToy,
  Person,
  AccessTime,
  CheckCircle,
  Error,
  Info
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { apiRequest } from '../utils/api';

// Styled components for Spotify-like chat design
const ChatBubble = styled(Paper)(({ theme, isUser }) => ({
  padding: theme.spacing(1.5, 2),
  margin: theme.spacing(0.5, 0),
  maxWidth: '80%',
  wordWrap: 'break-word',
  backgroundColor: isUser
    ? theme.palette.primary.main
    : theme.palette.grey[100],
  color: isUser
    ? theme.palette.primary.contrastText
    : theme.palette.text.primary,
  alignSelf: isUser ? 'flex-end' : 'flex-start',
  borderRadius: isUser
    ? '18px 18px 4px 18px'
    : '18px 18px 18px 4px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    [isUser ? 'right' : 'left']: -8,
    width: 0,
    height: 0,
    border: `8px solid ${isUser ? theme.palette.primary.main : theme.palette.grey[100]}`,
    borderBottomColor: 'transparent',
    borderRightColor: isUser ? 'transparent' : undefined,
    borderLeftColor: isUser ? undefined : 'transparent',
  }
}));

const ChatContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  height: '500px',
  padding: '16px',
  overflowY: 'auto',
  background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
});

const MessageContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  flexGrow: 1,
  padding: '8px',
  gap: '8px',
});

const InputContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  padding: theme.spacing(2),
  gap: theme.spacing(1),
  borderTop: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
}));

const FloatingButton = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: 24,
  right: 24,
  backgroundColor: '#1DB954',
  color: 'white',
  '&:hover': {
    backgroundColor: '#1aa34a',
    transform: 'scale(1.05)',
  },
  transition: 'all 0.3s ease',
  zIndex: 1000,
  boxShadow: '0 4px 20px rgba(29, 185, 84, 0.3)',
}));

const BantayChatbot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm BANTAY, your barangay assistant. I can help you with:\n\n• Certificate requests and requirements\n• Appointment scheduling\n• Filing blotter reports\n• General barangay information\n\nWhat would you like to know?",
      isUser: false,
      timestamp: new Date(),
      type: 'greeting'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputValue,
      isUser: true,
      timestamp: new Date(),
      type: 'user'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await apiRequest('ai/chatbot/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputValue,
          session_id: sessionId,
          context: {}
        })
      });

      const data = await response.json();

      const botMessage = {
        id: Date.now() + 1,
        text: data.response,
        isUser: false,
        timestamp: new Date(),
        type: 'bot',
        intent: data.intent,
        confidence: data.confidence,
        actions: data.actions || []
      };

      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "Sorry, I'm having trouble connecting right now. Please try again later or contact the barangay office directly.",
        isUser: false,
        timestamp: new Date(),
        type: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = (message) => {
    const isAppointmentRelated = message.intent === 'appointment_request' ||
                                message.text.toLowerCase().includes('appointment');

    return (
      <Fade in={true} key={message.id}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: message.isUser ? 'flex-end' : 'flex-start',
            mb: 1
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <Avatar
              sx={{
                width: 24,
                height: 24,
                mr: 1,
                bgcolor: message.isUser ? 'primary.main' : '#1DB954'
              }}
            >
              {message.isUser ? <Person sx={{ fontSize: 16 }} /> : <SmartToy sx={{ fontSize: 16 }} />}
            </Avatar>
            <Typography variant="caption" color="text.secondary">
              {message.isUser ? 'You' : 'BANTAY'} • {formatTime(message.timestamp)}
            </Typography>
            {message.intent && (
              <Chip
                label={message.intent.replace('_', ' ')}
                size="small"
                sx={{ ml: 1, fontSize: '0.7rem', height: 20 }}
                color={message.confidence > 0.8 ? 'success' : 'default'}
              />
            )}
          </Box>

          <ChatBubble isUser={message.isUser} elevation={1}>
            <Typography
              variant="body2"
              sx={{
                whiteSpace: 'pre-wrap',
                lineHeight: 1.4
              }}
            >
              {message.text}
            </Typography>
          </ChatBubble>

          {isAppointmentRelated && message.actions && message.actions.length > 0 && (
            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
              {message.actions.map((action, index) => (
                <Button
                  key={index}
                  variant="outlined"
                  size="small"
                  onClick={() => handleQuickAction(action)}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '0.8rem'
                  }}
                >
                  {action}
                </Button>
              ))}
            </Box>
          )}
        </Box>
      </Fade>
    );
  };

  const handleQuickAction = (action) => {
    setInputValue(action);
    setTimeout(() => handleSendMessage(), 100);
  };

  return (
    <>
      <FloatingButton
        onClick={() => setOpen(true)}
        aria-label="Open BANTAY Chatbot"
      >
        <Chat />
      </FloatingButton>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Slide}
        TransitionProps={{ direction: 'up' }}
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 3,
            maxHeight: '600px',
            margin: 2
          }
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #1DB954 0%, #1aa34a 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2 }}>
              <SmartToy />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                BANTAY Assistant
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Barangay AI Support • Online
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={() => setOpen(false)}
            sx={{ color: 'white' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          <ChatContainer>
            <MessageContainer>
              {messages.map(renderMessage)}

              {isTyping && (
                <Fade in={true}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      alignSelf: 'flex-start',
                      mb: 1
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 24,
                        height: 24,
                        mr: 1,
                        bgcolor: '#1DB954'
                      }}
                    >
                      <SmartToy sx={{ fontSize: 16 }} />
                    </Avatar>
                    <Paper
                      sx={{
                        padding: '12px 16px',
                        borderRadius: '18px 18px 18px 4px',
                        bgcolor: 'grey.100'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          BANTAY is typing
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Box
                            sx={{
                              width: 4,
                              height: 4,
                              bgcolor: 'grey.400',
                              borderRadius: '50%',
                              animation: 'bounce 1.4s ease-in-out infinite both',
                              '@keyframes bounce': {
                                '0%, 80%, 100%': { transform: 'scale(0)' },
                                '40%': { transform: 'scale(1)' }
                              }
                            }}
                          />
                          <Box
                            sx={{
                              width: 4,
                              height: 4,
                              bgcolor: 'grey.400',
                              borderRadius: '50%',
                              animation: 'bounce 1.4s ease-in-out infinite both',
                              animationDelay: '0.16s'
                            }}
                          />
                          <Box
                            sx={{
                              width: 4,
                              height: 4,
                              bgcolor: 'grey.400',
                              borderRadius: '50%',
                              animation: 'bounce 1.4s ease-in-out infinite both',
                              animationDelay: '0.32s'
                            }}
                          />
                        </Box>
                      </Box>
                    </Paper>
                  </Box>
                </Fade>
              )}
              <div ref={messagesEndRef} />
            </MessageContainer>
          </ChatContainer>

          <InputContainer>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Type your message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isTyping}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  '& fieldset': {
                    borderColor: 'grey.300',
                  },
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                  },
                },
              }}
            />
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              sx={{
                borderRadius: 3,
                px: 3,
                backgroundColor: '#1DB954',
                '&:hover': {
                  backgroundColor: '#1aa34a',
                },
                '&:disabled': {
                  backgroundColor: 'grey.300',
                }
              }}
            >
              <Send />
            </Button>
          </InputContainer>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BantayChatbot;
