<?php
/**
 * Plugin Name:       Collapsi for Gutenberg Blocks
 * Plugin URI:        https://github.com/devMoaz/collapsi-for-gutenberg
 * Description:       Editor-only collapse/expand toggle for every Gutenberg block. Hover a top-level block, click the chevron, and the block tucks into a compact bar with icon, title, and content preview. Survives reloads via localStorage. Works in Post Editor and Site Editor. No frontend impact.
 * Version:           1.0.0
 * Requires at least: 6.5
 * Requires PHP:      7.4
 * Tested up to:      7.0
 * Author:            Moaz Mahmoud
 * Author URI:        https://www.linkedin.com/in/moazmahmmoud/
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       collapsi
 * Domain Path:       /languages
 *
 * @package Collapsi
 */

declare( strict_types=1 );

defined( 'ABSPATH' ) || exit;

define( 'COLLAPSI_VERSION', '1.0.0' );
define( 'COLLAPSI_FILE', __FILE__ );
define( 'COLLAPSI_DIR', plugin_dir_path( __FILE__ ) );
define( 'COLLAPSI_URL', plugin_dir_url( __FILE__ ) );

require_once COLLAPSI_DIR . 'includes/class-plugin.php';
require_once COLLAPSI_DIR . 'includes/class-assets.php';
require_once COLLAPSI_DIR . 'includes/class-admin-page.php';
require_once COLLAPSI_DIR . 'includes/class-settings.php';

add_action(
	'plugins_loaded',
	static function (): void {
		\Collapsi\Plugin::instance()->boot();
	}
);
