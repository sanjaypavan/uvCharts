/**
 * uv is the namespace, which holds everything else related to the library
 * @type {Object}
 */
var uv = {};

/**
 * uv.Graph is an abstract class of sorts which serves as the base for all other graphs. Instances of it wouldnt be anything except bare bones needed to create a chart.
 * id					- unique id corresponding to the graph, created using current timestamp {#TODO: needs improved logic}
 * graphdef		- definition of the graph, containing data on which the visualization is built
 * config			- configuration of the graph, affecting the visual styling of the graph
 * frame			- <svg> element acting as the parent graph container
 * panel			- <g> element containing everything else, making it easier to move all elements across the svg
 * bg					- <rect> element which acts as the background for the graph
 * effects		- object containing functions which cause the various interactions on the graph
 * labels			- labels from the dataset provided
 * categories	- categories from the dataset provided
 * axes				- object containing axes related stuff: group, func, scale, axis, line, label
 *
 */
uv.Graph = function () {
	var self = this;
	self.id = uv.util.getUniqueId();
	self.graphdef = null;
	self.config = null;

	self.frame = null;
	self.panel = null;
	self.bg = null;
	self.effects = {};
	self.axes = {
		hor : { group: null, scale : null, func: null, axis : null, line : null, label : null },
		ver : { group: null, scale : null, func: null, axis : null, line : null, label : null }
	};

	self.labels = null;
	self.categories = null;

	return this;
};

/**
 * As the name suggests, this function initializes graph object construction based on the config and graphdef
 * @param  {Object} graphdef Definition of the graph, take a look at constants.js for complete documentation
 * @param  {Object} config   Configuration of the graph, take a look at config.js for complete documentation
 * @return {Object}          The graph object itself, to support method chaining
 *
 * #TODO: Remove dependency on jQuery/$
 */
uv.Graph.prototype.init = function (graphdef, config) {
	var self = this;
	self.graphdef = graphdef;
	self.config = $.extend(true, {}, uv.config, config);
	self.max(self.graphdef.stepup)
		.position(self.config.meta.position || 'body')
		.setDimensions()
		.setFrame()
		.setPanel()
		.setBackground()
		.setCaption()
		.setSubCaption()
		.setMetadata()
		.setHorizontalAxis()
		.setVerticalAxis()
		.setEffectsObject()
		.setDownloadOptions();	
		
	return self;
};

/**
 * Sets the dimensions of the graphs, namely height, width and margins: left, right, top and bottom
 * @return {Object}				The graph object itself, to support method chaining
 */
uv.Graph.prototype.setDimensions = function () {
	var self = this;
	self.height(self.config.dimension.height)
		.width(self.config.dimension.width)
		.top(self.config.margin.top)
		.bottom(self.config.margin.bottom)
		.left(self.config.margin.left)
		.right(self.config.margin.right);
	
	return this;
};

/**
 * This function downloads the graph in png format.
 * 
 */
uv.Graph.prototype.setDownloadOptions = function(){
	var self = this;
	self.download = self.panel.append('g').classed(uv.constants.classes.download, true);
	self.download.append('text').classed(uv.constants.classes.download, true)
	.text(uv.constants.downloads.downloadLabel)
	.attr('y', -self.config.margin.top / 2)
	.attr('x', self.config.dimension.width-25)
	.attr('text-anchor', self.config.caption.textanchor)
	.style('font-family', self.config.caption.fontfamily)
	.style('font-size', '12')
	.style('cursor', self.config.caption.cursor)
	.style('stroke', self.config.caption.stroke)
	.style('text-decoration', 'underline')
	.on('mouseover',function(){
		var dnldBtn = d3.select(this);
		dnldBtn.style('color','#0000FF');	
	})
	.on('mouseout',function(){
		var dnldBtn = d3.select(this);
		dnldBtn.style('color','#8D8D8D');
	})
	.on('click', function (){
		var dnldBtn = d3.select(this);
		dnldBtn.style('display','none');
		uv.util.svgToPng(self, function(){
				dnldBtn.style('display',null);
			});
		});
};


/**
 * Sets the main <svg> element which contains rest of the graph elements
 * @return {Object}				The graph object itself, to support method chaining
 */
uv.Graph.prototype.setFrame = function () {
	var self = this;
	if (!self.frame) {
		self.frame = d3.select(self.position() || 'body').append('div').style('display','inline-block').append('svg');
	}

	self.frame.attr('id', uv.constants.classes.uv + '-' + self.id)
		.classed(uv.constants.classes.frame, true)
		.attr('width', self.width() + self.left() + self.right())
		.attr('height', self.height() + self.top() + self.bottom());

	self.frame.append('rect').classed(uv.constants.classes.framebg, true)
		.attr('width', self.width() + self.left() + self.right())
		.attr('height', self.height() + self.top() + self.bottom())
		.style('fill', self.config.frame.bgcolor);

	return this;
};

/**
 * Sets the <g> element which serves as the base position for the graph elements
 * @return {Object}				The graph object itself, to support method chaining
 */
uv.Graph.prototype.setPanel = function () {
	var self = this;
	if (!self.panel) {
		self.panel = self.frame.append('g');
	}

	self.panel.attr('id', uv.constants.classes.panel + '-' + self.id)
		.classed(uv.constants.classes.panel, true)
		.attr('transform', 'translate(' + self.left() + ',' + self.top() + ')');

	return this;
};

/**
 * Sets the <rect> element which serves as the background for the chart
 * @param {String} color Color code for the background, set to config value if not specified
 * @return {Object}			The graph object itself, to support method chaining
 */
uv.Graph.prototype.setBackground = function (color) {
	var self = this;
	if (!self.bg) {
		self.bg = self.panel.append('rect').classed(uv.constants.classes.bg, true)
						.attr('height', self.height())
						.attr('width', self.width());
	}

	self.bg.style('fill', color || self.config.graph.background);
	return this;
};

/**
 * Sets the caption for the graph
 * @return {Object}			The graph object itself, to support method chaining
 */
uv.Graph.prototype.setCaption = function () {
	var self = this;
	self.caption = self.panel.append('g').classed(uv.constants.classes.caption, true);
	
	self.caption.append('text').classed(uv.constants.classes.captiontext, true)
		.text(self.config.meta.caption)
		.attr('y', -self.config.margin.top / 2)
		.attr('x', self.config.dimension.width / 2)
		.attr('text-anchor', self.config.caption.textanchor)
		.style('font-family', self.config.caption.fontfamily)
		.style('font-size', self.config.caption.fontsize)
		.style('font-weight', self.config.caption.fontweight)
		.style('font-variant', self.config.caption.fontvariant)
		.style('text-decoration', self.config.caption.textdecoration)
		.on('mouseover', uv.effects.caption.mouseover(self.config))
		.on('mouseout', uv.effects.caption.mouseout(self.config));

	return this;
};


/**
 * Sets the subcaption for the graph
 * @return {Object}			The graph object itself, to support method chaining
 */
uv.Graph.prototype.setSubCaption = function () {
	var self = this;
	self.subCaption = self.panel.append('g').classed(uv.constants.classes.subcaption, true);
	
	self.subCaption.append('text').classed(uv.constants.classes.subcaptiontext, true)
		.text(self.config.meta.subcaption)
		.attr('y', -self.config.margin.top / 2 + 1*self.config.caption.fontsize)
		.attr('x', self.config.dimension.width / 2)
		.attr('text-anchor', self.config.caption.textanchor)
		.style('font-family', self.config.subCaption.fontfamily)
		.style('font-size', self.config.subCaption.fontsize)
		.style('font-weight', self.config.subCaption.fontweight)
		.style('font-variant', self.config.subCaption.fontvariant)
		.style('text-decoration', self.config.subCaption.textdecoration);

	return this;
};


/**
 * Sets the metadata for the graph, this includes the labels and the categories
 * @return {Object}			The graph object itself, to support method chaining
 */
uv.Graph.prototype.setMetadata = function () {
	var self = this;
	self.labels = uv.util.getLabelArray(self.graphdef);
	self.categories = uv.util.getCategoryArray(self.graphdef);
	return this;
};

/**
 * Sets the Horizontal Axis functions but doesnt render it yet
 * return {Object}			The graph object itself, to support method chaining
 */
uv.Graph.prototype.setHorizontalAxis = function () {
	var self = this;
	var graphdef = self.graphdef;
	if (!self.axes.hor.group) {
		self.axes.hor.group = self.panel.append('g').classed(uv.constants.classes.horaxis, true)
									.attr('transform', 'translate(0,' + self.height() + ')')
									.style('shape-rendering','crispEdges');
	}

	if (self.config.graph.orientation === 'Horizontal') {
		self.axes.hor.scale	= d3.scale[self.config.scale.type]()
								.domain([self.config.scale.type === 'log' ? 1: 0, self.max()])
								.range([0, self.width()]);

		if (self.axes.hor.scale.nice) {
			self.axes.hor.scale.nice();
		}
		
		self.axes.hor.func = d3.svg.axis()
								.scale(self.axes.hor.scale)
								.ticks(self.config.axis.ticks)
								.tickSize(-self.width(), self.config.axis.minor, 0)
								.tickPadding(self.config.axis.padding)
								.tickSubdivide(self.config.axis.subticks)
								.orient('bottom');
	} else {
		self.axes.hor.scale = d3.scale.ordinal()
								.rangeRoundBands([0, self.width()], self.config.scale.ordinality);
		
		self.axes.hor.func = d3.svg.axis()
								.scale(self.axes.hor.scale)
								.tickPadding(self.config.axis.padding)
								.orient('bottom');
	}

	return this;
};

/**
 * Sets the Vertical axis functions, but doesnt render it yet
 * @return {Object}				The graph object itself, to support method chaining
 */
uv.Graph.prototype.setVerticalAxis = function () {
	var self = this;
	var graphdef = self.graphdef;
	if (!self.axes.ver.group) {
		self.axes.ver.group = self.panel.append('g').classed(uv.constants.classes.veraxis, true)
															.style('shape-rendering','crispEdges');
	}

	if (self.config.graph.orientation === 'Vertical') {
		self.axes.ver.scale	= d3.scale[self.config.scale.type]()
								.domain([self.max(), self.config.scale.type === 'log' ? 1 : 0])
								.range([0, self.height()]);
		
		if (self.axes.ver.scale.nice) {
			self.axes.ver.scale.nice();
		}
		
		self.axes.ver.func = d3.svg.axis()
								.scale(self.axes.ver.scale)
								.ticks(self.config.axis.ticks)
								.tickSize(-self.width(), self.config.axis.minor, 0)
								.tickPadding(self.config.axis.padding)
								.tickSubdivide(self.config.axis.subticks)
								.orient('left');
	} else {
		self.axes.ver.scale = d3.scale.ordinal()
								.rangeRoundBands([0, self.width()], self.config.scale.ordinality);
		
		self.axes.ver.func = d3.svg.axis()
								.scale(self.axes.ver.scale)
								.tickPadding(self.config.axis.padding)
								.orient('left');
	}

	return this;
};

/**
 * Creates placeholders for functions which cause the various animations across the graph to be able invoke it from other places
 * @return {Object}				The graph object itself, to support method chaining
 */
uv.Graph.prototype.setEffectsObject = function () {
	var self = this;
	for (var i = 0; i < self.categories.length ; i++) {
		self.effects[self.categories[i]] = {};
	}
	return self;
};

/**
 * Draws the horizontal axis within the frame based on the orientation and functions already created
 * @return {Object} The graph object itself, to support method chaining
 */
uv.Graph.prototype.drawHorizontalAxis = function () {
	var self = this;
	self.axes.hor.axis = self.axes.hor.group.append('g')
								.style('font-family', self.config.label.fontfamily)
								.style('font-size', self.config.label.fontsize)
								.style('font-weight', self.config.label.fontweight)
								.call(self.axes.hor.func);

	self.axes.hor.axis.selectAll('line').style('stroke', self.config.axis.strokecolor);
	self.axes.hor.axis.selectAll('path').style('fill','none');

	self.axes.hor.line = self.panel.append('line')
								.classed(uv.constants.classes.horaxis, true)
								.attr('y1', self.height())
								.attr('y2', self.height())
								.attr('x1', '0')
								.attr('x2', self.width())
								.style('stroke', self.config.axis.strokecolor);
	
	self.axes.hor.label = self.axes.hor.group.append('g')
														.classed(uv.constants.classes.axeslabelgroup, true)
														.attr('transform', 'translate(' + self.width()/2 + ',' + (1*self.config.margin.bottom/4 + 1*self.config.label.fontsize) + ')');
								
	self.axes.hor.label.append('text')
								.attr('display','block')
								.classed(uv.constants.classes.axeslabel, true).classed('cal', true)
								.attr('text-anchor','middle')
								.style('font-size', self.config.axis.fontsize)
								.style('font-family', self.config.axis.fontfamily)
								.text(self.config.meta.hlabel);

	self.axes.hor.label.append('text')
								.attr('display','block')
								.attr('y', 1*self.config.axis.fontsize)
								.attr(uv.constants.classes.axessublabel, true).classed('casl', true)
								.attr('text-anchor','middle')
								.style('font-size', self.config.axis.fontsize - 2)
								.style('font-family', self.config.axis.fontfamily)
								.text(self.config.meta.hsublabel);
	
	return this;
};

/**
 * Draws the vertical axis within the frame based on the orientation and functions already created
 * @return {Object} The graph object itself, to support method chaining
 */
