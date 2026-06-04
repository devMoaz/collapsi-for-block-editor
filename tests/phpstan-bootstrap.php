<?php
/**
 * PHPStan bootstrap. Declares plugin-defined constants whose runtime values
 * come from WordPress functions (plugin_dir_path / plugin_dir_url) that
 * PHPStan cannot evaluate statically. Real values are set in collapsi-for-block-editor.php.
 *
 * @package Collapsi
 */

declare( strict_types=1 );

defined( 'ABSPATH' ) || exit;

defined( 'COLLAPSI_VERSION' ) || define( 'COLLAPSI_VERSION', '1.0.0' );
defined( 'COLLAPSI_FILE' ) || define( 'COLLAPSI_FILE', dirname( __DIR__ ) . '/collapsi-for-block-editor.php' );
defined( 'COLLAPSI_DIR' ) || define( 'COLLAPSI_DIR', dirname( __DIR__ ) . '/' );
defined( 'COLLAPSI_URL' ) || define( 'COLLAPSI_URL', 'https://example.com/wp-content/plugins/collapsi-for-block-editor/' );
