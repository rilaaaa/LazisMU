'use client';

import { useState } from 'react';
import { XMarkIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatbotPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ text: string; sender: 'user' | 'bot' }>>([]);
  const [inputValue, setInputValue] = useState('');

  // Sample bot responses
  const botResponses = [
    "I'm here to help! What can I assist you with today?",
    "That's a great question. Let me check that for you.",
    "I understand your concern. Here's what I can tell you.",
    "Thanks for reaching out. Here's some information that might help.",
  ];

  const handleSendMessage = () => {
    if (inputValue.trim() === '') return;

    // Add user message
    const newMessages = [...messages, { text: inputValue, sender: 'user' as const }];
    setMessages(newMessages);
    setInputValue('');

    // Simulate bot response after a short delay
    setTimeout(() => {
      const randomResponse = botResponses[Math.floor(Math.random() * botResponses.length)];
      setMessages([...newMessages, { text: randomResponse, sender: 'bot' as const }]);
    }, 800);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  // Animation variants
  const chatButtonVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.1 },
    tap: { scale: 0.95 }
  };

  const chatWindowVariants = {
    hidden: { 
      opacity: 0,
      y: 20,
      scale: 0.9
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        damping: 25,
        stiffness: 300
      }
    },
    exit: {
      opacity: 0,
      y: 20,
      scale: 0.9,
      transition: {
        duration: 0.2
      }
    }
  };

  const messageVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            key="chat-window"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={chatWindowVariants}
            className="w-[400px] h-[600px] bg-white rounded-lg shadow-xl flex flex-col border border-gray-200 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-orange-600 text-white p-4 flex justify-between items-center">
              <h3 className="font-medium text-lg">Chat Support</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-orange-200 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-gray-500 py-8"
                  >
                    <p>How can I help you today?</p>
                  </motion.div>
                ) : (
                  messages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial="hidden"
                      animate="visible"
                      variants={messageVariants}
                      transition={{ duration: 0.2 }}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender === 'user'
                            ? 'bg-orange-600 text-white rounded-tr-none'
                            : 'bg-gray-200 text-gray-800 rounded-tl-none'
                        }`}
                      >
                        {message.text}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Input */}
            <div className="p-3 border-t border-gray-200 bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="chat-button"
            variants={chatButtonVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            onClick={() => setIsOpen(true)}
            className="bg-orange-600 text-white p-4 rounded-full shadow-lg"
          >
            <ChatBubbleBottomCenterTextIcon className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}