# AI Weather Chatbox (AI Trip Planner)

AI Weather Chatbox is a chat-based web app that helps you check the weather, view forecasts, and plan short trips in a conversational way.  
The project includes a React frontend and a Python FastAPI backend, and it uses the OpenWeatherMap API to fetch real-time weather and forecast data.


---

## Features
- Chatbox interface with a friendly assistant  
- Current weather data by city  
- 3-day weather forecasts with activity suggestions  
- Sunrise and sunset times for planning  
- Option to rename your robot assistant  

---

## Tech Stack
- **Frontend:** React (Vite) + TailwindCSS  
- **Backend:** Python (FastAPI)  
- **API:** OpenWeatherMap  

---

## Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/ElizabethBeaton/ai-weather-planner.git
cd ai-weather-planner

## Backend setup

cd Server
python -m venv .venv
source .venv/bin/activate   # Mac/Linux
# .venv\Scripts\activate    # Windows PowerShell

pip install -r requirements.txt
uvicorn main:app --reload

## Frontend setup (new terminal)

cd Client
npm install
npm run dev


