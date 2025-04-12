 function createStars() {
  const starsContainer = document.createElement('div');
  starsContainer.className = 'stars';
  starsContainer.style.position = 'fixed';
  starsContainer.style.top = '0';
  starsContainer.style.left = '0';
  starsContainer.style.width = '100vw';
  starsContainer.style.height = '100vh';
  starsContainer.style.zIndex = '-1';
  document.body.appendChild(starsContainer);

  for (let i = 0; i < 50; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    const size = Math.random() * 2 + 1;
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    star.style.top = `${Math.random() * 100}vh`;
    star.style.left = `${Math.random() * 100}vw`;
    star.style.animationDelay = `${Math.random() * 2}s`;
    starsContainer.appendChild(star);
  }

  const nebula = document.createElement('div');
  nebula.className = 'nebula';
  nebula.style.top = '30%';
  nebula.style.left = '20%';
  starsContainer.appendChild(nebula);
}

document.addEventListener('DOMContentLoaded', createStars);
