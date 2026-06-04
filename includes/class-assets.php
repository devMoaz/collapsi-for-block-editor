<?php
/**
 * Asset enqueue. Uses enqueue_block_editor_assets so styles reach the iframed editor.
 *
 * @package Collapsi
 */

declare( strict_types=1 );

namespace Collapsi;

use Collapsi\Settings;

defined( 'ABSPATH' ) || exit;

/**
 * Enqueues editor JS/CSS.
 */
final class Assets {

	public const HANDLE       = 'collapsi-editor';
	public const STYLE_HANDLE = 'collapsi-editor-style';

	/**
	 * Register hooks.
	 *
	 * JS is enqueued via enqueue_block_editor_assets — it runs in the outer
	 * admin context where addFilter registers the HOC.
	 *
	 * CSS is enqueued via enqueue_block_assets (with an is_admin guard) so
	 * the stylesheet reaches inside the iframed editor canvas where the
	 * wrapped block markup actually lives. The is_admin check keeps the
	 * stylesheet off the frontend entirely.
	 */
	public function register(): void {
		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_editor_script' ) );
		add_action( 'enqueue_block_assets', array( $this, 'enqueue_editor_style' ) );
	}

	/**
	 * Enqueue the editor JS bundle. Loaded in both Post Editor and Site Editor.
	 */
	public function enqueue_editor_script(): void {
		$asset_file = COLLAPSI_DIR . 'build/editor.asset.php';

		if ( ! file_exists( $asset_file ) ) {
			return;
		}

		/**
		 * Asset metadata from @wordpress/scripts.
		 *
		 * @var array{dependencies: string[], version: string} $asset
		 */
		$asset = require $asset_file;

		wp_enqueue_script(
			self::HANDLE,
			COLLAPSI_URL . 'build/editor.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);

		wp_set_script_translations( self::HANDLE, 'collapsi' );

		wp_add_inline_script(
			self::HANDLE,
			'window.collapsiSettings = ' . wp_json_encode( Settings::get() ) . ';',
			'before'
		);
	}

	/**
	 * Enqueue the editor stylesheet inside the iframed canvas.
	 * enqueue_block_assets fires for the iframe context too; the is_admin
	 * guard prevents the stylesheet from loading on the frontend.
	 */
	public function enqueue_editor_style(): void {
		if ( ! is_admin() ) {
			return;
		}

		$style_path = COLLAPSI_DIR . 'build/editor.css';

		if ( ! file_exists( $style_path ) ) {
			return;
		}

		wp_enqueue_style(
			self::STYLE_HANDLE,
			COLLAPSI_URL . 'build/editor.css',
			array(),
			(string) filemtime( $style_path )
		);

		// WordPress swaps in build/editor-rtl.css automatically when is_rtl().
		wp_style_add_data( self::STYLE_HANDLE, 'rtl', 'replace' );
	}
}
