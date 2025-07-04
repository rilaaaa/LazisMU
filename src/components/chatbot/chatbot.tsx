"use client";

import { useState, useRef, useEffect } from "react";
import {
  XMarkIcon,
  ChatBubbleBottomCenterTextIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { Chart, registerables } from "chart.js";

// Register Chart.js components
Chart.register(...registerables);

interface ChartData {
  type: string;
  data: any;
  options?: any;
}

type Message = {
  text: string | any[];
  sender: "user" | "bot";
  type?: "text" | "table" | "chart";
  chartData?: ChartData;
};

interface ApiResponse {
  intent: "chat" | "data" | "chart";
  reply?: string;
  results?: any[];
  chartData?: ChartData;
}

function ChartRenderer({ type, data, options }: ChartData) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart>();

  useEffect(() => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        // Destroy previous chart instance if exists
        if (chartInstance.current) {
          chartInstance.current.destroy();
        }

        // Create new chart
        chartInstance.current = new Chart(ctx, {
          type: type as any,
          data: data,
          options: options || {
            responsive: true,
            maintainAspectRatio: false,
          },
        });
      }
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [type, data, options]);

  return <canvas ref={chartRef} className="w-full h-full" />;
}

export default function ChatbotPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputValue.trim() === "") return;

    const userMessage: Message = { 
      text: inputValue, 
      sender: "user",
      type: "text"
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");

    try {
      // Show loading message
      setMessages(prev => [...prev, { 
        text: "Thinking...", 
        sender: "bot",
        type: "text"
      }]);

      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: inputValue }),
      });

      const data: ApiResponse = await response.json();

      // Remove the "Thinking..." message
      setMessages(prev => prev.filter(msg => msg.text !== "Thinking..."));

      if (data.intent === "chat" && data.reply) {
        // Simple text reply
        setMessages(prev => [
          ...prev,
          { 
            text: data.reply, 
            sender: "bot",
            type: "text"
          },
        ]);
      } else if (data.intent === "data" && data.results) {
        // Table data
        setMessages(prev => [
          ...prev,
          { 
            text: data.results, 
            sender: "bot",
            type: "table" 
          },
        ]);
      } else if (data.intent === "chart" && data.chartData) {
        // Chart data
        setMessages(prev => [
          ...prev,
          { 
            text: "Here's your chart:", 
            sender: "bot",
            type: "chart",
            chartData: data.chartData 
          },
        ]);
      } else {
        // Fallback
        setMessages(prev => [
          ...prev,
          { 
            text: "I couldn't process that request.", 
            sender: "bot",
            type: "text"
          },
        ]);
      }
    } catch (error) {
      // Remove the "Thinking..." message
      setMessages(prev => prev.filter(msg => msg.text !== "Thinking..."));
      
      setMessages(prev => [
        ...prev,
        {
          text: "Something went wrong while fetching the response.",
          sender: "bot",
          type: "text"
        },
      ]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  // Animation variants
  const chatButtonVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.1 },
    tap: { scale: 0.95 },
  };

  const chatWindowVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.9,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300,
      },
    },
    exit: {
      opacity: 0,
      y: 20,
      scale: 0.9,
      transition: {
        duration: 0.2,
      },
    },
  };

  const messageVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
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
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial="hidden"
                    animate="visible"
                    variants={messageVariants}
                    transition={{ duration: 0.2 }}
                    className={`flex ${
                      message.sender === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg overflow-x-auto ${
                        message.sender === "user"
                          ? "bg-orange-600 text-white rounded-tr-none"
                          : "bg-gray-200 text-gray-800 rounded-tl-none"
                      }`}
                    >
                      {message.type === "table" ? (
                        <div className="overflow-x-auto">
                          <table className="text-sm border border-gray-300 w-full">
                            <thead>
                              <tr>
                                {Object.keys(
                                  Array.isArray(message.text) && message.text.length > 0 
                                    ? message.text[0] 
                                    : {}
                                ).map((key) => (
                                  <th
                                    key={key}
                                    className="px-2 py-1 border-b border-gray-300 text-left font-semibold"
                                  >
                                    {key}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {Array.isArray(message.text) && message.text.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                  {Object.values(row).map((val, colIndex) => (
                                    <td
                                      key={colIndex}
                                      className="px-2 py-1 border-b border-gray-200"
                                    >
                                      {String(val)}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : message.type === "chart" && message.chartData ? (
                        <div className="w-full h-48">
                          <p className="text-sm mb-1">{message.text}</p>
                          <ChartRenderer {...message.chartData} />
                        </div>
                      ) : (
                        message.text
                      )}
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
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