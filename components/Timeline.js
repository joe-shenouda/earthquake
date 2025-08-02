const { useRef, useEffect } = React;

const Timeline = ({ earthquakeData, loading }) => {
    const timelineRef = useRef(null);

    useEffect(() => {
        if (!timelineRef.current || loading || !earthquakeData.length) return;

        // Clear previous chart
        d3.select(timelineRef.current).selectAll("*").remove();

        const margin = { top: 20, right: 30, bottom: 40, left: 60 };
        const width = timelineRef.current.clientWidth - margin.left - margin.right;
        const height = 360 - margin.top - margin.bottom;

        const svg = d3.select(timelineRef.current)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Process data
        const sortedData = earthquakeData
            .filter(d => d.properties.mag != null)
            .sort((a, b) => a.properties.time - b.properties.time);

        const xScale = d3.scaleTime()
            .domain(d3.extent(sortedData, d => new Date(d.properties.time)))
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain(d3.extent(sortedData, d => d.properties.mag))
            .nice()
            .range([height, 0]);

        const colorScale = d3.scaleSequential(d3.interpolateViridis)
            .domain(d3.extent(sortedData, d => d.properties.mag));

        // Add axes
        g.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%m/%d %H:%M")));

        g.append("g")
            .call(d3.axisLeft(yScale));

        // Add axis labels
        g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x", 0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .style("font-size", "12px")
            .style("fill", "#666")
            .text("Magnitude");

        g.append("text")
            .attr("transform", `translate(${width / 2}, ${height + margin.bottom})`)
            .style("text-anchor", "middle")
            .style("font-size", "12px")
            .style("fill", "#666")
            .text("Time");

        // Add circles for earthquakes
        g.selectAll(".earthquake-point")
            .data(sortedData)
            .enter().append("circle")
            .attr("class", "earthquake-point")
            .attr("cx", d => xScale(new Date(d.properties.time)))
            .attr("cy", d => yScale(d.properties.mag))
            .attr("r", d => Math.max(2, d.properties.mag))
            .attr("fill", d => colorScale(d.properties.mag))
            .attr("opacity", 0.7)
            .on("mouseover", function(event, d) {
                const tooltip = d3.select("body").append("div")
                    .attr("class", "tooltip")
                    .style("position", "absolute")
                    .style("background", "white")
                    .style("padding", "10px")
                    .style("border", "1px solid #ccc")
                    .style("border-radius", "4px")
                    .style("box-shadow", "0 2px 4px rgba(0,0,0,0.2)")
                    .style("pointer-events", "none")
                    .style("z-index", "1000")
                    .html(`
                        <strong>M ${d.properties.mag.toFixed(1)}</strong><br/>
                        ${d.properties.place}<br/>
                        ${new Date(d.properties.time).toLocaleString()}
                    `);

                tooltip.style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", function() {
                d3.selectAll(".tooltip").remove();
            });

    }, [earthquakeData, loading]);

    const getTimeDistribution = () => {
        if (!earthquakeData.length) return [];

        const now = Date.now();
        const hourBuckets = {};
        
        earthquakeData.forEach(eq => {
            const hoursAgo = Math.floor((now - eq.properties.time) / (1000 * 60 * 60));
            hourBuckets[hoursAgo] = (hourBuckets[hoursAgo] || 0) + 1;
        });

        return Object.entries(hourBuckets)
            .map(([hours, count]) => ({ hours: parseInt(hours), count }))
            .sort((a, b) => a.hours - b.hours)
            .slice(0, 24); // Last 24 hours
    };

    const timeDistribution = getTimeDistribution();

    return (
        <div>
            <div className="section">
                <h2 className="section-title">Earthquake Timeline</h2>
                
                {loading ? (
                    <div className="loading-indicator">Loading timeline data...</div>
                ) : (
                    <div>
                        <div className="timeline-container" ref={timelineRef}></div>
                        
                        <div style={{ marginTop: '2rem' }}>
                            <h3 style={{ marginBottom: '1rem' }}>Activity Distribution (Last 24 Hours)</h3>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                {timeDistribution.map(bucket => (
                                    <div key={bucket.hours} style={{
                                        padding: '0.5rem',
                                        background: '#f8f9fa',
                                        borderRadius: '4px',
                                        textAlign: 'center',
                                        minWidth: '60px'
                                    }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                                            {bucket.count}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#666' }}>
                                            {bucket.hours}h ago
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};