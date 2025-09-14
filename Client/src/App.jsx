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
    <div className="relative bg-blue-600 text-white rounded-2xl p-3 shadow-sm max-w-[70%]">
      <div className="absolute -right-2 top-3 w-0 h-0 border-y-8 border-y-transparent border-l-8 border-l-blue-600"></div>
      <p className="leading-relaxed">{children}</p>
    </div>
    <div className="shrink-0 w-10 h-10 rounded-full bg-blue-100 grid place-content-center text-xl">
      👧🏼
    </div>
  </div>
);

const initialBot = {
  role: "bot",
  text: "Hey! I’m your weather AI bestie ☀️🤖 What’s your name?",
};

export default function App() {
  const [messages, setMessages] = useState([initialBot]);
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
    setMessages([initialBot]);
    setState({ step: "askName" });
    setInput("");
    scroller.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function send(text) {
    setMessages((m) => [...m, { role: "user", text }]);

    // ask name → ask city
    if (state.step === "askName") {
      setState({ step: "askCity", name: text });
      setMessages((m) => [
        ...m,
        {
          role: "bot",
          text: `Hi ${text} 💐🥰! Which city are you curious about first?`,
        },
      ]);
      return;
    }

    // fetch current weather
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
            text: `Nice! Weather in ${w.city}: ${w.description}. Temp ${w.tempC}°C, feels like ${w.feelsC}°C.`,
            icon,
          },
        ]);
        setState((s) => ({ ...s, step: "keepPlanning", city }));
        setMessages((m) => [
          ...m,
          {
            role: "bot",
            text: "We’re about to plan the most spontaneous trip. Still in? (yes/no)",
          },
        ]);
      } catch (e) {
        setMessages((m) => [
          ...m,
          {
            role: "bot",
            text: "Hmm, that doesn't look like a city — maybe check the spelling?",
          },
        ]);
      }
      return;
    }

    // confirm planning
    if (state.step === "keepPlanning") {
      if (text.trim().toLowerCase() !== "yes") {
        setMessages((m) => [
          ...m,
          { role: "bot", text: "Okay, you’re missing out! Cya!!" },
        ]);
        setState({ step: "done" });
        return;
      }
      setState((s) => ({ ...s, step: "askHoliday1" }));
      setMessages((m) => [
        ...m,
        {
          role: "bot",
          text: "SO! In 3 days, which city should we go to? (somewhere hot please!!)",
        },
      ]);
      return;
    }

    // first holiday city → forecast + suggestion
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
      // activity based on current weather vibe
      try {
        const w = await fetch(
          `${API}/api/weather?city=${encodeURIComponent(firstCity)}`
        ).then((r) => r.json());
        const desc = (w.description || "").toLowerCase();
        let suggestion = "Let's have the bestest day ever!🤪🤪";
        if (desc.includes("rain"))
          suggestion =
            "Let’s go on a walk in the rain — you better not straighten your hair!💆🏼‍";
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

    // second city → sunrise/sunset → finish
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
    if (isDone) {
      resetChat(); // turn the button into “New chat”
      return;
    }
    const text = input.trim();
    if (!text) return;
    setInput("");
    await send(text);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white border rounded-3xl shadow-xl overflow-hidden">
        <header className="px-5 py-4 border-b flex items-center gap-3">
          <div className="w-9 h-9 grid place-content-center text-xl">🤖</div>
          <div>
            <h1 className="text-lg font-semibold">Weather Bestie</h1>
            <p className="text-xs text-gray-500">
              Plan a spontaneous trip with your robot buddy
            </p>
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
                  : "Type to your robot bestie..."
              }
              disabled={isDone}
            />
            <button
              className="px-5 py-3 rounded-xl border bg-blue-600 text-white"
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
