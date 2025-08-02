const { useState, useEffect, useRef } = React;

const App = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [earthquakeData, setEarthquakeData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        timeRange: 'day',
        minMagnitude: 1,
        maxMagnitude: 10,
        limit: 100
    });

    // Dedicated function for fetching recent earthquakes
    const getRecentEarthquakes = async () => {
        const response = await fetch('https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&limit=50');
        return await response.json();
    };

    // Fetching detailed event information
    const getEventDetails = async (eventId) => {
        const response = await fetch(`https://earthquake.usgs.gov/fdsnws/event/1/query?eventid=${eventId}&format=geojson`);
        return await response.json();
    };

    // USGS API endpoint builder
    const buildUSGSQuery = (filterOptions) => {
        const baseUrl = 'https://earthquake.usgs.gov/fdsnws/event/1/query';
        const query = new URLSearchParams({
            format: 'geojson',
            limit: filterOptions.limit || 100
        });

        // Time range
        const now = new Date();
        let startTime;
        switch (filterOptions.timeRange) {
            case 'hour':
                startTime = new Date(now.getTime() - 60 * 60 * 1000);
                break;
            case 'day':
                startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case 'week':
                startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        }

        query.append('starttime', startTime.toISOString());
        query.append('endtime', now.toISOString());

        if (filterOptions.minMagnitude) {
            query.append('minmagnitude', filterOptions.minMagnitude);
        }
        if (filterOptions.maxMagnitude) {
            query.append('maxmagnitude', filterOptions.maxMagnitude);
        }
        if (filterOptions.minDepth) {
            query.append('mindepth', filterOptions.minDepth);
        }
        if (filterOptions.maxDepth) {
            query.append('maxdepth', filterOptions.maxDepth);
        }
        if (filterOptions.latitude) {
            query.append('latitude', filterOptions.latitude);
        }
        if (filterOptions.longitude) {
            query.append('longitude', filterOptions.longitude);
        }
        if (filterOptions.radius) {
            query.append('maxradiuskm', filterOptions.radius);
        }

        query.append('orderby', 'time');

        return `${baseUrl}?${query.toString()}`;
    };

    // Getting earthquake counts for statistics
    const getEarthquakeCount = async (params) => {
        const baseUrl = 'https://earthquake.usgs.gov/fdsnws/event/1/count?';
        const query = new URLSearchParams(params);
        const response = await fetch(`${baseUrl}${query.toString()}`);
        return await response.json();
    };

    const fetchEarthquakeData = async () => {
        setLoading(true);
        try {
            const query = buildUSGSQuery(filters);
            console.log('Fetching from:', query);
            
            const response = await fetch(query);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Fetched data:', data);
            
            setEarthquakeData(data.features || []);
        } catch (error) {
            console.error('Error fetching earthquake data:', error);
            setEarthquakeData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEarthquakeData();
        
        // Refresh data every 5 minutes
        const interval = setInterval(fetchEarthquakeData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [filters]);

    const updateFilter = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <Dashboard earthquakeData={earthquakeData} loading={loading} />;
            case 'map':
                return <EarthquakeMap earthquakeData={earthquakeData} loading={loading} filters={filters} updateFilter={updateFilter} />;
            case 'timeline':
                return <Timeline earthquakeData={earthquakeData} loading={loading} />;
            case 'statistics':
                return <Statistics earthquakeData={earthquakeData} loading={loading} />;
            default:
                return <Dashboard earthquakeData={earthquakeData} loading={loading} />;
        }
    };

    return (
        <div className="app-container">
            <header className="header">
                <div className="header-content">
                    <a href="#" className="logo">🌍 Earthquake Explorer</a>
                    <nav>
                        <ul className="nav">
                            <li>
                                <a 
                                    className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('dashboard')}
                                >
                                    Dashboard
                                </a>
                            </li>
                            <li>
                                <a 
                                    className={`nav-link ${activeTab === 'map' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('map')}
                                >
                                    Interactive Map
                                </a>
                            </li>
                            <li>
                                <a 
                                    className={`nav-link ${activeTab === 'timeline' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('timeline')}
                                >
                                    Timeline
                                </a>
                            </li>
                            <li>
                                <a 
                                    className={`nav-link ${activeTab === 'statistics' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('statistics')}
                                >
                                    Statistics
                                </a>
                            </li>
                        </ul>
                    </nav>
                </div>
            </header>
            
            <main className="main-content">
                {renderContent()}
            </main>
        </div>
    );
};

ReactDOM.render(<App />, document.getElementById('app'));