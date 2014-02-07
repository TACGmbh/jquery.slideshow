/**
* jquery.slideshow.js v1.0.1 - a responsive touch-friendly Slideshow based on jQuery
* https://github.com/SaeidMohadjer/jquery.slideshow
* Copyright 2014 Saeid Mohadjer
* Released under the MIT license - http://opensource.org/licenses/MIT
*/

//https://gist.github.com/2375726
//http://blog.safaribooksonline.com/2012/04/18/mapping-mouse-events-and-touch-events-onto-a-single-event/
(function(){TouchMouseEvent={DOWN:"touchmousedown",UP:"touchmouseup",MOVE:"touchmousemove"};var e=function(e){var t;switch(e.type){case"mousedown":t=TouchMouseEvent.DOWN;break;case"mouseup":t=TouchMouseEvent.UP;break;case"mousemove":t=TouchMouseEvent.MOVE;break;default:return}var r=n(t,e,e.pageX,e.pageY);$(e.target).trigger(r)};var t=function(e){var t;switch(e.type){case"touchstart":t=TouchMouseEvent.DOWN;break;case"touchend":t=TouchMouseEvent.UP;break;case"touchmove":t=TouchMouseEvent.MOVE;break;default:return}var r=e.originalEvent.touches[0];var i;if(t==TouchMouseEvent.UP)i=n(t,e,null,null);else i=n(t,e,r.pageX,r.pageY);$(e.target).trigger(i)};var n=function(e,t,n,r){return $.Event(e,{pageX:n,pageY:r,originalEvent:t})};var r=$(document);if("ontouchstart"in window){r.on("touchstart",t);r.on("touchmove",t);r.on("touchend",t)}else{r.on("mousedown",e);r.on("mouseup",e);r.on("mousemove",e)}})()