uv.Graph.prototype.drawVerticalAxis = function () {
	var self = this;
	self.axes.ver.axis = self.axes.ver.group.append('g')
								.classed(uv.constants.classes.axes, true)
								.style('font-family', self.config.label.fontfamily)
								.style('font-size', self.config.label.fontsize)
								.style('font-weight', self.config.label.fontweight)
								.call(self.axes.ver.func);

	self.axes.ver.axis.selectAll('line').style('stroke', self.config.axis.strokecolor);
	self.axes.ver.axis.selectAll('path').style('fill','none');

	self.axes.ver.line = self.panel.append('line')
								.classed(uv.constants.classes.veraxis, true)
								.attr('y1', 0)
								.attr('y2', self.height())
								.style('stroke', self.config.axis.strokecolor);
	
	self.axes.ver.label = self.axes.ver.group.append('g')
								.attr('transform', 'translate(' + -4*self.config.margin.left/5 + ',' + self.height()/2 + ')rotate(270)');
								
	self.axes.ver.label.append('text').classed(uv.constants.classes.axeslabel, true)
								.attr('text-anchor', 'middle')
								.classed('cal', true)
								.style('font-family', self.config.axis.fontfamily)
								.style('font-size', self.config.axis.fontsize)
								.text(self.config.meta.vlabel);

	self.axes.ver.label.append('text').classed(uv.constants.classes.axessublabel, true)
								.attr('text-anchor', 'middle')
								.attr('y', +self.config.axis.fontsize)
								.classed('casl', true)
								.style('font-family', self.config.axis.fontfamily)
								.style('font-size', self.config.axis.fontsize - 2)
								.text(self.config.meta.vsublabel);
	
	return this;
};

/**
 * Sets the legend and related interactions for the graph based on the configuration
 * @return {Object}	The graph object itself, to support method chaining
 */
uv.Graph.prototype.setLegend = function () {
	var self = this;

	var legendgroup = self.panel.append('g').classed(uv.constants.classes.legend, true)
						.attr('transform', function(d, i){
							if(self.config.legend.position === 'right'){
								return 'translate(' + self.width() + ', 10)';
							}else if(self.config.legend.position === 'bottom'){
								var pos =  self.height() + self.config.margin.bottom/2 + Number(self.config.axis.fontsize);
								return 'translate(0, ' + pos +  ')';
							}
						});

	self.legends = legendgroup.selectAll('g').data(self.categories).enter().append('g')
						.attr('transform', function (d, i) { 
							if(self.config.legend.position === 'right'){
								return 'translate(10,' + 10 * (2 * i - 1) + ')'; 
							}else if(self.config.legend.position === 'bottom'){
								var hPos = 100*i - self.config.dimension.width*self.config.legend.legendstart;
								var vPos = 20*self.config.legend.legendstart;
								if(hPos >= self.config.dimension.width){
									self.config.legend.legendstart = self.config.legend.legendstart + 1;
									hPos = 100*i - self.config.dimension.width*self.config.legend.legendstart;
									vPos = 20*self.config.legend.legendstart;
								}
								return 'translate(' + hPos + ',' + vPos + ')'; 
							}
						})
						.attr('class', function (d, i) {
							if( !d3.select(this).attr('class')) {
								return 'cl_' + self.categories[i];
							}
							return d3.select(this).attr('class') + ('cl_' + self.categories[i]);
						})
						.attr('disabled', 'false')
						.on('mouseover', function (d, i) {
							if (self.effects[d].mouseover && typeof self.effects[d].mouseover === 'function') {
								self.effects[d].mouseover();
							}
						})
						.on('mouseout', function (d, i) {
							if (self.effects[d].mouseout && typeof self.effects[d].mouseout === 'function') {
								self.effects[d].mouseout();
							}
						})
						.on('click', function (d, i) {
							uv.effects.legend.click(i, this, self);
						});

	self.legends.append('rect').classed(uv.constants.classes.legendsign, true)
				.attr('height', self.config.legend.symbolsize)
				.attr('width', self.config.legend.symbolsize)
				.style('fill', function (d, i) { return uv.util.getColorBand(self.config, i); })
				.style('stroke', 'none');

	self.legends.append('text').classed(uv.constants.classes.legendlabel, true)
				.text(function (d, i) { return self.categories[i]; })
				.attr('dx', self.config.legend.textmargin)
				.attr('dy', '.71em')
				.attr('text-anchor', 'start')
				.style('font-family', self.config.legend.fontfamily)
				.style('font-size', self.config.legend.fontsize)
				.style('font-weight', self.config.legend.fontweight);

	return this;
};

/**
 * Finalizes stuff related to graph, used in conjuction with init to setup all the generic graph stuff
 * @param  {Boolean} isLoggable Specifies whether the graph object should be logged or not, for debug purpose only
 * @return {Object}             The graph object itself, to support method chaining
 */
uv.Graph.prototype.finalize = function (isLoggable) {
	var self = this;
	self.drawHorizontalAxis()
		.drawVerticalAxis()
		.setLegend();
	
	//Log Graph object if flag set to truthy value
	// if (isLoggable) { 
		console.log(self); 
	// }
	
	return this;
};

/*
 * Functions to remove individual elements of an graph
 */

/**
 * Removes the entire graph object
 * @return {Object} The graph object itself, to support method chaining
 */
uv.Graph.prototype.remove = function () {
	this.frame.remove();
	return this;
};

/**
 * Removes the caption component of the graph
 * @return {Object} The graph object itself, to support method chaining
 */
uv.Graph.prototype.removeCaption = function () {
	this.caption.remove();
	return this;
};

/**
 * Removes the legend component of the graph
 * @return {Object} The graph object itself, to support method chaining
 */
uv.Graph.prototype.removeLegend = function () {
	if (this.legends[0]) {
		this.legends[0].parentNode.remove();
	}
	
	return this;
};

uv.Graph.prototype.removePanel = function () {
	this.panel.remove();
	return this;
};

uv.Graph.prototype.removeHorAxis = function () {
	this.panel.selectAll('g.' + uv.constants.classes.horaxis + " > *").remove();
	this.panel.selectAll('line.' + uv.constants.classes.horaxis).remove();
	return this;
};

uv.Graph.prototype.removeVerAxis = function () {
	this.panel.selectAll('g.' + uv.constants.classes.veraxis + " > *").remove();
	this.panel.selectAll('line.' + uv.constants.classes.veraxis).remove();
	return this;
};

/*
 * Setters and getters for various common properties of the graph
 */

uv.Graph.prototype.width = function (w) {
	if (w) {
		this.config.dimension.width = w;
		return this;
	}

	return this.config.dimension.width;
};

uv.Graph.prototype.height = function (h) {
	if (h) {
		this.config.dimension.height = h;
		return this;
	}

	return this.config.dimension.height;
};

uv.Graph.prototype.top = function (t) {
	if (t) {
		this.config.margin.top = t;
		return this;
	}

	return this.config.margin.top;
};

uv.Graph.prototype.bottom = function (b) {
	if (b) {
		this.config.margin.bottom = b;
		return this;
	}

	return this.config.margin.bottom;
};

uv.Graph.prototype.left = function (l) {
	if (l) {
		this.config.margin.left = l;
		return this;
	}

	return this.config.margin.left;
};

uv.Graph.prototype.right = function (r) {
	if (r) {
		this.config.margin.right = r;
		return this;
	}

	return this.config.margin.right;
};

uv.Graph.prototype.position = function (pos) {
	if (pos) {
		this.config.meta.position = pos;
		return this;
	}

	return this.config.meta.position;
};

uv.Graph.prototype.caption = function (caption) {
	if (caption) {
		this.config.meta.caption = caption;
		return this;
	}

	return this.config.meta.caption;
};

uv.Graph.prototype.subCaption = function(subCaption){
	if(subCaption){
		this.config.meta.subCaption = subCaption;
		return this;
	}

	return this.config.meta.caption;
};

uv.Graph.prototype.isDownload = function(isDownload){
	if(isDownload){
		this.config.meta.isDownload = isDownload;
		return this;
	}
	return this.config.meta.isDownload;
};

uv.Graph.prototype.max = function (stepup) {
	if (stepup === true) {
		this.config.graph.max = uv.util.getStepMaxValue(this.graphdef);
		return this;
	} else if (stepup === false) {
		this.config.graph.max = uv.util.getMaxValue(this.graphdef);
		return this;
	} else if (stepup === 'percent') {
		this.config.graph.max = 100;
		return this;
	}  else if (stepup === 'waterfall') {
		this.config.graph.max = uv.util.getWaterfallMaxValue(this.graphdef);
		return this;
	}

	return this.config.graph.max;
};

/* Additional Graph functions */
uv.Graph.prototype.toggleGraphGroup = function (i) {
	var self = this, category = self.categories[i],
			state = self.frame.select('g.cge-' + uv.util.formatClassName(category)).style('display'),
			color = uv.util.getColorBand(self.config, i);

	self.frame.selectAll('g.cge-' + uv.util.formatClassName(category)).style('display', (state === 'none')? null : 'none');
	return this;
};

uv.util = {};

/**
 * Utility method to extend prototype for JavaScript classes, to act like inheritance
 * @param  {Class} f Original class which is being extended
 * @return {Prototype}   Prototype containing the functions from the super class
 */
uv.util.extend = function (f) {
	function G() {}
	G.prototype = f.prototype || f;
	return new G();
};

/**
 * Utility method to return a unique identification id
 * @return {number} Timestamp in ms is returned as a unique id
 */
uv.util.getUniqueId = function () {
	return new Date().getTime();
};

/**
 * 
 */
uv.util.getMaxValue = function (graphdef) {
	return d3.max(graphdef.categories.map(function (d) {
		return d3.max(graphdef.dataset[d].map(function (d) {
			return d.value;
		}));
	}));
};

uv.util.getStepMaxValue = function (graphdef) {
	var sumMap = graphdef.dataset[graphdef.categories[0]].map(function () {return 0; });
	graphdef.categories.map(function (d) {
		graphdef.dataset[d].map(function (d, i) {
			sumMap[i] += d.value;
		});
	});

	return d3.max(sumMap);
};

uv.util.getWaterfallMaxValue = function(graphdef) {
	var sumMap = graphdef.categories.map(function() {return 0;});
	graphdef.categories.map(function (d, i) {
		var localMax = 0;
		graphdef.dataset[d].map(function(d) {
			localMax += d.value;
			if(sumMap[i] < localMax) {
				sumMap[i] = localMax;
			}
		});
	});

	return d3.max(sumMap);
};

uv.util.getSumUpArray = function (graphdef) {
	var sumMap = graphdef.dataset[graphdef.categories[0]].map(function () {return 0; });
	graphdef.categories.map(function (d) {
		graphdef.dataset[d].map(function (d, i) {
			sumMap[i] += d.value;
		});
	});

	return sumMap;
};

uv.util.getPercentage = function (value, total) {
	return value * 100 / total;
};

uv.util.getDataArray = function (graphdef) {
	return graphdef.categories.map(function (d) { return graphdef.dataset[d]; });
};

uv.util.getTabularArray = function (graphdef) {
	var table = [], i, j, catlen, len, arr = [];
	for (i = 0, len = graphdef.dataset[graphdef.categories[0]].length; i < len; i = i + 1) {
		arr = [];
		arr.push(graphdef.dataset[graphdef.categories[0]][i].name);
		for (j = 0, catlen = graphdef.categories.length; j < catlen; j = j + 1) {
			arr.push(graphdef.dataset[graphdef.categories[j]][i].value);
		}
		table.push(arr);
	}
	return table;
};

uv.util.getLabelArray = function (graphdef) {
	return graphdef.dataset[graphdef.categories[0]].map(function (d) { return d.name; });
};

uv.util.getCategoryArray = function (graphdef) {
	return graphdef.categories.map(function (d) { return d; });
};

uv.util.getCategoryData = function (graphdef, categories) {
	return categories.map(function (d) {
		return graphdef.dataset[d].map(function (d) {
			return d.value;
		});
	});
};

uv.util.transposeData = function (graphdef) {
	var dataset = {}, i, j, length, jlength,
		name, label, value, categories = graphdef.dataset[graphdef.categories[0]].map(function (d) { return d.name; });

	for (i = 0, length = categories.length; i < length; i = i + 1) { dataset[categories[i]] = []; }

	for (i = 0, length = graphdef.categories.length; i < length; i = i + 1) {
		name = graphdef.categories[i];
		for (j = 0, jlength = graphdef.dataset[name].length; j < jlength; j = j + 1) {
			label = graphdef.dataset[name][j].name;
			value = graphdef.dataset[name][j].value;
			dataset[label].push({ 'name' : name, 'value' : value });
		}
	}

	graphdef.categories = categories;
	graphdef.dataset = dataset;
};

uv.util.getPascalCasedName = function (name) {
	return name.substring(0, 1).toUpperCase() + name.substring(1);
};

uv.util.getColorBand = function (config, index) {
	var len = uv.palette[config.graph.palette].length;
	return uv.palette[config.graph.palette][index % len];
};

/**
 * This function finds regular expressions other than Alphabets, Numbers,
 * "_" and "-" and replaces it with "_".
 * @param  {string} name The string which needs to be formatted
 * @return {string}      Returns the formatted String 
 */
uv.util.formatClassName = function(name){
	var returnName = name.trim().replace(/[^A-Za-z0-9_\-]/g,"-").toLowerCase();
	return returnName;
};

uv.util.svgToPng = function(graph, callback){
	var svgContent = d3.select(graph.frame.node().parentNode).html(),
			canvas = document.createElement('canvas'),
			ctx = canvas.getContext("2d"),
			width = graph.width() + graph.left() + graph.right(),
			height = graph.width() + graph.top() + graph.bottom();

	canvas.setAttribute('width', width);
	canvas.setAttribute('height', height);
	ctx.drawSvg(svgContent);
	canvas.toBlob(function(blob) {
		saveAs(blob, "png_download"+Math.ceil(Math.random()*100000)+".png");
	}, "image/png");
	callback.call();
};

uv.util.isCanvasSupported = function (){
  var elem = document.createElement('canvas');
  return !!(elem.getContext && elem.getContext('2d'));
};
/**
 * This function waits till the end of the transition and then call the callback
 * function which is passed as an argument
 * @param  {transition}   transition It's the current transition
 * @param  {Function} callback   function which is called at the end of
 *                               transition
 */
