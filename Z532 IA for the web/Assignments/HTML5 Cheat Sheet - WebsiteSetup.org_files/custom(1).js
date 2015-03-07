function initKubeLightbox(){
	var kubeSelector = 'a[rel*='+ kube.rel_selector +'], ' + kube.selector;
	
	jQuery(kubeSelector).kube({
		preload		: parseInt(kube.preload),
		prevEffect	: kube.effect_prev,
		nextEffect	: kube.effect_next,
		openEffect	: kube.effect_in,
		closeEffect	: kube.effect_out,
		autoSize	: parseInt(kube.auto_size),
		width		: parseInt(kube.width),
		height		: parseInt(kube.height),
		autoPlay	: parseInt(kube.autoplay),
		playSpeed	: parseInt(kube.playspeed),
		helpers		: {
			social	: parseInt(kube.social)
		}
	});	
}
jQuery(document).ready(function($) {
	initKubeLightbox();
});
