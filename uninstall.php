<?php
/**
 * Uninstall handler — runs when the user deletes the plugin from wp-admin.
 *
 * Removes the single option this plugin owns. Per-post collapse state lives in
 * the user's browser localStorage; it cannot be (and is not) cleared from PHP,
 * since localStorage is per-browser per-domain. Users who want a clean slate
 * can clear their browser storage manually.
 *
 * @package Collapsi
 */

declare( strict_types=1 );

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

const COLLAPSI_OPTION = 'collapsi_options';

if ( ! is_multisite() ) {
	delete_option( COLLAPSI_OPTION );
	return;
}

// Multisite: clear the option on every site in the network.
$collapsi_sites = function_exists( 'get_sites' )
	? get_sites( array( 'fields' => 'ids' ) )
	: array();

foreach ( $collapsi_sites as $collapsi_site_id ) {
	switch_to_blog( (int) $collapsi_site_id );
	delete_option( COLLAPSI_OPTION );
	restore_current_blog();
}

// Defensive: also clean any network-level traces (none in v1, but cheap).
delete_site_option( COLLAPSI_OPTION );
