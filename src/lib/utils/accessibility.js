// @ts-ignore
export function announceChange(message) {
    const announcement = document.getElementById('a11y-announce') || 
      createAnnouncementElement();
    announcement.textContent = message;
  }
  
  function createAnnouncementElement() {
    const element = document.createElement('div');
    element.id = 'a11y-announce';
    element.setAttribute('role', 'status');
    element.setAttribute('aria-live', 'polite');
    element.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      border: 0;
    `;
    document.body.appendChild(element);
    return element;
  }
  
  // @ts-ignore
  export function createAriaLabel(data) {
    const { Work_Hours, Sleep_Hours, Mental_Health_Condition } = data;
    return `Person working ${Work_Hours} hours per week, sleeping ${Sleep_Hours} hours per day, ${Mental_Health_Condition === 'Yes' ? 'reports' : 'does not report'} mental health condition`;
  }