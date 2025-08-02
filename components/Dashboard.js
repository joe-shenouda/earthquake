const { useState, useEffect } = React;

const Dashboard = ({ earthquakeData, loading }) => {
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [eventDetails, setEventDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const getEventDetails = async (eventId) => {
        const response = await fetch(`https://earthquake.usgs.gov/fdsnws/event/1/query?eventid=${eventId}&format=geojson`);
        return await response.json();
    };

    const handleEventClick = async (earthquake) => {
        if (selectedEvent === earthquake.id) {
            setSelectedEvent(null);
            setEventDetails(null);
            return;
        }

        setSelectedEvent(earthquake.id);
        setLoadingDetails(true);
        
        try {
            const details = await getEventDetails(earthquake.id);
            setEventDetails(details.features[0]);
        } catch (error) {
            console.error('Error fetching event details:', error);
            setEventDetails(null);
        } finally {
            setLoadingDetails(false);
        }
    };

    const getStats = () => {
        if (!earthquakeData.length) {
            return {
                total: 0,
                largest: 0,
                averageMagnitude: 0,
                last24Hours: 0
            };
        }

        const magnitudes = earthquakeData.map(eq => eq.properties.mag).filter(mag => mag != null);
        const largest = Math.max(...magnitudes);
        const averageMagnitude = magnitudes.reduce((sum, mag) => sum + mag, 0) / magnitudes.length;
        
        const now = Date.now();
        const last24Hours = earthquakeData.filter(eq => 
            now - eq.properties.time < 24 * 60 * 60 * 1000
        ).length;

        return {
            total: earthquakeData.length,
            largest: largest.toFixed(1),
            averageMagnitude: averageMagnitude.toFixed(1),
            last24Hours
        };
    };

    const stats = getStats();

    const getMagnitudeColor = (magnitude) => {
        if (magnitude >= 7) return '#e74c3c';
        if (magnitude >= 6) return '#f39c12';
        if (magnitude >= 5) return '#f1c40f';
        if (magnitude >= 4) return '#27ae60';
        return '#3498db';
    };

    const recentEarthquakes = earthquakeData
        .sort((a, b) => b.properties.time - a.properties.time)
        .slice(0, 10);

    return (
        <div>
            <div className="section">
                <h2 className="section-title">Real-time Earthquake Dashboard</h2>
                
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-value">{loading ? '...' : stats.total}</div>
                        <div className="stat-label">Total Earthquakes</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value" style={{ color: getMagnitudeColor(stats.largest) }}>
                            {loading ? '...' : stats.largest}
                        </div>
                        <div className="stat-label">Largest Magnitude</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{loading ? '...' : stats.averageMagnitude}</div>
                        <div className="stat-label">Average Magnitude</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{loading ? '...' : stats.last24Hours}</div>
                        <div className="stat-label">Last 24 Hours</div>
                    </div>
                </div>

                <div className="magnitude-colors">
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

            <div className="section">
                <h2 className="section-title">Recent Earthquakes</h2>
                {loading ? (
                    <div className="loading-indicator">Loading recent earthquakes...</div>
                ) : (
                    <div className="event-list">
                        {recentEarthquakes.map(earthquake => {
                            const { properties } = earthquake;
                            const magnitude = properties.mag;
                            const color = getMagnitudeColor(magnitude);
                            const isSelected = selectedEvent === earthquake.id;
                            
                            return (
                                <div key={earthquake.id}>
                                    <div 
                                        className="event-item"
                                        onClick={() => handleEventClick(earthquake)}
                                        style={{ 
                                            backgroundColor: isSelected ? '#f0f8ff' : 'transparent',
                                            borderLeft: isSelected ? '4px solid #3498db' : 'none'
                                        }}
                                    >
                                        <div className="event-magnitude" style={{ color }}>
                                            M {magnitude?.toFixed(1) || 'N/A'}
                                        </div>
                                        <div className="event-location">{properties.place}</div>
                                        <div className="event-time">
                                            {new Date(properties.time).toLocaleString()}
                                        </div>
                                        <div className="event-details">
                                            <span>Depth: {earthquake.geometry.coordinates[2]?.toFixed(1) || 'N/A'} km</span>
                                            <span>Felt Reports: {properties.felt || 0}</span>
                                        </div>
                                    </div>
                                    
                                    {isSelected && (
                                        <div style={{
                                            padding: '1rem',
                                            backgroundColor: '#f8f9fa',
                                            borderRadius: '0 0 var(--radius) var(--radius)',
                                            marginBottom: '1rem'
                                        }}>
                                            {loadingDetails ? (
                                                <div>Loading detailed information...</div>
                                            ) : eventDetails ? (
                                                <div>
                                                    <h4 style={{ marginBottom: '0.5rem', color: 'var(--primary-color)' }}>
                                                        Detailed Information
                                                    </h4>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                                        <div>
                                                            <strong>Event ID:</strong> {eventDetails.id}
                                                        </div>
                                                        <div>
                                                            <strong>Alert Level:</strong> {eventDetails.properties.alert || 'None'}
                                                        </div>
                                                        <div>
                                                            <strong>Tsunami:</strong> {eventDetails.properties.tsunami ? 'Yes' : 'No'}
                                                        </div>
                                                        <div>
                                                            <strong>Significance:</strong> {eventDetails.properties.sig || 'N/A'}
                                                        </div>
                                                        <div>
                                                            <strong>Max MMI:</strong> {eventDetails.properties.mmi || 'N/A'}
                                                        </div>
                                                        <div>
                                                            <strong>CDI:</strong> {eventDetails.properties.cdi || 'N/A'}
                                                        </div>
                                                    </div>
                                                    {eventDetails.properties.url && (
                                                        <div style={{ marginTop: '1rem' }}>
                                                            <a 
                                                                href={eventDetails.properties.url} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="btn btn-primary"
                                                                style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                                                            >
                                                                View USGS Details
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div>Failed to load detailed information.</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};