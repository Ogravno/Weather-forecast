// henter data fra APIen og returnerer et objekt med data om været
async function getWeatherInfo() {
    var request = await fetch("https://api.open-meteo.com/v1/forecast?latitude=59.9138&longitude=10.7387&hourly=temperature_2m,rain,windspeed_10m&timezone=auto")
    var weather = await request.json()

    var temperatureArray = []
    var windspeedArray = []
    var rainArray = []
    var timeArray = []

    for (x in weather.hourly.temperature_2m) {
        temperatureArray.push(weather.hourly.temperature_2m[x])
        windspeedArray.push(weather.hourly.windspeed_10m[x])
        rainArray.push(weather.hourly.rain[x])
        timeArray.push(weather.hourly.time[x])
    }

    var weatherInfo = {
        temperature: temperatureArray,
        windspeed: windspeedArray,
        rain: rainArray,
        time: timeArray
    }

    return weatherInfo
}

// henter data fra APIen og returnerer en array med hvilken time og hvilket minutt solen steg opp
async function getSunrise() {
    var request = await fetch("https://api.open-meteo.com/v1/forecast?latitude=59.9138&longitude=10.7387&daily=sunrise,sunset&timezone=auto")
    var weatherDaily = await request.json()

    var sunrise = weatherDaily.daily.sunrise[0]
    var sunriseTime = [new Date(sunrise).getHours(), new Date(sunrise).getMinutes()]

    return sunriseTime
}

// henter data fra APIen og returnerer en array med hvilken time og hvilket minutt solen gikk ned
async function getSunset() {
    var request = await fetch("https://api.open-meteo.com/v1/forecast?latitude=59.9138&longitude=10.7387&daily=sunrise,sunset&timezone=auto")
    var weatherDaily = await request.json()

    var sunset = weatherDaily.daily.sunset[0]
    var sunsetTime = [new Date(sunset).getHours(), new Date(sunset).getMinutes()]

    return sunsetTime
}

async function displayWeatherNow() {
    // kaller på funksjonen som henter data fra APIen og lagrer objektet som blir returnert
    var weatherInfo = await getWeatherInfo()

    var nowEl = document.getElementById("now")

    // lagrer hvilken time på døgnet det er som en variabel
    const d = new Date()
    var hour = d.getHours()

    var sunrise = await getSunrise()
    var sunset = await getSunset()

    // kaller på en funksjon som lager nye html elementer
    newElement(nowEl, "span", `${weatherInfo.temperature[hour]} °C<br>`, "temp")
    newElement(nowEl, "span", `${weatherInfo.windspeed[hour]} m/s`, "info")
    newElement(nowEl, "span", weatherInfo.rain[hour] + "mm<br>", "info")
    newElement(nowEl, "span", "Soloppgang: " + sunrise[0] + ":" + sunrise[1] + "<br>", "info")
    newElement(nowEl, "span", "Solnedgang: " + sunset[0] + ":" + sunset[1], "info")


    // endrer bakrunnsfarge på et av html elementene hvis sola er nede
    if (hour > sunset[0] || hour <= sunrise[0]) {
        nowEl.style.backgroundColor = "#000000"
        nowEl.style.color = "#ffffff"
    }

    else {
        nowEl.style.backgroundColor = "#29b6f6"
        nowEl.style.color = "#000000"
    }
    

    var temperaturesDuringDay = weatherInfo.temperature.slice(0, 24)
    var windspeedDuringDay = weatherInfo.windspeed.slice(0, 24)   
    var rainDuringDay = weatherInfo.rain.slice(0, 24)

    var weatherToday =[]
    
    // lager en object array med data om været hver time i dag
    for (let i = 0; i < 24; i++) {
        var hour = null

        if (i < 10) {
            hour = "0" + i + ":00"
        }

        else (
            hour = i + ":00"
        )
        
        var nexHour = {
            hour: hour,
            temperature: temperaturesDuringDay[i],
            windspeed: windspeedDuringDay[i],
            rain: rainDuringDay[i]
        }

        weatherToday.push(nexHour)
    }

    var dayTableEl = document.getElementById("dayTable")

    // lager en tabell med object arrayen som ble lagd
    for (let x of weatherToday) {
        newElement(dayTableEl, "tr")
        newElement(dayTableEl.lastChild, "td", x.hour)
        newElement(dayTableEl.lastChild, "td", `${x.temperature}°`)
        newElement(dayTableEl.lastChild, "td", x.windspeed + "m/s")
        newElement(dayTableEl.lastChild, "td", x.rain + "mm")
    }
    

}

// lager en tabell med værmeldingen for de neste 7 dagene
async function displayWeatherNextSevenDays() {
    var weatherInfo = await getWeatherInfo()

    var days = ["Søndag", "Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag"]

    var next7Days = []

    const d = new Date()

    for (let i = 0; i < 7; i++){
        var startOfDay = i * 24
        var endOfDay = (i + 1) * 24

        var temperaturesDuringDay = weatherInfo.temperature.slice(startOfDay, endOfDay)
        var minTemp = Math.min(...temperaturesDuringDay)
        var maxTemp = Math.max(...temperaturesDuringDay)
       

        var windspeedDuringDay = weatherInfo.windspeed.slice(startOfDay, endOfDay)
        var maxWindspeed = Math.max(...windspeedDuringDay)

        var rainDuringDay = weatherInfo.rain.slice(startOfDay, endOfDay)
        var totalRain = rainDuringDay.reduce((a, b) => a + b, 0)
        totalRain = Math.round(totalRain * 10) / 10

        var nextDay = {
            day: days[d.getDay()],
            minTemperature: minTemp,
            maxTemperature: maxTemp,
            windspeed: maxWindspeed,
            rain: totalRain
        }

        next7Days.push(nextDay)
        d.setDate(d.getDate() + 1)
    }

    console.log(next7Days)

    var weekTableEl = document.getElementById("weekTable")

    for (let x of next7Days) {
        newElement(weekTableEl, "tr")
        newElement(weekTableEl.lastChild, "td", x.day)
        newElement(weekTableEl.lastChild, "td", `${x.minTemperature}° / ${x.maxTemperature}°`)
        newElement(weekTableEl.lastChild, "td", x.windspeed + "m/s")
        newElement(weekTableEl.lastChild, "td", x.rain + "mm")
    }
}

//bruker plotly til å lage en graf som viser temperaturen de neste syv dagene
async function displayTemperatureNextSevenDays() {
    var weatherInfo = await getWeatherInfo()

    var data = [{
        x: weatherInfo.time,
        y: weatherInfo.temperature,
        mode: "lines"
    }]

    var layout = {
        xaxis: {title: "Tid"},
        yaxis: {title: "Grader i celsius"},
        title: "Temperatur de neste 7 dagene"
    }

    Plotly.newPlot("tempPlot", data, layout)
}

// funksjon som lager nye HTML elementer
function newElement(parentElementEl, elementType, text = "none", elementClass = false) {
    var newElement = document.createElement(elementType)

    if (text != "none") {
        newElement.innerHTML = text
    }

    if (elementClass != false) {
        newElement.className = elementClass
    }

    parentElementEl.appendChild(newElement)
}