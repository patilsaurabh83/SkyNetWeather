import { LightningElement, track } from 'lwc';
import WEATHER_API_KEY from '@salesforce/label/c.WeatherApiKey'; // Import custom label for API key
import BACKGROUND_IMAGE from '@salesforce/resourceUrl/SkeyNetWeatherCompBackground';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';


import IAQ_IMAGE from '@salesforce/resourceUrl/SkyNetWeatherIAQ';
import PRESSURE_IMAGE from '@salesforce/resourceUrl/SkyNetWeatherPressure';
import WIND_IMAGE from '@salesforce/resourceUrl/SkyNetWeatherWindImage';
import HUMIDITY_IMAGE from '@salesforce/resourceUrl/SkyNetWeatherHumidity';
import CLOUD_IMAGE from '@salesforce/resourceUrl/SkyNetWeatherCloud';
import REALFEEL_IMAGE from '@salesforce/resourceUrl/SkyNetWeatherFeel';

import SUN_IMAGE from '@salesforce/resourceUrl/SkyNetWeatherSun';
import RAIN_IMAGE from '@salesforce/resourceUrl/SkyNetWeatherRainPng';
import THUNDERSTORM_IMAGE from '@salesforce/resourceUrl/SkyNetWeatherThuderstorm';
import COLD_IMAGE from '@salesforce/resourceUrl/SkyNetWeatherCold';

import LOCATION_IMAGE from '@salesforce/resourceUrl/SkyNetWeatherLocation';

import WEATHERCOMP_IMAGE from '@salesforce/resourceUrl/SkyNetWeatherCompImages';

export default class WeatherComp extends LightningElement {
    @track searchQuery = '';     // Holds the user input
    @track showOverlay = false;  // Controls overlay visibility
    @track showLoader = true;
    @track weatherData = {};     // Holds fetched weather data
    @track snackbarMessage = 'Fetching your location...'

    background = BACKGROUND_IMAGE;

    iaqImage = IAQ_IMAGE;
    realFeel = REALFEEL_IMAGE;
    pressureImage = PRESSURE_IMAGE;
    windImage = WIND_IMAGE;
    humidityImage = HUMIDITY_IMAGE;
    cloudImage = CLOUD_IMAGE;
    sunImage = SUN_IMAGE;
    rainImage = RAIN_IMAGE;
    thunderstormImage = THUNDERSTORM_IMAGE;
    coldImage = COLD_IMAGE;

    locationName = LOCATION_IMAGE;

    weatherAllImages = WEATHERCOMP_IMAGE;

    // Local variables for weather data
    @track temperature = '';
    @track humidity = '';
    @track windSpeed = '';
    @track realFeelWeather = '';
    @track pressure = '';
    @track location = '';
    @track weatherDescription = '';
    @track weatherIcon = ''
    @track latitude = null;
    @track longitude = null;

    @track mapMarkers = [];
    @track mapCenter = { lat: 0, lng: 0 };

    handleInputChange(event) {
        this.searchQuery = event.target.value;
    }

