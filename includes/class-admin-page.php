<?php
/**
 * Adds Settings > Collapsi admin page. Phase 0 renders an empty container.
 *
 * @package Collapsi
 */

declare( strict_types=1 );

namespace Collapsi;

defined( 'ABSPATH' ) || exit;

/**
 * Settings page registration + asset enqueue for the settings React app.
 */
final class Admin_Page {

	public const SLUG    = 'collapsi-for-gutenberg';
	private const HANDLE = 'collapsi-settings';

	/**
	 * Register hooks.
	 */
	public function register(): void {
		add_action( 'admin_menu', array( $this, 'add_menu_page' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'maybe_enqueue' ) );
	}

	/**
	 * Add the Settings > Collapsi entry.
	 */
	public function add_menu_page(): void {
		add_options_page(
			__( 'Collapsi for Gutenberg Blocks', 'collapsi-for-gutenberg' ),
			__( 'Collapsi', 'collapsi-for-gutenberg' ),
			'manage_options',
			self::SLUG,
			array( $this, 'render_page' )
		);
	}

	/**
	 * Render the page container. The React app mounts inside #collapsi-settings-root.
	 */
	public function render_page(): void {
		echo '<div class="wrap"><div id="collapsi-settings-root"></div></div>';
	}

	/**
	 * Enqueue the settings bundle only on our page.
	 *
	 * @param string $hook_suffix Admin page hook suffix.
	 */
	public function maybe_enqueue( string $hook_suffix ): void {
		if ( 'settings_page_' . self::SLUG !== $hook_suffix ) {
			return;
		}

		$asset_file = COLLAPSI_DIR . 'build/settings.asset.php';

		if ( ! file_exists( $asset_file ) ) {
			return;
		}

		/**
		 * Asset metadata.
		 *
		 * @var array{dependencies: string[], version: string} $asset
		 */
		$asset = require $asset_file;

		wp_enqueue_script(
			self::HANDLE,
			COLLAPSI_URL . 'build/settings.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);

		wp_set_script_translations( self::HANDLE, 'collapsi-for-gutenberg' );

		$style_path = COLLAPSI_DIR . 'build/settings.css';
		if ( file_exists( $style_path ) ) {
			wp_enqueue_style(
				self::HANDLE,
				COLLAPSI_URL . 'build/settings.css',
				array( 'wp-components' ),
				(string) filemtime( $style_path )
			);
			// WordPress swaps in build/settings-rtl.css automatically when is_rtl().
			wp_style_add_data( self::HANDLE, 'rtl', 'replace' );
		}
	}
}
