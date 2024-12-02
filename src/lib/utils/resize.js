import debounce from 'lodash/debounce';

export function createResizeHandler(callback, delay = 250) {
  return debounce(callback, delay);
}

export function getViewportDimensions() {
  if (typeof window === 'undefined') return { width: 0, height: 0 };
  return {
    width: window.innerWidth,
    height: window.innerHeight
  };
}

export function calculateChartDimensions(container, margin) {
  const { width, height } = container.getBoundingClientRect();
  return {
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom
  };
}