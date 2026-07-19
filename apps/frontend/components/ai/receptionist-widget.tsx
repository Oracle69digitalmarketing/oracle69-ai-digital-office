"use client";

import { useState } from "react";
import { MessageSquare, X, Send, Minimize2, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ReceptionistWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Welcome to Oracle69! I am your AI Receptionist. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: "user", content: input }]);
    setInput("");
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { role: "assistant", content: "I've received your request. I am routing this to the Chief of Staff for planning." }]);
    }, 1000);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition-all"
      >
        <MessageSquare className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className={cn(
      "fixed right-6 flex flex-col bg-white shadow-2xl transition-all border border-gray-200 rounded-t-lg overflow-hidden",
      isMinimized ? "bottom-0 h-14 w-72" : "bottom-6 h-[500px] w-96"
    )}>
      <div className="flex h-14 items-center justify-between bg-indigo-600 px-4 text-white">
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 rounded-full bg-green-400"></div>
          <span className="font-medium text-sm text-white">AI Receptionist</span>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => setIsMinimized(!isMinimized)} className="p-1 hover:bg-indigo-500 rounded">
            {isMinimized ? <Maximize2 className="h-4 w-4 text-white" /> : <Minimize2 className="h-4 w-4 text-white" />}
          </button>
          <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-indigo-500 rounded">
            <X className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 text-black">
            {messages.map((msg, i) => (
              <div key={i} className={cn(
                "max-w-[80%] rounded-lg p-3 text-sm",
                msg.role === "user" 
                  ? "ml-auto bg-indigo-600 text-white" 
                  : "bg-white border border-gray-200"
              )}>
                {msg.content}
              </div>
            ))}
          </div>
          <div className="p-4 border-t bg-white">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type your message..."
                className="flex-1 bg-gray-100 rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500 text-black"
              />
              <button
                onClick={handleSend}
                className="p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
