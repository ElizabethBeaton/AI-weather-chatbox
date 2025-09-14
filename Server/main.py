import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("OPENWEATHER_API_KEY")
if not API_KEY:
    raise RuntimeError("Set OPENWEATHER_API_KEY in server/.env")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"]
    ,allow_headers=["*"]
)

BASE = "https://api.openweathermap.org/data/2.5"

def kelvin_to_celsius(k: float) -> float:
    return k - 273.15

@app.get("/api/weather")
def current_weather(city: str):
    r = requests.get(f"{BASE}/weather", params={"q": city, "appid": API_KEY})
    if r.status_code == 404:
        raise HTTPException(404, detail="City not found")
    r.raise_for_status()
    data = r.json()
    return {
        "city": city,
        "description": data['weather'][0]['description'],
        "icon": data['weather'][0]['icon'],
        "tempC": round(kelvin_to_celsius(data['main']['temp'])),
        "feelsC": round(kelvin_to_celsius(data['main']['feels_like']))
    }

@app.get("/api/forecast3")
def forecast_in_3_days(city: str):
    # 3‑hourly forecast — pick entries for the target date
    target_date = (datetime.now().date() + timedelta(days=3))
    r = requests.get(f"{BASE}/forecast", params={"q": city, "appid": API_KEY})
    if r.status_code == 404:
        raise HTTPException(404, detail="City not found")
    r.raise_for_status()
    data = r.json()
    match = None
    for item in data['list']:
        dt_ = datetime.fromtimestamp(item['dt'])
        if dt_.date() == target_date:
            match = item
            break
    if not match:
        raise HTTPException(404, detail="No forecast for target date")
    return {
        "date": str(target_date),
        "tempC": round(kelvin_to_celsius(match['main']['temp'])),
        "description": match['weather'][0]['description']
    }

@app.get("/api/sun")
def sunrise_sunset(city: str, days_ahead: int = 4):
    r = requests.get(f"{BASE}/weather", params={"q": city, "appid": API_KEY})
    if r.status_code == 404:
        raise HTTPException(404, detail="City not found")
    r.raise_for_status()
    data = r.json()
    sunrise = datetime.fromtimestamp(data['sys']['sunrise'], tz=timezone.utc) + timedelta(days=days_ahead)
    sunset = datetime.fromtimestamp(data['sys']['sunset'], tz=timezone.utc) + timedelta(days=days_ahead)
    return {
        "sunrise": sunrise.strftime('%H:%M'),
        "sunset": sunset.strftime('%H:%M')
    }