function Slideshow(slideshow_options) {
	try {
		$(document);
	} catch (e) {
		alert('jQuery is not available!');
	}
	
	if (!slideshow_options.id) {
		alert('Slideshow id has not been set!');
	};
	
	//default settings
	var settings = {
		align				 : 'left',	
		autoplay             : false,	
		autoplay_start_delay : 0,
		callback			 : false,		
		displayTime          : 3000,
		easing				 : 'swing', 			
		id                   : null,
		startingSlideNumber  : 1,
		startingSlideId		 : null,
		visibleSlidesCount   : 1, 		
		slideTab_has_value	 : false,
		transition_delay     : 500,	
		preload_images		 : true,
		loop				 : true,
		variableHeight		 : false,
		variableWidth		 : false,		
		role				 : '',
		touch_drag			: true,
		loader_image		: 'img/loader.gif',
		slide_is_as_wide_as_slideshow: true,
		slide_margin_right : 0, //percent only used when multiple slides are displayed and slideshow has variable width
		align_buttons: function() {
			//center align buttons
			var btn_h = $slideshow.find('.next').height();
			$slideshow.find('.prev, .next').css('top', (slideHeight() - btn_h)/2);	
		}	
	};
	
	var options = $.extend(true, settings, slideshow_options);	
	
	//private properties	
	var slideshow = this,
		id = '#' + options.id,
		$slideshow = $(id),
		$slides = $slideshow.find('.slides'),
		slideNum,
		slideTimer, 
		autoplay_timeout,
		previousSlidenum = 0,
		slide = {},
		slides_width = 0,
		tallest_slide_height = 0;
		
	//public properties
	this.width = null;
	
	if (options.visibleSlidesCount > 1) {
		options.slide_is_as_wide_as_slideshow = false;
	}
	
	$slideshow.addClass('loading');
	
	if ($slideshow.find('.slide img').length != 0 && options.preload_images) {
		//preload images
		if (jQuery.fn.imagesLoaded) {
			$slides.imagesLoaded(function() {
				init();
			});				
		} else {
			console.log('jquery.imagesloaded.js is missing!');
			init();
		}			
	} else {
		init();		
	}
		
	//public methods
	this.slideNumber = function(num) {
		if (num) {
			slideNum = parseInt(num);
			update();
			moveToSlide(slideNum-1);
		} else {
			return slideNum;
		}
	}
	
	this.getSlideCount = function() {
		return slide.count;
	}	
	
	this.remove_slide_by_id = function(id) {
		if ($('#'+id).length) {
			$('#'+id).remove();
			update();
		} else {
			return false;
		}
	}
	
	this.remove_slide_by_ordinal = function(position) {
		if (slide.div.eq(position).length) {
			slide.div.eq(position).remove();
			update();
		} else {
			return false;		
		}
	}
	
	this.add_slide = function(slide_markup) {
		$slides.prepend(slide_markup);
		slideNum = 1;	
			
		if (slide.count == 0) {
			init();
		} else {
			moveToSlide(1);			
		}		
		
		update();		
	}
	
	this.set_caption = function(id, caption) {
	    if ($('#'+ id + ' .caption').length) {
			$('#'+ id + ' .caption').text(caption);
			update();
		} else {
			return false;
		}
	}
	
	this.move_slide = function(slide_id, position) {
	    if ($('#'+slide_id).length) {	
			slideNum = position;	
			if ( $('#'+slide_id).index() < slideNum-1) {
				$('#'+slide_id).insertAfter(slide.div.eq(slideNum-1));		
			} else {
				$('#'+slide_id).insertBefore(slide.div.eq(slideNum-1));		
			}
			moveToSlide(slideNum);		
			update();	
		} else {
			return false;		
		}
	}
	
	function update_width() {
		//slideshow.width = $slideshow.parent().width();
		slideshow.width = $slideshow.find('.wrapper').width();
		if (options.slide_is_as_wide_as_slideshow) {
			slide.div.width(slideshow.width);		
		} else if (options.visibleSlidesCount > 1) {
			
			var total_margins_percent = (options.visibleSlidesCount - 1) * options.slide_margin_right;
			var slide_width_percent = (100 - total_margins_percent) / options.visibleSlidesCount;
			options.slide_width_pixel = slideshow.width * slide_width_percent / 100;		
			$slideshow.find('.slide').width(options.slide_width_pixel);
			$slideshow.find('.slide').css('margin-right',slideshow.width * options.slide_margin_right / 100);
			slide.div.width(options.slide_width_pixel);	
		}
	}
	
	function create_slideTabs() {
		var slideTabs = $(id + ' .slideTabs');
		
		//auto generate tab labels if markup is empty
		if (slideTabs.children().length == 0) {
			var tabValue;		
			for (var i=0, ii = options.loop ? slide.count-2 : slide.count; i<ii; i++) {			
				tabValue = options.slideTab_has_value ? i+1 : '';
				slideTabs.append('<a href="#">' + tabValue + '</a>');
			}
		}
		
		$(id + ' .slideTabs').on('click', 'a', function(e) {
			e.preventDefault();
			disableAutoplay();
			slideNum = $(this).index()+1;		
			moveToSlide(options.loop ? slideNum : slideNum-1);
		});
	}
	
	
	function init() {
		$slideshow.removeClass('loading');	
	
		slideNum = options.startingSlideId ? $('#'+ options.startingSlideId).index()+1 : options.startingSlideNumber;
		
		if (options.autoplay) init_autoplay();
		if (options.loop) adjust_dom_for_looping(); 
	
		//slide.margin  =  parseInt($(id + ' .slide').css('margin-right'));
		slide.div = $(id + ' .slide');
		slide.count = slide.div.length;	
		
		add_event_handlers();
		
		if ($slideshow.has('.slideTabs')) create_slideTabs();
		if (options.touch_drag) add_drag_handlers();

		//div.slides must be visible before positioning code runs as positioning relies on $.width() which doesn't work on hidden elements
		$slides.show(); 

		//set slideshow and slide width
		if (options.variableWidth) {
			update_width();		
		} else {
			slideshow.width = $slideshow.find('.wrapper').width();			
			if (options.slide_is_as_wide_as_slideshow) $slideshow.find('.slide').width(slideshow.width);
		}	

		set_window_resize_handler();		
	
		positionSlides();
		moveToSlide(options.loop ? slideNum : slideNum-1, 0);
	}
	
	function set_window_resize_handler() {
		$(window).resize(function() {
			update_width();
			positionSlides();		
			moveToSlide(options.loop ? slideNum : slideNum-1);
			
			if (options.variableHeight) {
				setSlideHeight();
			}
		});		
	}
	
	function add_event_handlers() {
		$slideshow.on('click', '.prev, .next', function(e) {
			e.preventDefault();
			if (!$(this).hasClass('disabled')) {
				var direction = $(this).hasClass('next') ? 'next' : 'previous';
				navigate(direction, e);
			}		
		});	
	}
	
	function init_autoplay() {
		options.loop = true;
		autoplay_timeout = window.setTimeout(function() {
			slideTimer = window.setInterval(function() {
				navigate('next');
			}, options.displayTime);				
		}, options.autoplay_start_delay);	
	}
	
	function adjust_dom_for_looping() {
		//we insert a clone of first slide after the last slide and a clone of last
		//slide before the first required for seamless looping effect
		var clone1 = $(id + ' .slide').first().clone().addClass('fake post_last');
		var clone2 = $(id + ' .slide').last().clone().addClass('fake pre_first');
		$slides.append(clone1).prepend(clone2);	
	}
		
	function disableAutoplay() {
		if (options.autoplay) {
			options.autoplay = false;		
			window.clearInterval(slideTimer);  	
			window.clearTimeout(autoplay_timeout);
		}
	}	

	function navigate(direction, event) {
		//disable autoplay when user clicks next/prev buttons
		if (event && options.autoplay) disableAutoplay();
		
		if (direction == 'next') {						
			if (options.loop) {
				if (slideNum < slide.count - 1 ) {
					slideNum++;
				} else {
					//jump to first slide which is same as last (current) slide
					$slides.css( { 
						'left' : - slide.div.eq(1).position().left 
					});
					slideNum = 2;
				}	
			} else {
				console.log(slideNum, slide.count);
				if (slideNum < slide.count ) {
					slideNum++
				} 				
			}				
		} else if (direction == 'previous') {
			if (options.loop) {
				if (slideNum > 0) {
					slideNum--;
				} else {
					//jump to last slide which is same as first (current) slide
					$slides.css( { 
						'left' : - slide.div.eq(slide.count-2).position().left 
					});	
					slideNum = slide.count - 3;						
				}
			} else {
				if (slideNum > 1) {
					slideNum--;
				}
			}
		}	
		
		moveToSlide(options.loop ? slideNum : slideNum - 1);			
	}
	
	function positionSlides() {
		var left = 0;
		var marginRight = parseInt(slide.div.css('margin-right')) || 0;

		//we set width of div.slides to a very large value so that content of div.slide will not wrap due to slideshows fixed width value. This is important when slide divs's width is not
		//fixed and is calculated on the fly by javascript. After all slides are positioned we update width of div.slides to the correct value (even though there is no need for that).
		//remove this hack later when you find a better solution to avoid wrapping of div.slide content.
		$slides.width(50000);
		for (var i = 0; i < slide.count; i++) {	
			slide.div.eq(i).css('left', left+'px');
			left = left + slide.div.eq(i).outerWidth()+ marginRight;
			//+ ( (i != slide.count-1) ? marginRight : 0 );
			slides_width = left;
		}
		$slides.width(slides_width);		
	}		
	
	function moveToSlide(num, delay) {
		var _delay = (delay == undefined) ? options.transition_delay : delay;
		var currentSlide = slide.div.eq(num);
		var slide_left = currentSlide.position().left;
		var slide_center = currentSlide.position().left + currentSlide.width()/2;
		var slideshow_center = slideshow.width/2;		
		
		if (options.align === 'center') {
			if (slide_center > slideshow_center) {
				if (slide_center < slides_width - slideshow_center) {
					slide_left = slide_left - (slideshow.width - currentSlide.width())/2;
				} else {
					slide_left = slides_width - slideshow.width;
				}
			} else {
				slide_left = 0;
			} 
		}						
		
		updateUI();
		previousSlidenum = num-1;		
		
		slide.div.removeClass('currentSlide');
		currentSlide.addClass('currentSlide');
		
		//stop()'s jumpToEnd should be false else loop animation will be buggy when next/prev btns are clicked fast
		$slides
			.stop(true, false)
			.animate( { 'left' : - slide_left}, _delay, options.easing, function() {
				if (options.variableHeight) {
					//addImageErrorLoadHandlers();
					if (tallest_slide_height == 0) setSlideHeight();
				}
				if (options.callback) options.callback(slideshow);
		}	);		
	}
	
	function add_drag_handlers() {
		var startX, endX;
		var slides = slide.div;
		
		slides.bind(TouchMouseEvent.DOWN, function(e) {
			e.preventDefault();
			startX = e.pageX;
			endX = startX;
		});

		slides.bind(TouchMouseEvent.MOVE, function(e) {
			e.preventDefault();
			endX = e.pageX;
		});			
		
		slides.bind(TouchMouseEvent.UP, function(e) {
			e.preventDefault();
			var slideIndex = slides.index($(this));
			
			//disable autoplay when user clicks next/prev buttons
			if (options.autoplay) {
				disableAutoplay();
			}			
			
			if ( endX - startX < 0) {
				navigate('next');
			} else if ( endX - startX > 0) {
				navigate('previous');
			} else {
				if ( slideIndex != slideNum ) {
					//user clicked a side slide
					slideNum = slideIndex;
					positionSlides();
				} else {
					//user has clicked current slide
					//do something
				}
			}
		});
	}	

	function setSlideHeight() {
		$(id + ' .wrapper').css('height', slideHeight());

		options.align_buttons();
		
		//we trigger resize because if slideshow has caused browser scrollbar 
		//to appear when slideshow's parent has no fixed width then slides will 
		//be almost 17px (width of scrollbar) wider than parent element causing 
		//layout issues...
		//if (options.variableWidth) update_width();	
	}
	
	function slideHeight() {
		var index = options.loop ? slideNum : slideNum-1;	

		var temp;		
		if (options.visibleSlidesCount === 1) {
			temp = $(id + ' .slide').eq(index).outerHeight();
		} else {
			temp = (function() { //find highest slide's height
				var h = 0;
				$slideshow.find('.slide').each(function() {
					var temp = $(this).outerHeight();
					if (temp > h) h = temp;
				});
				tallest_slide_height = h;
				return h;			
			})();
		}
		
		return temp;
	}

	//replace code with one from below:
	// http://stackoverflow.com/questions/4857896/jquery-callback-after-all-images-in-dom-are-loaded
	function addImageErrorLoadHandlers() {
		var images = $(id + ' .slide:eq(' + (slideNum) + ') img');
		for (var i = 0; i<images.length; i++ ) {
			images[i].onload = function(evt) {
				setSlideHeight();
			}
			images[i].onerror = function(evt) {
				this.src = "images/image_not_found.jpg";
			}
		}
	}

	function update() {
		slide.div = $(id + ' .slide');		
		slide.count = slide.div.length; 
		positionSlides();
		if ( (slideNum > slide.count) && (slide.count != 0) ) {
			slideNum = slide.count;
			moveToSlide(slideNum);
		} 
		updateUI();
	}

	function updateUI() {	
		//var count = slide.count - options.visibleSlidesCount + 1;
		if (slide.count == 0) slideNum = 0;
		
		//update slide number
		if (slideNum == slide.count - 1 && options.loop) {
			$(id + ' .slideNumber').text('1');		
		} else if (slideNum == 0 && options.loop) {
			$(id + ' .slideNumber').text(slide.count - 2);		
		} else {
			$(id + ' .slideNumber').text(slideNum);			
		}

		if ($slideshow.has('.slideTabs')) update_tab_state();		
		if (!options.loop) update_nav_state();

		//update total sildes
		$(id + ' .slidesCount').text(options.loop ? slide.count-2 : slide.count);
	}
	
	function update_tab_state() {
		var tabs = $(id + ' .slideTabs a');	
		tabs.removeClass('selected');		

		if (options.loop) {
			if (slideNum == slide.count - 1) {			
				tabs.eq(0).addClass('selected');		
			} else if (slideNum == 0) {	
				tabs.eq(slide.count - 3).addClass('selected');			
			} else {		
				tabs.eq(slideNum-1).addClass('selected');			
			}					
		} else {	
			tabs.eq(slideNum-1).addClass('selected');		
		}	
	}
	
	function update_nav_state() {
		$prev = $slideshow.find('.prev');
		$next = $slideshow.find('.next');
		
		if (options.visibleSlidesCount == 1) {
			if ( (slideNum == slide.count) && (slideNum == 1) ) { //there is only one slide
				$prev.addClass('disabled');    
				$next.addClass('disabled');   			
			} else if (slideNum == slide.count) { // last slide
				$prev.removeClass('disabled');    
				$next.addClass('disabled');   
			} else if (slideNum == 1) { // first slide
				$prev.addClass('disabled');    
				$next.removeClass('disabled');    
			} else { // other slides
				$prev.removeClass('disabled'); 
				$next.removeClass('disabled'); 
			}		
		} else {
			if (slideNum == slide.count - options.visibleSlidesCount + 1 ) { // last slide
				$prev.removeClass('disabled');    
				$next.addClass('disabled');   
			} else if (slideNum == 1) { // first slide
				$prev.addClass('disabled');    
				$next.removeClass('disabled');    
			} else { // other slides
				$prev.removeClass('disabled'); 
				$next.removeClass('disabled'); 
			}				
		}	
	}
		
}