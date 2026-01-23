import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Fab,
  List,
  ListItem,
  Avatar,
  CircularProgress,
  Chip,
  Fade,
  useTheme,
  Tooltip,
} from '@mui/material';
import {
  SmartToy,
  Send,
  Close,
  Person,
  ChatBubbleOutline,
  KeyboardArrowDown,
  HelpOutline,
} from '@mui/icons-material';
import { api } from '../utils/api';
import { useNavigate } from 'react-router-dom';

const DEFAULT_ACTIONS = [
  'Request Certificate',
  'File Complaint',
  'Office Hours',
  'Contact',
  'Where is the Barangay Hall?',
];

const Chatbot = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: 'Hello! 👋 Ako si BANTAY, ang iyong barangay assistant. Tutulong ako sa step‑by‑step guides para sa certificates, blotter, at FAQs. Ano ang maitutulong ko?',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [suggestedActions, setSuggestedActions] = useState(DEFAULT_ACTIONS);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend = null) => {
    const finalMessage = textToSend || message;
    if (!finalMessage.trim()) return;

    // Add user message
    const userMsg = {
      type: 'user',
      text: finalMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setMessage('');
    setIsTyping(true);
    setSuggestedActions([]); // Clear actions while typing

    try {
      const response = await api.post('/ai/chatbot', { message: finalMessage });
      const data = await response.json();

      // Add bot message
      const botMsg = {
        type: 'bot',
        text: data.response || 'Pasensya na, hindi ko naintindihan. Maaari mo bang ulitin?',
        steps: Array.isArray(data.steps) ? data.steps : [],
        guideType: data.type || 'text',
        disclaimers: Array.isArray(data.disclaimers) ? data.disclaimers : [],
        resources: Array.isArray(data.resources) ? data.resources : [],
        fields: typeof data.fields === 'object' && data.fields !== null ? data.fields : {},
        examples: typeof data.examples === 'object' && data.examples !== null ? data.examples : {},
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, botMsg]);

      // Update suggested actions
      const responseActions = (data.actions || []).filter((a) => !/schedule|book/i.test(a));
      setSuggestedActions(responseActions.length > 0 ? responseActions : DEFAULT_ACTIONS);
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages((prev) => [
        ...prev,
        {
          type: 'bot',
          text: "Sorry, I'm having trouble connecting to the server right now. Please try again later.",
          timestamp: new Date().toISOString(),
        },
      ]);
      setSuggestedActions(DEFAULT_ACTIONS);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const showFaq = () => {
    const faqMsg = {
      type: 'bot',
      text: 'Here are some frequently asked questions:',
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, faqMsg]);
    setSuggestedActions([
      'How to get Barangay Clearance?',
      'How to file a complaint?',
      'What are the office hours?',
      'Where is the Barangay Hall?',
      'Emergency Contact Numbers',
    ]);
  };

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1200 }}>
      <Fade in={isOpen} mountOnEnter unmountOnExit>
        <Paper
          elevation={12}
          sx={{
            width: 350,
            height: 500,
            mb: 2,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: 2,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'white', color: 'primary.main' }}>
                <SmartToy />
              </Avatar>
              <Box>
                <Typography variant='subtitle1' sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                  BANTAY
                </Typography>
                <Typography variant='caption' sx={{ opacity: 0.8 }}>
                  Barangay Assistant
                </Typography>
              </Box>
            </Box>
            <Box>
              <Tooltip title='Frequently Asked Questions'>
                <IconButton size='small' onClick={showFaq} sx={{ color: 'white', mr: 1 }}>
                  <HelpOutline />
                </IconButton>
              </Tooltip>
              <IconButton size='small' onClick={() => setIsOpen(false)} sx={{ color: 'white' }}>
                <KeyboardArrowDown />
              </IconButton>
            </Box>
          </Box>

          {/* Messages Area */}
          <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, bgcolor: theme.palette.action.hover }}>
            <List sx={{ p: 0 }}>
              {messages.map((msg, index) => (
                <ListItem
                  key={index}
                  sx={{
                    flexDirection: 'column',
                    alignItems: msg.type === 'user' ? 'flex-end' : 'flex-start',
                    mb: 1,
                    px: 0,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      maxWidth: '85%',
                      flexDirection: msg.type === 'user' ? 'row-reverse' : 'row',
                      gap: 1,
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 28,
                        height: 28,
                        bgcolor: msg.type === 'user' ? 'secondary.main' : 'primary.main',
                        fontSize: 14,
                      }}
                    >
                      {msg.type === 'user' ? (
                        <Person sx={{ fontSize: 18 }} />
                      ) : (
                        <SmartToy sx={{ fontSize: 18 }} />
                      )}
                    </Avatar>

                    <Box>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 1.5,
                          bgcolor: msg.type === 'user' ? 'primary.light' : 'background.paper',
                          color: msg.type === 'user' ? 'white' : 'text.primary',
                          borderRadius: 2,
                          borderTopRightRadius: msg.type === 'user' ? 0 : 2,
                          borderTopLeftRadius: msg.type === 'bot' ? 0 : 2,
                          border:
                            msg.type === 'bot' ? `1px solid ${theme.palette.divider}` : 'none',
                        }}
                      >
                        <Typography variant='body2' sx={{ whiteSpace: 'pre-wrap' }}>
                          {msg.text}
                        </Typography>
                        {msg.steps && msg.steps.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            {msg.steps.map((step, i) => (
                              <Typography key={i} variant='body2' sx={{ display: 'block' }}>
                                {i + 1}. {step}
                              </Typography>
                            ))}
                          </Box>
                        )}
                        {msg.fields && Object.keys(msg.fields).length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant='subtitle2'>Field definitions</Typography>
                            {Object.entries(msg.fields).map(([key, val]) => (
                              <Typography key={key} variant='body2' sx={{ display: 'block' }}>
                                {key}: {val}
                              </Typography>
                            ))}
                          </Box>
                        )}
                        {msg.examples && Object.keys(msg.examples).length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant='subtitle2'>Examples</Typography>
                            {Object.entries(msg.examples).map(([key, val]) => (
                              <Typography key={key} variant='body2' sx={{ display: 'block' }}>
                                {key}: {val}
                              </Typography>
                            ))}
                          </Box>
                        )}
                        {msg.disclaimers && msg.disclaimers.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            {msg.disclaimers.map((d, i) => (
                              <Typography
                                key={i}
                                variant='caption'
                                color='text.secondary'
                                sx={{ display: 'block' }}
                              >
                                Note: {d}
                              </Typography>
                            ))}
                          </Box>
                        )}
                        {msg.resources && msg.resources.length > 0 && (
                          <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {msg.resources.map((res, i) => {
                              const label = typeof res === 'string' ? res : res.label;
                              const url = typeof res === 'string' ? res : res.url;
                              return (
                                <Chip
                                  key={i}
                                  label={label}
                                  size='small'
                                  color='secondary'
                                  onClick={() => {
                                    try {
                                      if (url.startsWith('/')) {
                                        navigate(url);
                                      } else {
                                        window.location.href = url;
                                      }
                                    } catch {
                                      window.location.href = url;
                                    }
                                  }}
                                />
                              );
                            })}
                          </Box>
                        )}
                      </Paper>
                      <Typography
                        variant='caption'
                        color='text.secondary'
                        sx={{
                          mt: 0.5,
                          display: 'block',
                          textAlign: msg.type === 'user' ? 'right' : 'left',
                          px: 1,
                        }}
                      >
                        {formatTime(msg.timestamp)}
                      </Typography>
                    </Box>
                  </Box>
                </ListItem>
              ))}
              {isTyping && (
                <ListItem sx={{ px: 0 }}>
                  <Box sx={{ display: 'flex', gap: 1, ml: 4 }}>
                    <CircularProgress size={16} />
                    <Typography variant='caption' color='text.secondary'>
                      Bantay is typing...
                    </Typography>
                  </Box>
                </ListItem>
              )}
              <div ref={messagesEndRef} />
            </List>
          </Box>

          {/* Persistent Quick Actions */}
          {suggestedActions.length > 0 && (
            <Box
              sx={{
                p: 1.5,
                bgcolor: 'background.paper',
                borderTop: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                gap: 1,
                overflowX: 'auto',
                '&::-webkit-scrollbar': {
                  height: 4,
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: theme.palette.grey[300],
                  borderRadius: 2,
                },
              }}
            >
              {suggestedActions.map((action, i) => (
                <Chip
                  key={i}
                  label={action}
                  size='small'
                  color='primary'
                  variant='outlined'
                  onClick={() => handleSendMessage(action)}
                  sx={{
                    bgcolor: 'background.paper',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                />
              ))}
            </Box>
          )}

          {/* Input Area */}
          <Box
            sx={{
              p: 2,
              bgcolor: 'background.paper',
              borderTop: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size='small'
                placeholder='Type a message...'
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                multiline
                maxRows={3}
                disabled={isTyping}
              />
              <IconButton
                color='primary'
                onClick={() => handleSendMessage()}
                disabled={!message.trim() || isTyping}
              >
                <Send />
              </IconButton>
            </Box>
          </Box>
        </Paper>
      </Fade>

      {/* FAB Toggle */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Fab
          color='primary'
          aria-label='chat'
          onClick={() => setIsOpen(!isOpen)}
          sx={{
            width: 60,
            height: 60,
            boxShadow: theme.shadows[8],
          }}
        >
          {isOpen ? <Close /> : <ChatBubbleOutline />}
        </Fab>
      </Box>
    </Box>
  );
};

export default Chatbot;
