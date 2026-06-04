<?php
/**
 * Settings registration with REST exposure.
 *
 * @package Collapsi
 */

declare( strict_types=1 );

namespace Collapsi;

defined( 'ABSPATH' ) || exit;

/**
 * Owns the collapsi_options option and its REST schema.
 */
final class Settings {

	public const OPTION_NAME   = 'collapsi_options';
	public const OPTION_GROUP  = 'collapsi';
	public const ALLOWED_MODES = array( 'never', 'all' );

	/**
	 * Hook into init.
	 */
	public function register(): void {
		add_action( 'init', array( $this, 'register_setting' ) );
	}

	/**
	 * Register the option with REST schema + sanitize.
	 */
	public function register_setting(): void {
		register_setting(
			self::OPTION_GROUP,
			self::OPTION_NAME,
			array(
				'type'              => 'object',
				'default'           => self::defaults(),
				'sanitize_callback' => array( $this, 'sanitize' ),
				'show_in_rest'      => array(
					'schema' => self::schema(),
				),
			)
		);
	}

	/**
	 * Default values for the option.
	 *
	 * @return array<string, mixed>
	 */
	public static function defaults(): array {
		return array(
			'enabled'            => true,
			'showPreview'        => true,
			'showIcon'           => true,
			'autoCollapseOnLoad' => 'never',
			'accentColor'        => '#1d9e75',
			'barTextColor'       => '#444444',
		);
	}

	/**
	 * REST schema describing every field.
	 *
	 * @return array<string, mixed>
	 */
	public static function schema(): array {
		return array(
			'type'                 => 'object',
			'properties'           => array(
				'enabled'            => array( 'type' => 'boolean' ),
				'showPreview'        => array( 'type' => 'boolean' ),
				'showIcon'           => array( 'type' => 'boolean' ),
				'autoCollapseOnLoad' => array(
					'type' => 'string',
					'enum' => self::ALLOWED_MODES,
				),
				'accentColor'        => array(
					'type'    => 'string',
					'pattern' => '^#[0-9a-fA-F]{6}$',
				),
				'barTextColor'       => array(
					'type'    => 'string',
					'pattern' => '^#[0-9a-fA-F]{6}$',
				),
			),
			'additionalProperties' => false,
		);
	}

	/**
	 * Sanitize the option payload.
	 *
	 * Returns a fresh array with only known fields, coerced types, and
	 * rejected values replaced with defaults. Safe against malicious or
	 * malformed REST input.
	 *
	 * @param mixed $value Raw input.
	 * @return array<string, mixed>
	 */
	public function sanitize( $value ): array {
		$defaults = self::defaults();
		if ( ! is_array( $value ) ) {
			return $defaults;
		}

		$out = $defaults;

		if ( isset( $value['enabled'] ) ) {
			$out['enabled'] = (bool) $value['enabled'];
		}
		if ( isset( $value['showPreview'] ) ) {
			$out['showPreview'] = (bool) $value['showPreview'];
		}
		if ( isset( $value['showIcon'] ) ) {
			$out['showIcon'] = (bool) $value['showIcon'];
		}
		if (
			isset( $value['autoCollapseOnLoad'] ) &&
			in_array( $value['autoCollapseOnLoad'], self::ALLOWED_MODES, true )
		) {
			$out['autoCollapseOnLoad'] = $value['autoCollapseOnLoad'];
		}
		if (
			isset( $value['accentColor'] ) &&
			is_string( $value['accentColor'] ) &&
			preg_match( '/^#[0-9a-fA-F]{6}$/', $value['accentColor'] )
		) {
			$out['accentColor'] = strtolower( $value['accentColor'] );
		}
		if (
			isset( $value['barTextColor'] ) &&
			is_string( $value['barTextColor'] ) &&
			preg_match( '/^#[0-9a-fA-F]{6}$/', $value['barTextColor'] )
		) {
			$out['barTextColor'] = strtolower( $value['barTextColor'] );
		}

		return $out;
	}

	/**
	 * Read current settings, merged with defaults for missing keys.
	 *
	 * @return array<string, mixed>
	 */
	public static function get(): array {
		$stored = get_option( self::OPTION_NAME, array() );
		if ( ! is_array( $stored ) ) {
			$stored = array();
		}
		return array_merge( self::defaults(), $stored );
	}
}
