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

    connectedCallback(){
        this.logWithStyle('Designed and developed by Saurabh Patil');
    }

    logWithStyle(message) {
        console.clear(); // Clear the console
        const currentYear = new Date().getFullYear();
        const style = `
            background: linear-gradient(to right, rgba(255, 182, 193, 1) 0%, rgba(255, 105, 180, 1) 100%);
            padding: 30px;
            color: white;
            font-weight: bold;
            font-size: 16px;
        `;
        console.log(`%c${message} © ${currentYear}`, style);
    }

    handleSearchClick() {
        if (this.searchQuery) {
            this.fetchWeatherData(this.searchQuery);
        } else {
            // Trigger vibration on mobile
            if (navigator.vibrate) {
                navigator.vibrate(200); // Vibrate for 200 milliseconds
            }

            // Optionally, show a toast message
            this.showToast('Weather Alert!', 'Uh-oh! Your location is so invisible, even GPS is confused! Type or share it, and we’ll forecast!', 'info');



        }
    }

    clearInput() {
        const inputField = this.template.querySelector('.searchInput');
        if (inputField) {
            inputField.value = '';
        }
        this.searchQuery ='';  //once user will seach then the input value will be null
    }


    // Handle the location button click
    async handleLocationClick() {
        this.showSnackbar();  // Display snackbar notification
        if (navigator.geolocation) {
            try {
                // Check the permission status
                const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });

                if (permissionStatus.state === 'denied') {
                    this.hideSnackBar();
                    this.showToast('Location Retrieval Failed', 'Location access has been denied in your browser settings.', 'error');
                    return;
                }

                // Request current position with high accuracy
                navigator.geolocation.getCurrentPosition(
                    position => {
                        this.hideSnackBar();
                        this.showOverlay = true;
                        const lat = position.coords.latitude;
                        const lon = position.coords.longitude;
                        this.fetchWeatherDataByCoordinates(lat, lon);  // Fetch weather data using coordinates
                    },
                    error => {
                        this.hideSnackBar();
                        // Handle geolocation errors based on error codes
                        switch (error.code) {
                            case error.PERMISSION_DENIED:
                                this.showToast('Location Retrieval Failed', 'You denied the request for Geolocation.', 'error');
                                break;
                            case error.POSITION_UNAVAILABLE:
                                this.showToast('Location Retrieval Failed', 'Location information is unavailable.', 'error');
                                break;
                            case error.TIMEOUT:
                                this.showToast('Location Retrieval Failed', 'The request to get user location timed out.', 'error');
                                break;
                            default:
                                this.showToast('Location Retrieval Failed', `An unknown error occurred: ${error.message}`, 'error');
                        }
                    },
                    {
                        enableHighAccuracy: true,  // Prioritize high-accuracy methods like GPS
                        timeout: 10000,  // Wait for 10 seconds before timeout
                        maximumAge: 0    // Prevent caching of position for fresh location data
                    }
                );
            } catch (error) {
                this.hideSnackBar();
                this.showToast('Permission Check Failed', `An error occurred while checking permissions: ${error.message}`, 'error');
            }
        } else {
            this.hideSnackBar();
            // Fallback when geolocation is not supported
            this.showToast('Geolocation Not Supported', 'This browser does not support geolocation services.', 'warning');
        }
    }

    // Function to show the snackbar
    showSnackbar() {
        const snackbar = this.template.querySelector('.snackbar');
        snackbar.classList.add('show'); // Add 'show' class to make it visible
    }

    hideSnackBar(){
        const snackbar = this.template.querySelector('.snackbar');
        snackbar.classList.remove('show'); //hide the snackbar
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
        //clear the input field
        this.clearInput();
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

            // Set the minutes and seconds to 0 to display the hour only (e.g., 12:00)
            predictionTime.setMinutes(0);
            predictionTime.setSeconds(0);
            predictionTime.setMilliseconds(0);

            const options = {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true, // Set to true for 12-hour format or false for 24-hour format
            };

            const formattedTime = predictionTime.toLocaleTimeString([], options);

            predictions.push({
                time: formattedTime, // Always shows full hour (e.g., 12:00 PM)
                probability: likelihood.toFixed(0) // Probability in percent
            });
        }

        return predictions;
    }


    // Function to calculate the likelihood of rain based on multiple weather factors
    calculateBaseRainLikelihood(temperature, humidity, pressure, windSpeed, cloudCover, dewPoint, visibility) {
        let rainLikelihood = 0;

        // Humidity Factor: High humidity significantly increases the likelihood of rain
        if (humidity >= 90) {
            rainLikelihood += 40; // Very high humidity strongly suggests rain
        } else if (humidity >= 70) {
            rainLikelihood += 25; // High humidity increases chances
        } else if (humidity >= 50) {
            rainLikelihood += 10; // Moderate humidity, low influence
        }

        // Temperature Factor: Colder air tends to condense water vapor, increasing the chance of rain
        if (temperature < 10) {
            rainLikelihood += 20; // Cold temperatures often indicate rain
        } else if (temperature > 25) {
            rainLikelihood -= 15; // Hot temperatures generally reduce rain chances
        }

        // Pressure Factor: Low pressure usually accompanies storms and precipitation
        if (pressure < 1000) {
            rainLikelihood += 30; // Strong low pressure indicates high chances of rain
        } else if (pressure < 1010) {
            rainLikelihood += 15; // Low pressure, moderate effect
        } else if (pressure > 1020) {
            rainLikelihood -= 20; // High pressure generally reduces rain likelihood
        }

        // Wind Speed Factor: High wind speeds may bring stormy weather, but calm winds often reduce rain chances
        if (windSpeed > 20) {
            rainLikelihood += 15; // Strong winds indicate potential storms
        } else if (windSpeed < 5) {
            rainLikelihood -= 10; // Calm conditions reduce rain likelihood
        }

        // Cloud Cover Factor: Dense cloud cover often leads to rain
        if (cloudCover > 80) {
            rainLikelihood += 30; // Thick cloud cover signals rain
        } else if (cloudCover > 50) {
            rainLikelihood += 15; // Moderate cloud cover, moderate influence
        } else if (cloudCover < 20) {
            rainLikelihood -= 10; // Clear skies reduce chances of rain
        }

        // Dew Point Factor: High dew point near the air temperature means saturated air, increasing rain probability
        if (dewPoint >= temperature) {
            rainLikelihood += 20; // Saturated air, highly likely to rain
        }

        // Visibility Factor: Low visibility could indicate rain or fog
        if (visibility < 2000) { // Less than 2 km
            rainLikelihood += 10; // Low visibility may indicate precipitation
        }

        // Final adjustment to cap rain likelihood between 0% and 100%
        return Math.min(Math.max(rainLikelihood, 0), 100);
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
