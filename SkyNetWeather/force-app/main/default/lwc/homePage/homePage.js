import { LightningElement } from 'lwc';
import HEADER_IMAGE from '@salesforce/resourceUrl/SkyNetWeatherHome';
import LEFT_IMAGE from '@salesforce/resourceUrl/SkyNetWeatherRain';
import RIGHT_IMAGE from '@salesforce/resourceUrl/SkyNetWeatherHot';
import LOGO from '@salesforce/resourceUrl/SkyNetWeatherLogo';
import RIGHT_IMAGE1 from '@salesforce/resourceUrl/SkyNetCold';
import DIV_IMAGE from '@salesforce/resourceUrl/SkyNetWeatherDivImage';

export default class Homepage extends LightningElement {
    headerImage = HEADER_IMAGE;
    leftImage = LEFT_IMAGE;
    rightImage = RIGHT_IMAGE;
    logoImage = LOGO;
    rightImage1 = RIGHT_IMAGE1;
    divImage = DIV_IMAGE;

    mapMarkers = [];
    zoomLevel = 12;
    mapLoaded = false;

    connectedCallback() {
        this.getLocation(); 
        this.logWithStyle('Designed and developed by Saurabh Patil'); 
    }

    getLocation() {
        // First try to get the location from the browser's geolocation API
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => this.handleGeolocationSuccess(position),
                (error) => this.handleGeolocationError(error)
            );
        } else {
            // Geolocation is not supported, use IP-based geolocation
            this.fetchLocation();
        }
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

    handleGeolocationSuccess(position) {
        const { latitude, longitude } = position.coords;
        // Use a reverse geocoding service to get the location name
        fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
            .then(response => response.json())
            .then(data => {
                const locationName = `${data.principalSubdivision}, ${data.city}, ${data.countryName}`;                
                this.mapMarkers = [
                    {
                        location: {
                            Latitude: latitude,
                            Longitude: longitude
                        },
                        title: 'Your Current Location',
                        description : `${locationName}`
                    }
                ];
                this.mapLoaded = true;
                this.logWithStyle('Designed and developed by Saurabh Patil');
            })
            .catch(error => {
                this.mapMarkers = [
                    {
                        location: {
                            Latitude: latitude,
                            Longitude: longitude
                        },
                        title: 'error Occured',
                        description : `${error.message}`
                    }
                ];
                this.mapLoaded = true;
            });
    }

    handleGeolocationError(error) {
        this.fetchLocation(); // Fallback to IP-based geolocation
    }

    fetchLocation() {
        fetch('https://ipapi.co/json/')
            .then(response => response.json())
            .then(data => {
                const { city, region, country } = data;
                this.mapMarkers = [
                    {
                        location: {
                            Latitude: data.latitude,
                            Longitude: data.longitude
                        },
                        title: 'Current Location as per your IP',
                        description: `You are currently in ${city}, ${region}, ${country}.`
                    }
                ];
                this.mapLoaded = true;
                this.logWithStyle('Designed and developed by Saurabh Patil');
            })
            .catch(error => {
                this.logWithStyle('Designed and developed by Saurabh Patil');
            });
    }


    handleHamburgerClick() {
        const sidebar = this.template.querySelector('.sidebar');
        const overlay = this.template.querySelector('.sideoverlay');

        // Reset any inline styles before opening
        sidebar.style.right = '-300px';  // Ensure it's hidden initially

        // Make sidebar and overlay visible
        overlay.style.visibility = 'visible';
        overlay.style.opacity = '1';

        let position = -300; // Sidebar starts hidden at -300px
        function slideIn() {
            if (position < 0) {
                position += 10; // Move sidebar 10px at a time
                sidebar.style.right = `${position}px`;
                requestAnimationFrame(slideIn); // Keep calling until fully visible
            }
        }
        requestAnimationFrame(slideIn);  // Start the animation
    }

    closeSidebar() {
        const sidebar = this.template.querySelector('.sidebar');
        const overlay = this.template.querySelector('.sideoverlay');

        // Reset the hamburger checkbox to unchecked
        const burgerCheckbox = this.template.querySelector('.burger input');
        if (burgerCheckbox) {
            burgerCheckbox.checked = false;
        }

        let position = 0; // Sidebar is visible at 0px
        function slideOut() {
            if (position > -300) {
                position -= 10; // Move sidebar 10px at a time
                sidebar.style.right = `${position}px`;
                requestAnimationFrame(slideOut); // Keep calling until fully hidden
            } else {
                overlay.style.opacity = '0'; // Fade out the overlay
                overlay.style.visibility = 'hidden'; // Hide overlay after fade out
            }
        }
        requestAnimationFrame(slideOut);  // Start the animation
    }

    scrollToServices() {
        const servicesElement = this.template.querySelector('.location-button-container'); // Use class name
        if (servicesElement) {
            servicesElement.scrollIntoView({
                behavior: 'smooth'
            });
        } else {
            console.error('Element not found');
        }
    }
    
    


    handleButtonClick() {
        window.location.href = 'https://patil21-dev-ed.develop.my.site.com/SkyNetWeather/s/weather4u'; // Redirect to another page
    }

    contactUs() {
        const email = 'patilsaurabh9978@gmail.com';
        const subject = 'Professional Inquiry: SkynetWeather Services and Collaboration Opportunities';

        // You can update this Body
        const body = `Dear Saurabh,\n\nI hope this message finds you well. I am interested in learning more about SkynetWeather and the range of services you offer. Could you please provide additional information?\n\n\n\n//You can update the body as needed to suit your inquiry or purpose\n\n\n\nThank you in advance for your time and assistance.\n\nBest regards,`;

        // Construct the mailto link
        const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        // Open the mailto link
        window.location.href = mailtoLink;
    }

}
