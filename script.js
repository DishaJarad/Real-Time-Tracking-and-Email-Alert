
const map = L.map('map').setView([28.7041, 77.1025], 13); 
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
}).addTo(map);


const sourceIcon = L.icon({
  iconUrl: 'images/bike.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const destinationIcon = L.icon({
  iconUrl: 'images/flag.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

let emailSentCount = 0;


const destinationCoords = [12.9940, 80.1707]; 
const destinationMarker = L.marker(destinationCoords, { icon: destinationIcon }).addTo(map).bindPopup('Destination');


let sourceMarker = null;


let routeControl = null;


function setupRouting(startCoords, endCoords) {
  if (routeControl) {
    map.removeControl(routeControl); 
  }

  routeControl = L.Routing.control({
    waypoints: [
      L.latLng(startCoords[0], startCoords[1]),
      L.latLng(endCoords[0], endCoords[1]),
    ],
    lineOptions: {
      styles: [{ color: 'blue', opacity: 1, weight: 5 }], // Path color
    },
    createMarker: () => null, 
    routeWhileDragging: false,
    showAlternatives: false,
    router: L.Routing.osrmv1({ serviceUrl: 'https://router.project-osrm.org/route/v1' }),
    show: false, 
  }).addTo(map);
}


function updateSourcePosition(currentCoords) {
  if (!sourceMarker) {
    
    sourceMarker = L.marker(currentCoords, { icon: sourceIcon }).addTo(map).bindPopup('You');
    map.setView(currentCoords); 
  } else {
    sourceMarker.setLatLng(currentCoords); 
  }

  setupRouting(currentCoords, destinationCoords);

 

  const distanceToDestination = map.distance(currentCoords, destinationCoords);
  if (distanceToDestination <= 2000 && emailSentCount < 1) {
    sendEmailAlert(currentCoords); 
  }
}

function sendEmailAlert(currentCoords) {
  if (emailSentCount >= 1) return; // 

  const mapUrl = `https://www.openstreetmap.org/?mlat=${currentCoords[0]}&mlon=${currentCoords[1]}#map=16/${currentCoords[0]}/${currentCoords[1]}`;

  const emailData = {
    sender: { name: "BHARAT POST", email: "drjarad11@gmail.com" },
    to: [{ email: "drjarad11@gmail.com", name: "Receiver" }],
    subject: "!!!Track your Post!!!",
    htmlContent: `
      <p>The tracker is now within 2KM of the destination.</p>
      <p>To view the live movement of the source, click the link below:</p>
      <a href="${mapUrl}" target="_blank">View Live Coordinates on Map</a>
    `,
  };

  fetch("https://api.sendinblue.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": "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", // Replace with your actual Sendinblue API key
    },
    body: JSON.stringify(emailData),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Email sent successfully:", data);
      emailSentCount++; 
    })
    .catch((error) => console.error("Error sending email:", error));
}


if ('geolocation' in navigator) {
  navigator.geolocation.watchPosition(
    (position) => {
      const currentCoords = [position.coords.latitude, position.coords.longitude];
      console.log('Current Location:', currentCoords);
      updateSourcePosition(currentCoords); 
    },
    (error) => {
      console.error('Error fetching location:', error);
      alert('Unable to retrieve your location. Please check your device settings.');
    },
    {
      enableHighAccuracy: true, 
      maximumAge: 0, 
      timeout: 10000 
    }
  );
} else {
  alert('Geolocation is not supported by your browser.');
}