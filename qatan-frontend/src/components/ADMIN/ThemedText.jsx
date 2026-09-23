import React from 'react'
import { useAppContext } from './context/AppContext'

/**
 * ThemedText
 * A tiny helper that centralizes dark/light text color choices.
 * Usage: <ThemedText variant="muted">Some text</ThemedText>
 */
export default function ThemedText({ children, variant = 'default', style = {}, className = '', as = 'span', ...props }) {
	const { darkTheme } = useAppContext()

	const palette = {
		default: darkTheme ? '#e8e8e8' : '#111827',
		muted: darkTheme ? '#9ca3af' : '#6b7280',
		heading: darkTheme ? '#e8e8e8' : '#111827',
		value: darkTheme ? '#e8e8e8' : '#111827',
		info: darkTheme ? '#60a5fa' : '#1976d2',
	}

	const color = palette[variant] || palette.default

	const Element = as || 'span'
	return React.createElement(
		Element,
		{ className, style: { color, ...style }, ...props },
		children
	)
}