uv.util.endAll = function (transition, callback){
	var n = 0; 
	transition.each(function() { ++n; }).each("end", function() {
    if (!--n) {
      callback.apply(this, arguments);
    }
  });
};

uv.config = {
	graph : {
		palette : 'Brink',
		background : '#FFFFFF',
		orientation : 'Horizontal',
		max : 0
	},

	meta : {
		position : '.uv_div',
		caption : 'Usage of browsers by the years',
		subcaption : 'Among major vendors',
		hlabel : 'Horizontal Axis Label',
		vlabel : 'Vertical Axis Label',
		hsublabel : 'h sublabel',
		vsublabel : 'v sublabel',
		isDownload : true
		
	},

	dimension : {
		width : 400,
		height : 400
	},

	margin : {
		top : 50,
		bottom : 150,
		left : 100,
		right : 100
	},

	frame : {
		bgcolor : '#FFFFFF'
	},

	axis : {
		ticks : 8,
		subticks : 2,
		padding : 5,
		minor : -10,
		strokecolor : '#000000',
		fontfamily : 'Arial',
		fontsize : '14',
		fontweight : 'bold'
	},

	label : {
		fontfamily : 'Arial',
		fontsize : '11',
		fontweight : 'normal',
		strokecolor : '#000000',
		showlabel : false
	},

	scale : {
		type : 'linear',
		ordinality : 0.2
	},

	bar : {
		strokecolor : 'none',
		fontfamily : 'Arial',
		fontsize : '10',
		fontweight : 'bold',
		textcolor : '#000'
	},

	line : {
		interpolation : 'linear'
	},

	area : {
		interpolation : 'cardinal',
		offset : 'zero',
		opacity : 0.2
	},

	pie : {
		fontfamily : 'Arial',
		fontsize : '14',
		fontweight : 'normal',
		fontvariant : 'small-caps',
		fontfill : '#FFFFFF',
		strokecolor : 'none',
		strokewidth : 2
	},
	
	donut : {
		fontfamily : 'Arial',
		fontsize : '14',
		fontweight : 'normal',
		fontvariant : 'small-caps',
		fontfill : '#FFFFF',
		factor : 0.4,
		strokecolor : 'none',
		strokewidth : 2
	},
	
	caption : {
		fontfamily : 'Arial',
		fontsize : '14',
		fontweight : 'bold',
		fontvariant : 'small-caps',
		textdecoration : 'none',
		hovercolor : '#696969',
		textanchor : 'middle',
		cursor : 'pointer',
		stroke : '#0000FF'
	},

	subCaption : {
		fontfamily : 'Arial',
		fontsize : '9',
		fontweight : 'normal',
		fontvariant : 'normal',
		textdecoration : 'none',
		textanchor : 'middle'
	},

	legend : {
		position : 'bottom',
		fontfamily : 'Arial',
		fontsize : '11',
		fontweight : 'normal',
		textmargin : 15,
		symbolsize : 10,
		inactivecolor : '#DDD',
		legendstart : 0,
	},

	effects : {
		hovercolor : '#FF0000',
		strokecolor : 'none',
		textcolor : '#000000',
		duration : 800,
		hover : 400,
		showhovertext : false
	}
};
uv.constants = {};

uv.constants.graphdef = {
	categories : ['IE', 'Chrome', 'Opera', 'Safari'],
	dataset : {
		'IE' : [
			{name: '2001', value: 60 },
			{name: '2002', value: 70 },
			{name: '2003', value: 80 },
			{name: '2004', value: 90 },
			{name: '2005', value: 20 }
		],
		'Chrome' : [
			{name: '2001', value: 10},
			{name: '2002', value: 30},
			{name: '2003', value: 50},
			{name: '2004', value: 90},
			{name: '2005', value: 70}
		],
		'Firefox': [
			{name: '2001', value: 50},
			{name: '2002', value: 150},
			{name: '2003', value: 20},
			{name: '2004', value: 80},
			{name: '2005', value: 40}
		],
		'Opera': [
			{name: '2001', value: 90},
			{name: '2002', value: 60},
			{name: '2003', value: 30},
			{name: '2004', value: 10},
			{name: '2005', value: 70}
		],
		'Safari' : [
			{name: '2001', value: 30},
			{name: '2002', value: 10},
			{name: '2003', value: 60},
			{name: '2004', value: 90},
			{name: '2005', value: 40}
		]
	}
};

uv.constants.waterfallGraphdef = {
        categories : ['data'],
        dataset : {
            'data' : [
                {
                    "name": "2005 Actual",
                    "value": 90
                },
                {
                    "name": "Price",
                    "value": 15
                },
                {
                    "name": "Volume",
                    "value": 21
                },
                {
                    "name": "Fixes",
                    "value": -37
                },
                {
                    "name": "Taxation",
                    "value": -43
                },
                {
                    "name": "Escalation",
                    "value": -40
                },
                {
                    "name": "Mix",
                    "value": 46
                },
                {
                    "name": "Market Effect",
                    "value": 91
                },
                {
                    "name": "Partners",
                    "value": 61
                }
            ]
        }
    };

uv.constants.classes = {
	uv : 'uv',
	pos : 'uv-div',
	frame : 'uv-frame',
	panel : 'uv-panel',
	bg : 'uv-chart-bg',
	axes : 'uv-axes',
	legend : 'uv-legend',
	framebg : 'uv-frame-bg',
	horaxis : 'uv-hor-axis',
	veraxis : 'uv-ver-axis',
	caption : 'uv-caption',
	captiontext : 'uv-caption-text',
	subcaption : 'uv-subcaption',
	subcaptiontext : 'uv-subcaption-text',
	axeslabelgroup : 'uv-axes-lable-group',
	axeslabel : 'uv-axes-label',
	axessublabel : 'uv-axes-sub-label',
	legendsign : 'uv-legend-sign',
	legendlabel : 'uv-legend-label',
	hoverbg : 'uv-hover-bg',

	arc : 'uv-arc-',
	areapath : 'uv-areapath-',
	linepath :'uv-linepath-',
	area : 'uv-area-',
	line : 'uv-line-',
	dot : 'uv-dot',
	
	download : 'download-options'
};

uv.constants.downloads = {
	downloadLabel: 'Download',
};
uv.types = {};

uv.addChart = function (type, functionName) {
  uv.types[type] = functionName;
};

uv.addChart('Bar','BarGraph');
uv.addChart('Line','LineGraph');
uv.addChart('StackedBar','StackedBarGraph');
uv.addChart('StepUpBar','StepUpBarGraph');
uv.addChart('Area','AreaGraph');
uv.addChart('StackedArea','StackedAreaGraph');
uv.addChart('PercentBar','PercentBarGraph');
uv.addChart('PercentArea','PercentAreaGraph');
uv.addChart('Pie','PieGraph');
uv.addChart('Donut','DonutGraph');
uv.addChart('Waterfall','WaterfallGraph');
uv.addChart('PolarArea','PolarAreaGraph');

uv.chart = function (type, graphdef, config) {
  if (uv.types[type] !== undefined) {
    return new uv[uv.types[type]](graphdef, config);
  }
};
uv.effects = {};

uv.effects.bar = {};
uv.effects.bar.mouseover = function (graph, idx) {
	var config = graph.config,
		category = graph.categories[idx];

	var effect = function () {
		graph.frame.selectAll('rect.cr_' + uv.util.formatClassName(category))
			.transition().duration(config.effects.hover)
				.style('fill', config.effects.hovercolor)
				.style('stroke', config.effects.strokecolor);
	
		if(config.effects.showhovertext){
			graph.frame.selectAll('text.cr_' + uv.util.formatClassName(category))
				.transition().duration(config.effects.hover)
					.style('fill', config.effects.textcolor)
					.style('opacity', 1);
		}
	};

	graph.effects[category].mouseover = effect;
	return effect;
};

uv.effects.bar.mouseout = function (graph, idx, defColor) {
	var config = graph.config,
		category = graph.categories[idx],
		barColor = uv.util.getColorBand(graph.config, idx),
		textColor = defColor || uv.util.getColorBand(graph.config, idx);

	var effect = function () {
		graph.frame.selectAll('rect.cr_' + uv.util.formatClassName(category))
			.transition().duration(config.effects.hover)
				.style('fill', barColor)
				.style('stroke', 'none');
	
		graph.frame.selectAll('text.cr_' + uv.util.formatClassName(category))
			.transition().duration(config.effects.hover)
				.style('fill', graph.config.label.showlabel ? textColor : 'none');
	};

	graph.effects[category].mouseout = effect;
	return effect;
};

uv.effects.area = {};
uv.effects.area.mouseover = function (graph, idx) {
	var config = graph.config,
		category = graph.categories[idx];

	var effect = function () {
		graph.frame.selectAll('.cge-' + uv.util.formatClassName(category)).select('path.' + uv.constants.classes.area + uv.util.formatClassName(category))
		.transition().duration(config.effects.hover)
		.style('fill',config.effects.hovercolor);
	};

	graph.effects[category].mouseover = effect;
	return effect;
};

uv.effects.area.mouseout = function (graph, idx) {
	var config = graph.config,
		category = graph.categories[idx];

	var effect = function () {
		graph.frame.selectAll('.cge-'+ uv.util.formatClassName(category)).select('path.'+ uv.constants.classes.area + uv.util.formatClassName(category));
		graph.frame.selectAll('.cge-'+category).select('path.' + uv.constants.classes.area +category)
		.transition().duration(config.effects.hover)
		.style('fill',uv.util.getColorBand(config,idx));
	};

	graph.effects[category].mouseout = effect;
	return effect;
};


uv.effects.line = {};
uv.effects.line.mouseover = function (graph, idx) {
	var config = graph.config,
		category = graph.categories[idx];

	var effect = function () {
		graph.frame.selectAll('.cge-' + uv.util.formatClassName(category)).selectAll('circle')
			.transition().duration(config.effects.hover)
				.style('fill', config.effects.hovercolor)
				.style('fill-opacity', 1)
				.style('stroke', config.effects.hovercolor);

		graph.frame.selectAll('.cge-' + uv.util.formatClassName(category)).select('path')
			.transition().duration(config.effects.hover)
				.style('stroke', config.effects.hovercolor);

		if(config.effects.showhovertext){
			graph.frame.selectAll('.cge-' + uv.util.formatClassName(category)).selectAll('text')
				.transition().duration(config.effects.hover)
					.style('fill', config.effects.textcolor);
		}
	};
	graph.effects[category].mouseover = effect;

	return effect;
};

uv.effects.line.mouseout = function (graph, idx, defColor) {
	var config = graph.config,
		category = graph.categories[idx],
		color = defColor || uv.util.getColorBand(graph.config, idx);

	var effect = function () {
		graph.frame.selectAll('.cge-' + uv.util.formatClassName(category)).selectAll('circle')
			.transition().duration(config.effects.hover)
				.style('fill', color)
				.style('fill-opacity', 0.6)
				.style('stroke', color);

		graph.frame.selectAll('.cge-' + uv.util.formatClassName(category)).select('path')
			.transition().duration(config.effects.hover)
				.style('stroke', color);

		graph.frame.selectAll('.cge-' + uv.util.formatClassName(category)).selectAll('text')
			.transition().duration(config.effects.hover)
				.style('fill', graph.config.label.showlabel ? color : 'none');

	};	
	graph.effects[category].mouseout = effect;
	return effect;
};

uv.effects.caption = {};
uv.effects.caption.mouseover = function (config) {
	return function () {
		d3.select(this.parentNode.parentNode).select('.' + uv.constants.classes.hoverbg)
			.transition().duration(config.effects.duration)
				.style('fill', config.caption.hovercolor);
	};
};

uv.effects.caption.mouseout = function (config) {
	return function () {
		d3.select(this.parentNode.parentNode).select('.' + uv.constants.classes.hoverbg)
			.transition().duration(config.effects.duration)
				.style('fill', config.graph.background);
	};
};

uv.effects.donut = {};
uv.effects.donut.mouseover = function (center, arcfunc, config, d) {
	return function (d) {
		var dev = {
				x : arcfunc.centroid(d)[0] / 5,
				y : arcfunc.centroid(d)[1] / 5
			};

		d3.select(this.parentNode)
			.transition().duration(config.effects.duration)
				.attr('transform', 'translate(' + (center.x + dev.x) + ',' + (center.y + dev.y) + ')');
	};
};

uv.effects.donut.mouseout = function (center, config) {
	return function () {
		d3.select(this.parentNode)
			.transition().duration(config.effects.duration)
				.attr('transform', 'translate(' + center.x + ',' + center.y + ')');
	};
};

uv.effects.pie = {};
uv.effects.pie.mouseover = function (center, arcfunc, config, d) {
	return function (d) {
		var dev = {
				x : arcfunc.centroid(d)[0] / 5,
				y : arcfunc.centroid(d)[1] / 5
			};

		d3.select(this.parentNode)
			.transition().duration(config.effects.duration)
				.attr('transform', 'translate(' + (center.x + dev.x) + ',' + (center.y + dev.y) + ')');
	};
};

uv.effects.pie.mouseout = function (center, config) {
	return function () {
		d3.select(this.parentNode)
			.transition().duration(config.effects.duration)
				.attr('transform', 'translate(' + center.x + ',' + center.y + ')');
	};
};

uv.effects.legend = {};
uv.effects.legend.mouseover = function (self, idx) {
	return self.effects.group[self.categories[idx]].mouseover;
};

uv.effects.legend.mouseout = function (self, idx) {
	return self.effects.group[self.categories[idx]].mouseout;
};

uv.effects.legend.click = function (i, ctx, graph) {
	var disabled = (d3.select(ctx).attr('disabled') === 'false') ? false : true;
	graph.toggleGraphGroup(i);
	d3.select(ctx).select('rect').style('fill', disabled ? uv.util.getColorBand(graph.config, i) : uv.config.legend.inactivecolor);
	d3.select(ctx).select('text').style('fill', disabled ? null : uv.config.legend.inactivecolor);
	d3.select(ctx).attr('disabled', disabled ? 'false' : 'true');
};

