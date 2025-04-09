function createStars() {
  const starsContainer = document.createElement('div');
  starsContainer.className = 'stars';
  document.body.appendChild(starsContainer);

  // Create 100 stars
  for (let i = 0; i < 100; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.width = `${Math.random() * 3 + 1}px`;
    star.style.height = star.style.width;
    star.style.top = `${Math.random() * 100}vh`;
    star.style.left = `${Math.random() * 100}vw`;
    star.style.animationDelay = `${Math.random() * 2}s`;
    starsContainer.appendChild(star);
  }

  // Add a nebula effect
  const nebula = document.createElement('div');
  nebula.className = 'nebula';
  nebula.style.top = '20%';
  nebula.style.left = '10%';
  starsContainer.appendChild(nebula);
  }

};
