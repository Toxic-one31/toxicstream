/**
 * D-Pad Navigation for TV Remotes
 */

class DPadNavigator {
  constructor() {
    this.focusableElements = [];
    this.currentIndex = 0;
    this.init();
  }
  
  init() {
    this.updateFocusableElements();
    this.attachKeyListeners();
    this.focusCurrent();
  }
  
  updateFocusableElements() {
    this.focusableElements = Array.from(
      document.querySelectorAll(
        'a[href], button, input, .card, .nav-link'
      )
    ).filter(el => el.offsetParent !== null && !el.disabled);
    
    this.focusableElements.sort((a, b) => {
      const rectA = a.getBoundingClientRect();
      const rectB = b.getBoundingClientRect();
      return rectA.top - rectB.top || rectA.left - rectB.left;
    });
  }
  
  attachKeyListeners() {
    document.addEventListener('keydown', (e) => this.handleKeyPress(e));
  }
  
  handleKeyPress(e) {
    const key = e.key || e.keyCode;
    
    switch(key) {
      case 'ArrowDown':
      case 40:
        e.preventDefault();
        this.navigateDown();
        break;
      case 'ArrowUp':
      case 38:
        e.preventDefault();
        this.navigateUp();
        break;
      case 'ArrowRight':
      case 39:
        e.preventDefault();
        this.navigateRight();
        break;
      case 'ArrowLeft':
      case 37:
        e.preventDefault();
        this.navigateLeft();
        break;
      case 'Enter':
      case 13:
        e.preventDefault();
        this.selectCurrent();
        break;
    }
  }
  
  navigateDown() {
    if (this.currentIndex < this.focusableElements.length - 1) {
      this.currentIndex++;
      this.focusCurrent();
    }
  }
  
  navigateUp() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.focusCurrent();
    }
  }
  
  navigateRight() {
    if (this.currentIndex < this.focusableElements.length - 1) {
      this.currentIndex++;
      this.focusCurrent();
    }
  }
  
  navigateLeft() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.focusCurrent();
    }
  }
  
  focusCurrent() {
    this.focusableElements.forEach(el => {
      el.classList.remove('tv-focused');
      el.blur();
    });
    
    const current = this.focusableElements[this.currentIndex];
    if (current) {
      current.classList.add('tv-focused');
      current.focus();
      current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
  
  selectCurrent() {
    const current = this.focusableElements[this.currentIndex];
    if (current) {
      current.click();
    }
  }
  
  refresh() {
    this.updateFocusableElements();
  }
}

// Initialize
let dpadNav;
document.addEventListener('DOMContentLoaded', () => {
  dpadNav = new DPadNavigator();
  
  const observer = new MutationObserver(() => {
    if (dpadNav) dpadNav.refresh();
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
});