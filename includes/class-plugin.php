<?php
/**
 * Main plugin orchestrator.
 *
 * @package Collapsi
 */

declare( strict_types=1 );

namespace Collapsi;

defined( 'ABSPATH' ) || exit;

/**
 * Singleton orchestrator. Boots subsystems on plugins_loaded.
 */
final class Plugin {

	/**
	 * Singleton instance.
	 *
	 * @var Plugin|null
	 */
	private static ?Plugin $instance = null;

	/**
	 * Whether boot() has already run.
	 *
	 * @var bool
	 */
	private bool $booted = false;

	/**
	 * Disallow direct construction.
	 */
	private function __construct() {}

	/**
	 * Get or create the singleton.
	 */
	public static function instance(): self {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Wire hooks. Idempotent.
	 */
	public function boot(): void {
		if ( $this->booted ) {
			return;
		}
		$this->booted = true;

		( new Assets() )->register();
		( new Admin_Page() )->register();
		( new Settings() )->register();
	}
}
