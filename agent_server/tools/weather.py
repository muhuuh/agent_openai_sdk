# weather.py
import os
import requests
from dotenv import load_dotenv
from datetime import datetime
import sys

load_dotenv()
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")

def get_coordinates(city: str):
    """
    Get latitude and longitude for a given city using OpenWeatherMap's Geocoding API.
    """
    geocode_url = (
        f"http://api.openweathermap.org/geo/1.0/direct"
        f"?q={city}&limit=1&appid={OPENWEATHER_API_KEY}"
    )
    print(f"[DEBUG] Geocoding URL: {geocode_url}", file=sys.stderr)
    response = requests.get(geocode_url)
    print(f"[DEBUG] Geocode status: {response.status_code}", file=sys.stderr)
    if response.status_code != 200 or not response.json():
        raise ValueError(f"Could not retrieve coordinates for {city}")
    data = response.json()[0]
    return data['lat'], data['lon']

def get_weather(city: str) -> str:
    """
    Get the current weather for a specified city using the free OpenWeatherMap API.
    """
    try:
        lat, lon = get_coordinates(city)
    except ValueError as e:
        return str(e)

    url = (
        f"https://api.openweathermap.org/data/2.5/weather"
        f"?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}&units=metric"
    )
    print(f"[DEBUG] Weather URL: {url}", file=sys.stderr)
    response = requests.get(url)
    print(f"[DEBUG] Weather status: {response.status_code}", file=sys.stderr)

    if response.status_code != 200:
        return f"Failed to retrieve weather data: {response.text}"

    data = response.json()
    weather = data["weather"][0]["description"]
    temperature = data["main"]["temp"]
    feels_like = data["main"]["feels_like"]
    humidity = data["main"]["humidity"]

    return (
        f"Current weather in {city}: {weather}. "
        f"Temperature: {temperature}°C, feels like {feels_like}°C. "
        f"Humidity: {humidity}%."
    )

def get_hourly_forecast(city: str, hours: int) -> str:
    """
    Get hourly weather forecast (up to 48 hours)
    """
    print(f"[DEBUG] get_hourly_forecast(city={city!r}, hours={hours})", file=sys.stderr)
    if hours <= 0 or hours > 48:
        return "Please specify a number of hours between 1 and 48."
    try:
        lat, lon = get_coordinates(city)
    except ValueError as e:
        return str(e)

    url = (
        f"https://api.openweathermap.org/data/3.0/onecall"
        f"?lat={lat}&lon={lon}&exclude=current,minutely,daily,alerts"
        f"&appid={OPENWEATHER_API_KEY}&units=metric"
    )
    print(f"[DEBUG] Hourly URL: {url}", file=sys.stderr)
    response = requests.get(url)
    if response.status_code != 200:
        return f"Failed to retrieve hourly forecast: {response.text}"

    data = response.json().get("hourly", [])
    output = f"Hourly forecast for {city}:\n"
    for hour in data[:hours]:
        ts = datetime.utcfromtimestamp(hour["dt"]).strftime("%Y-%m-%d %H:%M")
        output += f" - {ts}: {hour['weather'][0]['description']}, {hour['temp']}°C\n"
    return output.strip()

def get_daily_forecast(city: str, days: int) -> str:
    """
    Get daily weather forecast (up to 7 days)
    """
    print(f"[DEBUG] get_daily_forecast(city={city!r}, days={days})", file=sys.stderr)
    if days <= 0 or days > 7:
        return "Please specify a number of days between 1 and 7."
    try:
        lat, lon = get_coordinates(city)
    except ValueError as e:
        return str(e)

    url = (
        f"https://api.openweathermap.org/data/3.0/onecall"
        f"?lat={lat}&lon={lon}&exclude=current,minutely,hourly,alerts"
        f"&appid={OPENWEATHER_API_KEY}&units=metric"
    )
    print(f"[DEBUG] Daily URL: {url}", file=sys.stderr)
    response = requests.get(url)
    if response.status_code != 200:
        return f"Failed to retrieve daily forecast: {response.text}"

    data = response.json().get("daily", [])
    output = f"{days}-day forecast for {city}:\n"
    for i, d in enumerate(data[:days], 1):
        output += (
            f" - Day {i}: {d['weather'][0]['description']}, "
            f"Day {d['temp']['day']}°C / Night {d['temp']['night']}°C\n"
        )
    return output.strip()