uv.palette = {
	'Plain' : [ '#1F77B4' ],
	'Simple' : [ '#d42f3c', '#85b1e6', '#FD6D16', '#dfe617' ],
	'RGB' : [ '#bb2211', '#2222bb', '#22aa22', '#9999aa', '#223322' ],
	'Olive' : [ '#B4AF91', '#787746', '#40411E', '#32331D' ],
	'Soil and Sky' : [ '#928174', '#AA9788', '#BDE4E9', '#A8E1E9', '#90D1DA' ],
	'Candid' : [ '#EADEA1', '#808355', '#4E493D', '#3A301C', '#3F7696' ],
	'Sulphide' : [ '#949993', '#615952', '#343640', '#A15026', '#C7B091' ],
	'New Moon' : [ '#EEE6AB', '#C5BC8E', '#696758', '#45484B', '#36393B' ],
	'Nature' : [ '#EEEFD8', '#BECD8A', '#73880A', '#CCCC33', '#E2EAA3' ],
	'Earth' : [ '#862424', '#D8D1B4', '#B3AB8E', '#F1F0E9', '#353535' ],
	'Sea' : [ '#334433', '#6699aa', '#88aaaa', '#aacccc', '#447799' ],
	'Lemon' : [ '#eebb00', '#ddaa00', '#eecc00', '#ffee11' ],
	'Water' : [ '#2266bb', '#3388dd', '#55aaee', '#bbddee', '#113355' ],
	'Grass' : [ '#00AF64', '#36D729', '#61D7A4', '#007241' ],
	'Hash' : [ 'tomato', 'yellowgreen', 'midnightblue', 'lightseagreen', 'gold'],
	'Soft' : ['#f1b2e1', '#b1ddf3', '#ffde89', '#e3675c', '#c2d985'],
	'Brink' : ['#01243b', '#5288d8', '#9da7b2', '#c5c5c5', '#71c42b'],
	'Bright' : ['#ef597b', '#ff6d31', '#73b66b', '#ffcb18', '#29a2c6'],
	'Lint' : ['#667b99', '#afbbd2', '#ccd5e6', '#e9eef6', '#ff6637']
};


uv.Test = function () {
	var self = this;

	self.categories = ['fruits', 'browsers', 'distros', 'countries'];
	self.categoryData = {
		'fruits' : ['oranges', 'apples', 'mangoes', 'pears', 'berries', 'guava', 'pineapples', 'watermelons'],
		'browsers' : ['firefox', 'safari', 'ie', 'chrome', 'opera', 'maxthon', 'midori', 'epiphany'],
		'distros': ['Linux Mint', 'Ubuntu', 'PCLinuxOS', 'Fedora', 'Rosa', 'OpenSUSE', 'Sabayon Linux'],
		'countries' : ['U.S.A', 'U.K', 'India', 'China', 'Canada', 'Brazil', 'Pakistan', 'France', 'Spain', 'Australia']
	};

	self.labels = ['years', 'users', 'mood'];
	self.labelData = {
		'years' : ['2001', '2002', '2003', '2004', '2005', '2006', '2007', '2008', '2009', '2010'],
		'users' : ['infants', 'kids', 'teens', 'middleage', 'oldage'],
		'mood' : ['happy', 'sad', 'excited', 'surprised', 'none', 'angry']
	};

	self.init();
};


uv.Test.prototype.init = function () {
	var self = this;
	var labelNumber = uv.Test.getRandomInteger(0, self.labels.length), categoryNumber = uv.Test.getRandomInteger(0, self.categories.length),
		label = self.labels[labelNumber], category = self.categories[categoryNumber];

	var nLabels = uv.Test.getRandomInteger(1, self.labelData[label].length + 1),
			nCategories = uv.Test.getRandomInteger(1, self.categoryData[category].length + 1);

	self.categorySet = uv.Test.getRandomSet(self.categoryData[category], nCategories);
	self.labelSet = uv.Test.getRandomSet(self.labelData[label], nLabels);
};

uv.Test.getRandomSet = function (array, num) {
	var self = this;
	var numbers = [], set = [], selected = 0;
	while (selected !== num) {
		var number = uv.Test.getRandomInteger(0, array.length);
		if (numbers.indexOf(number) === -1) {
			set.push(array[number]);
			numbers.push(number);
			selected += 1;
		}
	}

	return set;
};

uv.Test.prototype.getGraphDef = function () {
	var self = this;
	var graphdef = {};
	graphdef.categories = self.categorySet;
	graphdef.dataset = self.getDataset();

	console.log(graphdef);
	return graphdef;
};

uv.Test.prototype.getDataset = function () {
	var self = this;
	var dataset = {};
	for (var i=0, cLength = self.categorySet.length; i<cLength; i++) {
		var data = [], category = self.categorySet[i];
		for (var j=0, lLength = self.labelSet.length; j<lLength; j++) {
			data.push(uv.Test.getDataElement(self.labelSet[j]));
		}
		dataset[category] = data;
	}

	return dataset;
};

uv.Test.getDataElement = function (label) {
	var self = this, dataElement = {};
	dataElement.name = label;
	dataElement.value = uv.Test.getRandomInteger(1, 1000);
	return dataElement;
};

uv.Test.getRandomValue = function (min, max) {
	return (Math.random() * (max - min + 1)) + min;
};

uv.Test.getRandomDataset = function (num, min, max) {
	var self = this, data = [];
	for (var i = 0; i < num; i++) {
		data.push(uv.Test.getRandomValue(min, max));
	}
};

uv.Test.getRandomInteger = function (min, max) {
	return Math.floor(Math.random() * (max - min)) + min;
};

uv.Test.getRandomIntegers = function (num, min, max) {
	var self = this, data = [];
	for (var i = 0; i < num; i++) {
		data.push(uv.Test.getRandomInteger(min, max));
	}
	return data;
};
uv.AreaGraph = function (graphdef, config) {
	var self = this;
	uv.Graph.call(self).setDefaults(graphdef, config).init(graphdef, config);

	self.areagroups = [];
	self.dataset = uv.util.getDataArray(self.graphdef);

	var areagroup, areapath, areafunc, idx, len,
		domainData = self.graphdef.dataset[self.graphdef.categories[0]];

	self.axes[self.config.graph.orientation === 'Horizontal' ? 'ver' : 'hor'].scale.domain(domainData.map(function (d) { return d.name; }));

	for (idx = 0, len = self.dataset.length; idx < len; idx = idx + 1) {
		areapath = self.panel.append('g').classed('cg-' + uv.util.formatClassName(self.categories[idx]), true)
												.append('g').classed('cge-' + uv.util.formatClassName(self.categories[idx]), true).datum(self.dataset[idx]);
		areagroup = { path: areapath, linefunc: undefined, areafunc: undefined, line: undefined, area: undefined };
		self['draw' + self.config.graph.orientation + 'Area'](areagroup, idx);
		self.areagroups.push(areagroup);
	}

	self.finalize();
};

uv.AreaGraph.prototype = uv.util.extend(uv.Graph);

uv.AreaGraph.prototype.setDefaults = function (graphdef, config) {
	graphdef.stepup = false;
	return this;
};

uv.AreaGraph.prototype.drawHorizontalArea = function (areagroup, idx) {
	var self = this,
		color = uv.util.getColorBand(self.config, idx);
		
	self.axes.ver.scale.rangePoints([0, self.height()]);

	areagroup.linefunc = d3.svg.line()
				.x(function (d) { return self.axes.hor.scale(d.value); })
				.y(function (d) { return self.axes.ver.scale(d.name) + self.axes.ver.scale.rangeBand() / 2; })
				.interpolate(self.config.area.interpolation);

	areagroup.areafunc = d3.svg.area()
				.x0(self.axes.hor.scale(0))
				.x1(areagroup.linefunc.x())
				.y(areagroup.linefunc.y())
				.interpolate(self.config.area.interpolation);

	areagroup.area = areagroup.path.append('svg:path')
				.classed(uv.constants.classes.areapath + idx, true)
				.attr('d', areagroup.areafunc)
				.style('opacity', self.config.area.opacity)
				.style('-moz-opacity', self.config.area.opacity)
				.style('fill', color);

	areagroup.line = areagroup.path.append('svg:path')
				.classed(uv.constants.classes.linepath + idx, true)
				.attr('d', areagroup.linefunc)
				.style('stroke', 'white')
				.style('fill', 'none');

	areagroup.path.selectAll('.' + uv.constants.classes.dot)
				.data(self.dataset[idx])
				.enter().append('circle')
				.classed(uv.constants.classes.dot, true)
				.attr('cx', areagroup.linefunc.x())
				.attr('cy', areagroup.linefunc.y())
				.attr('r', 3.5)
				.style('fill', 'white');
};

uv.AreaGraph.prototype.drawVerticalArea = function (areagroup, idx) {
	var self = this,
		color = uv.util.getColorBand(self.config, idx);
	
	self.axes.hor.scale.rangePoints([0, self.width()]);

	areagroup.linefunc = d3.svg.line()
				.x(function (d) { return self.axes.hor.scale(d.name) + self.axes.hor.scale.rangeBand() / 2; })
				.y(function (d) { return self.axes.ver.scale(d.value); })
				.interpolate(self.config.area.interpolation);

	areagroup.areafunc = d3.svg.area()
				.x(areagroup.linefunc.x())
				.y0(areagroup.linefunc.y())
				.y1(self.axes.ver.scale(0))
				.interpolate(self.config.area.interpolation);

	areagroup.area = areagroup.path.append('svg:path')
				.classed(uv.constants.classes.areapath + idx, true)
				.attr('d', areagroup.areafunc)
				.style('opacity', self.config.area.opacity)
				.style('-moz-opacity', self.config.area.opacity)
				.style('fill', color);

	areagroup.line = areagroup.path.append('svg:path')
				.classed(uv.constants.classes.linepath + idx, true)
				.attr('d', areagroup.linefunc)
				.style('stroke', 'white')
				.style('fill', 'none');

	areagroup.path.selectAll('.' + uv.constants.classes.dot)
				.data(self.dataset[idx])
				.enter().append('circle')
				.classed(uv.constants.classes.dot, true)
				.attr('cx', areagroup.linefunc.x())
				.attr('cy', areagroup.linefunc.y())
				.attr('r', 3.5)
				.style('fill', 'white');
};
/**
/**
 * A normal 2d bar chart capable of being rendered in horizontal and vertical manner
 * @param {Object} graphdef Definition of the graph being rendered
 * @param {Object} config   Configuration of the graph being rendered
 */
uv.BarGraph = function (graphdef, config) {
	var self = this;
	uv.Graph.call(self).setDefaults(graphdef, config).init(graphdef, config);

	self.bargroups = {};

	self.axes[self.config.graph.orientation === 'Horizontal' ? 'ver' : 'hor'].scale.domain(self.labels);
	
	var idx, length = self.categories.length, category;
	for (idx = 0; idx < length; idx = idx + 1) {
		category = self.categories[idx];
		self.bargroups[category] = self.panel.append('g').classed('cg-' + uv.util.formatClassName(category), true);
		self['draw' + self.config.graph.orientation + 'Bars'](idx);
	}

	self.finalize();
};

uv.BarGraph.prototype = uv.util.extend(uv.Graph);

uv.BarGraph.prototype.setDefaults = function (graphdef, config) {
	graphdef.stepup = false;
	return this;
};

uv.BarGraph.prototype.drawHorizontalBars = function (idx) {
	var self = this,
		color = uv.util.getColorBand(this.config, idx),
		len = self.categories.length;
	
	var bars = self.bargroups[self.categories[idx]].selectAll('g').data(self.graphdef.dataset[self.categories[idx]]).enter()
				.append('g').classed('cge-' + uv.util.formatClassName(self.categories[idx]), true);
	
	bars.append('rect')
		.classed(uv.util.formatClassName(self.categories[idx]), true)
		.classed('cr_' + uv.util.formatClassName(self.categories[idx]), true)
		.attr('height', self.axes.ver.scale.rangeBand() / len)
		.attr('x', 0)
		.attr('y', function (d) {return self.axes.ver.scale(d.name); })
		.style('stroke', self.config.bar.strokecolor)
		.style('fill', color)
		.transition()
			.duration(self.config.effects.duration)
			.delay(function (d, i) { return i * self.config.effects.duration; })
			.attr('width', function (d) { return self.axes.hor.scale(d.value); })
			.call(uv.util.endAll, function (d,i){
				d3.select(this.parentNode.parentNode).selectAll('rect').on('mouseover', uv.effects.bar.mouseover(self, idx));
				d3.select(this.parentNode.parentNode).selectAll('rect').on('mouseout', uv.effects.bar.mouseout(self, idx));
			});


	bars.append('text')
		.attr('y', function(d) { return self.axes.ver.scale(d.name) + (self.axes.ver.scale.rangeBand()/len)/2; })
		.attr('dx', 4)
		.attr('dy', '.35em')
		.attr('text-anchor', 'start')
		.classed('cr_' + uv.util.formatClassName(self.categories[idx]), true)
		.style('fill', self.config.label.showlabel ? uv.util.getColorBand(self.config, idx) : 'none')
		.style('font-family', self.config.bar.fontfamily)
		.style('font-size', self.config.bar.fontsize)
		.style('font-weight', self.config.bar.fontweight)
		.text(function(d) { return String(d.value); })
		.transition()
			.duration(self.config.effects.duration)
			.delay(function (d, i) { return i * self.config.effects.duration; })
			.attr('x', function (d) { return self.axes.hor.scale(d.value); });
	
	bars.append('svg:title')
		.text( function (d, i) { return self.categories[idx] + ' [' + self.labels[i] + '] : ' + d.value;});
	
	self.bargroups[self.categories[idx]].attr('transform', 'translate(0,' + idx * self.axes.ver.scale.rangeBand() / len + ')');
};

