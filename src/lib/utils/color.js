export const colorScheme = {
    withCondition: 'var(--color-bright-purple)',
    withoutCondition: 'var(--color-off-purple)',
    highlight: 'var(--color-bright-yellow)',
    text: 'var(--color-off-purple)',
    background: 'var(--color-bg)',
    accent: 'var(--color-lighter-purple)'
  };
  
  // @ts-ignore
  export function getConditionColor(hasCondition) {
    return hasCondition ? colorScheme.withCondition : colorScheme.withoutCondition;
  }
  
  // @ts-ignore
  export function interpolateColors(startColor, endColor, steps) {
    // @ts-ignore
    return d3.quantize(d3.interpolateRgb(startColor, endColor), steps);
  }