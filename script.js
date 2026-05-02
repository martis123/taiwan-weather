const cities = [
  { displayName: "台北市", cwaName: "臺北市" },
  { displayName: "新北市", cwaName: "新北市" },
  { displayName: "基隆市", cwaName: "基隆市" },
  { displayName: "桃園市", cwaName: "桃園市" },
  { displayName: "新竹市", cwaName: "新竹市" },
  { displayName: "新竹縣", cwaName: "新竹縣" },
  { displayName: "苗栗縣", cwaName: "苗栗縣" },
  { displayName: "台中市", cwaName: "臺中市" },
  { displayName: "彰化縣", cwaName: "彰化縣" },
  { displayName: "南投縣", cwaName: "南投縣" },
  { displayName: "雲林縣", cwaName: "雲林縣" },
  { displayName: "嘉義市", cwaName: "嘉義市" },
  { displayName: "嘉義縣", cwaName: "嘉義縣" },
  { displayName: "台南市", cwaName: "臺南市" },
  { displayName: "高雄市", cwaName: "高雄市" },
  { displayName: "屏東縣", cwaName: "屏東縣" },
  { displayName: "宜蘭縣", cwaName: "宜蘭縣" },
  { displayName: "花蓮縣", cwaName: "花蓮縣" },
  { displayName: "台東縣", cwaName: "臺東縣" },
  { displayName: "澎湖縣", cwaName: "澎湖縣" },
  { displayName: "金門縣", cwaName: "金門縣" },
  { displayName: "連江縣", cwaName: "連江縣" }
];

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
  refreshButton: document.querySelector("#refreshButton"),
  settingsButton: document.querySelector("#settingsButton"),
  authCard: document.querySelector("#authCard"),
  apiKeyInput: document.querySelector("#apiKeyInput"),
  saveApiKeyButton: document.querySelector("#saveApiKeyButton")
};

const AUTO_REFRESH_MS = 10 * 60 * 1000;
const API_KEY_STORAGE = "cwaWeatherApiKey";
const CITY_STORAGE = "selectedTaiwanWeatherCity";
const CWA_ENDPOINT = "https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001";
let autoRefreshTimer;
let installPromptEvent;

const dateFormatter = new Intl.DateTimeFormat("zh-TW", {
  month: "numeric",
  day: "numeric",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit"
});

const timeFormatter = new Intl.DateTimeFormat("zh-TW", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Taipei"
});

function setupCityOptions() {
  const savedCity = localStorage.getItem(CITY_STORAGE) || "臺北市";

  cities.forEach((city) => {
    const option = document.createElement("option");
    option.value = city.cwaName;
    option.textContent = city.displayName;
    dom.select.append(option);
  });

  dom.select.value = savedCity;
}

function setupApiKey() {
  const savedKey = localStorage.getItem(API_KEY_STORAGE) || "";
  dom.apiKeyInput.value = savedKey;
  dom.authCard.hidden = Boolean(savedKey);
  dom.settingsButton.setAttribute("aria-expanded", String(!dom.authCard.hidden));
}

function getSelectedCity() {
  return cities.find((city) => city.cwaName === dom.select.value) || cities[0];
}

function getApiKey() {
  return dom.apiKeyInput.value.trim();
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

  dom.autoUpdateAt.textContent = `下次自動更新：${timeFormatter.format(nextUpdate)}`;
  autoRefreshTimer = window.setTimeout(loadWeather, AUTO_REFRESH_MS);
}

function getElementMap(location) {
  return Object.fromEntries(
    location.weatherElement.map((element) => [element.elementName, element.time])
  );
}

function getParameter(timeItem) {
  return timeItem?.parameter?.parameterName || "--";
}

function getIcon(condition) {
  if (condition.includes("雷")) return "⛈️";
  if (condition.includes("雨")) return "🌧️";
  if (condition.includes("陰")) return "☁️";
  if (condition.includes("雲")) return "⛅";
  if (condition.includes("晴")) return "☀️";
  return "🌡️";
}

function formatPeriod(startTime, endTime) {
  return `${dateFormatter.format(new Date(startTime))} - ${dateFormatter.format(new Date(endTime))}`;
}

