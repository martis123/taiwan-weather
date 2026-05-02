const cities = [
  { name: "台北市", lat: 25.0375, lon: 121.5637 },
  { name: "新北市", lat: 25.012, lon: 121.4657 },
  { name: "基隆市", lat: 25.1276, lon: 121.7392 },
  { name: "桃園市", lat: 24.9936, lon: 121.301 },
  { name: "新竹市", lat: 24.8039, lon: 120.9647 },
  { name: "新竹縣", lat: 24.839, lon: 121.002 },
  { name: "苗栗縣", lat: 24.5602, lon: 120.8214 },
  { name: "台中市", lat: 24.1477, lon: 120.6736 },
  { name: "彰化縣", lat: 24.0685, lon: 120.5575 },
  { name: "南投縣", lat: 23.9609, lon: 120.9719 },
  { name: "雲林縣", lat: 23.7092, lon: 120.4313 },
  { name: "嘉義市", lat: 23.4801, lon: 120.4491 },
  { name: "嘉義縣", lat: 23.4518, lon: 120.2555 },
  { name: "台南市", lat: 22.9997, lon: 120.227 },
  { name: "高雄市", lat: 22.6273, lon: 120.3014 },
  { name: "屏東縣", lat: 22.5519, lon: 120.5488 },
  { name: "宜蘭縣", lat: 24.7021, lon: 121.7378 },
  { name: "花蓮縣", lat: 23.9872, lon: 121.6015 },
  { name: "台東縣", lat: 22.7972, lon: 121.0714 },
  { name: "澎湖縣", lat: 23.5711, lon: 119.5793 },
  { name: "金門縣", lat: 24.4321, lon: 118.3171 },
  { name: "連江縣", lat: 26.1602, lon: 119.9517 }
];

const weatherCodes = {
  0: ["晴朗", "☀️"],
  1: ["大致晴朗", "🌤️"],
  2: ["局部多雲", "⛅"],
  3: ["陰天", "☁️"],
  45: ["有霧", "🌫️"],
  48: ["霧凇", "🌫️"],
  51: ["毛毛雨", "🌦️"],
  53: ["毛毛雨", "🌦️"],
  55: ["毛毛雨", "🌦️"],
  61: ["小雨", "🌧️"],
  63: ["雨", "🌧️"],
  65: ["大雨", "🌧️"],
  80: ["陣雨", "🌦️"],
  81: ["陣雨", "🌦️"],
  82: ["強陣雨", "⛈️"],
  95: ["雷雨", "⛈️"],
  96: ["雷雨", "⛈️"],
  99: ["雷雨", "⛈️"]
};

const dom = {
  select: document.querySelector("#citySelect"),
  status: document.querySelector("#status"),
  current: document.querySelector("#currentWeather"),
  cityName: document.querySelector("#cityName"),
  updatedAt: document.querySelector("#updatedAt"),
  autoUpdateAt: document.querySelector("#autoUpdateAt"),
  icon: document.querySelector("#weatherIcon"),
  temperature: document.querySelector("#temperature"),
  condition: document.querySelector("#condition"),
  feelsLike: document.querySelector("#feelsLike"),
  rainChance: document.querySelector("#rainChance"),
  humidity: document.querySelector("#humidity"),
  windSpeed: document.querySelector("#windSpeed"),
  forecastGrid: document.querySelector("#forecastGrid"),
  installButton: document.querySelector("#installButton"),
  refreshButton: document.querySelector("#refreshButton")
};

const AUTO_REFRESH_MS = 10 * 60 * 1000;
let autoRefreshTimer;
let installPromptEvent;

const dateFormatter = new Intl.DateTimeFormat("zh-TW", {
  month: "numeric",
  day: "numeric",
  weekday: "short"
});

const timeFormatter = new Intl.DateTimeFormat("zh-TW", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Taipei"
});