uv.BarGraph.prototype.drawVerticalBars = function (idx) {
	var self = this,
		color = uv.util.getColorBand(this.config, idx),
		len = self.categories.length;
	
	var bars = self.bargroups[self.categories[idx]].selectAll('g').data(self.graphdef.dataset[self.categories[idx]]).enter()
			.append('g').classed('cge-' + uv.util.formatClassName(self.categories[idx]), true);
	
	bars.append('rect')
			.classed(uv.util.formatClassName(self.categories[idx]), true)
			.classed('cr_' + uv.util.formatClassName(self.categories[idx]), true)
			.attr('height', 0)
			.attr('width', 0)
			.attr('x', function (d) {return self.axes.hor.scale(d.name); })
			.attr('y', 0)
			.style('stroke', self.config.bar.strokecolor).style('fill', color)
			.transition()
				.duration(self.config.effects.duration)
				.delay(idx * self.config.effects.duration)
				.attr('height', function (d) { return self.height() - self.axes.ver.scale(d.value); })
				.attr('width', self.axes.hor.scale.rangeBand() / len)
				.call(uv.util.endAll, function (d,i){
					d3.select(this.parentNode.parentNode).selectAll('rect').on('mouseover', uv.effects.bar.mouseover(self, idx));
					d3.select(this.parentNode.parentNode).selectAll('rect').on('mouseout', uv.effects.bar.mouseout(self, idx));
				});

	
	bars.append('text').attr('transform','scale(1,-1)')
			.attr('x', function(d) { return self.axes.hor.scale(d.name) + (self.axes.hor.scale.rangeBand()/len)/2; })
			.attr('y', -10)
			.attr('dx', 0)
			.attr('dy', '.35em')
			.attr('text-anchor', 'middle')
			.classed('cr_' + uv.util.formatClassName(self.categories[idx]), true)
			.style('fill', self.config.label.showlabel ? uv.util.getColorBand(self.config, idx) : 'none')
			.style('font-family', self.config.bar.fontfamily)
			.style('font-size', self.config.bar.fontsize)
			.style('font-weight', self.config.bar.fontweight)
			.text(function(d) { return String(d.value); })
			.transition()
				.duration(self.config.effects.duration)
				.delay(idx * self.config.effects.duration)
				.attr('y', function (d) { return -(self.height() - self.axes.ver.scale(d.value)) - 10; });
	
	bars.append('svg:title')
		.text( function (d, i) { return self.categories[idx] + ' [' + self.labels[i] + '] : ' + d.value;});
	
	self.bargroups[self.categories[idx]].attr('transform', 'translate(' + idx * self.axes.hor.scale.rangeBand() / len + ',' + self.height() + ') scale(1,-1)');
};
uv.DonutGraph = function (graphdef, config) {
	var self = this;
	uv.Graph.call(self).setDefaults(graphdef, config).init(graphdef, config);

	self.radius = Math.min(self.height(), self.width()) * 2 / 5;
	self.center = {
		x : self.width() / 2,
		y : self.height() / 2
	};
	
	self.category = graphdef.categories[0];
	
	var data = uv.util.getCategoryData(self.graphdef, [self.category]),
		arcfunc = d3.svg.arc().innerRadius(self.radius * self.config.donut.factor).outerRadius(self.radius),
		layout = d3.layout.pie();

	self.panel.data(data);
	self.arcs = self.panel.selectAll('g.arc')
					.data(layout).enter()
					.append('g').classed(uv.constants.classes.arc + uv.util.formatClassName(self.category), true)
					.attr('transform', 'translate(' + self.center.x + ',' + self.center.y + ')');

	self.arcs.append('path')
			.attr('d', arcfunc)
			.style('fill', function (d, i) { return uv.util.getColorBand(self.config, i); })
			.style('stroke', self.config.donut.strokecolor)
			.style('stroke-width', self.config.donut.strokewidth)
		.on('mouseover', uv.effects.donut.mouseover(self.center, arcfunc, self.config))
		.on('mouseout', uv.effects.donut.mouseout(self.center, self.config));

	self.arcs.append('text')
			.attr('transform', function (d) { return 'translate(' + arcfunc.centroid(d) + ')'; })
			.attr('dy', '.35em')
			.attr('text-anchor', 'middle')
			.style('fill', self.config.label.showlabel ? self.config.donut.fontfill : 'none')
			.style('font-family', self.config.donut.fontfamily)
			.style('font-size', self.config.donut.fontsize)
			.style('font-weight', self.config.donut.fontweight)
			.style('font-variant', self.config.donut.fontvariant)
			.text(function (d) { return String(d.value); });
		
	self.arcs.append('svg:title')
		.text(function (d, i) { return self.labels[i] + ' : ' + d.value;});
};

uv.DonutGraph.prototype = uv.util.extend(uv.Graph);

uv.DonutGraph.prototype.setDefaults = function (graphdef, config) {
	graphdef.stepup = false;
	return this;
};
uv.LineGraph = function (graphdef, config) {
	var self = this;
	uv.Graph.call(self).setDefaults(graphdef, config).init(graphdef, config);

	self.linegroups = {};
	self.dataset = uv.util.getDataArray(self.graphdef);

	var linegroup, linepath, linefunc, idx, len = self.categories.length,
		domainData = self.labels;

	self.axes[self.config.graph.orientation === 'Horizontal' ? 'ver' : 'hor'].scale.domain(domainData);

	for (idx = 0; idx < len; idx = idx + 1) {
		linepath = self.panel.append('g').classed('cg-' + uv.util.formatClassName(self.categories[idx]), true)
												.append('g').classed('cge-' + uv.util.formatClassName(self.categories[idx]), true).datum(self.dataset[idx]);
		linegroup = {
			path: linepath,
			func: undefined
		};

		self['draw' + self.config.graph.orientation + 'Lines'](linegroup, idx);
		self.linegroups[self.categories[idx]] = linegroup;
	}

	self.finalize();
};

uv.LineGraph.prototype = uv.util.extend(uv.Graph);

uv.LineGraph.prototype.setDefaults = function (graphdef, config) {
	graphdef.stepup = false;
	config.scale.ordinality = 0;
	return this;
};

uv.LineGraph.prototype.drawHorizontalLines = function (linegroup, idx) {
	var self = this,
		axes = self.axes,
		config = self.config,
		color = uv.util.getColorBand(self.config, idx);

	linegroup.func = d3.svg.line()
				.x(function (d) { return axes.hor.scale(d.value); })
				.y(function (d) { return axes.ver.scale(d.name) + axes.ver.scale.rangeBand() / 2; })
				.interpolate(uv.config.line.interpolation);

	linegroup.path.append('path')
				.classed('cr_' + uv.util.formatClassName(self.categories[idx]), true)
				.attr('d', linegroup.func)
				.style('fill', 'none')
				.style('stroke', color)
				.style('stroke-width', 1.5)
				.style('stroke-opacity', 0.01)
				.transition()
					.duration(3 * self.config.effects.duration)
					.delay(2 * idx * self.config.effects.duration)
					.style('stroke-opacity', 1)
					.call(uv.util.endAll, function (d,i){
						d3.select(this.parentNode.parentNode).selectAll('path').on('mouseover', uv.effects.line.mouseover(self, idx));
						d3.select(this.parentNode.parentNode).selectAll('path').on('mouseout', uv.effects.line.mouseout(self, idx));
						d3.select(this.parentNode.parentNode).selectAll('circle').on('mouseover', uv.effects.line.mouseover(self, idx));
						d3.select(this.parentNode.parentNode).selectAll('circle').on('mouseout', uv.effects.line.mouseout(self, idx));
					});

	linegroup.path.selectAll('circle')
				.data(self.dataset[idx])
				.enter().append('circle')
				.classed('cr_' + uv.util.formatClassName(self.categories[idx]), true)
				.attr('cx', linegroup.func.x())
				.attr('cy', linegroup.func.y())
				.attr('r', 3.5)
				.style('fill', color)
				.style('fill-opacity', 0.6)
				.style('stroke', color)
					.append('svg:title')
					.text( function (d, i) { return self.categories[idx] + ' [' + self.labels[i] + ']: ' + d.value;});
	
	linegroup.path.selectAll('text')
				.data(self.dataset[idx])
				.enter().append('text')
				.attr('x', function (d) { return axes.hor.scale(d.value); })
				.attr('y', function(d) { return axes.ver.scale(d.name) + axes.ver.scale.rangeBand()/2; })
				.attr('dx', 10)
				.attr('dy', '.35em')
				.attr('text-anchor', 'start')
				.classed('cr_' + uv.util.formatClassName(self.categories[idx]), true)
				.style('fill', self.config.label.showlabel ? uv.util.getColorBand(self.config, idx) : 'none')
				.style('font-family', self.config.bar.fontfamily)
				.style('font-size', self.config.bar.fontsize)
				.style('font-weight', self.config.bar.fontweight)
				.text(function(d) { return String(d.value); });
	
	return this;
};

uv.LineGraph.prototype.drawVerticalLines = function (linegroup, idx) {
	var self = this,
		axes = self.axes,
		config = self.config,
		color = uv.util.getColorBand(self.config, idx);

	linegroup.func = d3.svg.line()
				.x(function (d) { return axes.hor.scale(d.name) + axes.hor.scale.rangeBand() / 2; })
				.y(function (d) { return axes.ver.scale(d.value); })
				.interpolate(uv.config.line.interpolation);

	linegroup.path.append('path')
				.attr('d', linegroup.func)
				.classed('cr_' + uv.util.formatClassName(self.categories[idx]), true)
				.style('fill', 'none')
				.style('stroke', color)
				.style('stroke-width', 1.5)
				.style('stroke-opacity', 0.01)
				.transition()
					.duration(self.config.effects.duration)
					.delay(2 * idx * self.config.effects.duration)
					.style('stroke-opacity', 1)
					.call(uv.util.endAll, function (d,i){
						d3.select(this.parentNode.parentNode).selectAll('path').on('mouseover', uv.effects.line.mouseover(self, idx));
						d3.select(this.parentNode.parentNode).selectAll('path').on('mouseout', uv.effects.line.mouseout(self, idx));
						d3.select(this.parentNode.parentNode).selectAll('circle').on('mouseover', uv.effects.line.mouseover(self, idx));
						d3.select(this.parentNode.parentNode).selectAll('circle').on('mouseout', uv.effects.line.mouseout(self, idx));
					});

	linegroup.path.selectAll('circle')
				.data(self.dataset[idx])
				.enter().append('circle')
				.attr('cx', linegroup.func.x())
				.attr('cy', linegroup.func.y())
				.attr('r', 3.5)
				.classed('cr_' + uv.util.formatClassName(self.categories[idx]), true)
				.style('fill', color)
				.style('fill-opacity', 0.2)
				.style('stroke', color)
					.append('svg:title')
					.text( function (d, i) { return self.categories[idx] + ' [' + self.labels[i] + ']: ' + d.value;});
	
	linegroup.path.selectAll('text')
				.data(self.dataset[idx])
				.enter().append('text')
				.attr('x', function (d) { return axes.hor.scale(d.name) + axes.hor.scale.rangeBand() / 2; })
				.attr('y', function (d) { return axes.ver.scale(d.value) - 20; })
				.attr('dx', 0)
				.attr('dy', '.71em')
				.attr('text-anchor', 'middle')
				.classed('cr_' + uv.util.formatClassName(self.categories[idx]), true)
				.style('fill', self.config.label.showlabel ? uv.util.getColorBand(self.config, idx) : 'none')
				.style('font-family', self.config.bar.fontfamily)
				.style('font-size', self.config.bar.fontsize)
				.style('font-weight', self.config.bar.fontweight)
				.text(function(d) { return String(d.value); });

	return this;
};
uv.PercentAreaGraph = function (graphdef, config) {
	var self = this;
	uv.Graph.call(self).setDefaults(graphdef, config).init(graphdef, config);

	var stacklayout = d3.layout.stack().offset('zero')(
		self.categories.map(function (d) {
			return graphdef.dataset[d].map(function (d) {
				return {x: d.name, y: +d.value};
			});
		})
	);

	var areagroup, areapath, areafunc,
		domainData = self.labels,
		categories = self.categories;

	self.axes[self.config.graph.orientation === 'Horizontal' ? 'ver' : 'hor'].scale.domain(domainData);
	self.areagroup = self.panel.selectAll('g.areagroup').data(stacklayout).enter().append('g')
								.attr('class', function (d,i) {
									if( !d3.select(this).attr('class')) {
										return 'cge-' + uv.util.formatClassName(self.categories[i]);
									}
									return d3.select(this).attr('class') + ('cge-' + uv.util.formatClassName(self.categories[i])); 
								});

	self['draw' + self.config.graph.orientation + 'Area']();

	self.finalize(true);
};

uv.PercentAreaGraph.prototype = uv.util.extend(uv.Graph);

uv.PercentAreaGraph.prototype.setDefaults = function (graphdef, config) {
	graphdef.stepup = 'percent';
	return this;
};

