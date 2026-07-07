/**
 * Cookie consent integration for the Ubuntu skin.
 *
 * Initialises the Canonical cookie-policy library and Google Consent Mode v2.
 * The vendor IIFE (cookie-policy.js) is loaded via the
 * skins.ubuntu.cookieConsent.vendor ResourceLoader module, which uses
 * indirect eval to execute the vendor code in global scope, setting
 * window.cpNs and GTM consent defaults to "denied" before GTM loads.
 *
 * This module handles:
 * - Stubbing the Flask backend endpoints that don't exist on MediaWiki
 * - Calling window.cpNs.cookiePolicy() to show the consent banner
 * - Pushing a custom GTM event when consent changes
 */
var config = require( './config.json' );

if ( config.UbuntuCookieConsentEnabled ) {
	// The @canonical/cookie-policy library POSTs to /_cookies/set-preferences
	// and /_cookies/init, which are Flask backend endpoints that don't exist
	// on MediaWiki. Intercept fetch() to return a stub response so the library
	// doesn't log errors to the console.
	var originalFetch = window.fetch;
	window.fetch = function ( url, options ) {
		if ( typeof url === 'string' && url.startsWith( '/_cookies/' ) ) {
			return Promise.resolve( new Response( '{}', {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			} ) );
		}
		return originalFetch.apply( this, arguments );
	};

	// window.cpNs.cookiePolicy is exposed by the vendor IIFE loaded via
	// the skins.ubuntu.cookieConsent.vendor ResourceLoader module.
	// Parameters: (callback, initWithCookieService)
	//   callback - called after user selects a preference
	//   initWithCookieService - false: local cookie only (no Flask backend)
	window.cpNs.cookiePolicy( function () {
		// Push a custom GTM event so tags can react to consent changes
		// beyond what setGoogleConsentPreferences() already handles.
		window.dataLayer = window.dataLayer || [];
		window.dataLayer.push( { event: 'cookie_consent_updated' } );

		// Sync the .is-dark class on .cookie-policy with the skin's dark
		// mode, so the vendor CSS dark palette activates when appropriate.
		syncDarkMode();
	}, false );

	// The vendor CSS uses .cookie-policy.is-dark for its dark palette.
	// Sync this class with the MediaWiki skin's dark mode preference.
	function syncDarkMode() {
		var el = document.querySelector( '.cookie-policy' );
		if ( !el ) {
			return;
		}
		var html = document.documentElement;
		var isDark = html.classList.contains( 'skin-theme-clientpref-night' ) ||
			( html.classList.contains( 'skin-theme-clientpref-os' &&
				window.matchMedia( '(prefers-color-scheme: dark)' ).matches ) );
		el.classList.toggle( 'is-dark', isDark );
	}

	// Re-sync if the user changes their theme preference at runtime.
	var observer = new MutationObserver( syncDarkMode );
	observer.observe( document.documentElement, {
		attributes: true,
		attributeFilter: [ 'class' ]
	} );
	window.matchMedia( '(prefers-color-scheme: dark)' )
		.addEventListener( 'change', syncDarkMode );
}
