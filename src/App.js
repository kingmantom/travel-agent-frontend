import React, { useState, useRef, useEffect } from "react";
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
  const [context, setContext] = useState(null);
  const [suggestedRoutes, setSuggestedRoutes] = useState([]);
  const [previousSuggestions, setPreviousSuggestions] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const extractRoutesFromResponse = (text) => {
    const matches = text?.match(/(?<=["\u05F4“”])[^"\u05F4“”]+(?=["\u05F4“”])/g);
    return matches ? [...new Set(matches)] : [];
  };

  const handleSendMessage = async () => {
    setPreviousSuggestions([]);
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
      const res = await fetch("https://travel-agent-backend-ztzn.onrender.com/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, ...(context ? { context } : {}) }),
      });

      const data = await res.json();

      const botMessage = {
        id: Date.now().toString(),
        content: data.response || "מצטער, לא הצלחתי להבין 😅",
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);

      const cleaned = extractRoutesFromResponse(data.response);
      setSuggestedRoutes(cleaned);
      setPreviousSuggestions(cleaned);

      setContext(data.context || null);
    } catch {
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        content: "שגיאה בתקשורת עם השרת 😕",
        sender: "bot",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccessibilityResponse = async (wantsAccessibility) => {
    if (!context) return;
    setIsLoading(true);
    try {
      const res = await fetch("https://travel-agent-backend-ztzn.onrender.com/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: wantsAccessibility ? "כן" : "לא", context }),
      });

      const data = await res.json();

      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        content: data.response || "שגיאה בעיבוד הבקשה 😕",
        sender: "bot",
        timestamp: new Date(),
      }]);

      const cleaned = extractRoutesFromResponse(data.response);
      setSuggestedRoutes(cleaned);
      setPreviousSuggestions(cleaned);

      setContext(null);
    } catch {
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        content: "שגיאה בשליחת הנתונים לשרת 😕",
        sender: "bot",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimilarClick = async (routeName) => {
    if (!routeName) return;
    setIsLoading(true);
    try {
      const res = await fetch("https://travel-agent-backend-ztzn.onrender.com/similar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ route_name: routeName }),
      });

      const data = await res.json();

      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        content: data.response || "לא נמצאו מסלולים דומים 😅",
        sender: "bot",
        timestamp: new Date(),
      }]);
      setSuggestedRoutes([]);
    } catch {
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        content: "שגיאה בשליפת מסלולים דומים 😕",
        sender: "bot",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSuggestions = () => {
    setSuggestedRoutes(previousSuggestions);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: "1",
        content: "שלום! אני העוזר שלך למציאת מסלולי טיול בישראל. איך אוכל לעזור לך היום?",
        sender: "bot",
        timestamp: new Date(),
      },
    ]);
    setInput("");
    setContext(null);
    setSuggestedRoutes([]);
    setPreviousSuggestions([]);
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
            <div ref={messagesEndRef}></div>
          </div>
        </div>

        {context?.followup_required && !isLoading && (
          <div className="similar-button-wrapper">
            <p>האם חשוב לך שהמסלול יהיה נגיש לנכים?</p>
            <button className="similar-button" onClick={() => handleAccessibilityResponse(true)}>כן</button>
            <button className="similar-button" onClick={() => handleAccessibilityResponse(false)}>לא</button>
          </div>
        )}

        {suggestedRoutes.length > 0 && !isLoading && (
          <div className="similar-button-wrapper">
            <p>🔁 רוצה לראות מסלולים דומים לאחד מהם?</p>
            {suggestedRoutes.map((route, index) => (
              <button key={index} onClick={() => handleSimilarClick(route)} className="similar-button">
                {route}
              </button>
            ))}
          </div>
        )}

        {previousSuggestions.length > 0 && suggestedRoutes.length === 0 && !isLoading && (
          <div className="similar-button-wrapper">
            <button onClick={handleBackToSuggestions} className="similar-button">
              ← חזור להצעות הקודמות
            </button>
          </div>
        )}

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

        <div className="reset-button-wrapper">
          <button className="similar-button" onClick={handleResetChat}>
            🛑 סיים שיחה והתחל מחדש
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