uv.PercentAreaGraph.prototype.drawHorizontalArea = function () {
	var self = this, axes = self.axes,
		categories = self.categories,
		config = self.config,
		sumMap = uv.util.getSumUpArray(self.graphdef);
	
	axes.ver.scale.rangePoints([0, self.height()]);

	for(var i = 0; i < categories.length; i = i + 1) {
		uv.effects.area.mouseover(self, i);
		uv.effects.area.mouseout(self,i);
	}

	self.areagroup.append('path')
			.attr('class', function (d, i) {
				if( !d3.select(this).attr('class')) {
					return uv.constants.classes.area + uv.util.formatClassName(categories[i]);
				}
				return  d3.select(this).attr('class') + (uv.constants.classes.area + uv.util.formatClassName(categories[i])); 
			})
			.style('fill', function (d, i) { return uv.util.getColorBand(config, i); })
			.attr('d', d3.svg.area()
				.y(function (d) { return axes.ver.scale(d.x) + axes.ver.scale.rangeBand() / 2; })
				.x0(function (d, i) { return axes.hor.scale(uv.util.getPercentage(d.y0, sumMap[i])); })
				.x1(function (d, i) { return axes.hor.scale(uv.util.getPercentage(d.y0 + d.y, sumMap[i])); })
				.interpolate(self.config.area.interpolation)
		)
		.on('mouseover', function (d,i) { self.effects[categories[i]].mouseover(); })
		.on('mouseout', function (d,i) { self.effects[categories[i]].mouseout(); });

	self.areagroup.append('path')
		.attr('class', function (d, i) {
			if( !d3.select(this).attr('class')) {
				return uv.constants.classes.line + uv.util.formatClassName(categories[i]);	
			}
			return d3.select(this).attr('class') + (uv.constants.classes.line + uv.util.formatClassName(categories[i])); 
		})
		.style('stroke', 'white')
		.style('fill', 'none')
		.style('stroke-width', 2)
		.attr('d', d3.svg.line()
				.y(function (d) { return axes.ver.scale(d.x) + axes.ver.scale.rangeBand() / 2; })
				.x(function (d, i) { return axes.hor.scale(uv.util.getPercentage(d.y0 + d.y, sumMap[i])); })
				.interpolate(self.config.area.interpolation)
		);
};

uv.PercentAreaGraph.prototype.drawVerticalArea = function () {
	var self = this, axes = self.axes,
		categories = self.categories,
		config = self.config,
		sumMap = uv.util.getSumUpArray(self.graphdef);
	
	axes.hor.scale.rangePoints([0, self.width()]);
	
	for(var i = 0; i < categories.length; i = i + 1){
		uv.effects.area.mouseover(self, i);
		uv.effects.area.mouseout(self,i);
	}

	self.areagroup.append('path')
			.attr('class', function (d, i) {
				if( !d3.select(this).attr('class')) {
					return uv.constants.classes.area + uv.util.formatClassName(categories[i]);
				}
				return d3.select(this).attr('class') + (uv.constants.classes.area + uv.util.formatClassName(categories[i])); 
			})
			.style('fill', function (d, i) { return uv.util.getColorBand(config, i); })
			.attr('d', d3.svg.area()
				.x(function (d) { return axes.hor.scale(d.x) + axes.hor.scale.rangeBand() / 2; })
				.y0(function (d, i) { return axes.ver.scale(uv.util.getPercentage(d.y0, sumMap[i])); })
				.y1(function (d, i) { return axes.ver.scale(uv.util.getPercentage(d.y0 + d.y, sumMap[i])); })
				.interpolate(self.config.area.interpolation)
			)
		.on('mouseover', function (d,i) {self.effects[categories[i]].mouseover(); })
		.on('mouseout', function (d,i) { self.effects[categories[i]].mouseout(); });

	self.areagroup.append('path')
			.attr('class', function (d, i) {
				if( !d3.select(this).attr('class')) {
					return uv.constants.classes.line + uv.util.formatClassName(categories[i]);
				}
				return d3.select(this).attr('class') + (uv.constants.classes.line + uv.util.formatClassName(categories[i])); 
			})
			.style('stroke', 'white')
			.style('fill', 'none')
			.style('stroke-width', 2)
			.attr('d', d3.svg.line()
				.x(function (d, i) { return axes.hor.scale(d.x) + axes.hor.scale.rangeBand() / 2; })
				.y(function (d, i) { return axes.ver.scale(uv.util.getPercentage(d.y0 + d.y, sumMap[i])); })
				.interpolate(self.config.area.interpolation)
			);
};
uv.PercentBarGraph = function (graphdef, config) {
	var self = this;
	uv.Graph.call(self).setDefaults(graphdef, config).init(graphdef, config);

	self.bargroups = [];

	var bargroup, bars, idx, len, color,
		domainData = self.labels,
		csum = domainData.map(function (d) {return 0; }),
		tsum = domainData.map(function (d) {return 0; });

	self.axes[self.config.graph.orientation === 'Horizontal' ? 'ver' : 'hor'].scale.domain(domainData);

	for (idx = 0, len = self.categories.length; idx < len; idx = idx + 1) {
		color = uv.util.getColorBand(self.config, idx);
		bargroup = self.panel.append('g').classed('cg-' + self.categories[idx], true);
		bars = bargroup.selectAll('g').data(self.graphdef.dataset[self.categories[idx]]).enter().append('g').classed('cge-' + uv.util.formatClassName(self.categories[idx]), true);

		self['draw' + uv.util.getPascalCasedName(self.config.graph.orientation) + 'Bars'](bars, csum, tsum, idx);

		if (self.config.graph.orientation === 'Vertical') {
			bargroup.attr('transform', 'translate(0,' + 2 * self.height() + ') scale(1,-1)');
		}

		self.bargroups.push(bargroup);
	}

	self.finalize();
};

uv.PercentBarGraph.prototype = uv.util.extend(uv.Graph);

uv.PercentBarGraph.prototype.setDefaults = function (graphdef, config) {
	graphdef.stepup = 'percent';
	config.scale.ordinality = 0;
	return this;
};

uv.PercentBarGraph.prototype.drawHorizontalBars = function (bars, csum, tsum, idx) {
	var self = this,
		axes = this.axes,
		color = uv.util.getColorBand(this.config, idx),
		config = this.config,
		sumMap = uv.util.getSumUpArray(this.graphdef);
	
	bars.append('rect')
		.attr('height', axes.ver.scale.rangeBand())
		.attr('width', 0)
		.attr('x', function (d, i) { var value = axes.hor.scale(uv.util.getPercentage(csum[i], sumMap[i])); csum[i] += d.value; return value; })
		.attr('y', function (d) {return axes.ver.scale(d.name); })
		.classed('cr_' + uv.util.formatClassName(self.categories[idx]), true)
		.style('stroke', 'none')
		.style('fill', color)
		.transition()
			.duration(uv.config.effects.duration)
			.delay(idx * uv.config.effects.duration)
			.attr('width', function (d, i) { return axes.hor.scale(uv.util.getPercentage(d.value, sumMap[i]));})
			.call(uv.util.endAll, function (d,i){
				d3.select(this.parentNode.parentNode).selectAll('rect').on('mouseover', uv.effects.bar.mouseover(self, idx, self.config.effects.textcolor));
				d3.select(this.parentNode.parentNode).selectAll('rect').on('mouseout', uv.effects.bar.mouseout(self, idx, self.config.effects.textcolor));
			});


	bars.append('text')
		.attr('y', function(d) { return axes.ver.scale(d.name) + axes.ver.scale.rangeBand()/2; })
		.attr('dx', 0)
		.attr('dy', '.35em')
		.attr('text-anchor', 'end')
		.classed('cr_' + uv.util.formatClassName(self.categories[idx]), true)
		.style('fill', self.config.label.showlabel ? self.config.effects.textcolor : 'none')
		.style('font-family', this.config.bar.fontfamily)
		.style('font-size', this.config.bar.fontsize)
		.style('font-weight', this.config.bar.fontweight)
		.text(function(d, i) { return ( axes.hor.scale(uv.util.getPercentage(csum[i], sumMap[i])) > 15 ) ? String(Math.round(uv.util.getPercentage(d.value, sumMap[i]))) : null; })
		.transition()
			.duration(uv.config.effects.duration)
			.delay(idx * uv.config.effects.duration)
			.attr('x', function (d, i) { tsum[i] += d.value; return axes.hor.scale(uv.util.getPercentage(tsum[i], sumMap[i])) - 5; });
};

uv.PercentBarGraph.prototype.drawVerticalBars = function (bars, csum, tsum, idx) {
	var self = this,
		height = this.height(),
		axes = this.axes,
		color = uv.util.getColorBand(this.config, idx),
		config = this.config,
		sumMap = uv.util.getSumUpArray(this.graphdef);
	
	bars.append('rect')
		.attr('height', 0)
		.attr('width', axes.hor.scale.rangeBand())
		.attr('x', function (d) { return axes.hor.scale(d.name); })
		.attr('y', function (d, i) { var value = axes.ver.scale(uv.util.getPercentage(csum[i], sumMap[i])); csum[i] -= d.value; return value; })
		.classed('cr_' + uv.util.formatClassName(self.categories[idx]), true)
		.style('stroke', 'none')
		.style('fill', color)
		.transition()
			.duration(uv.config.effects.duration)
			.delay(idx * uv.config.effects.duration)
			.attr('height', function (d, i) { return height - axes.ver.scale(uv.util.getPercentage(d.value, sumMap[i])); })
			.call(uv.util.endAll, function (d,i){
				d3.select(this.parentNode.parentNode).selectAll('rect').on('mouseover', uv.effects.bar.mouseover(self, idx, self.config.effects.textcolor));
				d3.select(this.parentNode.parentNode).selectAll('rect').on('mouseout', uv.effects.bar.mouseout(self, idx, self.config.effects.textcolor));
			});
	
	bars.append('text').attr('transform','scale(1,-1)')
		.attr('x', function(d) { return axes.hor.scale(d.name) + axes.hor.scale.rangeBand()/2; })
		.attr('y', -height + 5)
		.attr('dy', '.71em')
		.attr('text-anchor', 'middle')
		.classed('cr_' + uv.util.formatClassName(self.categories[idx]), true)
		.style('fill', self.config.label.showlabel ? self.config.effects.textcolor : 'none')
		.style('font-family', this.config.bar.fontfamily)
		.style('font-size', this.config.bar.fontsize)
		.style('font-weight', this.config.bar.fontweight)
		.text(function(d, i) { return ( height - axes.ver.scale(uv.util.getPercentage(d.value, sumMap[i])) > 15) ? String(Math.round(uv.util.getPercentage(d.value, sumMap[i]))) : null; })
		.transition()
			.duration(uv.config.effects.duration)
			.delay(idx * uv.config.effects.duration)
			.attr('y', function (d, i) { tsum[i] += d.value; return -(2*height - axes.ver.scale(uv.util.getPercentage(tsum[i], sumMap[i]))) + 5; });
};
uv.PieGraph = function (graphdef, config) {
	var self = this;
	uv.Graph.call(self).setDefaults(graphdef, config).init(graphdef, config);

	self.radius = Math.min(self.height(), self.width()) * 2 / 5;
	self.center = {
		x : self.width() / 2,
		y : self.height() / 2
	};
	
	self.category = graphdef.categories[0];

	var data = uv.util.getCategoryData(self.graphdef, [self.category]),
		arcfunc = d3.svg.arc().innerRadius(0).outerRadius(self.radius),
		layout = d3.layout.pie();

	self.panel.data(data);
	self.arcs = self.panel.selectAll('g.arc')
					.data(layout).enter()
					.append('g').classed(uv.constants.classes.arc + uv.util.formatClassName(self.category), true)
					.attr('transform', 'translate(' + self.center.x + ',' + self.center.y + ')');

	self.arcs.append('path')
			.attr('d', arcfunc)
			.style('fill', function (d, i) { return uv.util.getColorBand(self.config, i); })
			.style('stroke', self.config.pie.strokecolor)
			.style('stroke-width', self.config.pie.strokewidth)
		.on('mouseover', uv.effects.pie.mouseover(self.center, arcfunc, self.config))
		.on('mouseout', uv.effects.pie.mouseout(self.center, self.config));

	self.arcs.append('text')
			.attr('transform', function (d) { return 'translate(' + arcfunc.centroid(d) + ')'; })
			.attr('dy', '.35em')
			.attr('text-anchor', 'middle')
			.style('fill', self.config.label.showlabel ? self.config.donut.fontfill : 'none')
			.style('font-family', self.config.pie.fontfamily)
			.style('font-size', self.config.pie.fontsize)
			.style('font-weight', self.config.pie.fontweight)
			.style('font-variant', self.config.pie.fontvariant)
			.text(function (d) { return String(d.value); });
	
	self.arcs.append('svg:title')
		.text(function (d, i) { return self.labels[i] + ' : ' + d.value;});
};

uv.PieGraph.prototype = uv.util.extend(uv.Graph);

uv.PieGraph.prototype.setDefaults = function (graphdef, config) {
	graphdef.stepup = false;
	return this;
};
uv.PolarAreaGraph = function (graphdef, config) {
	var self = this;

	uv.Graph.call(self).setDefaults(graphdef, config).init(graphdef, config);

	self.maxRadius = Math.min(self.height(), self.width()) * 2/5;
	self.center = {
		x : self.width() / 2,
		y : self.height() / 2
	};

	self.category = self.categories[0];

	var data = uv.util.getCategoryData(self.graphdef, [self.category]),
		layout = d3.layout.pie(),
		arcfuncs = data[0].map( function (d, i) {
			return d3.svg.arc().innerRadius(0)
					.outerRadius((d * self.maxRadius) / self.max());
		});

	self.panel.data(data);
	self.arcs = self.panel.selectAll('g.arc')
									.data(layout).enter()
									.append('g').classed(uv.constants.classes.arc + uv.util.formatClassName(self.category), true)
									.attr('transform', 'translate(' + self.center.x + ',' + self.center.y + ')');

	self.arcs.append('path')
		.attr('d', arcfuncs[0]) /*function (d, i) {
			arcfuncs[i](d, i);
		})*/
		.style('fill', function (d, i) { return uv.util.getColorBand(self.config, i);})
		.style('stroke', self.config.pie.strokecolor)
		.style('stroke-width', self.config.pie.strokewidth);

	self.arcs.append('text')
			.attr('transform', function (d, i) { return 'translate(' + arcfuncs[i].centroid(d) + ')'; })
			.attr('dy', '.35em')
			.attr('text-anchor', 'middle')
			.style('fill', self.config.pie.fontfill)
			.style('font-family', self.config.pie.fontfamily)
			.style('font-size', self.config.pie.fontsize)
			.style('font-weight', self.config.pie.fontweight)
			.style('font-variant', self.config.pie.fontvariant)
			.text(function (d) { return String(d.value); });
	
	self.arcs.append('svg:title')
		.text(function (d, i) { return self.labels[i] + ' : ' + d.value;});
};