async function loadWeather() {
  const apiKey = getApiKey();

  if (!apiKey) {
    dom.current.hidden = true;
    dom.forecastGrid.replaceChildren();
    dom.authCard.hidden = false;
    dom.settingsButton.setAttribute("aria-expanded", "true");
    setStatus("請先貼上中央氣象署 OpenData 授權碼，然後按「儲存」。", true);
    return;
  }

  const city = getSelectedCity();
  localStorage.setItem(CITY_STORAGE, city.cwaName);
  setStatus(`正在讀取中央氣象署 ${city.displayName} 預報...`);
  dom.current.hidden = true;
  dom.forecastGrid.replaceChildren();

  const params = new URLSearchParams({
    Authorization: apiKey,
    format: "JSON",
    locationName: city.cwaName
  });

  try {
    const response = await fetch(`${CWA_ENDPOINT}?${params}`);

    if (!response.ok) {
      throw new Error("中央氣象署服務暫時無法回應");
    }

    const data = await response.json();
    const location = data.records?.location?.[0];

    if (!location) {
      throw new Error("查不到這個縣市的中央氣象署預報資料");
    }

    renderWeather(city, location);
    hideStatus();
  } catch (error) {
    setStatus(`${error.message}。請確認授權碼是否正確，或稍後再試。`, true);
  } finally {
    scheduleAutoRefresh();
  }
}

function renderWeather(city, location) {
  const elements = getElementMap(location);
  const firstWeather = elements.Wx?.[0];
  const firstCondition = getParameter(firstWeather);
  const firstMin = getParameter(elements.MinT?.[0]);
  const firstMax = getParameter(elements.MaxT?.[0]);
  const firstRain = getParameter(elements.PoP?.[0]);
  const firstComfort = getParameter(elements.CI?.[0]);

  dom.cityName.textContent = city.displayName;
  dom.updatedAt.textContent = firstWeather
    ? `預報期間：${formatPeriod(firstWeather.startTime, firstWeather.endTime)}`
    : "中央氣象署 36 小時預報";
  dom.icon.textContent = getIcon(firstCondition);
  dom.temperature.textContent = `${firstMin}° / ${firstMax}°`;
  dom.condition.textContent = firstCondition;
  dom.feelsLike.textContent = `${firstMax}°C`;
  dom.rainChance.textContent = `${firstRain}%`;
  dom.humidity.textContent = `${firstMin}°C`;
  dom.windSpeed.textContent = firstComfort;
  dom.current.hidden = false;

  renderForecast(elements);
}

function renderForecast(elements) {
  const periods = elements.Wx || [];

  periods.forEach((period, index) => {
    const condition = getParameter(period);
    const minT = getParameter(elements.MinT?.[index]);
    const maxT = getParameter(elements.MaxT?.[index]);
    const rain = getParameter(elements.PoP?.[index]);
    const comfort = getParameter(elements.CI?.[index]);
    const card = document.createElement("article");
    card.className = "forecast-card";
    card.innerHTML = `
      <p class="forecast-date">${formatPeriod(period.startTime, period.endTime)}</p>
      <p class="mini-icon" aria-hidden="true">${getIcon(condition)}</p>
      <p class="forecast-temp">${minT}° / ${maxT}°</p>
      <p class="forecast-rain">${condition} · 降雨 ${rain}% · ${comfort}</p>
    `;
    dom.forecastGrid.append(card);
  });
}

setupCityOptions();
setupApiKey();
dom.select.addEventListener("change", loadWeather);
dom.refreshButton.addEventListener("click", loadWeather);
dom.settingsButton.addEventListener("click", () => {
  dom.authCard.hidden = !dom.authCard.hidden;
  dom.settingsButton.setAttribute("aria-expanded", String(!dom.authCard.hidden));
});
dom.saveApiKeyButton.addEventListener("click", () => {
  localStorage.setItem(API_KEY_STORAGE, getApiKey());
  dom.authCard.hidden = true;
  dom.settingsButton.setAttribute("aria-expanded", "false");
  loadWeather();
});

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
