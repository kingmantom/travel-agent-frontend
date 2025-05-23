import React, { useState } from "react";
import { Send, Mountain } from "lucide-react";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([
    {
      id: "1",
      content: "שלום! אני העוזר שלך למציאת מסלולי טיול בישראל. איך אוכל לעזור לך היום?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      content: input,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();

      const botMessage = {
        id: Date.now().toString(),
        content: data.response || "מצטער, לא הצלחתי להבין 😅",
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          content: "שגיאה בתקשורת עם השרת 😕",
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chat-wrapper">
      <div className="chat-card">
        <div className="chat-header">
          <Mountain className="icon" />
          <span>מסלולי טיול בישראל</span>
        </div>

        <div className="chat-content">
          <div className="messages" dir="rtl">
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.sender}`}>
                {message.content}
              </div>
            ))}
            {isLoading && (
              <div className="message bot loading">
                <span className="dot"></span>
                <span className="dot delay1"></span>
                <span className="dot delay2"></span>
              </div>
            )}
          </div>
        </div>

        <div className="chat-footer">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="הקלד את שאלתך כאן..."
            dir="rtl"
          />
          <button onClick={handleSendMessage} disabled={isLoading || !input.trim()}>
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