uv.PolarAreaGraph.prototype = uv.util.extend(uv.Graph);

uv.PolarAreaGraph.prototype.setDefaults = function (graphdef, config) {
	graphdef.stepup = false;
	return this;
};
uv.StackedAreaGraph = function (graphdef, config) {
	var self = this;
	uv.Graph.call(self, graphdef).setDefaults(graphdef, config).init(graphdef, config);

	var stacklayout = d3.layout.stack().offset(self.config.area.offset)(self.categories.map(function (d) {
			return graphdef.dataset[d].map(function (d) { return {x: d.name, y: +d.value}; });
	}));

	self.axes[self.config.graph.orientation === 'Horizontal' ? 'ver' : 'hor'].scale.domain(self.labels.map(function (d) { return d; }));
	self.areagroup = self.panel.append('g').selectAll('g')
											.data(stacklayout).enter().append('g').attr('class', function (d, i) {
												if( !d3.select(this).attr('class')) {
													return 'cge-' + uv.util.formatClassName(self.categories[i]);
												}
												return d3.select(this).attr('class') + ('cge-' + uv.util.formatClassName(self.categories[i]));
											});
	
	self['draw' + self.config.graph.orientation + 'Area']();

	self.finalize();
};

uv.StackedAreaGraph.prototype = uv.util.extend(uv.Graph);

uv.StackedAreaGraph.prototype.setDefaults = function (graphdef, config) {
	graphdef.stepup = true;
	return this;
};

uv.StackedAreaGraph.prototype.drawHorizontalArea = function () {
	var self = this, axes = self.axes,
		categories = self.categories,
		config = self.config;
	
	axes.ver.scale.rangePoints([0, self.height()]);

	for(var i = 0; i < categories.length; i = i + 1){
		uv.effects.area.mouseover(self, i);
		uv.effects.area.mouseout(self, i);
	}

	self.areagroup.append('path')
			.attr('class', function (d, i) {
				if( !d3.select(this).attr('class')) {
					return uv.constants.classes.area + uv.util.formatClassName(categories[i]);
				}
				return d3.select(this).attr('class') + (uv.constants.classes.area + uv.util.formatClassName(categories[i]));
			})
			.style('fill', function (d, i) { return uv.util.getColorBand(config, i); })
			.attr('d', d3.svg.area()
				.y(function (d) { return axes.ver.scale(d.x) + axes.ver.scale.rangeBand() / 2; })
				.x0(function (d) { return axes.hor.scale(d.y0); })
				.x1(function (d) { return axes.hor.scale(d.y0 + d.y); })
				.interpolate(self.config.area.interpolation)
			)
		.on('mouseover', function (d,i){ self.effects[categories[i]].mouseover(); })
		.on('mouseout',  function (d,i) { self.effects[categories[i]].mouseout(); });

	self.areagroup.append('path')
		.attr('class', function (d, i) {
			if( !d3.select(this).attr('class')) {
				return uv.constants.classes.line + uv.util.formatClassName(categories[i]);
			}
			return d3.select(this).attr('class') + (uv.constants.classes.line+ uv.util.formatClassName(categories[i])); 
		})
		.style('stroke', 'white')
		.style('fill', 'none')
		.style('stroke-width', 2)
		.attr('d', d3.svg.line()
			.y(function (d) { return axes.ver.scale(d.x) + axes.ver.scale.rangeBand() / 2; })
			.x(function (d) { return axes.hor.scale(d.y0 + d.y); })
			.interpolate(self.config.area.interpolation)
		);

	return self;
};

uv.StackedAreaGraph.prototype.drawVerticalArea = function () {
	var self = this, axes = self.axes,
		categories = self.categories,
		config = self.config;
	
	axes.hor.scale.rangePoints([0, self.width()]);

	for(var i = 0; i < categories.length; i = i + 1){
		uv.effects.area.mouseover(self, i);
		uv.effects.area.mouseout(self, i);
	}

	self.areagroup.append('path')
			.attr('class', function (d, i) {
				if( !d3.select(this).attr('class')) {
					return uv.constants.classes.area + uv.util.formatClassName(categories[i]);
				}
				return d3.select(this).attr('class') + (uv.constants.classes.area + uv.util.formatClassName(categories[i])); 
			})
			.style('fill', function (d, i) { return uv.util.getColorBand(config, i); })
			.attr('d', d3.svg.area()
				.x(function (d) { return axes.hor.scale(d.x) + axes.hor.scale.rangeBand() / 2; })
				.y0(function (d) { return axes.ver.scale(d.y0); })
				.y1(function (d) { return axes.ver.scale(d.y0 + d.y); })
				.interpolate(self.config.area.interpolation)
			)
		.on('mouseover', function (d,i){ self.effects[categories[i]].mouseover(); })
		.on('mouseout',  function (d,i) { self.effects[categories[i]].mouseout(); });


	self.areagroup.append('path')
			.attr('class', function (d, i) {
				if( !d3.select(this).attr('class')) {
					return uv.constants.classes.line + uv.util.formatClassName(categories[i]);
				}
				return d3.select(this).attr('class') + (uv.constants.classes.line + uv.util.formatClassName(categories[i]));
			})
			.style('stroke', 'white')
			.style('fill', 'none')
			.style('stroke-width', 2)
			.attr('d', d3.svg.line()
				.x(function (d) { return axes.hor.scale(d.x) + axes.hor.scale.rangeBand() / 2; })
				.y(function (d) { return axes.ver.scale(d.y0 + d.y); })
				.interpolate(self.config.area.interpolation)
			);

	return self;
};
uv.StackedBarGraph = function (graphdef, config) {
	var self = this;
	uv.Graph.call(self).setDefaults(graphdef, config).init(graphdef, config);

	self.bargroups = {};

	var bargroup, bars, idx, len, color,
		domainData = self.labels,
		csum = domainData.map(function (d) {return 0; }),
		tsum = domainData.map(function (d) {return 0; });

	self.axes[self.config.graph.orientation === 'Horizontal' ? 'ver' : 'hor'].scale.domain(domainData);

	for (idx = 0, len = self.categories.length; idx < len; idx = idx + 1) {
		self.bargroups[self.categories[idx]] = self.panel.append('g').classed('cg-' + uv.util.formatClassName(self.categories[idx]), true);
		self['draw' + self.config.graph.orientation + 'Bars'](idx, csum, tsum);
	}

	self.finalize();
};

uv.StackedBarGraph.prototype = uv.util.extend(uv.Graph);

uv.StackedBarGraph.prototype.setDefaults = function (graphdef, config) {
	graphdef.stepup = true;
	return this;
};

uv.StackedBarGraph.prototype.drawHorizontalBars = function (idx, csum, tsum) {
	var self = this,
		axes = this.axes,
		color = uv.util.getColorBand(this.config, idx),
		config = this.config,
		bargroup = this.bargroups[this.categories[idx]];
	
	var bars = bargroup.selectAll('g').data(this.graphdef.dataset[self.categories[idx]])
				.enter().append('g').classed('cge-' + uv.util.formatClassName(self.categories[idx]), true);
	
	bars.append('rect')
		.attr('height', axes.ver.scale.rangeBand())
		.attr('width', 0)
		.attr('x', function (d, i) { var value = axes.hor.scale(csum[i]); csum[i] += d.value; return value; })
		.attr('y', function (d) {return axes.ver.scale(d.name); })
		.classed('cr_' + uv.util.formatClassName(self.categories[idx]), true)
		.style('stroke', 'none')
		.style('fill', color)
		.transition()
			.duration(uv.config.effects.duration)
			.delay(idx * uv.config.effects.duration)
			.attr('width', function (d,i) { return axes.hor.scale(csum[i]) - axes.hor.scale(csum[i]-d.value); })
			.each("end", function (d,i){
				d3.select(this).on('mouseover', uv.effects.bar.mouseover(self, idx, self.config.effects.textcolor));
				d3.select(this).on('mouseout', uv.effects.bar.mouseout(self, idx, self.config.effects.textcolor));
			});


	bars.append('text')
		.attr('y', function(d) { return axes.ver.scale(d.name) + axes.ver.scale.rangeBand()/2; })
		.attr('dx', 0)
		.attr('dy', '.35em')
		.attr('text-anchor', 'end')
		.classed('cr_' + uv.util.formatClassName(self.categories[idx]), true)
		.style('fill', self.config.label.showlabel ? self.config.effects.textcolor : 'none')
		.style('font-family', config.bar.fontfamily)
		.style('font-size', config.bar.fontsize)
		.style('font-weight', config.bar.fontweight)
		.text(function(d) { return ( axes.hor.scale(d.value) > 15 ) ? String(d.value) : null; })
		.transition()
			.duration(uv.config.effects.duration)
			.delay(idx * uv.config.effects.duration)
			.attr('x', function (d, i) { tsum[i] += d.value; return axes.hor.scale(tsum[i]) - 5; });
	
	bars.append('svg:title')
		.text( function (d, i) { return self.categories[idx] + ' [' + self.labels[i] + '] : ' + d.value;});
};

uv.StackedBarGraph.prototype.drawVerticalBars = function (idx, csum, tsum) {
	var self = this,
		height = this.height(),
		axes = this.axes,
		color = uv.util.getColorBand(this.config, idx),
		config = this.config,
		bargroup = this.bargroups[self.categories[idx]];
	
	var bars = bargroup.selectAll('g').data(this.graphdef.dataset[self.categories[idx]])
				.enter().append('g').classed('cge-' + uv.util.formatClassName(self.categories[idx]), true);
	
	bars.append('rect')
		.attr('height', 0)
		.attr('width', axes.hor.scale.rangeBand())
		.attr('x', function (d) { return axes.hor.scale(d.name); })
		.attr('y', function (d, i) { var value = axes.ver.scale(csum[i]); csum[i] -= d.value; return value; })
		.classed('cr_' + uv.util.formatClassName(self.categories[idx]), true)
		.style('stroke', 'none')
		.style('fill', color)
		.transition()
			.duration(uv.config.effects.duration)
			.delay(idx * uv.config.effects.duration)
			.attr('height', function (d,i) { return -(axes.ver.scale(-csum[i]) - axes.ver.scale(-csum[i]-d.value)); })
			.each("end", function (d,i){
				d3.select(this).on('mouseover', uv.effects.bar.mouseover(self, idx, self.config.effects.textcolor));
				d3.select(this).on('mouseout', uv.effects.bar.mouseout(self, idx, self.config.effects.textcolor));
			});

	
	bars.append('text').attr('transform','scale(1,-1)')
		.attr('x', function(d) { return axes.hor.scale(d.name) + axes.hor.scale.rangeBand()/2; })
		.attr('y', -height + 5)
		.attr('dy', '.71em')
		.attr('text-anchor', 'middle')
		.classed('cr_' + uv.util.formatClassName(self.categories[idx]), true)
		.style('fill', self.config.label.showlabel ? self.config.effects.textcolor : 'none')
		.style('font-family', config.bar.fontfamily)
		.style('font-size', config.bar.fontsize)
		.style('font-weight', config.bar.fontweight)
		.text(function(d) { return ( height - axes.ver.scale(d.value) > 15) ? String(d.value) : null; })
		.transition()
			.duration(uv.config.effects.duration)
			.delay(idx * uv.config.effects.duration)
			.attr('y', function (d, i) { tsum[i] += d.value; return -(2*height - axes.ver.scale(tsum[i])) + 5; });
	
	bars.append('svg:title')
		.text( function (d, i) { return self.categories[idx] + ' [' + self.labels[i] + '] : ' + d.value;});
	
	bargroup.attr('transform', 'translate(0,' + 2 * this.height() + ') scale(1,-1)');
};
uv.StepUpBarGraph = function (graphdef, config) {
	var self = this;
	uv.Graph.call(self).setDefaults(graphdef, config).init(graphdef, config);

	this.bargroups = {};

	var idx, length = self.categories.length,
		csum = self.labels.map(function (d) {return 0; }),
		tsum = self.labels.map(function (d) {return 0; });

	self.axes[this.config.graph.orientation === 'Horizontal' ? 'ver' : 'hor'].scale.domain(this.labels);

	for (idx = 0; idx < length; idx = idx + 1) {
		self.bargroups[self.categories[idx]] = this.panel.append('g').classed('cg-' + uv.util.formatClassName(self.categories[idx]), true);
		self['draw' + self.config.graph.orientation + 'Bars'](idx, csum, tsum);
	}

	self.finalize();
};

uv.StepUpBarGraph.prototype = uv.util.extend(uv.Graph);

uv.StepUpBarGraph.prototype.setDefaults = function (graphdef, config) {
	graphdef.stepup = true;
	return this;
};

