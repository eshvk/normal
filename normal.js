function normalPdf(x, mu, sigma) {
    var s2 = Math.pow(sigma, 2);
    return (1 / Math.sqrt(2 * s2 * Math.PI)) * Math.exp(-Math.pow(x - mu, 2) / s2);
}

function sigmaFromMaxPdf(n) {
    var n2 = Math.pow(n, 2);
    return (1 / Math.sqrt(2 * n2 * Math.PI));
}

function generateDistCurve(mu, sigma) {
    var data = [];
    data.push([mu, normalPdf(mu, mu, sigma)]);
    data.push([mu + sigma, normalPdf(mu + sigma, mu, sigma)]);
    data.unshift([mu - sigma, normalPdf(mu - sigma, mu, sigma)]);
    data.push([mu + 2 * sigma, normalPdf(mu + 2 * sigma, mu, sigma)]);
    data.unshift([mu - 2 * sigma, normalPdf(mu - 2 * sigma, mu, sigma)]);
    data.push([mu + 3 * sigma, normalPdf(mu + 3 * sigma, mu, sigma)]);
    data.unshift([mu - 3 * sigma, normalPdf(mu - 3 * sigma, mu, sigma)]);
    return data;
}

function generateBoxPlotEnds(mu, sigma) {
    var data = [];
    data.push([
        [xScale(mu - sigma), yScale(normalPdf(mu, mu, sigma)) - 15],
        [xScale(mu - sigma), yScale(normalPdf(mu, mu, sigma)) + 15]
    ]);
    data.push([
        [xScale(mu + sigma), yScale(normalPdf(mu, mu, sigma)) - 15],
        [xScale(mu + sigma), yScale(normalPdf(mu, mu, sigma)) + 15]
    ]);
    return data;
}

function mpdf(h) {
    handle.attr("cy", yScale(h));
    sigma = sigmaFromMaxPdf(h);
    data = generateDistCurve(mu, sigma);
    xScale.domain(d3.extent(data, function(d) {
        return d[0]
    }));
    var scaledData = data.map(function(d) {
        return [xScale(d[0]), yScale(d[1])];
    });
    svg.select('.pdf')
        .attr('d', pdf(scaledData));
    controls
        .select('.midl')
        .attr('d', pdf([
            [xScale(mu - sigma), yScale(normalPdf(mu, mu, sigma))],
            [xScale(mu + sigma), yScale(normalPdf(mu, mu, sigma))]
        ]));
    boxEnds = generateBoxPlotEnds(mu, sigma);
    controls
        .selectAll(".end")
        .data(boxEnds)
        .attr("class", "end")
        .attr("d", d3.line());
    legend
        .select('.sigmatext')
        .text("σ : " + sigma.toFixed(2));
    axisLine.call(axis);
}
var w = 600,
    h = 300,
    padding = 30,
    mu = 0,
    sigma = 1;
var pdf = d3.line().curve(d3.curveNatural);
var data = generateDistCurve(mu, sigma);
var xScale = d3.scaleLinear()
    .domain(d3.extent(data, function(d) {
        return d[0]
    }))
    .range([0 + padding, w - padding]);
var yScale = d3.scaleLinear()
    .domain(d3.extent(data, function(d) {
        return d[1]
    }))
    .range([h - 1.05 * padding, 0 + padding])
    .clamp(true);
var axis = d3.axisBottom(xScale);
var svg = d3.select("body")
    .append("svg");
svg.attr("width", w)
    .attr("height", h)
    .append("rect")
    .attr("class", "background")
    .attr("width", "100%")
    .attr("height", "100%");
svg.append("path").attr("class", "pdf")
    .datum(data.map(function(d) {
        return [xScale(d[0]), yScale(d[1])];
    }))
    .attr("d", pdf);
var legend = svg
    .append("g")
    .attr("class", "legend");
legend
    .append("text")
    .attr("x", w - 50 - padding)
    .attr("y", 70)
    .attr("text-anchor", "middle")
    .text("μ : " + mu);
legend
    .append("text")
    .attr("class", "sigmatext")
    .attr("x", w - 50 - padding)
    .attr("y", 90)
    .attr("text-anchor", "middle")
    .text("σ : " + sigma);
var controls = svg.append("g").attr("class", "whisker");
controls
    .append("path")
    .attr("class", "midl")
    .datum([
        [xScale(mu - sigma), yScale(normalPdf(mu, mu, sigma))],
        [xScale(mu + sigma), yScale(normalPdf(mu, mu, sigma))]
    ])
    .attr('d', d3.line());
var boxEnds = generateBoxPlotEnds(mu, sigma);
var ends = controls
    .selectAll(".end")
    .data(boxEnds);
ends
    .enter()
    .append("path")
    .attr("class", "end")
    .attr("d", d3.line());
var vslider = svg.append("g")
    .attr("class", "vslider")
    .attr("transform", "translate(" + (w / 2) + "," + 0 + ")");
vslider.append("line")
    .attr("class", "track")
    .attr("y1", yScale(0) + 2)
    .attr("y2", yScale(normalPdf(mu, mu, sigma)))
    .select(function() {
        return this.parentNode.appendChild(this.cloneNode(true));
    })
    .attr("class", "track-inset")
    .select(function() {
        return this.parentNode.appendChild(this.cloneNode(true));
    })
    .attr("class", "track-overlay")
    .call(d3.drag()
        .on("start.interrupt", function() { vslider.interrupt(); })
        .on("start drag", function() { mpdf(yScale.invert(d3.event.y)); }));
var handle = vslider.insert("circle", ".track-overlay")
    .attr("class", "handlep")
    .attr("r", 6)
    .attr("cy", yScale(normalPdf(mu, mu, sigma)));
var axisLine = svg.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(0," + (h - padding) + ")")
    .call(axis);