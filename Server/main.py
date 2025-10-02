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

# CORS middleware - must be added before routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 
BASE = "https://api.openweathermap.org/data/2.5"


def kelvin_to_celsius(k: float) -> float:
    return k - 273.15


@app.get("/api/weather")
def current_weather(city: str):
    try:
        r = requests.get(
            f"{BASE}/weather",
            params={"q": city, "appid": API_KEY},
            timeout=10
        )
        
        if r.status_code == 404:
            raise HTTPException(404, detail="City not found")
        
        if r.status_code == 401:
            raise HTTPException(500, detail="Invalid API key")
        
        r.raise_for_status()
        data = r.json()
        
        return {
            "city": data['name'],
            "description": data['weather'][0]['description'],
            "icon": data['weather'][0]['icon'],
            "tempC": round(kelvin_to_celsius(data['main']['temp'])),
            "feelsC": round(kelvin_to_celsius(data['main']['feels_like']))
        }
    except requests.exceptions.RequestException as e:
        raise HTTPException(500, detail=f"Error fetching weather data: {str(e)}")


@app.get("/api/forecast3")
def forecast_in_3_days(city: str):
    try:
        target_date = (datetime.now().date() + timedelta(days=3))
        
        r = requests.get(
            f"{BASE}/forecast",
            params={"q": city, "appid": API_KEY},
            timeout=10
        )
        
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
    except requests.exceptions.RequestException as e:
        raise HTTPException(500, detail=f"Error fetching forecast data: {str(e)}")


@app.get("/api/sun")
def sunrise_sunset(city: str, days_ahead: int = 4):
    try:
        r = requests.get(
            f"{BASE}/weather",
            params={"q": city, "appid": API_KEY},
            timeout=10
        )
        
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
    except requests.exceptions.RequestException as e:
        raise HTTPException(500, detail=f"Error fetching sun data: {str(e)}")