uv.StepUpBarGraph.prototype.drawHorizontalBars = function (idx, csum, tsum) {
	var self = this, len = self.categories.length,
		color = uv.util.getColorBand(self.config, idx),
		bargroup = self.bargroups[self.categories[idx]];

	var bars = bargroup.selectAll('g').data(self.graphdef.dataset[self.categories[idx]]).enter().append('g').classed('cge-' + uv.util.formatClassName(self.categories[idx]), true);
	bars.append('rect')
		.attr('height', self.axes.ver.scale.rangeBand() / len)
		.attr('width', 0)
		.attr('x', function (d, i) { var value = self.axes.hor.scale(csum[i]); csum[i] += d.value; return value; })
		.attr('y', function (d) {return self.axes.ver.scale(d.name); })
		.classed('cr_' + uv.util.formatClassName(self.categories[idx]), true)
		.style('stroke', 'none')
		.style('fill', color)
		.transition()
			.duration(self.config.effects.duration)
			.delay(idx * self.config.effects.duration)
			.attr('width', function (d, i) { return self.axes.hor.scale(csum[i]) - self.axes.hor.scale(csum[i]-d.value); })
			.call(uv.util.endAll, function (d,i){
				d3.select(this.parentNode.parentNode).selectAll('rect').on('mouseover', uv.effects.bar.mouseover(self, idx));
				d3.select(this.parentNode.parentNode).selectAll('rect').on('mouseout', uv.effects.bar.mouseout(self, idx));
			});

	bars.append('text')
		.attr('y', function(d) { return self.axes.ver.scale(d.name) + (self.axes.ver.scale.rangeBand()/len)/2; })
		.attr('dx', 4)
		.attr('dy', '.35em')
		.attr('text-anchor', 'start')
		.classed('cr_' + uv.util.formatClassName(self.categories[idx]), true)
		.style('fill', self.config.label.showlabel ? uv.util.getColorBand(self.config, idx) : 'none')
		.style('font-family', self.config.bar.fontfamily)
		.style('font-size', self.config.bar.fontsize)
		.style('font-weight', self.config.bar.fontweight)
		.text(function(d) { return String(d.value); })
		.transition()
			.duration(self.config.effects.duration)
			.delay(idx * self.config.effects.duration)
			.attr('x', function (d, i) { tsum[i] += d.value; return self.axes.hor.scale(tsum[i]); });
			
	bars.append('svg:title')
		.text( function (d, i) { return self.categories[idx] + ' [' + self.labels[i] + '] : ' + d.value;});
	
	bargroup.attr('transform', 'translate(0,' + idx * self.axes.ver.scale.rangeBand() / len + ')');
};

uv.StepUpBarGraph.prototype.drawVerticalBars = function (idx, csum, tsum) {
	var self = this, len = self.categories.length,
		color = uv.util.getColorBand(self.config, idx),
		bargroup = self.bargroups[self.categories[idx]],
		scaledSum = 0;

	var bars = bargroup.selectAll('g').data(self.graphdef.dataset[self.categories[idx]]).enter().append('g').classed('cge-' + uv.util.formatClassName(self.categories[idx]), true);

	bars.append('rect')
		.attr('height', 0)
		.attr('width', self.axes.hor.scale.rangeBand() / len)
		.attr('x', function (d) { return self.axes.hor.scale(d.name); })
		.attr('y', function (d, i) { var value = self.axes.ver.scale(csum[i]); csum[i] -= d.value; return value; })
		.classed('cr_' + uv.util.formatClassName(self.categories[idx]), true)
		.style('stroke', 'none')
		.style('fill', color)
		.transition()
			.duration(self.config.effects.duration)
			.delay(idx * self.config.effects.duration)
			.attr('height', function (d, i) { 
				return -(self.axes.ver.scale(-csum[i]) - self.axes.ver.scale(-csum[i]-d.value)); 
			})
			.call(uv.util.endAll, function (d,i){
				d3.select(this.parentNode.parentNode).selectAll('rect').on('mouseover', uv.effects.bar.mouseover(self, idx));
				d3.select(this.parentNode.parentNode).selectAll('rect').on('mouseout', uv.effects.bar.mouseout(self, idx));
			});
	
	bars.append('text').attr('transform','scale(1,-1)')
		.attr('x', function(d) { return self.axes.hor.scale(d.name) + (self.axes.hor.scale.rangeBand()/len)/2; })
		.attr('y', -self.height() - 10)
		.attr('dy', '.71em')
		.attr('text-anchor', 'middle')
		.classed('cr_' + uv.util.formatClassName(self.categories[idx]), true)
		.style('fill', self.config.label.showlabel ? uv.util.getColorBand(self.config, idx) : 'none')
		.style('font-family', self.config.bar.fontfamily)
		.style('font-size', self.config.bar.fontsize)
		.style('font-weight', self.config.bar.fontweight)
		.text(function(d) { return String(d.value); })
		.transition()
			.duration(self.config.effects.duration)
			.delay(idx * self.config.effects.duration)
			.attr('y', function (d, i) { tsum[i] += d.value; return -(2*self.height() - self.axes.ver.scale(tsum[i])) - 10; });
			
	bars.append('svg:title')
		.text( function (d, i) { return self.categories[idx] + ' [' + self.labels[i] + '] : ' + d.value;});
	
	bargroup.attr('transform', 'translate(' + idx * self.axes.hor.scale.rangeBand() / len + ',' + 2 * self.height() + ') scale(1,-1)');
};
/**
 * A waterfall chart capable of being rendered in horizontal and vertical manner
 * @param {Object} graphdef Definition of the graph being rendered
 * @param {Object} config   Configuration of the graph being rendered
 */
uv.WaterfallGraph = function (graphdef, config) {
	var self = this;
	uv.Graph.call(self).setDefaults(graphdef, config).init(graphdef, config);

	self.bargroups = {};

	self.axes[self.config.graph.orientation === 'Horizontal' ? 'ver' : 'hor'].scale.domain(self.labels);

	var idx, length = self.categories.length, category;
	
	category = self.categories[0];
	self.bargroups[category] = self.panel.append('g').classed('cg-' + uv.util.formatClassName(category), true);
	self['draw' + self.config.graph.orientation + 'Bars'](0);

	self.finalize();
};

uv.WaterfallGraph.prototype = uv.util.extend(uv.Graph);

uv.WaterfallGraph.prototype.setDefaults = function (graphdef, config) {
	graphdef.stepup = 'waterfall'; 
	return this;
};

uv.WaterfallGraph.prototype.drawHorizontalBars = function (idx) {
	var self = this, len = self.categories.length,
		color = uv.util.getColorBand(self.config, idx),
		bargroup = self.bargroups[self.categories[idx]];
	var	csum = 0, tsum =0;

	var bars = bargroup.selectAll('g').data(self.graphdef.dataset[self.categories[idx]]).enter().append('g').classed('cge-' + uv.util.formatClassName(self.categories[idx]), true);
	bars.append('rect')
		.attr('height', (self.axes.ver.scale.rangeBand() / len)-2)
		.attr('width', 0)
		.attr('x', function (d, i) { 
			var value = (d.value < 0) ? csum + d.value : csum; 
			csum += d.value;
			return self.axes.hor.scale(value); })
		.attr('y', function (d) {return self.axes.ver.scale(d.name); })
		.classed('cr_' + uv.util.formatClassName(self.categories[idx]), true)
		.style('stroke', 'none')
		.style('fill', color)
		.transition()
			.duration(self.config.effects.duration)
			.delay(idx * self.config.effects.duration)
			.attr('width', function (d) { return  self.axes.hor.scale(Math.abs(d.value)); })
			.call(uv.util.endAll, function (d,i){
				d3.select(this.parentNode.parentNode).selectAll('rect').on('mouseover', uv.effects.bar.mouseover(self, idx));
				d3.select(this.parentNode.parentNode).selectAll('rect').on('mouseout', uv.effects.bar.mouseout(self, idx));
			});

	bars.append('text')
		.attr('y', function(d) { return self.axes.ver.scale(d.name) + (self.axes.ver.scale.rangeBand()/len)/2; })
		.attr('dx', 4)
		.attr('dy', '.35em')
		.attr('text-anchor', 'start')
		.classed('cr_' + uv.util.formatClassName(self.categories[idx]), true)
		.style('fill', self.config.label.showlabel ? uv.util.getColorBand(self.config, idx) : 'none')
		.style('font-family', self.config.bar.fontfamily)
		.style('font-size', self.config.bar.fontsize)
		.style('font-weight', self.config.bar.fontweight)
		.text(function(d) { return String(d.value); })
		.transition()
			.duration(self.config.effects.duration)
			.delay(idx * self.config.effects.duration)
			.attr('x', function (d, i) { 
				var value = d.value < 0 ? tsum : tsum + d.value; 
				tsum += d.value;
				return self.axes.hor.scale(value); 
			});
	
	bars.append('svg:title')
		.text( function (d, i) { return self.categories[idx] + ' [' + self.labels[i] + '] : ' + d.value;});
	
	bargroup.attr('transform', 'translate(0,' + idx * self.axes.ver.scale.rangeBand() / len + ')');
};

uv.WaterfallGraph.prototype.drawVerticalBars = function (idx) { 
	var self = this,
		color = uv.util.getColorBand(this.config, idx), 
		len = self.categories.length;
	var csum =0, tsum = 0;
	
	var bars = self.bargroups[self.categories[idx]].selectAll('g').data(self.graphdef.dataset[self.categories[idx]]).enter()
			.append('g').classed('cge-' + uv.util.formatClassName(self.categories[idx]), true);
	
	bars.append('rect')
			.classed('cr_' + uv.util.formatClassName(self.categories[idx]), true)
			.attr('height', 0)
			.attr('width', 0)
			.attr('x', function (d) {return self.axes.hor.scale(d.name); })
			.attr('y', function(d) { 
				var value = (d.value < 0) ? csum + d.value : csum;
				csum += d.value;
				return self.height() - self.axes.ver.scale(value);
			})
			.style('stroke', self.config.bar.strokecolor).style('fill', color)
			.transition()
				.duration(self.config.effects.duration)
				.delay(idx * self.config.effects.duration)
				.attr('height', function (d) {	return self.height() - self.axes.ver.scale(Math.abs(d.value)); })
				.attr('width', (self.axes.hor.scale.rangeBand() / len)-2)
				.call(uv.util.endAll, function (d,i){
					d3.select(this.parentNode.parentNode).selectAll('rect').on('mouseover', uv.effects.bar.mouseover(self, idx));
					d3.select(this.parentNode.parentNode).selectAll('rect').on('mouseout', uv.effects.bar.mouseout(self, idx));
				});
	
	
	bars.append('text').attr('transform','scale(1,-1)')
			.attr('x', function(d) { return self.axes.hor.scale(d.name) + (self.axes.hor.scale.rangeBand()/len)/2; })
			.attr('y', -10)
			.attr('dx', 0)
			.attr('dy', '.35em')
			.attr('text-anchor', 'middle')
			.classed('cr_' + uv.util.formatClassName(self.categories[idx]), true)
			.style('fill', self.config.label.showlabel ? uv.util.getColorBand(self.config, idx) : 'none')
			.style('font-family', self.config.bar.fontfamily)
			.style('font-size', self.config.bar.fontsize)
			.style('font-weight', self.config.bar.fontweight)
			.text(function(d) { return String(d.value); })
			.transition()
				.duration(self.config.effects.duration)
				.delay(idx * self.config.effects.duration)
				.attr('y', function (d) {
					tsum += d.value;
					var value = d.value < 0 ? tsum - d.value : tsum;
					return -(self.height() - self.axes.ver.scale(value)) - 10; });
	
	bars.append('svg:title')
		.text( function (d, i) { return self.categories[idx] + ' [' + self.labels[i] + '] : ' + d.value;});
	
	self.bargroups[self.categories[idx]].attr('transform', 'translate(' + idx * self.axes.hor.scale.rangeBand() / len + ',' + self.height() + ') scale(1,-1)');
};

uv.Table = function () {
	this.caption = undefined;
	this.position = undefined;
	this.graphdef = undefined;

	this.table = undefined;
	this.header = undefined;
	this.body = undefined;
	this.bodyrows = {};
};

uv.Table.prototype.init = function (graphdef, config) {
	this.graphdef = graphdef;
	this.config = $.extend(true, {}, config);
	this.position = this.config.meta.pos || 'body';

	this.table = d3.select(this.position).append('table').classed(this.config.table.tableclass, true);
	this.header = this.table.append('thead').classed(this.config.table.headerclass, true);
	this.body = this.table.append('tbody').classed(this.config.table.bodyclass, true);
	this.footer = this.table.append('tfoot').classed(this.config.table.footerclass, true);
};

uv.Table.prototype.finalize = function () {
	//console.log(this);
};
uv.TableGraph = function (graphdef, config) {
	uv.Table.apply(this, [graphdef]);
	this.init(graphdef, config);

	if (this.config.graph.orientation === 'Horizontal') {
		this.setHorTable();
	} else {
		this.setVerTable();
	}

	this.finalize();
};

uv.TableGraph.prototype = uv.util.extend(uv.Table);

uv.TableGraph.prototype.setHorTable = function () {
	var categories = this.graphdef.categories, tableData = uv.util.getTabularArray(this.graphdef);

	categories.unshift('');
	this.header.append('tr').selectAll('td').data(categories).enter().append('td').text(function (d) { return d; });
	categories.shift();

	this.bodyrows = this.body.selectAll('tr').data(tableData)
					.enter().append('tr');

	this.bodyrows.selectAll('td').data(function (d, i) { return tableData[i]; })
					.enter().append('td')
					.attr('class', function (d, i) {
						var classNameString = (i === 0) ? 'chart3rtablelabel' : 'chart3rtabledata';
						return d3.select(this).attr('class') + classNameString;
					})
					.text(function (d) {return d; });
};

uv.TableGraph.prototype.setVerTable = function () {
	var labels = uv.util.getLabelArray(this.graphdef), dataset = this.graphdef.dataset;

	labels.unshift('');
	this.header.append('tr').selectAll('td').data(labels).enter().append('td').text(function (d) { return d; });
	labels.shift();

	this.bodyrows = this.body.selectAll('tr').data(this.graphdef.categories)
					.enter().append('tr');

	this.bodyrows.selectAll('td')
		.data(function (d) {
			var arr = [], i, len;
			arr.push(d);
			for (i = 0, len = dataset[d].length; i < len; i = i + 1) { arr.push(dataset[d][i].value); }
			return arr;
		}).enter().append('td')
			.attr('class', function (d, i) {
				var classNameString = (i === 0) ? 'chart3rtablelabel' : 'chart3rtabledata';
				return d3.select(this).attr('class') + classNameString;
			})
			.text(function (d) {return d; });
};