function setupCityOptions() {
  const savedCity = localStorage.getItem("selectedTaiwanWeatherCity") || "台北市";

  cities.forEach((city) => {
    const option = document.createElement("option");
    option.value = city.name;
    option.textContent = city.name;
    dom.select.append(option);
  });

  dom.select.value = savedCity;
}

function getSelectedCity() {
  return cities.find((city) => city.name === dom.select.value) || cities[0];
}

function getWeatherInfo(code) {
  return weatherCodes[code] || ["天氣資料", "🌡️"];
}

function setStatus(message, isError = false) {
  dom.status.textContent = message;
  dom.status.classList.toggle("error", isError);
  dom.status.hidden = false;
}

function hideStatus() {
  dom.status.hidden = true;
}

function scheduleAutoRefresh() {
  window.clearTimeout(autoRefreshTimer);
  const nextUpdate = new Date(Date.now() + AUTO_REFRESH_MS);

  if (dom.autoUpdateAt) {
    dom.autoUpdateAt.textContent = `下次自動更新：${timeFormatter.format(nextUpdate)}`;
  }

  autoRefreshTimer = window.setTimeout(loadWeather, AUTO_REFRESH_MS);
}

async function loadWeather() {
  const city = getSelectedCity();
  localStorage.setItem("selectedTaiwanWeatherCity", city.name);
  setStatus(`正在讀取 ${city.name} 天氣資料...`);
  dom.current.hidden = true;
  dom.forecastGrid.replaceChildren();

  const params = new URLSearchParams({
    latitude: city.lat,
    longitude: city.lon,
    timezone: "Asia/Taipei",
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    forecast_days: "7"
  });

  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);

    if (!response.ok) {
      throw new Error("天氣服務暫時無法回應");
    }

    const data = await response.json();
    renderCurrent(city, data.current);
    renderForecast(data.daily);
    hideStatus();
  } catch (error) {
    setStatus(`${error.message}。請稍後再試，或確認網路連線。`, true);
  } finally {
    scheduleAutoRefresh();
  }
}

function renderCurrent(city, current) {
  const [condition, icon] = getWeatherInfo(current.weather_code);

  dom.cityName.textContent = city.name;
  dom.updatedAt.textContent = `更新時間：${timeFormatter.format(new Date(current.time))}`;
  dom.icon.textContent = icon;
  dom.temperature.textContent = `${Math.round(current.temperature_2m)}°C`;
  dom.condition.textContent = condition;
  dom.feelsLike.textContent = `${Math.round(current.apparent_temperature)}°C`;
  dom.rainChance.textContent = "看下方預報";
  dom.humidity.textContent = `${current.relative_humidity_2m}%`;
  dom.windSpeed.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
  dom.current.hidden = false;
}

function renderForecast(daily) {
  daily.time.forEach((date, index) => {
    const [condition, icon] = getWeatherInfo(daily.weather_code[index]);
    const card = document.createElement("article");
    card.className = "forecast-card";
    card.innerHTML = `
      <p class="forecast-date">${dateFormatter.format(new Date(date))}</p>
      <p class="mini-icon" aria-hidden="true">${icon}</p>
      <p class="forecast-temp">${Math.round(daily.temperature_2m_min[index])}° / ${Math.round(daily.temperature_2m_max[index])}°</p>
      <p class="forecast-rain">${condition} · 降雨 ${daily.precipitation_probability_max[index] ?? 0}%</p>
    `;
    dom.forecastGrid.append(card);
  });
}

setupCityOptions();
dom.select.addEventListener("change", loadWeather);
dom.refreshButton.addEventListener("click", loadWeather);

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPromptEvent = event;
  dom.installButton.hidden = false;
});

dom.installButton.addEventListener("click", async () => {
  if (!installPromptEvent) {
    return;
  }

  installPromptEvent.prompt();
  await installPromptEvent.userChoice;
  installPromptEvent = null;
  dom.installButton.hidden = true;
});

window.addEventListener("appinstalled", () => {
  installPromptEvent = null;
  dom.installButton.hidden = true;
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // The app still works if service workers are unavailable.
    });
  });
}

loadWeather();
