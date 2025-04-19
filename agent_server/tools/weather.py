import os
import requests
from agents import function_tool
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")

def get_coordinates(city: str):
    """
    Get latitude and longitude for a given city using OpenWeatherMap's Geocoding API.
    """
    geocode_url = f"http://api.openweathermap.org/geo/1.0/direct?q={city}&limit=1&appid={OPENWEATHER_API_KEY}"
    print(f"[DEBUG] Geocoding URL: {geocode_url}")
    response = requests.get(geocode_url)
    print(f"[DEBUG] Geocode status: {response.status_code}")
    print(f"[DEBUG] Geocode response: {response.text}")
    
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

    url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}&units=metric"
    print(f"[DEBUG] Weather URL: {url}")
    response = requests.get(url)
    print(f"[DEBUG] Weather status: {response.status_code}")
    print(f"[DEBUG] Weather response: {response.text}")

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
    Get hourly weather forecast (up to 48 hours) using OpenWeatherMap One Call API 3.0.
    """
    print(f"[DEBUG] get_hourly_forecast() called with city='{city}', hours={hours}")
    
    if hours <= 0 or hours > 48:
        return "Please specify a number of hours between 1 and 48."

    try:
        lat, lon = get_coordinates(city)
        print(f"[DEBUG] Coordinates for '{city}': lat={lat}, lon={lon}")
    except ValueError as e:
        return str(e)

    url = f"https://api.openweathermap.org/data/3.0/onecall?lat={lat}&lon={lon}&exclude=current,minutely,daily,alerts&appid={OPENWEATHER_API_KEY}&units=metric"
    print(f"[DEBUG] Hourly Forecast URL: {url}")
    response = requests.get(url)
    print(f"[DEBUG] Hourly Forecast status: {response.status_code}")
    print(f"[DEBUG] Hourly Forecast response: {response.text[:500]}")  # Avoid overly long logs

    if response.status_code != 200:
        return f"Failed to retrieve hourly forecast: {response.text}"

    try:
        data = response.json()
        forecasts = data.get("hourly", [])
        print(f"[DEBUG] Number of hourly data points: {len(forecasts)}")
        output = f"Hourly forecast for {city}:\n"

        for hour in forecasts[:hours]:
            temp = hour["temp"]
            desc = hour["weather"][0]["description"]
            timestamp = datetime.utcfromtimestamp(hour["dt"]).strftime('%Y-%m-%d %H:%M')
            output += f" - {timestamp}: {desc}, {temp}°C\n"

        return output.strip()
    except Exception as e:
        return f"Error parsing hourly forecast: {str(e)}"


def get_daily_forecast(city: str, days: int) -> str:
    """
    Get daily weather forecast (up to 7 days) using OpenWeatherMap One Call API 3.0.
    """
    print(f"[DEBUG] get_daily_forecast() called with city='{city}', days={days}")

    if days <= 0 or days > 7:
        return "Please specify a number of days between 1 and 7."

    try:
        lat, lon = get_coordinates(city)
        print(f"[DEBUG] Coordinates for '{city}': lat={lat}, lon={lon}")
    except ValueError as e:
        return str(e)

    url = f"https://api.openweathermap.org/data/3.0/onecall?lat={lat}&lon={lon}&exclude=current,minutely,hourly,alerts&appid={OPENWEATHER_API_KEY}&units=metric"
    print(f"[DEBUG] Daily Forecast URL: {url}")
    response = requests.get(url)
    print(f"[DEBUG] Daily Forecast status: {response.status_code}")
    print(f"[DEBUG] Daily Forecast response: {response.text[:500]}")

    if response.status_code != 200:
        return f"Failed to retrieve daily forecast: {response.text}"

    try:
        data = response.json()
        forecasts = data.get("daily", [])
        print(f"[DEBUG] Number of daily data points: {len(forecasts)}")

        output = f"{days}-day forecast for {city}:\n"
        for i, forecast in enumerate(forecasts[:days]):
            day_temp = forecast["temp"]["day"]
            night_temp = forecast["temp"]["night"]
            desc = forecast["weather"][0]["description"]
            output += f" - Day {i+1}: {desc}, Day Temp: {day_temp}°C, Night Temp: {night_temp}°C\n"

        return output.strip()
    except Exception as e:
        return f"Error parsing daily forecast: {str(e)}"
