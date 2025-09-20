// Simple Spotify-like demo (no external APIs).
// Loads SVG icons, mock data, renders cards, and wires a basic audio player.

(async function init(){
  // Load SVG sprite into the page for <use> icons
  try {
    const svg = await fetch('assets/img/icons.svg').then(r => r.text());
    document.getElementById('svg-sprite').innerHTML = svg;
  } catch(e) {
    console.warn('SVG sprite failed to load:', e);
  }

  // Mock data (you can replace with real API later)
  const tracks = [
    { id: 't1', title: 'Senorita', artist: 'Shawn', src: 'assets/audio/senorita.mp3', liked: false },
    { id: 't2', title: 'Pink Venom', artist: 'BLACKPINK', src: 'assets/audio/pink venom.mp3', liked: false },
    { id: 't3', title: 'Bluebird', artist: 'Ikimonogakari',src: 'assets/audio/Blue-Bird.mp3', liked: false },
    { id: 't4', title: 'Fly Away', artist: 'TheFatRat', src: 'assets/audio/Fly Away.mp3', liked: false },
    { id: 't5', title: 'Blinding Lights', artist: 'The Weeknd', src: 'assets/audio/Blinding Lights.mp3', liked: false },
    { id: 't6', title: 'A Thousand Years', artist: 'Christina Perri', src: 'assets/audio/Christina Perri - A Thousand Years [Official Music Video].mp3', liked: false },
    { id: 't7', title: 'Dark Paradise', artist: 'Lana del rey', src: 'assets/audio/Dark Paradise.mp3', liked: false },
    { id: 't8', title: 'Heartbreak Anniversary', artist: 'GIVEON',src: 'assets/audio/assets/audio/GIVĒON - Heartbreak Anniversary (Official Music Video).mp3', liked: false },
    { id: 't9', title: 'детство', artist: 'Rauf & Faik', src: 'assets/audio/Rauf & Faik — детство (Official video).mp3', liked: false },
    { id: 't10', title: 'Favorite', artist: 'Isabel LaRosa', src: 'audio/Isabel LaRosa - Favorite (Official Video).mp3', liked: false },
    { id: 't11', title: 'Childhood', artist: 'Rauf & Faik', src: 'assets/audio/Rauf Faik - детство (Official audio).mp3', liked: false },
    { id: 't12', title: 'Reawaker', artist: 'Lisa', src: 'assets/audio/reawaker.mp3', liked: false },
    { id: 't13', title: 'royalty', artist: 'Neoni', src: 'assets/audio/royalty.mp3', liked: false },
    { id: 't14', title: 'Mortals', artist: 'Warriyo', src: 'assets/audio/Mortals.mp3', liked: false },
  ];

  const playlists = [
    { id:'p1', name: 'Daily Mix 1', trackIds: ['t2','t3','t4']},
    { id:'p1', name: 'Mikey Reddy', trackIds: ['t3','t8','t13']},
    { id:'p2', name: 'Focus Flow', trackIds: ['t1','t5','t6']},
    { id:'p3', name: 'Throwback Vibes', trackIds: ['t3','t14','t12']},
    { id:'p3', name: 'Anime', trackIds: ['t12','t3','t13']},
  ];

  // Cache elements
  const $newRelease = document.getElementById('new-release-cards');
  const $madeForYou = document.getElementById('made-for-you-cards');
  const $playlistList = document.getElementById('playlist-list');
  const $queueList = document.getElementById('queue-list');
  const $search = document.getElementById('search');

  // Player elements
  const audio = document.getElementById('audio');
  const playBtn = document.getElementById('play-btn');
  const nextBtn = document.getElementById('next-btn');
  const prevBtn = document.getElementById('prev-btn');
  const likeBtn = document.getElementById('like-btn');
  const seek = document.getElementById('seek');
  const currentTime = document.getElementById('current-time');
  const duration = document.getElementById('duration');
  const volume = document.getElementById('volume');
  const shuffleBtn = document.getElementById('shuffle-btn');
  const repeatBtn = document.getElementById('repeat-btn');
  const playerTitle = document.getElementById('player-title');
  const playerArtist = document.getElementById('player-artist');

  let queue = [...tracks.map(t => t.id)];
  let currentIndex = 0;
  let isShuffle = false;
  let isRepeat = false;

  function fmtTime(sec){
    if (!Number.isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return m + ':' + String(s).padStart(2, '0');
  }

  function renderCards(target, items){
    target.innerHTML = '';
    items.forEach(item => {
      const el = document.createElement('article');
      el.className = 'card';
      el.innerHTML = `
        <div class="cover">♪</div>
        <div class="title">${item.title}</div>
        <div class="subtitle">${item.artist} • ${item.album}</div>
        <button class="btn add-queue"><svg class="icon"><use href="#icon-queue"></use></svg> Add to queue</button>
      `;
      el.querySelector('.add-queue').addEventListener('click', () => {
        queue.push(item.id);
        renderQueue();
      });
      el.addEventListener('dblclick', () => playById(item.id));
      target.appendChild(el);
    });
  }

  function renderPlaylists(){
    $playlistList.innerHTML = '';
    playlists.forEach(p => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#';
      a.textContent = p.name;
      a.addEventListener('click', (e) => {
        e.preventDefault();
        queue = [...p.trackIds];
        currentIndex = 0;
        loadCurrent();
        audio.play();
        updatePlayIcon();
      });
      li.appendChild(a);
      $playlistList.appendChild(li);
    });
  }

  function renderQueue(){
    $queueList.innerHTML = '';
    queue.forEach((tid, i) => {
      const t = tracks.find(x => x.id === tid);
      if (!t) return;
      const li = document.createElement('li');
      li.className = 'queue-item';
      li.innerHTML = `
        <div class="number">${i+1}</div>
        <div class="meta">
          <div class="title">${t.title}</div>
          <div class="artist">${t.artist}</div>
        </div>
        <div class="actions">
          <button class="btn small play-now">Play</button>
          <button class="btn small remove">X</button>
        </div>
      `;
      li.querySelector('.play-now').addEventListener('click', () => {
        currentIndex = i;
        loadCurrent();
        audio.play();
        updatePlayIcon();
      });
      li.querySelector('.remove').addEventListener('click', () => {
        queue.splice(i, 1);
        if (currentIndex >= queue.length) currentIndex = Math.max(0, queue.length - 1);
        renderQueue();
      });
      $queueList.appendChild(li);
    });
  }

  function currentTrack(){
    const id = queue[currentIndex];
    return tracks.find(t => t.id === id) || tracks[0];
  }

  function loadCurrent(){
    const t = currentTrack();
    if (!t) return;
    audio.src = t.src;
    playerTitle.textContent = t.title;
    playerArtist.textContent = t.artist;
    likeBtn.classList.toggle('active', !!t.liked);
  }

  function playById(id){
    const idx = queue.indexOf(id);
    if (idx !== -1) currentIndex = idx;
    else { queue.unshift(id); currentIndex = 0; }
    loadCurrent();
    audio.play();
    updatePlayIcon();
  }

  function updatePlayIcon(){
    const use = playBtn.querySelector('use');
    if (audio.paused) use.setAttribute('href', '#icon-play');
    else use.setAttribute('href', '#icon-pause');
  }

  // Attach listeners
  playBtn.addEventListener('click', () => {
    if (audio.paused) audio.play(); else audio.pause();
    updatePlayIcon();
  });
  nextBtn.addEventListener('click', () => {
    if (isShuffle) currentIndex = Math.floor(Math.random() * queue.length);
    else currentIndex = (currentIndex + 1) % queue.length;
    loadCurrent();
    audio.play();
    updatePlayIcon();
  });
  prevBtn.addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + queue.length) % queue.length;
    loadCurrent();
    audio.play();
    updatePlayIcon();
  });

  likeBtn.addEventListener('click', () => {
    const t = currentTrack();
    if (t) { t.liked = !t.liked; likeBtn.classList.toggle('active', t.liked); }
  });

  shuffleBtn.addEventListener('click', () => {
    isShuffle = !isShuffle;
    shuffleBtn.classList.toggle('active', isShuffle);
  });
  repeatBtn.addEventListener('click', () => {
    isRepeat = !isRepeat;
    repeatBtn.classList.toggle('active', isRepeat);
  });

  audio.addEventListener('timeupdate', () => {
    currentTime.textContent = fmtTime(audio.currentTime);
    duration.textContent = fmtTime(audio.duration || 0);
    seek.value = audio.duration ? Math.floor((audio.currentTime / audio.duration) * 100) : 0;
  });
  audio.addEventListener('ended', () => {
    if (isRepeat) { audio.currentTime = 0; audio.play(); return; }
    nextBtn.click();
  });
  seek.addEventListener('input', () => {
    if (!audio.duration) return;
    audio.currentTime = (seek.value / 100) * audio.duration;
  });
  volume.addEventListener('input', () => {
    audio.volume = volume.value;
  });

  $search.addEventListener('input', () => {
    const q = $search.value.trim().toLowerCase();
    const filtered = tracks.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      t.album.toLowerCase().includes(q)
    );
    renderCards($newRelease, filtered);
  });

  // Initial render
  renderCards($newRelease, tracks);
  renderCards($madeForYou, tracks.slice().reverse());
  renderPlaylists();
  renderQueue();
  loadCurrent();
  audio.volume = volume.value;
  updatePlayIcon();
})();
