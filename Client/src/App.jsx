import { useEffect, useRef, useState } from "react";

const API = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const RobotBubble = ({ children }) => (
  <div className="flex items-start gap-3">
    <div className="shrink-0 w-10 h-10 rounded-full bg-gray-200 grid place-content-center text-xl">
      🤖
    </div>
    <div className="relative bg-white border rounded-2xl p-3 shadow-sm max-w-[70%]">
      <div className="absolute -left-2 top-3 w-0 h-0 border-y-8 border-y-transparent border-r-8 border-r-white"></div>
      <p className="leading-relaxed">{children}</p>
    </div>
  </div>
);

const HumanBubble = ({ children }) => (
  <div className="flex items-start gap-3 justify-end">
    <div className="relative bg-pink-600 text-white rounded-2xl p-3 shadow-sm max-w-[70%]">
      <div className="absolute -right-2 top-3 w-0 h-0 border-y-8 border-y-transparent border-l-8 border-l-pink-600"></div>
      <p className="leading-relaxed">{children}</p>
    </div>
    <div className="shrink-0 w-10 h-10 rounded-full bg-blue-100 grid place-content-center text-xl">
      👧🏼
    </div>
  </div>
);

export default function App() {
  const DEFAULT_NAME = "Weather Bestie";
  const [botName, setBotName] = useState(
    () => localStorage.getItem("botName") || DEFAULT_NAME
  );
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(botName);

  useEffect(() => {
    localStorage.setItem("botName", botName);
  }, [botName]);

  const [messages, setMessages] = useState([
    { role: "bot", text: `Hey! I’m ${botName} 🤖☀️ What’s your name?` },
  ]);
  const [input, setInput] = useState("");
  const [state, setState] = useState({ step: "askName" });
  const scroller = useRef(null);

  useEffect(() => {
    scroller.current?.scrollTo({
      top: scroller.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  function resetChat() {
    setMessages([
      { role: "bot", text: `Hey! I’m ${botName} 🤖☀️ What’s your name?` },
    ]);
    setState({ step: "askName" });
    setInput("");
    scroller.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  function applyNewName(newName) {
    const clean = newName.trim();
    if (!clean) return;
    setBotName(clean);
    setTempName(clean);
    setIsEditingName(false);
    // 🔻 removed: bot sends "You can call me ..." message
  }

  async function send(text) {
    setMessages((m) => [...m, { role: "user", text }]);

    if (state.step === "askName") {
      setState({ step: "askCity", name: text });
      setMessages((m) => [
        ...m,
        {
          role: "bot",
          text: `Hi ${text} 🌸! Which city should we check out first?`,
        },
      ]);
      return;
    }

    if (state.step === "askCity") {
      const city = text;
      try {
        const r = await fetch(
          `${API}/api/weather?city=${encodeURIComponent(city)}`
        );
        if (!r.ok) throw new Error("City not found");
        const w = await r.json();
        const icon = w.icon
          ? `https://openweathermap.org/img/wn/${w.icon}.png`
          : null;
        setMessages((m) => [
          ...m,
          {
            role: "bot",
            text: `Nice! Weather in ${w.city}: ${w.description}. The temperature is ${w.tempC}°C, and feels like ${w.feelsC}°C.`,
            icon,
          },
        ]);
        setState((s) => ({ ...s, step: "keepPlanning", city }));
        setMessages((m) => [
          ...m,
          {
            role: "bot",
            text: "So.. want me to plan a little spontaneous trip? 🤞🏼 (yes/no)",
          },
        ]);
      } catch (e) {
        setMessages((m) => [
          ...m,
          {
            role: "bot",
            text: "Uh oh, that doesn't look like a city — maybe check the spelling?",
          },
        ]);
      }
      return;
    }

    if (state.step === "keepPlanning") {
      if (text.trim().toLowerCase() !== "yes") {
        setMessages((m) => [
          ...m,
          { role: "bot", text: "Okay, maybe next time! Ciao!!" },
        ]);
        setState({ step: "done" });
        return;
      }
      setState((s) => ({ ...s, step: "askHoliday1" }));
      setMessages((m) => [
        ...m,
        {
          role: "bot",
          text: "In 3 days, which city shall we go to?",
        },
      ]);
      return;
    }

    if (state.step === "askHoliday1") {
      const firstCity = text;
      try {
        const f = await fetch(
          `${API}/api/forecast3?city=${encodeURIComponent(firstCity)}`
        );
        if (!f.ok) throw new Error("no forecast");
        const fc = await f.json();
        setMessages((m) => [
          ...m,
          {
            role: "bot",
            text: `Nice choice bestie!!! On ${fc.date}, ${firstCity} will be ${fc.tempC}°C and ${fc.description} — not bad at all!`,
          },
        ]);
      } catch (e) {
        setMessages((m) => [
          ...m,
          { role: "bot", text: "Forecast data not available for that date." },
        ]);
      }
      try {
        const w = await fetch(
          `${API}/api/weather?city=${encodeURIComponent(firstCity)}`
        ).then((r) => r.json());
        const desc = (w.description || "").toLowerCase();
        let suggestion = "You're going to have the bestest day ever!🤪🤪";
        if (desc.includes("rain"))
          suggestion =
            "We could go on a walk in the rain — you better not straighten your hair!💆🏼‍";
        else if (desc.includes("hot"))
          suggestion = "About time we get some sun!! Let’s get a tan!🌞";
        else if (desc.includes("clear"))
          suggestion = "We should defo have a brunch outside!🥗🍴";
        else if (desc.includes("cloud"))
          suggestion = "Maybe we can stay in and watch a movie on this day🍿";
        setMessages((m) => [...m, { role: "bot", text: suggestion }]);
      } catch {}
      setState((s) => ({ ...s, step: "askHoliday2", firstCity }));
      setMessages((m) => [
        ...m,
        {
          role: "bot",
          text: "EXCITING!!! Let’s only stay 24 hours then go somewhere else! I was thinking Madrid, but where would you like to go??",
        },
      ]);
      return;
    }

    if (state.step === "askHoliday2") {
      const secondCity = text;
      try {
        const sun = await fetch(
          `${API}/api/sun?city=${encodeURIComponent(secondCity)}&days_ahead=4`
        ).then((r) => r.json());
        setMessages((m) => [
          ...m,
          {
            role: "bot",
            text: `If we get to ${secondCity} before ${sun.sunrise}am, we’ll catch the sunrise 🌇☄️`,
          },
          {
            role: "bot",
            text: `If we miss that, we can watch sunset at ${sun.sunset}pm. How cute! 🌗🌙 I’m so excited for this trip! 💓`,
          },
          {
            role: "bot",
            text: `Trip saved: ${state.firstCity} ➜ ${secondCity}. (Copy this!)`,
          },
        ]);
      } catch (e) {
        setMessages((m) => [
          ...m,
          { role: "bot", text: "Couldn’t fetch sunrise/sunset for that city." },
        ]);
      }
      setState({ step: "done" });
      return;
    }
  }

  const isDone = state.step === "done";

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    if (text.toLowerCase().startsWith("/name ")) {
      const newName = text.slice(6);
      applyNewName(newName);
      setInput("");
      return;
    }

    if (isDone) {
      resetChat();
      return;
    }

    setInput("");
    await send(text);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white border rounded-3xl shadow-xl overflow-hidden">
        <header className="px-5 py-4 border-b flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 grid place-content-center text-xl">🤖</div>
            <div>
              <h1 className="text-lg font-semibold">{botName}</h1>
              <p className="text-xs text-gray-500">
                Plan a spontaneous trip with your robot best friend
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEditingName ? (
              <>
                <input
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="rounded-lg border px-3 py-1 text-sm focus:outline-none focus:ring"
                  placeholder="Robot name"
                />
                <button
                  onClick={() => applyNewName(tempName)}
                  className="px-3 py-1 text-sm rounded-lg border bg-pink-600 text-white"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditingName(false);
                    setTempName(botName);
                  }}
                  className="px-3 py-1 text-sm rounded-lg border"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditingName(true)}
                className="px-3 py-1 text-sm rounded-lg border"
                title="Rename the robot"
              >
                Rename
              </button>
            )}
          </div>
        </header>

        <main
          ref={scroller}
          className="h-[60vh] overflow-y-auto p-5 space-y-3 bg-gray-50"
        >
          {messages.map((m, i) =>
            m.role === "user" ? (
              <HumanBubble key={i}>{m.text}</HumanBubble>
            ) : (
              <div key={i} className="space-y-1">
                <RobotBubble>{m.text}</RobotBubble>
              </div>
            )
          )}
        </main>

        <form onSubmit={handleFormSubmit} className="p-4 border-t bg-white">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 rounded-xl border px-4 py-3 focus:outline-none focus:ring disabled:opacity-60"
              placeholder={
                isDone
                  ? "Chat finished — start a new one"
                  : `Type to ${botName}...`
              }
              disabled={isDone}
            />
            <button
              className="px-5 py-3 rounded-xl border bg-pink-600 text-white"
              type="submit"
            >
              {isDone ? "New chat" : "Send"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