    handleKeyDown(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            this.handleSearchClick();
        }
    }    

    handleSearchClick() {
        if (this.searchQuery) {
            this.fetchWeatherData(this.searchQuery);
            this.searchQuery='';
        } else {
            // Trigger vibration on mobile
            if (navigator.vibrate) {
                navigator.vibrate(200); // Vibrate for 200 milliseconds
            }
            
            // Optionally, show a toast message
            this.showToast('Weather Alert!', 'Oops! Can’t read the clouds without a location. Toss us a place to forecast!', 'info');

        }
    }
    

    // Handle the location button click
    handleLocationClick() {
        if (navigator.geolocation) {
            this.showSnackbar();
            navigator.geolocation.getCurrentPosition(
                position => {
                    this.showOverlay = true;
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    this.fetchWeatherDataByCoordinates(lat, lon);
                },
                error => {
                    console.error('Error getting geolocation:', error);
                    // Use a professional title and include error.message in the body
                    this.showToast('Location Retrieval Failed', `${error.message}`, 'error');

                }
            );
        } else {
            alert('Geolocation is not supported by this browser.');
        }
    }

    // Function to show the snackbar
    showSnackbar() {
        const snackbar = this.template.querySelector('.snackbar');
        snackbar.classList.add('show'); // Add 'show' class to make it visible

        // Hide the snackbar after 2000ms
        setTimeout(() => {
            snackbar.classList.remove('show');
        }, 1000);
    }

    // Fetch weather data from API by location name
    fetchWeatherData(location) {
        const apiKey = WEATHER_API_KEY; // Use the imported API key
        const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric`;

        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                if (data.message && data.message.toLowerCase() === "city not found") {
                    // Calling the showToast method for City Not Found scenario
                    this.showToast('City Not Found', `Click the blinking Navigation Icon, and we'll help you find it.`, 'info');
                } else {
                    this.extractWeatherData(data);
                    this.showOverlay = true;  // Show the overlay with weather data
                    this.showLoader = false;
                }
            })
            .catch(error => {
                this.showToast('Unable to Retrieve Weather Data', `We're experiencing issues fetching the weather information. Error: ${error.message}`, 'error');
            });
    }

    // Fetch weather data from API by coordinates
    fetchWeatherDataByCoordinates(lat, lon) {
        const apiKey = WEATHER_API_KEY; // Use the imported API key
        const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                this.extractWeatherData(data);
                setTimeout(() => {
                    this.showLoader = false; //show the weather comp.
                }, 1000);

            })
            .catch(error => {
                this.showToast('Unable to Retrieve Weather Data', `We're experiencing issues fetching the weather information. Error: ${error.message}`, 'error');
                this.showOverlay = false;
            });
    }


    // Object to hold the weather icons based on the icon code
    weatherIcons = {
        '01d': `${this.weatherAllImages}/SkyNetWeatherCompImages/ClearSkyDay.png`,
        '01n': `${this.weatherAllImages}/SkyNetWeatherCompImages/ClearSkyNight.png`,
        '02d': `${this.weatherAllImages}/SkyNetWeatherCompImages/FewCloudsDay.png`,
        '02n': `${this.weatherAllImages}/SkyNetWeatherCompImages/FewCloudsNight.png`,
        '03d': `${this.weatherAllImages}/SkyNetWeatherCompImages/ScatteredcloudDay.png`,
        '03n': `${this.weatherAllImages}/SkyNetWeatherCompImages/ScatteredCloudNight.png`,
        '04d': `${this.weatherAllImages}/SkyNetWeatherCompImages/BrokenCloud.png`,
        '04n': `${this.weatherAllImages}/SkyNetWeatherCompImages/BrokenCloud.png`,
        '09d': `${this.weatherAllImages}/SkyNetWeatherCompImages/ShowerRainDay.png`,
        '09n': `${this.weatherAllImages}/SkyNetWeatherCompImages/ShowerRainNight.png`,
        '10d': `${this.weatherAllImages}/SkyNetWeatherCompImages/RainDay.png`,
        '10n': `${this.weatherAllImages}/SkyNetWeatherCompImages/RainNight.png`,
        '11d': `${this.weatherAllImages}/SkyNetWeatherCompImages/ThunderstormDay.png`,
        '11n': `${this.weatherAllImages}/SkyNetWeatherCompImages/ThunderstormNight.png`,
        '13d': `${this.weatherAllImages}/SkyNetWeatherCompImages/SnowDay.png`,
        '13n': `${this.weatherAllImages}/SkyNetWeatherCompImages/SnowNight.png`,
        '50d': `${this.weatherAllImages}/SkyNetWeatherCompImages/MistDay.png`,
        '50n': `${this.weatherAllImages}/SkyNetWeatherCompImages/MistNight.png`,
        'default': `${this.weatherAllImages}/SkyNetWeatherCompImages/ClearSkyDay.png`
    };

    // Function to get the weather icon based on the weather code
    getWeatherIcon(weatherIconCode) {
        return this.weatherIcons[weatherIconCode] || this.weatherIcons['default'];
    }

    // Calculate dew point using temperature and humidity
    calculateDewPoint(temperature, humidity) {
        return temperature - ((100 - humidity) / 5);
    }

    // Extract relevant weather data and store in local variables
    extractWeatherData(data) {
        console.log(data);

        this.temperature = data.main.temp;
        this.humidity = data.main.humidity;
        this.weatherIcon = this.getWeatherIcon(data.weather[0].icon);
        this.windSpeed = data.wind.speed;
        this.realFeelWeather = data.main.feels_like;
        this.mapCenter = { lat: data.coord.lat, lng: data.coord.lon };
        this.mapMarkers = [{ location: { Latitude: data.coord.lat, Longitude: data.coord.lon } }];
        this.pressure = data.main.pressure;
        this.location = `${data.name}, ${data.sys.country}`;
        this.weatherDescription = data.weather[0].description;

        const dewPoint = this.calculateDewPoint(this.temperature, this.humidity);
        // Generate predictions for the next 5 hours
        this.rainForecast = this.calculateRainForecast(this.temperature, this.humidity, this.pressure, data.clouds.all, this.windSpeed, dewPoint, data.sys.visibility);
    }

    // Generate rain predictions for the next 5 hours
    calculateRainForecast(temperature, humidity, pressure, cloudCover, windSpeed, dewPoint, visibility) {
        const predictions = [];
        const baseRainLikelihood = this.calculateBaseRainLikelihood(temperature, humidity, pressure, cloudCover, windSpeed, dewPoint, visibility);

        for (let hour = 1; hour <= 5; hour++) {
            // Simulate slight variations over the next hours
            const variation = (Math.random() * 10 - 5); // Random variation between -5 and +5
            const likelihood = Math.min(Math.max(baseRainLikelihood + variation, 0), 100); // Cap between 0 and 100

            const predictionTime = new Date(Date.now() + hour * 3600000);
            const options = {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true, // Set to true for 12-hour format or false for 24-hour format
            };

            const formattedTime = predictionTime.toLocaleTimeString([], options).replace(':00', ''); // Remove ":00" to show only hours

            predictions.push({
                time: formattedTime, // Use formatted time
                probability: likelihood.toFixed(0) // Probability in percent
            });
        }

        return predictions;
    }

    // Calculate base rain likelihood based on current conditions
    calculateBaseRainLikelihood(temperature, humidity, pressure, cloudCover, windSpeed, dewPoint, visibility) {
        let rainLikelihood = 0;

        // Humidity factor
        if (humidity > 80) {
            rainLikelihood += 40; // Very high humidity strongly increases the chance of rain
        } else if (humidity > 60) {
            rainLikelihood += 20; // Moderate humidity increases the chance, but less
        }

        // Temperature factor
        if (temperature < 15) {
            rainLikelihood += 20; // Cooler temperatures may indicate rain
        } else if (temperature > 30) {
            rainLikelihood -= 15; // Higher temperatures reduce the chance of rain
        }

        // Pressure factor
        if (pressure < 1000) {
            rainLikelihood += 25; // Very low pressure strongly increases the chance of rain
        } else if (pressure < 1013) {
            rainLikelihood += 15; // Low pressure increases the chance
        } else if (pressure > 1020) {
            rainLikelihood -= 15; // High pressure reduces the chance of rain
        }

        // Cloud cover factor
        if (cloudCover > 70) {
            rainLikelihood += 30; // High cloud cover strongly indicates rain
        } else if (cloudCover > 50) {
            rainLikelihood += 15; // Moderate cloud cover may indicate some rain
        } else if (cloudCover < 30) {
            rainLikelihood -= 10; // Low cloud cover decreases the chance of rain
        }

        // Wind speed factor
        if (windSpeed > 15) {
            rainLikelihood += 15; // High wind speed may indicate stormy conditions
        } else if (windSpeed < 5) {
            rainLikelihood -= 10; // Calm conditions decrease the likelihood of rain
        }

        // Dew point factor
        if (dewPoint >= temperature) {
            rainLikelihood += 20; // High dew point (near temperature) indicates saturated air
        }

        // Visibility factor
        if (visibility < 5000) { // Adjusted to meters, assuming lower visibility indicates rain
            rainLikelihood += 10; // Reduced visibility may indicate rain or fog
        }

        // Final adjustment to ensure the value is between 0% and 100%
        return Math.min(Math.max(rainLikelihood, 0), 100); // Cap between 0 and 100
    }
    // Close the weather overlay
    handleCloseOverlay() {
        this.showOverlay = false;
    }


    // Method to show a toast message with dynamic title, message, and variant
    showToast(title, message, variant) {
        const toastEvent = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant, // Success, Info, Warning, or Error
            mode: 'pester' // Can be changed to 'dismissible' or 'sticky' based on requirement
        });
        this.dispatchEvent(toastEvent);
    }


}
