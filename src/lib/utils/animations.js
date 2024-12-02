export const transitions = {
    standard: {
      duration: 400,
      easing: 'cubic-bezier(0.25, 0.1, 0.25, 1.0)'
    },
    slow: {
      duration: 800,
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
    },
    quick: {
      duration: 200,
      easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)'
    }
  };
  
  // @ts-ignore
  export function createStaggeredDelay(index, baseDelay = 50) {
    return Math.min(index * baseDelay, 1000);
  }
  
  // @ts-ignore
  export function createEnterTransition(index, reduced = false) {
    if (reduced) return '';
    const delay = createStaggeredDelay(index);
    return `
      opacity: 0;
      transform: scale(0);
      animation: enter ${transitions.standard.duration}ms ${delay}ms ${transitions.standard.easing} forwards;
    `;
  }