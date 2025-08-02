const { useRef, useEffect, useState } = React;

const EarthquakeMap = ({ earthquakeData, loading, filters, updateFilter }) => {
    const mapRef = useRef(null);
    const [map, setMap] = useState(null);
    const [earthquakes, setEarthquakes] = useState([]);
    const markersRef = useRef([]);

    // Fix for default markers in react-leaflet
    useEffect(() => {
        if (typeof L !== 'undefined') {
            delete L.Icon.Default.prototype._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            });
        }
    }, []);

    useEffect(() => {
        setEarthquakes(earthquakeData);
    }, [earthquakeData]);

    useEffect(() => {
        if (!mapRef.current || map) return;

        // Initialize map
        const leafletMap = L.map(mapRef.current).setView([39.8283, -98.5795], 4);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(leafletMap);

        setMap(leafletMap);

        return () => {
            if (leafletMap) {
                leafletMap.remove();
            }
        };
    }, []);

    useEffect(() => {
        if (!map || loading) return;

        // Clear existing markers
        markersRef.current.forEach(marker => {
            map.removeLayer(marker);
        });
        markersRef.current = [];

        earthquakes.forEach(earthquake => {
            const { geometry, properties } = earthquake;
            const [longitude, latitude, depth] = geometry.coordinates;
            const magnitude = properties.mag;

            if (!magnitude || !latitude || !longitude) return;

            const getMarkerColor = (mag) => {
                if (mag >= 7) return '#d32f2f';      // Red
                if (mag >= 6) return '#f57c00';      // Orange
                if (mag >= 5) return '#fbc02d';      // Yellow
                if (mag >= 4) return '#388e3c';      // Green
                return '#1976d2';                    // Blue
            };

            const circle = L.circle([latitude, longitude], {
                radius: magnitude * 10000,
                color: getMarkerColor(magnitude),
                fillColor: getMarkerColor(magnitude),
                fillOpacity: 0.3,
                weight: 2
            });

            const popupContent = `
                <div>
                    <h3>Magnitude ${magnitude.toFixed(1)} Earthquake</h3>
                    <p><strong>Location:</strong> ${properties.place}</p>
                    <p><strong>Depth:</strong> ${depth?.toFixed(1) || 'N/A'} km</p>
                    <p><strong>Time:</strong> ${new Date(properties.time).toLocaleString()}</p>
                    <p><strong>Felt Reports:</strong> ${properties.felt || 0}</p>
                </div>
            `;

            circle.bindPopup(popupContent);
            circle.addTo(map);
            markersRef.current.push(circle);
        });
    }, [map, earthquakes, loading]);

    return (
        <div>
            <div className="section">
                <h2 className="section-title">Interactive Earthquake Map</h2>
                
                <div className="filters">
                    <div className="filter-group">
                        <label className="filter-label">Time Range</label>
                        <select 
                            className="filter-select"
                            value={filters.timeRange}
                            onChange={(e) => updateFilter('timeRange', e.target.value)}
                        >
                            <option value="hour">Last Hour</option>
                            <option value="day">Last Day</option>
                            <option value="week">Last Week</option>
                            <option value="month">Last Month</option>
                        </select>
                    </div>
                    
                    <div className="filter-group">
                        <label className="filter-label">Min Magnitude</label>
                        <input 
                            type="number"
                            className="filter-input"
                            min="0"
                            max="10"
                            step="0.1"
                            value={filters.minMagnitude}
                            onChange={(e) => updateFilter('minMagnitude', parseFloat(e.target.value))}
                        />
                    </div>
                    
                    <div className="filter-group">
                        <label className="filter-label">Max Magnitude</label>
                        <input 
                            type="number"
                            className="filter-input"
                            min="0"
                            max="10"
                            step="0.1"
                            value={filters.maxMagnitude}
                            onChange={(e) => updateFilter('maxMagnitude', parseFloat(e.target.value))}
                        />
                    </div>
                    
                    <div className="filter-group">
                        <label className="filter-label">Limit</label>
                        <select 
                            className="filter-select"
                            value={filters.limit}
                            onChange={(e) => updateFilter('limit', parseInt(e.target.value))}
                        >
                            <option value="50">50 events</option>
                            <option value="100">100 events</option>
                            <option value="250">250 events</option>
                            <option value="500">500 events</option>
                        </select>
                    </div>
                </div>

                <div className="map-container">
                    {loading && (
                        <div className="loading-indicator">
                            Loading earthquake data...
                        </div>
                    )}
                    <div ref={mapRef} style={{ height: '100%', width: '100%' }}></div>
                </div>

                <div className="magnitude-colors" style={{ marginTop: '1rem' }}>
                    <div className="magnitude-legend">
                        <div className="color-dot" style={{ backgroundColor: '#e74c3c' }}></div>
                        <span>7.0+ Major</span>
                    </div>
                    <div className="magnitude-legend">
                        <div className="color-dot" style={{ backgroundColor: '#f39c12' }}></div>
                        <span>6.0-6.9 Strong</span>
                    </div>
                    <div className="magnitude-legend">
                        <div className="color-dot" style={{ backgroundColor: '#f1c40f' }}></div>
                        <span>5.0-5.9 Moderate</span>
                    </div>
                    <div className="magnitude-legend">
                        <div className="color-dot" style={{ backgroundColor: '#27ae60' }}></div>
                        <span>4.0-4.9 Light</span>
                    </div>
                    <div className="magnitude-legend">
                        <div className="color-dot" style={{ backgroundColor: '#3498db' }}></div>
                        <span>&lt;4.0 Minor</span>
                    </div>
                </div>
            </div>
        </div>
    );
};