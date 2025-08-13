import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import StatsChart from './StatsChart.svelte';
import type { ChartData } from '$lib/types/game';

describe('StatsChart Component', () => {
	const lineChartData: ChartData = {
		labels: ['1/1', '1/2', '1/3', '1/4', '1/5', '1/6', '1/7'],
		datasets: [
			{
				label: 'WPM',
				data: [50, 52, 55, 54, 58, 60, 62],
				color: '#3B82F6'
			}
		]
	};

	const barChartData: ChartData = {
		labels: ['月', '火', '水', '木', '金', '土', '日'],
		datasets: [
			{
				label: 'プレイ時間（分）',
				data: [30, 45, 60, 40, 55, 90, 120],
				color: '#10B981'
			}
		]
	};

	const pieChartData: ChartData = {
		labels: ['練習', 'ランダム', '特定札'],
		datasets: [
			{
				label: 'モード別割合',
				data: [60, 30, 10],
				color: undefined // Will use default colors
			}
		]
	};

	describe('Line Chart', () => {
		it('TC-009: should render line chart for WPM trend', async () => {
			render(StatsChart, {
				props: {
					data: lineChartData,
					type: 'line',
					title: 'WPM推移'
				}
			});

			expect(screen.getByTestId('chart-container')).toBeInTheDocument();
			expect(screen.getByText('WPM推移')).toBeInTheDocument();

			// Wait for chart to render
			await waitFor(() => {
				expect(screen.getByTestId('line-chart')).toBeInTheDocument();
			});

			// Check if data points are rendered
			const chart = screen.getByTestId('line-chart');
			expect(chart).toHaveAttribute('data-points', '7');
		});

		it('should show tooltip on hover', async () => {
			render(StatsChart, {
				props: {
					data: lineChartData,
					type: 'line',
					showTooltip: true
				}
			});

			await waitFor(() => {
				const dataPoint = screen.getByTestId('data-point-3');
				dataPoint.dispatchEvent(new MouseEvent('mouseenter'));
			});

			expect(screen.getByTestId('chart-tooltip')).toBeInTheDocument();
			expect(screen.getByText('55 WPM')).toBeInTheDocument();
		});
	});

	describe('Bar Chart', () => {
		it('TC-010: should render bar chart for daily play time', async () => {
			render(StatsChart, {
				props: {
					data: barChartData,
					type: 'bar',
					title: '日別プレイ時間'
				}
			});

			expect(screen.getByText('日別プレイ時間')).toBeInTheDocument();

			await waitFor(() => {
				expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
			});

			// Check if all bars are rendered
			const bars = screen.getAllByTestId(/^bar-\d+$/);
			expect(bars).toHaveLength(7);
		});

		it('should animate bars on load', async () => {
			render(StatsChart, {
				props: {
					data: barChartData,
					type: 'bar',
					animate: true
				}
			});

			await waitFor(() => {
				const bars = screen.getAllByTestId(/^bar-\d+$/);
				bars.forEach((bar) => {
					expect(bar).toHaveClass('animate-grow-height');
				});
			});
		});
	});

	describe('Pie Chart', () => {
		it('TC-011: should render pie chart for mode distribution', async () => {
			render(StatsChart, {
				props: {
					data: pieChartData,
					type: 'pie',
					title: 'モード別プレイ割合'
				}
			});

			expect(screen.getByText('モード別プレイ割合')).toBeInTheDocument();

			await waitFor(() => {
				expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
			});

			// Check segments
			expect(screen.getByTestId('pie-segment-0')).toBeInTheDocument();
			expect(screen.getByTestId('pie-segment-1')).toBeInTheDocument();
			expect(screen.getByTestId('pie-segment-2')).toBeInTheDocument();

			// Check labels
			expect(screen.getByText('練習 (60%)')).toBeInTheDocument();
			expect(screen.getByText('ランダム (30%)')).toBeInTheDocument();
			expect(screen.getByText('特定札 (10%)')).toBeInTheDocument();
		});

		it('should show legend for pie chart', () => {
			render(StatsChart, {
				props: {
					data: pieChartData,
					type: 'pie',
					showLegend: true
				}
			});

			const legend = screen.getByTestId('chart-legend');
			expect(legend).toBeInTheDocument();
			expect(legend).toContainHTML('練習');
			expect(legend).toContainHTML('ランダム');
			expect(legend).toContainHTML('特定札');
		});
	});

	describe('Empty Data Handling', () => {
		it('TC-012: should show empty message when no data', () => {
			const emptyData: ChartData = {
				labels: [],
				datasets: []
			};

			render(StatsChart, {
				props: {
					data: emptyData,
					type: 'line'
				}
			});

			expect(screen.getByText('データがありません')).toBeInTheDocument();
			expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
		});

		it('should show custom empty message', () => {
			const emptyData: ChartData = {
				labels: [],
				datasets: []
			};

			render(StatsChart, {
				props: {
					data: emptyData,
					type: 'bar',
					emptyMessage: 'まだプレイ記録がありません'
				}
			});

			expect(screen.getByText('まだプレイ記録がありません')).toBeInTheDocument();
		});
	});

	describe('Chart Options', () => {
		it('should apply custom height', () => {
			render(StatsChart, {
				props: {
					data: lineChartData,
					type: 'line',
					options: {
						height: 400
					}
				}
			});

			const container = screen.getByTestId('chart-container');
			expect(container).toHaveStyle({ height: '400px' });
		});

		it('should apply custom colors', async () => {
			render(StatsChart, {
				props: {
					data: {
						...lineChartData,
						datasets: [
							{
								...lineChartData.datasets[0],
								color: '#EF4444'
							}
						]
					},
					type: 'line'
				}
			});

			await waitFor(() => {
				const line = screen.getByTestId('chart-line');
				expect(line).toHaveStyle({ stroke: '#EF4444' });
			});
		});
	});

	describe('Responsive Behavior', () => {
		it('should adjust for mobile screens', () => {
			global.innerWidth = 375;

			render(StatsChart, {
				props: {
					data: barChartData,
					type: 'bar'
				}
			});

			const container = screen.getByTestId('chart-container');
			expect(container).toHaveClass('w-full');
		});

		it('should show horizontal scroll for many data points on mobile', () => {
			global.innerWidth = 375;

			const manyLabels = Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`);
			const manyData = Array.from({ length: 30 }, () => Math.floor(Math.random() * 100));

			render(StatsChart, {
				props: {
					data: {
						labels: manyLabels,
						datasets: [{ label: 'Data', data: manyData }]
					},
					type: 'bar'
				}
			});

			const scrollContainer = screen.getByTestId('chart-scroll-container');
			expect(scrollContainer).toHaveClass('overflow-x-auto');
		});
	});

	describe('Animation', () => {
		it('TC-037: should animate chart drawing', async () => {
			render(StatsChart, {
				props: {
					data: lineChartData,
					type: 'line',
					animate: true
				}
			});

			await waitFor(() => {
				const line = screen.getByTestId('chart-line');
				expect(line).toHaveClass('animate-draw-line');
			});
		});

		it('should delay animation for staggered effect', async () => {
			render(StatsChart, {
				props: {
					data: barChartData,
					type: 'bar',
					animate: true,
					animationDelay: 100
				}
			});

			await waitFor(() => {
				const bars = screen.getAllByTestId(/^bar-\d+$/);
				bars.forEach((bar, index) => {
					const delay = parseInt(bar.style.animationDelay);
					expect(delay).toBe(index * 100);
				});
			});
		});
	});

	describe('Accessibility', () => {
		it('TC-047: should have proper ARIA labels', () => {
			render(StatsChart, {
				props: {
					data: lineChartData,
					type: 'line',
					title: 'WPM推移グラフ'
				}
			});

			const chart = screen.getByTestId('chart-container');
			expect(chart).toHaveAttribute('role', 'img');
			expect(chart).toHaveAttribute('aria-label', 'WPM推移グラフ');
		});

		it('should provide text alternative for data', () => {
			render(StatsChart, {
				props: {
					data: lineChartData,
					type: 'line'
				}
			});

			const description = screen.getByTestId('chart-description');
			expect(description).toHaveAttribute('class', expect.stringContaining('sr-only'));
			expect(description).toHaveTextContent('1/1: 50, 1/2: 52');
		});
	});
});
