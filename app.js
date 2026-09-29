const apiKey = "bbe32e9410884dc8872191843262309"
const city = "sikar"
let windspeed
let humidity
let wdirection
let uv
let visibility

fetch(`https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${city}&days=7&aqi=yes`)
  .then(response => response.json())
  .then(data => {
    updateUI(data)
  })

function updateUI(data) {
  console.log(data);

  // The properties below are from OpenWeatherMap, so they will break with WeatherAPI!
  // I have commented them out so you can look at the console log first.


  windspeed = data.current.wind_mph
  document.getElementById("wind").innerHTML = `${windspeed} <span>mph</span>`;

  humidity = data.current.humidity
  document.getElementById("humidityvalue").innerHTML = `${humidity} <span>%</span>`

  wdirection = data.current.wind_dir
  document.getElementById("winddirection").textContent = `Direction: ${wdirection}`

  uv = data.current.uv;
  document.getElementById("uvindexvalue").innerHTML = uv;

  let uvCategory = "";
  if (uv <= 2) {
    uvCategory = "Low";
  } else if (uv <= 5) {
    uvCategory = "Moderate";
  } else if (uv <= 7) {
    uvCategory = "High";
  } else if (uv <= 10) {
    uvCategory = "Very High";
  } else {
    uvCategory = "Extreme";
  }
  document.getElementById("uvindexsub").innerHTML = uvCategory;

  // Precipitation
  let chanceOfRain = data.forecast.forecastday[0].day.daily_chance_of_rain;
  let precipMm = data.current.precip_mm;

  document.getElementById("precipvalue").innerHTML = `${chanceOfRain} <span>%</span>`;
  document.getElementById("precipsub").innerHTML = `Current: ${precipMm}mm`;

  // Pressure
  let pressureMb = data.current.pressure_mb;
  document.getElementById("pressurevalue").innerHTML = `${pressureMb} <span>mb</span>`;

  visibility = data.current.vis_km;
  document.getElementById("Visibilityvalue").innerHTML = `${visibility} <span>km</span>`;

  let visCategory = "";
  if (visibility >= 10) {
    visCategory = "Perfectly clear";
  } else if (visibility >= 4) {
    visCategory = "Good";
  } else if (visibility >= 1) {
    visCategory = "Moderate / Haze";
  } else {
    visCategory = "Poor / Fog";
  }
  document.getElementById("Visibilitysub").innerHTML = visCategory;


  let now = data.current.condition.text;
  let nowicon = data.current.condition.icon;

  // The API sometimes returns URLs starting with "//", so we add "https:" to it
  if (nowicon.startsWith("//")) {
    nowicon = "https:" + nowicon;
  }

  // Inject into small card (only the giant icon, like in your image!)
  document.getElementById("small-card").innerHTML = `
    <img src="${nowicon}" alt="${now}" style="width: 150px;"> 
  `;

  // Inject into the left side (Condition text, small icon, and temperatures)
  document.getElementById("condition-header").innerHTML = `
    <img src="${nowicon}" alt="${now}" style="width: 40px;"> 
    <span>${now}</span>
  `;

  let currentTemp = Math.round(data.current.temp_c);
  let highTemp = Math.round(data.forecast.forecastday[0].day.maxtemp_c);
  let lowTemp = Math.round(data.forecast.forecastday[0].day.mintemp_c);
  let feelsLike = Math.round(data.current.feelslike_c);

  document.getElementById("current-temp").innerHTML = `${currentTemp}&deg;`;
  document.getElementById("high-low-feels").innerHTML = `H: ${highTemp}&deg; &bull; L: ${lowTemp}&deg; &bull; Feels like ${feelsLike}&deg;`;

  // --- VERY SIMPLE CHART LOGIC ---
  const chartLabels = [];
  const chartData = [];

  // 1. Combine today's and tomorrow's hours into one list
  const allHours = [...data.forecast.forecastday[0].hour, ...data.forecast.forecastday[1].hour];

  // 2. Find the current time in the list
  const currentHourEpoch = data.current.last_updated_epoch;
  let startIndex = allHours.findIndex(hour => hour.time_epoch >= currentHourEpoch);
  if (startIndex === -1) startIndex = 0;

  // 3. Get 8 data points, spaced 3 hours apart
  for (let i = 0; i < 8; i++) {
    let indexToGrab = startIndex + (i * 3);
    let hourData = allHours[indexToGrab];
    
    // The time is something like "2024-05-10 15:00", we split by space to get "15:00"
    let timeString = hourData.time.split(' ')[1]; 
    let temp = Math.round(hourData.temp_c);

    chartLabels.push(timeString);
    chartData.push(temp);
  }

  // 4. Get the canvas from HTML
  const canvas = document.getElementById('myWeatherChart');
  const ctxCanvas = canvas.getContext('2d');

  // 5. If a chart already exists, destroy it so they don't overlap
  if (window.weatherChart) {
    window.weatherChart.destroy();
  }

  // 6. Draw a very basic line chart
  window.weatherChart = new Chart(ctxCanvas, {
    type: 'bar',
    data: {
      labels: chartLabels,
      datasets: [{
        label: 'Temperature (°C)',
        data: chartData,
        borderColor: '#e8e4d9', // Line color
        backgroundColor: 'rgba(232, 228, 217, 0.2)', // Light fill color
        borderWidth: 2,
        fill: true,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });

  // 7. Populate 7-day forecast
  const daysReportDiv = document.getElementById("daysreport");
  daysReportDiv.innerHTML = '<h2>7-DAY FORECAST</h2>'; // Reset inner HTML to keep only the header

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  data.forecast.forecastday.forEach((dayData, index) => {
    let dayName = "";
    if (index === 0) {
      dayName = "Today";
    } else {
      const dateObj = new Date(dayData.date);
      dayName = daysOfWeek[dateObj.getDay()];
    }

    let iconUrl = dayData.day.condition.icon;
    if (iconUrl.startsWith("//")) {
      iconUrl = "https:" + iconUrl;
    }

    const minTemp = Math.round(dayData.day.mintemp_c);
    const maxTemp = Math.round(dayData.day.maxtemp_c);
    const conditionText = dayData.day.condition.text;

    const row = document.createElement("div");
    row.className = "forecast-row";
    row.innerHTML = `
      <div class="day-name">${dayName}</div>
      <div class="day-condition">
        <img src="${iconUrl}" alt="${conditionText}">
        <span>${conditionText}</span>
      </div>
      <div class="day-temp">
        <strong>${maxTemp}&deg;</strong> <span style="color: #7e8ea6;">/ ${minTemp}&deg;</span>
      </div>
    `;

    daysReportDiv.appendChild(row);
  });
}

// /* 
// function getWindDirection(degree) {
//   direction = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
//   directionIndex = Math.floor((degree + 11.25) / 22.5)
  
// }
// */

