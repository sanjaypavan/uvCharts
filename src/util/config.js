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
		showlabel : false,
		precision : 2
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