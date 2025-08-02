const { useRef, useEffect } = React;

const Statistics = ({ earthquakeData, loading }) => {
    const chartRef = useRef(null);

    useEffect(() => {
        if (!chartRef.current || loading || !earthquakeData.length) return;

        // Clear previous chart
        d3.select(chartRef.current).selectAll("*").remove();

        const margin = { top: 20, right: 30, bottom: 40, left: 60 };
        const width = chartRef.current.clientWidth - margin.left - margin.right;
        const height = 300 - margin.top - margin.bottom;

        const svg = d3.select(chartRef.current)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Create magnitude bins
        const magnitudes = earthquakeData
            .map(d => d.properties.mag)
            .filter(mag => mag != null);

        const bins = d3.bin()
            .domain([0, 10])
            .thresholds(20)(magnitudes);

        const xScale = d3.scaleLinear()
            .domain([0, 10])
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(bins, d => d.length)])
            .nice()
            .range([height, 0]);

        // Add axes
        g.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale));

        g.append("g")
            .call(d3.axisLeft(yScale));

        // Add bars
        g.selectAll(".bar")
            .data(bins)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", d => xScale(d.x0))
            .attr("width", d => Math.max(0, xScale(d.x1) - xScale(d.x0) - 1))
            .attr("y", d => yScale(d.length))
            .attr("height", d => height - yScale(d.length))
            .attr("fill", "#3498db")
            .attr("opacity", 0.7);

        // Add axis labels
        g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x", 0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .style("font-size", "12px")
            .style("fill", "#666")
            .text("Number of Earthquakes");

        g.append("text")
            .attr("transform", `translate(${width / 2}, ${height + margin.bottom})`)
            .style("text-anchor", "middle")
            .style("font-size", "12px")
            .style("fill", "#666")
            .text("Magnitude");

    }, [earthquakeData, loading]);

    const getDepthDistribution = () => {
        if (!earthquakeData.length) return {};

        const depths = earthquakeData
            .map(eq => eq.geometry.coordinates[2])
            .filter(depth => depth != null);

        const shallow = depths.filter(d => d < 70).length;
        const intermediate = depths.filter(d => d >= 70 && d < 300).length;
        const deep = depths.filter(d => d >= 300).length;

        return { shallow, intermediate, deep };
    };

    const getMagnitudeStats = () => {
        if (!earthquakeData.length) return {};

        const magnitudes = earthquakeData
            .map(eq => eq.properties.mag)
            .filter(mag => mag != null);

        const minor = magnitudes.filter(m => m < 4).length;
        const light = magnitudes.filter(m => m >= 4 && m < 5).length;
        const moderate = magnitudes.filter(m => m >= 5 && m < 6).length;
        const strong = magnitudes.filter(m => m >= 6 && m < 7).length;
        const major = magnitudes.filter(m => m >= 7).length;

        return { minor, light, moderate, strong, major };
    };

    const depthStats = getDepthDistribution();
    const magnitudeStats = getMagnitudeStats();

    return (
        <div>
            <div className="section">
                <h2 className="section-title">Earthquake Statistics</h2>
                
                {loading ? (
                    <div className="loading-indicator">Loading statistics...</div>
                ) : (
                    <div>
                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ marginBottom: '1rem' }}>Magnitude Distribution</h3>
                            <div ref={chartRef}></div>
                        </div>

                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-value" style={{ color: '#3498db' }}>
                                    {magnitudeStats.minor || 0}
                                </div>
                                <div className="stat-label">Minor (&lt;4.0)</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value" style={{ color: '#27ae60' }}>
                                    {magnitudeStats.light || 0}
                                </div>
                                <div className="stat-label">Light (4.0-4.9)</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value" style={{ color: '#f1c40f' }}>
                                    {magnitudeStats.moderate || 0}
                                </div>
                                <div className="stat-label">Moderate (5.0-5.9)</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value" style={{ color: '#f39c12' }}>
                                    {magnitudeStats.strong || 0}
                                </div>
                                <div className="stat-label">Strong (6.0-6.9)</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value" style={{ color: '#e74c3c' }}>
                                    {magnitudeStats.major || 0}
                                </div>
                                <div className="stat-label">Major (7.0+)</div>
                            </div>
                        </div>

                        <div style={{ marginTop: '2rem' }}>
                            <h3 style={{ marginBottom: '1rem' }}>Depth Distribution</h3>
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div className="stat-value">{depthStats.shallow || 0}</div>
                                    <div className="stat-label">Shallow (&lt;70km)</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value">{depthStats.intermediate || 0}</div>
                                    <div className="stat-label">Intermediate (70-300km)</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value">{depthStats.deep || 0}</div>
                                    <div className="stat-label">Deep (300km+)</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};